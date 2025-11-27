const Comment = require('../models/Comment');

/**
 * Comment Repository
 * Handles database operations for Comment model
 */

/**
 * Find comment by ID
 * @param {string} commentId - Comment ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Comment document
 */
const findById = async (commentId, options = {}) => {
    let query = Comment.findById(commentId);

    if (options.populate) {
        query = query.populate('autor_id', 'name profilePicture');
    }

    return await query;
};

/**
 * Find comments by video ID
 * @param {string} videoId - Video ID
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of comments
 */
const findByVideoId = async (videoId, pagination = {}) => {
    const { skip = 0, limit = 20, sort = { fecha_creacion: -1 } } = pagination;

    return await Comment.find({ video_id: videoId })
        .populate('autor_id', 'name profilePicture')
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

/**
 * Find comments by author
 * @param {string} authorId - Author ID
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of comments
 */
const findByAuthorId = async (authorId, pagination = {}) => {
    const { skip = 0, limit = 20, sort = { fecha_creacion: -1 } } = pagination;

    return await Comment.find({ autor_id: authorId })
        .populate('video_id', 'titulo')
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

/**
 * Count comments for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<number>} Count of comments
 */
const countByVideoId = async (videoId) => {
    return await Comment.countDocuments({ video_id: videoId });
};

/**
 * Create new comment
 * @param {Object} commentData - Comment data
 * @returns {Promise<Object>} Created comment
 */
const create = async (commentData) => {
    const comment = await Comment.create(commentData);
    return await comment.populate('autor_id', 'name profilePicture');
};

/**
 * Update comment
 * @param {string} commentId - Comment ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated comment
 */
const update = async (commentId, updateData) => {
    return await Comment.findByIdAndUpdate(
        commentId,
        updateData,
        { new: true, runValidators: true }
    ).populate('autor_id', 'name profilePicture');
};

/**
 * Delete comment
 * @param {string} commentId - Comment ID
 * @returns {Promise<void>}
 */
const deleteById = async (commentId) => {
    return await Comment.findByIdAndDelete(commentId);
};

/**
 * Delete all comments for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Delete result
 */
const deleteByVideoId = async (videoId) => {
    return await Comment.deleteMany({ video_id: videoId });
};

module.exports = {
    findById,
    findByVideoId,
    findByAuthorId,
    countByVideoId,
    create,
    update,
    deleteById,
    deleteByVideoId,
};
