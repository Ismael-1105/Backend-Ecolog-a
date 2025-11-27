const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const {
  uploadVideo,
  getPublicVideos,
  getVideoById,
  getVideosByAuthor,
  getPendingVideos,
  approveVideo,
  updateVideo,
  deleteVideo,
} = require('../controllers/videoController');
const auth = require('../middlewares/auth');
const { requireAdmin, requireDocente } = require('../middlewares/rbac');
const upload = require('../middlewares/upload');
const handleValidation = require('../middlewares/validate');
const commentRoutes = require('./comments');
const ratingRoutes = require('./ratings');

// @route   POST api/videos
// @desc    Upload a video
// @access  Private (Docente and above)
router.post(
  '/',
  [auth, requireDocente, upload],
  [
    body('titulo').isString().trim().isLength({ min: 2, max: 120 }),
    body('descripcion').isString().trim().isLength({ min: 2, max: 500 }),
    handleValidation,
  ],
  uploadVideo
);

// @route   GET api/videos
// @desc    Get all public videos
// @access  Public
router.get('/', getPublicVideos);

// @route   GET api/videos/pending
// @desc    Get pending approval videos
// @access  Private/Admin
router.get('/pending', [auth, requireAdmin], getPendingVideos);

// @route   GET api/videos/author/:authorId
// @desc    Get videos by author
// @access  Public
router.get(
  '/author/:authorId',
  [param('authorId').isMongoId(), handleValidation],
  getVideosByAuthor
);

// @route   GET api/videos/:id
// @desc    Get video by ID
// @access  Public
router.get(
  '/:id',
  [param('id').isMongoId(), handleValidation],
  getVideoById
);

// @route   PUT api/videos/:id
// @desc    Update video
// @access  Private
router.put(
  '/:id',
  [auth, param('id').isMongoId(), handleValidation],
  updateVideo
);

// @route   PUT api/videos/:id/approve
// @desc    Approve a video
// @access  Private/Admin
router.put(
  '/:id/approve',
  [auth, requireAdmin, param('id').isMongoId(), handleValidation],
  approveVideo
);

// @route   DELETE api/videos/:id
// @desc    Delete video
// @access  Private
router.delete(
  '/:id',
  [auth, param('id').isMongoId(), handleValidation],
  deleteVideo
);

// Nested comment routes
router.use('/:videoId/comments', commentRoutes);

// Nested rating routes
router.use('/:videoId/rate', ratingRoutes);

module.exports = router;
