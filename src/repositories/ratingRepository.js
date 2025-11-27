const Rating = require('../models/Rating');

/**
 * Rating Repository
 * Handles database operations for Rating model
 */

/**
 * Find rating by ID
 * @param {string} ratingId - Rating ID
 * @returns {Promise<Object>} Rating document
 */
const findById = async (ratingId) => {
    return await Rating.findById(ratingId);
};

/**
 * Find rating by user and video
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Rating document
 */
const findByUserAndVideo = async (userId, videoId) => {
    return await Rating.findOne({ user_id: userId, video_id: videoId });
};

/**
 * Find all ratings for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<Array>} Array of ratings
 */
const findByVideoId = async (videoId) => {
    return await Rating.find({ video_id: videoId })
        .populate('user_id', 'name profilePicture');
};

/**
 * Get average rating for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Average rating and count
 */
const getAverageRating = async (videoId) => {
    const result = await Rating.aggregate([
        { $match: { video_id: videoId } },
        {
            $group: {
                _id: '$video_id',
                averageRating: { $avg: '$valoracion' },
                totalRatings: { $sum: 1 },
            },
        },
    ]);

    if (result.length === 0) {
        return { averageRating: 0, totalRatings: 0 };
    }

    return {
        averageRating: Math.round(result[0].averageRating * 10) / 10, // Round to 1 decimal
        totalRatings: result[0].totalRatings,
    };
};

/**
 * Get rating distribution for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Rating distribution (1-5 stars)
 */
const getRatingDistribution = async (videoId) => {
    const result = await Rating.aggregate([
        { $match: { video_id: videoId } },
        {
            $group: {
                _id: '$valoracion',
                count: { $sum: 1 },
            },
        },
        { $sort: { _id: -1 } },
    ]);

    // Initialize distribution with 0 for all ratings
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    result.forEach((item) => {
        distribution[item._id] = item.count;
    });

    return distribution;
};

/**
 * Create or update rating
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @param {number} valoracion - Rating value (1-5)
 * @returns {Promise<Object>} Created or updated rating
 */
const createOrUpdate = async (userId, videoId, valoracion) => {
    return await Rating.findOneAndUpdate(
        { user_id: userId, video_id: videoId },
        { valoracion },
        { upsert: true, new: true, runValidators: true }
    );
};

/**
 * Delete rating
 * @param {string} userId - User ID
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
const deleteByUserAndVideo = async (userId, videoId) => {
    return await Rating.findOneAndDelete({ user_id: userId, video_id: videoId });
};

/**
 * Delete all ratings for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Delete result
 */
const deleteByVideoId = async (videoId) => {
    return await Rating.deleteMany({ video_id: videoId });
};

/**
 * Count ratings for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<number>} Count of ratings
 */
const countByVideoId = async (videoId) => {
    return await Rating.countDocuments({ video_id: videoId });
};

module.exports = {
    findById,
    findByUserAndVideo,
    findByVideoId,
    getAverageRating,
    getRatingDistribution,
    createOrUpdate,
    deleteByUserAndVideo,
    deleteByVideoId,
    countByVideoId,
};
