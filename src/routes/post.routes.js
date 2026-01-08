const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth');
const {
  createPost,
  getPosts,
  getPost
} = require('../controllers/post.controller');
const commentRoutes = require('./comment.routes');

// GET /api/posts
router.get('/', getPosts);

// POST /api/posts (Create post - requires auth)
router.post('/', protect, createPost);

// GET /api/posts/:id
router.get('/:id', getPost);

// Mount comment routes for posts: /api/posts/:postId/comments
router.use('/:postId/comments', commentRoutes);

module.exports = router;