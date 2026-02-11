const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { uploadMiddlewares } = require('../middlewares/upload.unified');
const protect = require('../middlewares/auth');
const multerErrorHandler = require('../middlewares/multerErrorHandler');

/**
 * Upload Routes
 * All routes require authentication
 */

// Apply authentication to all routes
router.use(protect);

/**
 * @route   POST /api/uploads/single
 * @desc    Upload a single file (any type, max 50MB)
 * @access  Private
 */
router.post('/single', uploadMiddlewares.singleFile, multerErrorHandler, uploadController.uploadSingleFile);

/**
 * @route   POST /api/uploads/multiple
 * @desc    Upload multiple files (max 5 files, 50MB each)
 * @access  Private
 */
router.post('/multiple', uploadMiddlewares.multipleFiles, multerErrorHandler, uploadController.uploadMultipleFiles);

/**
 * @route   POST /api/uploads/image
 * @desc    Upload an image file (max 10MB)
 * @access  Private
 */
router.post('/image', uploadMiddlewares.singleImage, multerErrorHandler, uploadController.uploadImage);

/**
 * @route   POST /api/uploads/video
 * @desc    Upload a video file (max 50MB)
 * @access  Private
 */
router.post('/video', uploadMiddlewares.singleVideo, multerErrorHandler, uploadController.uploadVideo);

/**
 * @route   POST /api/uploads/document
 * @desc    Upload a document file (max configurable via MAX_DOCUMENT_SIZE, default 100MB)
 * @access  Private
 */
router.post('/document', uploadMiddlewares.singleDocument, multerErrorHandler, uploadController.uploadDocument);

/**
 * @route   GET /api/uploads
 * @desc    Get all uploads with pagination and filters
 * @access  Private
 */
router.get('/', uploadController.getAllUploads);

/**
 * @route   GET /api/uploads/my-files
 * @desc    Get current user's uploads
 * @access  Private
 */
router.get('/my-files', uploadController.getMyUploads);

/**
 * @route   PATCH /api/uploads/:id
 * @desc    Update upload metadata (title, description, category)
 * @access  Private
 */
router.patch('/:id', uploadController.updateUploadMetadata);

/**
 * @route   POST /api/uploads/:id/download
 * @desc    Increment download counter for a file
 * @access  Private
 */
router.post('/:id/download', uploadController.incrementDownloads);

/**
 * @route   GET /api/uploads/download/:id
 * @desc    Download a file
 * @access  Private
 */
router.get('/download/:id', uploadController.downloadFile);

/**
 * @route   GET /api/uploads/:filename
 * @desc    Get file information
 * @access  Private
 */
router.get('/:filename', uploadController.getFileInfo);

/**
 * @route   DELETE /api/uploads/:filename
 * @desc    Delete an uploaded file
 * @access  Private
 */
router.delete('/:id', uploadController.deleteFile);

module.exports = router;


