const videoRepository = require('../repositories/videoRepository');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');
const path = require('path');
const fs = require('fs').promises;

/**
 * Video Service
 * Handles business logic for video operations
 */

/**
 * Upload a new video
 * @param {Object} videoData - Video data
 * @param {Object} file - Uploaded file
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created video
 */
const uploadVideo = async (videoData, file, userId) => {
    if (!file) {
        throw ErrorResponse.badRequest('Video file is required');
    }

    const url_video = file.path.replace(/\\/g, '/');

    const video = await videoRepository.create({
        ...videoData,
        url_video,
        autor_id: userId,
        fileSize: file.size,
    });

    logger.info('Video uploaded', {
        videoId: video._id,
        userId,
        filename: file.filename,
    });

    return video;
};

/**
 * Get all public (approved) videos
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated videos
 */
const getPublicVideos = async (query) => {
    const { page, limit, skip } = parsePaginationParams(query, 10, 50);

    const filters = { aprobado: true };

    // Search functionality
    if (query.search) {
        const videos = await videoRepository.searchByText(query.search, { skip, limit });
        const totalCount = videos.length; // Approximate count for text search
        return createPaginatedResponse(videos, page, limit, totalCount);
    }

    const videos = await videoRepository.findAll(filters, { skip, limit, populate: true });
    const totalCount = await videoRepository.count(filters);

    return createPaginatedResponse(videos, page, limit, totalCount);
};

/**
 * Get video by ID
 * @param {string} videoId - Video ID
 * @param {boolean} incrementViews - Whether to increment view count
 * @returns {Promise<Object>} Video data
 */
const getVideoById = async (videoId, incrementViews = false) => {
    const video = await videoRepository.findById(videoId, { populate: true });

    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    // Increment views if requested
    if (incrementViews) {
        await videoRepository.incrementViews(videoId);
        video.views = (video.views || 0) + 1;
    }

    return video;
};

/**
 * Get videos by author
 * @param {string} authorId - Author ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated videos
 */
const getVideosByAuthor = async (authorId, query) => {
    const { page, limit, skip } = parsePaginationParams(query);

    const videos = await videoRepository.findByAuthor(authorId, { skip, limit, populate: true });
    const totalCount = await videoRepository.count({ autor_id: authorId });

    return createPaginatedResponse(videos, page, limit, totalCount);
};

/**
 * Get pending approval videos (admin only)
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated pending videos
 */
const getPendingVideos = async (query) => {
    const { page, limit, skip } = parsePaginationParams(query);

    const videos = await videoRepository.findPending({ skip, limit, populate: true });
    const totalCount = await videoRepository.count({ aprobado: false });

    return createPaginatedResponse(videos, page, limit, totalCount);
};

/**
 * Approve video
 * @param {string} videoId - Video ID
 * @param {string} adminId - Admin user ID
 * @returns {Promise<Object>} Approved video
 */
const approveVideo = async (videoId, adminId) => {
    const video = await videoRepository.approve(videoId);

    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    logger.info('Video approved', {
        videoId,
        approvedBy: adminId,
    });

    return video;
};

/**
 * Update video
 * @param {string} videoId - Video ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<Object>} Updated video
 */
const updateVideo = async (videoId, updateData, userId, userRole) => {
    const video = await videoRepository.findById(videoId);

    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    // Check ownership or admin rights
    if (video.autor_id.toString() !== userId && userRole !== 'Administrador' && userRole !== 'SuperAdmin') {
        throw ErrorResponse.forbidden('You can only update your own videos');
    }

    // Don't allow changing author or approval status through this method
    delete updateData.autor_id;
    delete updateData.aprobado;

    const updatedVideo = await videoRepository.update(videoId, updateData);

    logger.info('Video updated', { videoId, updatedBy: userId });

    return updatedVideo;
};

/**
 * Delete video
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<void>}
 */
const deleteVideo = async (videoId, userId, userRole) => {
    const video = await videoRepository.findById(videoId);

    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    // Check ownership or admin rights
    if (video.autor_id.toString() !== userId && userRole !== 'Administrador' && userRole !== 'SuperAdmin') {
        throw ErrorResponse.forbidden('You can only delete your own videos');
    }

    // Soft delete
    await videoRepository.softDelete(videoId);

    logger.info('Video deleted', { videoId, deletedBy: userId });

    // Optionally delete the physical file
    try {
        await fs.unlink(video.url_video);
        logger.info('Video file deleted', { path: video.url_video });
    } catch (error) {
        logger.error('Failed to delete video file', {
            error: error.message,
            path: video.url_video,
        });
    }
};

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
