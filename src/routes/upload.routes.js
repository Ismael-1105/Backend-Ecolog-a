const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { uploadMiddlewares } = require('../middlewares/upload.unified');
const protect = require('../middlewares/auth');

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
router.post('/single', uploadMiddlewares.singleFile, uploadController.uploadSingleFile);

/**
 * @route   POST /api/uploads/multiple
 * @desc    Upload multiple files (max 5 files, 50MB each)
 * @access  Private
 */
router.post('/multiple', uploadMiddlewares.multipleFiles, uploadController.uploadMultipleFiles);

/**
 * @route   POST /api/uploads/image
 * @desc    Upload an image file (max 10MB)
 * @access  Private
 */
router.post('/image', uploadMiddlewares.singleImage, uploadController.uploadImage);

/**
 * @route   POST /api/uploads/video
 * @desc    Upload a video file (max 50MB)
 * @access  Private
 */
router.post('/video', uploadMiddlewares.singleVideo, uploadController.uploadVideo);

/**
 * @route   POST /api/uploads/document
 * @desc    Upload a document file (max 10MB)
 * @access  Private
 */
router.post('/document', uploadMiddlewares.singleDocument, uploadController.uploadDocument);

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
router.delete('/:filename', uploadController.deleteFile);

module.exports = router;
