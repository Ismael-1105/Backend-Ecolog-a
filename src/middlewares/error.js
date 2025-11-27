const logger = require('../config/logger');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Global Error Handler Middleware
 * Handles all errors thrown in the application
 */
const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;
    error.stack = err.stack;

    // Log error details
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        user: req.user ? req.user.id : 'unauthenticated',
    });

    // Mongoose bad ObjectId
    if (err.name === 'CastError') {
        const message = 'Resource not found';
        error = ErrorResponse.notFound(message);
    }

    // Mongoose duplicate key
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const message = `${field} already exists`;
        error = ErrorResponse.conflict(message, 'DUPLICATE_FIELD');
    }

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors)
            .map((val) => val.message)
            .join(', ');
        error = ErrorResponse.badRequest(message, 'VALIDATION_ERROR');
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error = ErrorResponse.unauthorized('Invalid token', 'INVALID_TOKEN');
    }

    if (err.name === 'TokenExpiredError') {
        error = ErrorResponse.unauthorized('Token expired', 'TOKEN_EXPIRED');
    }

    // Multer errors
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error = ErrorResponse.badRequest(
                'File size too large',
                'FILE_TOO_LARGE'
            );
        } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            error = ErrorResponse.badRequest(
                'Unexpected file field',
                'UNEXPECTED_FILE'
            );
        } else {
            error = ErrorResponse.badRequest(err.message, 'FILE_UPLOAD_ERROR');
        }
    }

    // Default to 500 server error
    const statusCode = error.statusCode || 500;
    const errorCode = error.errorCode || 'INTERNAL_ERROR';

    // Prepare response
    const response = {
        success: false,
        error: error.message || 'Server Error',
        errorCode,
    };

    // Include stack trace in development
    if (process.env.NODE_ENV === 'development') {
        response.stack = error.stack;
    }

    res.status(statusCode).json(response);
};

module.exports = errorHandler;
