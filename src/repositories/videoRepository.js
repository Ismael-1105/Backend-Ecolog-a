const Video = require('../models/Video');

/**
 * Video Repository
 * Handles database operations for Video model
 */

/**
 * Find video by ID
 * @param {string} videoId - Video ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Video document
 */
const findById = async (videoId, options = {}) => {
    let query = Video.findById(videoId);

    if (options.populate) {
        query = query.populate('autor_id', 'name institution profilePicture');
    }

    if (options.includeDeleted) {
        query = query.setOptions({ includeDeleted: true });
    }

    return await query;
};

/**
 * Find all videos with filters and pagination
 * @param {Object} filters - Query filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of videos
 */
const findAll = async (filters = {}, pagination = {}) => {
    const { skip = 0, limit = 10, sort = { fecha_creacion: -1 }, populate = true } = pagination;

    let query = Video.find(filters);

    if (populate) {
        query = query.populate('autor_id', 'name institution profilePicture');
    }

    if (pagination.includeDeleted) {
        query = query.setOptions({ includeDeleted: true });
    }

    return await query
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

/**
 * Search videos by text
 * @param {string} searchText - Text to search
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of videos
 */
const searchByText = async (searchText, pagination = {}) => {
    const { skip = 0, limit = 10 } = pagination;

    return await Video.find(
        { $text: { $search: searchText }, aprobado: true },
        { score: { $meta: 'textScore' } }
    )
        .sort({ score: { $meta: 'textScore' } })
        .populate('autor_id', 'name institution')
        .skip(skip)
        .limit(limit);
};

/**
 * Find videos by author
 * @param {string} authorId - Author ID
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of videos
 */
const findByAuthor = async (authorId, pagination = {}) => {
    return await findAll({ autor_id: authorId }, pagination);
};

/**
 * Find approved videos
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of approved videos
 */
const findApproved = async (pagination = {}) => {
    return await findAll({ aprobado: true }, pagination);
};

/**
 * Find pending approval videos
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of pending videos
 */
const findPending = async (pagination = {}) => {
    return await findAll({ aprobado: false }, pagination);
};

/**
 * Count videos
 * @param {Object} filters - Query filters
 * @returns {Promise<number>} Count of videos
 */
const count = async (filters = {}) => {
    return await Video.countDocuments(filters);
};

/**
 * Create new video
 * @param {Object} videoData - Video data
 * @returns {Promise<Object>} Created video
 */
const create = async (videoData) => {
    return await Video.create(videoData);
};

/**
 * Update video
 * @param {string} videoId - Video ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated video
 */
const update = async (videoId, updateData) => {
    return await Video.findByIdAndUpdate(
        videoId,
        updateData,
        { new: true, runValidators: true }
    ).populate('autor_id', 'name institution');
};

/**
 * Approve video
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Approved video
 */
const approve = async (videoId) => {
    return await update(videoId, { aprobado: true });
};

/**
 * Increment video views
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Updated video
 */
const incrementViews = async (videoId) => {
    return await Video.findByIdAndUpdate(
        videoId,
        { $inc: { views: 1 } },
        { new: true }
    );
};

/**
 * Soft delete video
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Deleted video
 */
const softDelete = async (videoId) => {
    return await Video.findByIdAndUpdate(
        videoId,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
    );
};

/**
 * Hard delete video (permanent)
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
const hardDelete = async (videoId) => {
    return await Video.findByIdAndDelete(videoId);
};

/**
 * Restore soft-deleted video
 * @param {string} videoId - Video ID
 * @returns {Promise<Object>} Restored video
 */
const restore = async (videoId) => {
    return await Video.findByIdAndUpdate(
        videoId,
        { isDeleted: false, deletedAt: null },
        { new: true }
    ).setOptions({ includeDeleted: true });
};

module.exports = {
    findById,
    findAll,
    searchByText,
    findByAuthor,
    findApproved,
    findPending,
    count,
    create,
    update,
    approve,
    incrementViews,
    softDelete,
    hardDelete,
    restore,
};
