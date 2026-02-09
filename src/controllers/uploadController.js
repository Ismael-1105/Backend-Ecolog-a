const UploadService = require('../services/uploadService');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Upload Controller
 * Handles HTTP requests for file upload operations
 * All routes require authentication
 */

/**
 * @route   POST /api/uploads/single
 * @desc    Upload a single file
 * @access  Private
 */
exports.uploadSingleFile = asyncHandler(async (req, res, next) => {
    // Validate file exists
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No file uploaded',
            code: 'NO_FILE'
        });
    }

    try {
        // Process file metadata
        const fileMetadata = await UploadService.processFile(req.file);

        // Save to database with user ID and metadata from request body
        const upload = await UploadService.saveUploadToDatabase(
            fileMetadata,
            req.user.id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: 'File uploaded successfully',
            data: upload,
        });
    } catch (error) {
        // Clean up file if database save fails
        await UploadService.cleanupFile(req.file);

        // Re-throw to be handled by error middleware
        throw error;
    }
});

/**
 * @route   POST /api/uploads/multiple
 * @desc    Upload multiple files
 * @access  Private
 */
exports.uploadMultipleFiles = asyncHandler(async (req, res, next) => {
    // Validate files exist
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({
            success: false,
            error: 'No files uploaded',
            code: 'NO_FILES'
        });
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
        return res.status(400).json({
            success: false,
            error: 'Filename is required',
            code: 'NO_FILENAME'
        });
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
        return res.status(400).json({
            success: false,
            error: 'Filename is required',
            code: 'NO_FILENAME'
        });
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
        return res.status(400).json({
            success: false,
            error: 'No image uploaded',
            code: 'NO_IMAGE'
        });
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
        return res.status(400).json({
            success: false,
            error: 'No video uploaded',
            code: 'NO_VIDEO'
        });
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
    // Validate file exists
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No document uploaded',
            code: 'NO_DOCUMENT'
        });
    }

    try {
        // Process file metadata
        const fileMetadata = await UploadService.processFile(req.file);

        // Save to database with user ID and metadata from request body
        const upload = await UploadService.saveUploadToDatabase(
            fileMetadata,
            req.user.id,
            req.body
        );

        res.status(201).json({
            success: true,
            message: 'Document uploaded successfully',
            data: upload,
        });
    } catch (error) {
        // Clean up file if database save fails
        await UploadService.cleanupFile(req.file);

        // Re-throw to be handled by error middleware
        throw error;
    }
});

/**
 * @route   GET /api/uploads
 * @desc    Get all uploads with pagination and filters
 * @access  Private
 */
exports.getAllUploads = asyncHandler(async (req, res, next) => {
    const { fileType, category, search, page, limit, sort } = req.query;

    const filters = { fileType, category, search };
    const pagination = { page, limit, sort };

    const result = await UploadService.getAllUploads(filters, pagination);

    res.status(200).json({
        success: true,
        data: result.uploads,
        pagination: result.pagination,
    });
});

/**
 * @route   GET /api/uploads/my-files
 * @desc    Get current user's uploads
 * @access  Private
 */
exports.getMyUploads = asyncHandler(async (req, res, next) => {
    const { page, limit, sort } = req.query;
    const pagination = { page, limit, sort };

    const result = await UploadService.getUserUploads(req.user.id, pagination);

    res.status(200).json({
        success: true,
        data: result.uploads,
        pagination: result.pagination,
    });
});

/**
 * @route   PATCH /api/uploads/:id
 * @desc    Update upload metadata
 * @access  Private
 */
exports.updateUploadMetadata = asyncHandler(async (req, res, next) => {
    const { id } = req.params;
    const { title, description, category } = req.body;

    const upload = await UploadService.updateUploadMetadata(
        id,
        { title, description, category },
        req.user.id
    );

    res.status(200).json({
        success: true,
        message: 'Upload metadata updated successfully',
        data: upload,
    });
});

/**
 * @route   POST /api/uploads/:id/download
 * @desc    Increment download counter
 * @access  Private
 */
exports.incrementDownloads = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const upload = await UploadService.incrementDownloads(id);

    res.status(200).json({
        success: true,
        data: {
            downloads: upload.downloads,
        },
    });
});
/**
 * @route   GET /api/uploads/download/:id
 * @desc    Download a file
 * @access  Private
 */
exports.downloadFile = asyncHandler(async (req, res, next) => {
    const { id } = req.params;

    const { filePath, originalName } = await UploadService.getDownloadInfo(id);

    res.download(filePath, originalName, (err) => {
        if (err) {
            if (res.headersSent) {
                // Background error after headers were sent
                return;
            }
            return next(new ErrorResponse('Error al descargar el archivo', 500));
        }
    });
});
