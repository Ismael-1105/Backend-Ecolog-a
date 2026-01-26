const PostService = require('../services/postService');
const UploadService = require('../services/uploadService');
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

  try {
    // Process file attachments if present
    let attachments = [];
    if (req.file) {
      // Single file upload
      const fileMetadata = await UploadService.processFile(req.file);
      attachments.push(fileMetadata);
    } else if (req.files && req.files.length > 0) {
      // Multiple files upload
      if (req.files.length > 5) {
        // Cleanup files before throwing error
        await UploadService.cleanupMultipleFiles(req.files);
        return res.status(400).json({
          success: false,
          error: 'Maximum 5 files allowed per post'
        });
      }
      attachments = await UploadService.processMultipleFiles(req.files);
    }

    const post = await PostService.createPost(
      { title, content, category, attachments },
      userId
    );

    res.status(201).json({
      success: true,
      data: post
    });
  } catch (error) {
    // Cleanup uploaded files if post creation fails
    if (req.file) {
      await UploadService.cleanupFile(req.file);
    } else if (req.files && req.files.length > 0) {
      await UploadService.cleanupMultipleFiles(req.files);
    }
    throw error;
  }
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
  // Increment views when getting a single post
  const post = await PostService.getPostById(req.params.id, true);

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

  // Get post first to access attachments
  const post = await PostService.getPostById(req.params.id);

  // Delete the post (this checks authorization)
  const result = await PostService.deletePost(req.params.id, userId, userRole);

  // Delete associated files if post had attachments
  if (post.attachments && post.attachments.length > 0) {
    const filePaths = post.attachments.map(att => att.path);
    await UploadService.deleteMultipleFiles(filePaths);
  }

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

/**
 * @desc    Dislike/un-dislike a post
 * @route   POST /api/posts/:id/dislike
 * @access  Private
 */
const dislikePost = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await PostService.toggleDislike(req.params.id, userId);

  res.json({
    success: true,
    message: result.disliked ? 'Post disliked' : 'Post un-disliked',
    data: {
      dislikeCount: result.dislikeCount
    }
  });
});

/**
 * @desc    Search posts by text
 * @route   GET /api/posts/search
 * @access  Public
 */
const searchPosts = asyncHandler(async (req, res) => {
  const { q, page, limit, category } = req.query;

  if (!q) {
    return res.status(400).json({
      success: false,
      error: 'Search query is required'
    });
  }

  const result = await PostService.searchPosts(q, { page, limit, category });

  res.json({
    success: true,
    data: result.posts,
    pagination: result.pagination
  });
});

/**
 * @desc    Get trending posts
 * @route   GET /api/posts/trending
 * @access  Public
 */
const getTrendingPosts = asyncHandler(async (req, res) => {
  const { limit, category, timeframe } = req.query;

  const result = await PostService.getTrendingPosts({ limit, category, timeframe });

  res.json({
    success: true,
    data: result.posts,
    timeframe: result.timeframe
  });
});

/**
 * @desc    Pin/unpin a post
 * @route   POST /api/posts/:id/pin
 * @access  Private (Admin)
 */
const togglePinPost = asyncHandler(async (req, res) => {
  const adminId = req.user.id;
  const { pin = true } = req.body;

  const post = await PostService.togglePin(req.params.id, adminId, pin);

  res.json({
    success: true,
    message: pin ? 'Post pinned successfully' : 'Post unpinned successfully',
    data: post
  });
});

module.exports = {
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
};