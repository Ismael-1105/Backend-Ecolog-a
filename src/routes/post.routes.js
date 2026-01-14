const express = require('express');
const router = express.Router();
const protect = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/rbac');
const { validatePagination } = require('../middlewares/queryOptimizer');
const {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  dislikePost,
  searchPosts,
  getTrendingPosts,
  togglePinPost,
  getPostsByAuthor
} = require('../controllers/post.controller');
const commentRoutes = require('./comment.routes');

// Public routes

// GET /api/posts/search - Search posts (must be before /:id)
router.get('/search', validatePagination, searchPosts);

// GET /api/posts/trending - Get trending posts (must be before /:id)
router.get('/trending', getTrendingPosts);

// GET /api/posts - Get all posts
router.get('/', validatePagination, getPosts);

// GET /api/posts/author/:authorId - Get posts by author
router.get('/author/:authorId', validatePagination, getPostsByAuthor);

// GET /api/posts/:id - Get single post
router.get('/:id', getPost);

// Protected routes (require authentication)

// POST /api/posts - Create post
router.post('/', protect, createPost);

// PUT /api/posts/:id - Update post
router.put('/:id', protect, updatePost);

// DELETE /api/posts/:id - Delete post
router.delete('/:id', protect, deletePost);

// POST /api/posts/:id/like - Like/unlike post
router.post('/:id/like', protect, likePost);

// POST /api/posts/:id/dislike - Dislike/un-dislike post
router.post('/:id/dislike', protect, dislikePost);

// Admin routes

// POST /api/posts/:id/pin - Pin/unpin post (admin only)
router.post('/:id/pin', protect, requireAdmin, togglePinPost);

// Mount comment routes for posts: /api/posts/:postId/comments
router.use('/:postId/comments', commentRoutes);

module.exports = router;