const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router({ mergeParams: true }); // mergeParams to access videoId from parent router
const {
  rateVideo,
  getVideoRatingStats,
  getUserRating,
  deleteRating,
} = require('../controllers/ratingController');
const auth = require('../middlewares/auth');
const handleValidation = require('../middlewares/validate');

// @route   POST api/videos/:videoId/rate
// @desc    Rate a video
// @access  Private
router.post(
  '/',
  [
    auth,
    param('videoId').isMongoId(),
    body('valoracion').isInt({ min: 1, max: 5 }),
    handleValidation,
  ],
  rateVideo
);

// @route   GET api/videos/:videoId/rate
// @desc    Get video rating statistics
// @access  Public
router.get(
  '/',
  [param('videoId').isMongoId(), handleValidation],
  getVideoRatingStats
);

// @route   GET api/videos/:videoId/rate/me
// @desc    Get user's rating for a video
// @access  Private
router.get(
  '/me',
  [auth, param('videoId').isMongoId(), handleValidation],
  getUserRating
);

// @route   DELETE api/videos/:videoId/rate
// @desc    Delete user's rating
// @access  Private
router.delete(
  '/',
  [auth, param('videoId').isMongoId(), handleValidation],
  deleteRating
);

module.exports = router;
