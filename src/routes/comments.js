const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router({ mergeParams: true }); // mergeParams to access videoId from parent router
const {
  createComment,
  getVideoComments,
  updateComment,
  deleteComment,
} = require('../controllers/commentController');
const auth = require('../middlewares/auth');
const handleValidation = require('../middlewares/validate');

// @route   POST api/videos/:videoId/comments
// @desc    Create a comment
// @access  Private
router.post(
  '/',
  [
    auth,
    param('videoId').isMongoId(),
    body('comentario').isString().trim().isLength({ min: 1, max: 500 }),
    handleValidation,
  ],
  createComment
);

// @route   GET api/videos/:videoId/comments
// @desc    Get comments for a video
// @access  Public
router.get(
  '/',
  [param('videoId').isMongoId(), handleValidation],
  getVideoComments
);

// @route   PUT api/videos/:videoId/comments/:commentId
// @desc    Update a comment
// @access  Private
router.put(
  '/:commentId',
  [
    auth,
    param('videoId').isMongoId(),
    param('commentId').isMongoId(),
    body('comentario').isString().trim().isLength({ min: 1, max: 500 }),
    handleValidation,
  ],
  updateComment
);

// @route   DELETE api/videos/:videoId/comments/:commentId
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
  deleteComment
);

module.exports = router;
