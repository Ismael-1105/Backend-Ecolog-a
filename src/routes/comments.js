
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router({ mergeParams: true });
const { addComment } = require('../controllers/commentController');
const auth = require('../middlewares/auth');
const handleValidation = require('../middlewares/validate');

// @route   POST api/videos/:videoId/comments
// @desc    Add a comment to a video
// @access  Private
router.post(
  '/',
  auth,
  [param('videoId').isMongoId(), body('comentario').isString().trim().isLength({ min: 1, max: 500 }), handleValidation],
  addComment
);

module.exports = router;
