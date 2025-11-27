
const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const { uploadVideo, getPublicVideos, approveVideo } = require('../controllers/videoController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const upload = require('../middlewares/upload');
const handleValidation = require('../middlewares/validate');
const commentRoutes = require('./comments');
const ratingRoutes = require('./ratings');

// @route   POST api/videos
// @desc    Upload a video
// @access  Private
router.post(
  '/',
  auth,
  upload,
  [body('titulo').isString().trim().isLength({ min: 2, max: 120 }), body('descripcion').isString().trim().isLength({ min: 2, max: 500 }), handleValidation],
  uploadVideo
);

// @route   GET api/videos
// @desc    Get all public videos
// @access  Public
router.get('/', getPublicVideos);

// @route   PUT api/videos/:id/approve
// @desc    Approve a video
// @access  Private/Admin
router.put(
  '/:id/approve',
  [auth, admin, param('id').isMongoId(), handleValidation],
  approveVideo
);

// Nested comment routes
router.use('/:videoId/comments', commentRoutes);

// Nested rating routes
router.use('/:videoId/rate', ratingRoutes);

module.exports = router;
