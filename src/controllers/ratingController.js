const ratingService = require('../services/ratingService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Rate a video
 * @route   POST /api/videos/:videoId/rate
 * @access  Private
 */
const rateVideo = asyncHandler(async (req, res) => {
    const { valoracion } = req.body;

    const result = await ratingService.rateVideo(
        req.params.videoId,
        req.user.id,
        valoracion
    );

    res.json({
        success: true,
        data: result,
    });
});

/**
 * @desc    Get video rating statistics
 * @route   GET /api/videos/:videoId/rate
 * @access  Public
 */
const getVideoRatingStats = asyncHandler(async (req, res) => {
    const stats = await ratingService.getVideoRatingStats(req.params.videoId);

    res.json({
        success: true,
        data: stats,
    });
});

/**
 * @desc    Get user's rating for a video
 * @route   GET /api/videos/:videoId/rate/me
 * @access  Private
 */
const getUserRating = asyncHandler(async (req, res) => {
    const rating = await ratingService.getUserRating(
        req.params.videoId,
        req.user.id
    );

    res.json({
        success: true,
        data: rating,
    });
});

/**
 * @desc    Delete user's rating
 * @route   DELETE /api/videos/:videoId/rate
 * @access  Private
 */
const deleteRating = asyncHandler(async (req, res) => {
    const result = await ratingService.deleteRating(
        req.params.videoId,
        req.user.id
    );

    res.json({
        success: true,
        data: result,
        message: 'Rating deleted successfully',
    });
});

module.exports = {
    rateVideo,
    getVideoRatingStats,
    getUserRating,
    deleteRating,
};
