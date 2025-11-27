const ratingRepository = require('../repositories/ratingRepository');
const videoRepository = require('../repositories/videoRepository');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Rating Service
 * Handles business logic for video ratings
 */

/**
 * Rate a video
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @param {number} valoracion - Rating value (1-5)
 * @returns {Promise<Object>} Rating and updated average
 */
const rateVideo = async (videoId, userId, valoracion) => {
    // Verify video exists
    const video = await videoRepository.findById(videoId);

    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    // Validate rating value
    if (valoracion < 1 || valoracion > 5) {
        throw ErrorResponse.badRequest('Rating must be between 1 and 5');
    }

    // Create or update rating
    const rating = await ratingRepository.createOrUpdate(userId, videoId, valoracion);

    // Get updated average
    const averageData = await ratingRepository.getAverageRating(videoId);

    logger.info('Video rated', {
        videoId,
        userId,
        valoracion,
        newAverage: averageData.averageRating,
    });

    return {
        rating,
        averageRating: averageData.averageRating,
        totalRatings: averageData.totalRatings,
    };
};

/**
 * Get video rating statistics
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Rating statistics
 */
const getVideoRatingStats = async (videoId) => {
    // Verify video exists
    const video = await videoRepository.findById(videoId);

    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    const averageData = await ratingRepository.getAverageRating(videoId);
    const distribution = await ratingRepository.getRatingDistribution(videoId);

    return {
        averageRating: averageData.averageRating,
        totalRatings: averageData.totalRatings,
        distribution,
    };
};

/**
 * Get user's rating for a video
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @returns {Promise<Object|null>} User's rating or null
 */
const getUserRating = async (videoId, userId) => {
    const rating = await ratingRepository.findByUserAndVideo(userId, videoId);
    return rating;
};

/**
 * Delete user's rating
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated average
 */
const deleteRating = async (videoId, userId) => {
    const rating = await ratingRepository.findByUserAndVideo(userId, videoId);

    if (!rating) {
        throw ErrorResponse.notFound('Rating not found');
    }

    await ratingRepository.deleteByUserAndVideo(userId, videoId);

    // Get updated average
    const averageData = await ratingRepository.getAverageRating(videoId);

    logger.info('Rating deleted', { videoId, userId });

    return {
        averageRating: averageData.averageRating,
        totalRatings: averageData.totalRatings,
    };
};

module.exports = {
    rateVideo,
    getVideoRatingStats,
    getUserRating,
    deleteRating,
};
