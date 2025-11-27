
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router({ mergeParams: true });
const { addRating } = require('../controllers/ratingController');
const auth = require('../middlewares/auth');
const handleValidation = require('../middlewares/validate');

// @route   POST api/videos/:videoId/rate
// @desc    Rate a video
// @access  Private
router.post(
  '/',
  auth,
  [param('videoId').isMongoId(), body('valoracion').isInt({ min: 1, max: 5 }), handleValidation],
  addRating
);

module.exports = router;
