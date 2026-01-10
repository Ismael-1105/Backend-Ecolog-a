const CommentPostService = require('../services/commentPostService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * Comment Controller
 * Handles HTTP requests for post comment operations
 */

/**
 * @desc    Create a comment on a post
 * @route   POST /api/posts/:postId/comments
 * @access  Private
 */
const createComment = asyncHandler(async (req, res) => {
  const { content, parentComment } = req.body;
  const { postId } = req.params;
  const userId = req.user.id;

  const comment = await CommentPostService.createComment(
    postId,
    { content, parentComment },
    userId
  );

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
  const { page, limit, sort } = req.query;

  const result = await CommentPostService.getCommentsByPost(postId, { page, limit, sort });

  res.json({
    success: true,
    data: result.comments,
    pagination: result.pagination
  });
});

/**
 * @desc    Update comment
 * @route   PUT /api/post-comments/:id
 * @access  Private
 */
const updateComment = asyncHandler(async (req, res) => {
  const { content } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;

  const comment = await CommentPostService.updateComment(
    req.params.id,
    { content },
    userId,
    userRole
  );

  res.json({
    success: true,
    message: 'Comment updated successfully',
    data: comment
  });
});

/**
 * @desc    Delete comment
 * @route   DELETE /api/post-comments/:id
 * @access  Private
 */
const deleteComment = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const userRole = req.user.role;

  const result = await CommentPostService.deleteComment(req.params.id, userId, userRole);

  res.json({
    success: true,
    message: result.message
  });
});

/**
 * @desc    Like/unlike a comment
 * @route   POST /api/post-comments/:id/like
 * @access  Private
 */
const likeComment = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const result = await CommentPostService.toggleLike(req.params.id, userId);

  res.json({
    success: true,
    message: result.liked ? 'Comment liked' : 'Comment unliked',
    data: {
      likeCount: result.likeCount
    }
  });
});

module.exports = {
  createComment,
  getCommentsByPost,
  updateComment,
  deleteComment,
  likeComment
};