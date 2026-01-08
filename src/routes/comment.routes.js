const express = require('express');
const router = express.Router({ mergeParams: true });
const protect = require('../middlewares/auth');
const {
  createComment,
  getCommentsByPost
} = require('../controllers/comment.controller');

// GET /api/posts/:postId/comments
router.get('/', getCommentsByPost);

// POST /api/posts/:postId/comments
router.post('/', protect, createComment);

module.exports = router;