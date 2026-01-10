const UploadService = require('../services/uploadService');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Upload Controller
 * Handles HTTP requests for file upload operations
 */

/**
 * @route   POST /api/uploads/single
 * @desc    Upload a single file
 * @access  Private
 */
exports.uploadSingleFile = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(ErrorResponse.badRequest('No file uploaded', 'NO_FILE'));
    }

    try {
        const fileMetadata = await UploadService.processFile(req.file);

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: fileMetadata,
        });
    } catch (error) {
        // Clean up file if processing fails
        await UploadService.cleanupFile(req.file);
        throw error;
    }
});

/**
 * @route   POST /api/uploads/multiple
 * @desc    Upload multiple files
 * @access  Private
 */
exports.uploadMultipleFiles = asyncHandler(async (req, res, next) => {
    if (!req.files || req.files.length === 0) {
        return next(ErrorResponse.badRequest('No files uploaded', 'NO_FILES'));
    }

    try {
        const filesMetadata = await UploadService.processMultipleFiles(req.files);

        res.status(201).json({
            success: true,
            message: `${filesMetadata.length} file(s) uploaded successfully`,
            data: filesMetadata,
        });
    } catch (error) {
        // Clean up files if processing fails
        await UploadService.cleanupMultipleFiles(req.files);
        throw error;
    }
});

/**
 * @route   DELETE /api/uploads/:filename
 * @desc    Delete an uploaded file
 * @access  Private
 */
exports.deleteFile = asyncHandler(async (req, res, next) => {
    const { filename } = req.params;

    if (!filename) {
        return next(ErrorResponse.badRequest('Filename is required', 'NO_FILENAME'));
    }

    // Get file info to verify it exists and belongs to user
    const fileInfo = await UploadService.getFileInfo(filename, req.user.id);

    // Delete the file
    await UploadService.deleteFile(fileInfo.path);

    res.status(200).json({
        success: true,
        message: 'File deleted successfully',
        data: {
            filename,
        },
    });
});

/**
 * @route   GET /api/uploads/:filename
 * @desc    Get file information
 * @access  Private
 */
exports.getFileInfo = asyncHandler(async (req, res, next) => {
    const { filename } = req.params;

    if (!filename) {
        return next(ErrorResponse.badRequest('Filename is required', 'NO_FILENAME'));
    }

    const fileInfo = await UploadService.getFileInfo(filename, req.user.id);

    res.status(200).json({
        success: true,
        data: fileInfo,
    });
});

/**
 * @route   POST /api/uploads/image
 * @desc    Upload an image file
 * @access  Private
 */
exports.uploadImage = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(ErrorResponse.badRequest('No image uploaded', 'NO_IMAGE'));
    }

    try {
        const fileMetadata = await UploadService.processFile(req.file);

        res.status(201).json({
            success: true,
            message: 'Image uploaded successfully',
            data: fileMetadata,
        });
    } catch (error) {
        await UploadService.cleanupFile(req.file);
        throw error;
    }
});

/**
 * @route   POST /api/uploads/video
 * @desc    Upload a video file
 * @access  Private
 */
exports.uploadVideo = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(ErrorResponse.badRequest('No video uploaded', 'NO_VIDEO'));
    }

    try {
        const fileMetadata = await UploadService.processFile(req.file);

        res.status(201).json({
            success: true,
            message: 'Video uploaded successfully',
            data: fileMetadata,
        });
    } catch (error) {
        await UploadService.cleanupFile(req.file);
        throw error;
    }
});

/**
 * @route   POST /api/uploads/document
 * @desc    Upload a document file
 * @access  Private
 */
exports.uploadDocument = asyncHandler(async (req, res, next) => {
    if (!req.file) {
        return next(ErrorResponse.badRequest('No document uploaded', 'NO_DOCUMENT'));
    }

    try {
        const fileMetadata = await UploadService.processFile(req.file);

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: fileMetadata,
        });
    } catch (error) {
        await UploadService.cleanupFile(req.file);
        throw error;
    }
});
