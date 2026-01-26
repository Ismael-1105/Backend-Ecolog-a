const multer = require('multer');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Multer Error Handler Middleware
 * Handles multer-specific errors and converts them to proper HTTP responses
 * Must be placed AFTER multer middleware in the route chain
 */
module.exports = function (err, req, res, next) {
    // Handle multer-specific errors
    if (err instanceof multer.MulterError) {
        logger.warn('Multer error', {
            code: err.code,
            field: err.field,
            message: err.message,
            path: req.path
        });

        // File too large
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                error: 'File size exceeds the maximum allowed limit',
                code: 'FILE_TOO_LARGE',
                details: err.message
            });
        }

        // Too many files
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                error: 'Too many files uploaded',
                code: 'TOO_MANY_FILES',
                details: err.message
            });
        }

        // Unexpected field
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                error: `Unexpected field: ${err.field}`,
                code: 'UNEXPECTED_FIELD',
                details: 'The file field name does not match the expected field'
            });
        }

        // Generic multer error
        return res.status(400).json({
            success: false,
            error: 'File upload error',
            code: 'UPLOAD_ERROR',
            details: err.message
        });
    }

    // Handle custom file validation errors (from fileFilter)
    if (err instanceof ErrorResponse && err.statusCode === 400) {
        return res.status(400).json({
            success: false,
            error: err.message,
            code: err.code || 'VALIDATION_ERROR'
        });
    }

    // Pass other errors to the next error handler
    next(err);
};
