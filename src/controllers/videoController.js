const videoService = require('../services/videoService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Upload a video
 * @route   POST /api/videos
 * @access  Private
 */
const uploadVideo = asyncHandler(async (req, res) => {
    const { titulo, descripcion } = req.body;

    const video = await videoService.uploadVideo(
        { titulo, descripcion },
        req.file,
        req.user.id
    );

    res.status(201).json({
        success: true,
        data: video,
    });
});

/**
 * @desc    Get all public videos
 * @route   GET /api/videos
 * @access  Public
 */
const getPublicVideos = asyncHandler(async (req, res) => {
    const result = await videoService.getPublicVideos(req.query);

    res.json({
        success: true,
        ...result,
    });
});

/**
 * @desc    Get video by ID
 * @route   GET /api/videos/:id
 * @access  Public
 */
const getVideoById = asyncHandler(async (req, res) => {
    const video = await videoService.getVideoById(req.params.id, true);

    res.json({
        success: true,
        data: video,
    });
});

/**
 * @desc    Get videos by author
 * @route   GET /api/videos/author/:authorId
 * @access  Public
 */
const getVideosByAuthor = asyncHandler(async (req, res) => {
    const result = await videoService.getVideosByAuthor(req.params.authorId, req.query);

    res.json({
        success: true,
        ...result,
    });
});

/**
 * @desc    Get pending approval videos
 * @route   GET /api/videos/pending
 * @access  Private/Admin
 */
const getPendingVideos = asyncHandler(async (req, res) => {
    const result = await videoService.getPendingVideos(req.query);

    res.json({
        success: true,
        ...result,
    });
});

/**
 * @desc    Approve a video
 * @route   PUT /api/videos/:id/approve
 * @access  Private/Admin
 */
const approveVideo = asyncHandler(async (req, res) => {
    const video = await videoService.approveVideo(req.params.id, req.user.id);

    res.json({
        success: true,
        data: video,
    });
});

/**
 * @desc    Update video
 * @route   PUT /api/videos/:id
 * @access  Private
 */
const updateVideo = asyncHandler(async (req, res) => {
    const video = await videoService.updateVideo(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
    );

    res.json({
        success: true,
        data: video,
    });
});

/**
 * @desc    Delete video
 * @route   DELETE /api/videos/:id
 * @access  Private
 */
const deleteVideo = asyncHandler(async (req, res) => {
    await videoService.deleteVideo(req.params.id, req.user.id, req.user.role);

    res.json({
        success: true,
        message: 'Video deleted successfully',
    });
});

module.exports = {
    uploadVideo,
    getPublicVideos,
    getVideoById,
    getVideosByAuthor,
    getPendingVideos,
    approveVideo,
    updateVideo,
    deleteVideo,
};
