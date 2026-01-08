const express = require('express');
const router = express.Router();
const videoController = require('../controllers/video.controller');
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');
const { cloudinaryUpload } = require('../middlewares/upload.cloudinary');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');
const commentRoutes = require('./comments');

/**
 * Video Routes
 * All routes related to video management
 */

// Validation rules
const uploadValidation = [
    body('title')
        .trim()
        .notEmpty().withMessage('Title is required')
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    body('duration')
        .optional()
        .isNumeric().withMessage('Duration must be a number'),
    validate
];

const updateValidation = [
    body('title')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Title cannot exceed 200 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 2000 }).withMessage('Description cannot exceed 2000 characters'),
    validate
];

/**
 * Public routes
 */

// Get all approved videos
router.get('/', videoController.getVideos);

// Get video by ID
router.get('/:id', videoController.getVideoById);

/**
 * Protected routes - Require authentication
 */

// Upload video (All authenticated users - no role restriction)
router.post(
    '/',
    auth,
    cloudinaryUpload,
    uploadValidation,
    videoController.uploadVideo
);

// Update video (Author or Admin)
router.put(
    '/:id',
    auth,
    updateValidation,
    videoController.updateVideo
);

// Delete video (Author or Admin)
router.delete(
    '/:id',
    auth,
    videoController.deleteVideo
);

// Like video
router.post(
    '/:id/like',
    auth,
    videoController.likeVideo
);

// Dislike video
router.post(
    '/:id/dislike',
    auth,
    videoController.dislikeVideo
);

/**
 * Admin routes
 */

// Approve video (Admin+)
router.put(
    '/:id/approve',
    auth,
    rbac.requireRole(['Administrador', 'SuperAdmin']),
    videoController.approveVideo
);

/**
 * Nested comment routes
 * Mount comment routes under /:videoId/comments
 */
router.use('/:videoId/comments', commentRoutes);

module.exports = router;
