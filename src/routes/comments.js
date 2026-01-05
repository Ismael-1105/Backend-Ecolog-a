const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router({ mergeParams: true }); // mergeParams to access videoId from parent router
const commentController = require('../controllers/commentController');
const auth = require('../middlewares/auth');
const handleValidation = require('../middlewares/validate');

/**
 * Comment Routes
 * Nested under /api/videos/:videoId/comments
 */

// Validation rules
const createCommentValidation = [
  auth,
  param('videoId').isMongoId().withMessage('Invalid video ID'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 1, max: 2000 }).withMessage('Content must be between 1 and 2000 characters'),
  body('parentComment')
    .optional()
    .isMongoId().withMessage('Invalid parent comment ID'),
  handleValidation,
];

const updateCommentValidation = [
  auth,
  param('videoId').isMongoId().withMessage('Invalid video ID'),
  param('commentId').isMongoId().withMessage('Invalid comment ID'),
  body('content')
    .trim()
    .notEmpty().withMessage('Content is required')
    .isLength({ min: 1, max: 2000 }).withMessage('Content must be between 1 and 2000 characters'),
  handleValidation,
];

/**
 * Routes for video comments
 */

// @route   POST /api/videos/:videoId/comments
// @desc    Create a comment (or reply)
// @access  Private
router.post('/', createCommentValidation, commentController.createComment);

// @route   GET /api/videos/:videoId/comments
// @desc    Get top-level comments for a video
// @access  Public
router.get(
  '/',
  [param('videoId').isMongoId(), handleValidation],
  commentController.getVideoComments
);

// @route   PUT /api/videos/:videoId/comments/:commentId
// @desc    Update a comment
// @access  Private
router.put('/:commentId', updateCommentValidation, commentController.updateComment);

// @route   DELETE /api/videos/:videoId/comments/:commentId
// @desc    Delete a comment
// @access  Private
router.delete(
  '/:commentId',
  [
    auth,
    param('videoId').isMongoId(),
    param('commentId').isMongoId(),
    handleValidation,
  ],
  commentController.deleteComment
);

/**
 * Standalone comment routes (not nested under video)
 */
const standaloneRouter = express.Router();

// @route   GET /api/comments/:id/replies
// @desc    Get replies to a comment
// @access  Public
standaloneRouter.get(
  '/:id/replies',
  [param('id').isMongoId(), handleValidation],
  commentController.getCommentReplies
);

// @route   GET /api/comments/:id/thread
// @desc    Get comment thread with nested replies
// @access  Public
standaloneRouter.get(
  '/:id/thread',
  [param('id').isMongoId(), handleValidation],
  commentController.getCommentThread
);

// @route   POST /api/comments/:id/like
// @desc    Like/unlike a comment
// @access  Private
standaloneRouter.post(
  '/:id/like',
  [auth, param('id').isMongoId(), handleValidation],
  commentController.toggleLike
);

// Export both routers
module.exports = router;
module.exports.standalone = standaloneRouter;
