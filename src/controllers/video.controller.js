const videoService = require('../services/video.service');
const asyncHandler = require('../middlewares/asyncHandler');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Video Controller
 * Handles HTTP requests for video operations
 */

/**
 * @route   POST /api/videos
 * @desc    Upload a new video with thumbnail
 * @access  Private (Docente+)
 */
exports.uploadVideo = asyncHandler(async (req, res, next) => {
    const { title, description, duration } = req.body;

    // Validate required fields
    if (!title || !description) {
        return next(new ErrorResponse('Title and description are required', 400, 'MISSING_FIELDS'));
    }

    // Get uploaded files
    const videoFile = req.videoFile;
    const thumbnailFile = req.thumbnailFile;

    // Upload video
    const video = await videoService.uploadVideo(
        videoFile,
        thumbnailFile,
        { title, description, duration },
        req.user.id
    );

    res.status(201).json({
        success: true,
        message: 'Video uploaded and approved successfully.',
        data: video
    });
});

/**
 * @route   GET /api/videos
 * @desc    Get all approved videos
 * @access  Public
 */
exports.getVideos = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10, sort = 'createdAt' } = req.query;

    const sortOrder = sort.startsWith('-') ? { [sort.substring(1)]: -1 } : { [sort]: 1 };

    const result = await videoService.getApprovedVideos({
        page: parseInt(page),
        limit: parseInt(limit),
        sort: sortOrder
    });

    res.status(200).json({
        success: true,
        data: result.videos,
        pagination: result.pagination
    });
});

/**
 * @route   GET /api/videos/:id
 * @desc    Get video by ID
 * @access  Public
 */
exports.getVideoById = asyncHandler(async (req, res, next) => {
    const video = await videoService.getVideoById(req.params.id, true);

    res.status(200).json({
        success: true,
        data: video
    });
});

/**
 * @route   GET /api/videos/my-videos
 * @desc    Get current user's videos
 * @access  Private (Docente+)
 */
exports.getMyVideos = asyncHandler(async (req, res, next) => {
    const { page = 1, limit = 10 } = req.query;

    const result = await videoService.getVideosByAuthor(req.user.id, {
        page: parseInt(page),
        limit: parseInt(limit)
    });

    res.status(200).json({
        success: true,
        data: result.videos,
        pagination: result.pagination
    });
});

/**
 * @route   PUT /api/videos/:id/approve
 * @desc    Approve a video
 * @access  Private (Admin+)
 */
exports.approveVideo = asyncHandler(async (req, res, next) => {
    const video = await videoService.approveVideo(req.params.id, req.user.id);

    res.status(200).json({
        success: true,
        message: 'Video approved successfully',
        data: video
    });
});

/**
 * @route   PUT /api/videos/:id
 * @desc    Update video
 * @access  Private (Author or Admin)
 */
exports.updateVideo = asyncHandler(async (req, res, next) => {
    const { title, description } = req.body;

    const video = await videoService.updateVideo(
        req.params.id,
        { title, description },
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: 'Video updated successfully',
        data: video
    });
});

/**
 * @route   DELETE /api/videos/:id
 * @desc    Delete video
 * @access  Private (Author or Admin)
 */
exports.deleteVideo = asyncHandler(async (req, res, next) => {
    const result = await videoService.deleteVideo(
        req.params.id,
        req.user.id,
        req.user.role
    );

    res.status(200).json({
        success: true,
        message: result.message
    });
});

/**
 * @route   POST /api/videos/:id/like
 * @desc    Like a video
 * @access  Private
 */
exports.likeVideo = asyncHandler(async (req, res, next) => {
    const video = await videoService.likeVideo(req.params.id, req.user.id);

    res.status(200).json({
        success: true,
        message: 'Video liked successfully',
        data: {
            likeCount: video.likeCount,
            dislikeCount: video.dislikeCount
        }
    });
});

/**
 * @route   POST /api/videos/:id/dislike
 * @desc    Dislike a video
 * @access  Private
 */
exports.dislikeVideo = asyncHandler(async (req, res, next) => {
    const video = await videoService.dislikeVideo(req.params.id, req.user.id);

    res.status(200).json({
        success: true,
        message: 'Video disliked successfully',
        data: {
            likeCount: video.likeCount,
            dislikeCount: video.dislikeCount
        }
    });
});
