const Comment = require('../models/Comment');
const Post = require('../models/Post');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * @desc    Create a comment on a post
 * @route   POST /api/posts/:postId/comments
 * @access  Private
 */
const createComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const { postId } = req.params;

  if (!content) {
    throw ErrorResponse.badRequest('Comment content is required');
  }

  // Verify post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw ErrorResponse.notFound('Post not found');
  }

  const comment = await Comment.create({
    content,
    post: postId,
    author: req.user.id
  });

  await comment.populate('author', 'name profilePicture');

  res.status(201).json({
    success: true,
    data: comment
  });
});

/**
 * @desc    Get comments for a post
 * @route   GET /api/posts/:postId/comments
 * @access  Public
 */
const getCommentsByPost = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip = (page - 1) * limit;

  // Verify post exists
  const post = await Post.findById(postId);
  if (!post) {
    throw ErrorResponse.notFound('Post not found');
  }

  const comments = await Comment.find({ post: postId })
    .populate('author', 'name profilePicture')
    .sort({ createdAt: 1 })
    .skip(skip)
    .limit(limit);

  const total = await Comment.countDocuments({ post: postId });

  res.json({
    success: true,
    data: comments,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  });
});

module.exports = {
  createComment,
  getCommentsByPost
};