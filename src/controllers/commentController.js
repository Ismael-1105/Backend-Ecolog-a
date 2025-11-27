const commentService = require('../services/commentService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Create a comment
 * @route   POST /api/videos/:videoId/comments
 * @access  Private
 */
const createComment = asyncHandler(async (req, res) => {
    const { comentario } = req.body;

    const comment = await commentService.createComment(
        req.params.videoId,
        req.user.id,
        comentario
    );

    res.status(201).json({
        success: true,
        data: comment,
    });
});

/**
 * @desc    Get comments for a video
 * @route   GET /api/videos/:videoId/comments
 * @access  Public
 */
const getVideoComments = asyncHandler(async (req, res) => {
    const result = await commentService.getVideoComments(
        req.params.videoId,
        req.query
    );

    res.json({
        success: true,
        ...result,
    });
});

/**
 * @desc    Update a comment
 * @route   PUT /api/videos/:videoId/comments/:commentId
 * @access  Private
 */
const updateComment = asyncHandler(async (req, res) => {
    const { comentario } = req.body;

    const comment = await commentService.updateComment(
        req.params.commentId,
        req.user.id,
        req.user.role,
        comentario
    );

    res.json({
        success: true,
        data: comment,
    });
});

/**
 * @desc    Delete a comment
 * @route   DELETE /api/videos/:videoId/comments/:commentId
 * @access  Private
 */
const deleteComment = asyncHandler(async (req, res) => {
    await commentService.deleteComment(
        req.params.commentId,
        req.user.id,
        req.user.role
    );

    res.json({
        success: true,
        message: 'Comment deleted successfully',
    });
});

module.exports = {
    createComment,
    getVideoComments,
    updateComment,
    deleteComment,
};
