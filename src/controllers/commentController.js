const commentService = require('../services/commentService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Get comments for a video
 * @route   GET /api/videos/:videoId/comments
 * @access  Public
 */
const getVideoComments = asyncHandler(async (req, res) => {
    const result = await commentService.getVideoComments(req.params.videoId, req.query);

    res.json({
        success: true,
        ...result,
    });
});

/**
 * @desc    Get replies to a comment
 * @route   GET /api/comments/:id/replies
 * @access  Public
 */
const getCommentReplies = asyncHandler(async (req, res) => {
    const result = await commentService.getCommentReplies(req.params.id, req.query);

    res.json({
        success: true,
        ...result,
    });
});

/**
 * @desc    Get comment thread (with nested replies)
 * @route   GET /api/comments/:id/thread
 * @access  Public
 */
const getCommentThread = asyncHandler(async (req, res) => {
    const maxDepth = parseInt(req.query.maxDepth) || 3;
    const comment = await commentService.getCommentThread(req.params.id, maxDepth);

    res.json({
        success: true,
        data: comment,
    });
});

/**
 * @desc    Create a comment
 * @route   POST /api/videos/:videoId/comments
 * @access  Private
 */
const createComment = asyncHandler(async (req, res) => {
    const comment = await commentService.createComment(
        req.params.videoId,
        req.body,
        req.user.id
    );

    res.status(201).json({
        success: true,
        data: comment,
    });
});

/**
 * @desc    Update a comment
 * @route   PUT /api/comments/:id
 * @access  Private
 */
const updateComment = asyncHandler(async (req, res) => {
    const comment = await commentService.updateComment(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
    );

    res.json({
        success: true,
        data: comment,
    });
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/comments/:id
 * @access  Private
 */
const deleteComment = asyncHandler(async (req, res) => {
    await commentService.deleteComment(req.params.id, req.user.id, req.user.role);

    res.json({
        success: true,
        message: 'Comment deleted successfully',
    });
});

/**
 * @desc    Like/unlike a comment
 * @route   POST /api/comments/:id/like
 * @access  Private
 */
const toggleLike = asyncHandler(async (req, res) => {
    const comment = await commentService.toggleLike(req.params.id, req.user.id);

    res.json({
        success: true,
        data: comment,
    });
});

module.exports = {
    getVideoComments,
    getCommentReplies,
    getCommentThread,
    createComment,
    updateComment,
    deleteComment,
    toggleLike,
};
