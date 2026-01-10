const PostService = require('../services/postService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * Post Controller
 * Handles HTTP requests for forum post operations
 */

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = asyncHandler(async (req, res) => {
  const { title, content, category } = req.body;
  const userId = req.user && req.user.id ? req.user.id : null;

  const post = await PostService.createPost({ title, content, category }, userId);

  res.status(201).json({
    success: true,
    data: post
  });
});

/**
 * @desc    Get all posts
 * @route   GET /api/posts
 * @access  Public
 */
const getPosts = asyncHandler(async (req, res) => {
  const { page, limit, sort, category } = req.query;

  const result = await PostService.getPosts({ page, limit, sort, category });

  res.json({
    success: true,
    data: result.posts,
    pagination: result.pagination
  });
});

/**
 * @desc    Get single post
 * @route   GET /api/posts/:id
 * @access  Public
 */
const getPost = asyncHandler(async (req, res) => {
  const post = await PostService.getPostById(req.params.id);

  res.json({
    success: true,
    data: post
  });
});

/**
 * @desc    Update post
 * @route   PUT /api/posts/:id
 * @access  Private
 */
const updatePost = asyncHandler(async (req, res) => {
  const { title, content, category } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const post = await PostService.updatePost(
    req.params.id,
    { title, content, category },
    userId,
    userRole
  );

  res.json({
    success: true,
    message: 'Post updated successfully',
    data: post
  });
});

/**
 * @desc    Delete post
 * @route   DELETE /api/posts/:id
 * @access  Private
 */
const deletePost = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  const result = await PostService.deletePost(req.params.id, userId, userRole);

  res.json({
    success: true,
    message: result.message
  });
});

/**
 * @desc    Like/unlike a post
 * @route   POST /api/posts/:id/like
 * @access  Private
 */
const likePost = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await PostService.toggleLike(req.params.id, userId);

  res.json({
    success: true,
    message: result.liked ? 'Post liked' : 'Post unliked',
    data: {
      likeCount: result.likeCount
    }
  });
});

/**
 * @desc    Get posts by author
 * @route   GET /api/posts/author/:authorId
 * @access  Public
 */
const getPostsByAuthor = asyncHandler(async (req, res) => {
  const { page, limit, sort } = req.query;

  const result = await PostService.getPostsByAuthor(req.params.authorId, { page, limit, sort });

  res.json({
    success: true,
    data: result.posts,
    pagination: result.pagination
  });
});

module.exports = {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  getPostsByAuthor
};