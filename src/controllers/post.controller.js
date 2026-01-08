const Post = require('../models/Post');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * @desc    Create a new post
 * @route   POST /api/posts
 * @access  Private
 */
const createPost = asyncHandler(async (req, res) => {
  const { title, content, category } = req.body;

  if (!title || !content) {
    throw ErrorResponse.badRequest('Title and content are required');
  }

  if (!category) {
    throw ErrorResponse.badRequest('Category is required');
  }

  const postData = {
    title,
    content,
    category
  };

  // Only add author if user is authenticated
  if (req.user && req.user.id) {
    postData.author = req.user.id;
  }

  const post = await Post.create(postData);

  // Only populate author if it exists
  if (post.author) {
    await post.populate('author', 'name profilePicture');
  }

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
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  const posts = await Post.find()
    .populate('author', 'name profilePicture')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Post.countDocuments();

  res.json({
    success: true,
    data: posts,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

/**
 * @desc    Get single post
 * @route   GET /api/posts/:id
 * @access  Public
 */
const getPost = asyncHandler(async (req, res) => {
  const post = await Post.findById(req.params.id)
    .populate('author', 'name profilePicture');

  if (!post) {
    throw ErrorResponse.notFound('Post not found');
  }

  res.json({
    success: true,
    data: post
  });
});

module.exports = {
  createPost,
  getPosts,
  getPost
};