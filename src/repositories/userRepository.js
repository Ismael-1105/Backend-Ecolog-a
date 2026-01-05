const User = require('../models/User');

/**
 * User Repository
 * Handles database operations for User model
 */

/**
 * Find user by ID
 * @param {string} userId - User ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} User document
 */
const findById = async (userId, options = {}) => {
    let query = User.findById(userId);

    if (options.includePassword) {
        query = query.select('+password');
    }

    if (options.includeDeleted) {
        query = query.setOptions({ includeDeleted: true });
    }

    return await query;
};

/**
 * Find user by email
 * @param {string} email - User email
 * @param {Object} options - Query options
 * @returns {Promise<Object>} User document
 */
const findByEmail = async (email, options = {}) => {
    let query = User.findOne({ email });

    if (options.includePassword) {
        query = query.select('+password');
    }

    if (options.includeDeleted) {
        query = query.setOptions({ includeDeleted: true });
    }

    return await query;
};

/**
 * Find users by IDs
 * @param {Array} userIds - Array of user IDs
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of users
 */
const findByIds = async (userIds, pagination = {}) => {
    const { skip = 0, limit = 20 } = pagination;

    return await User.find({ _id: { $in: userIds } })
        .skip(skip)
        .limit(limit)
        .select('name email profilePicture institution isVerified badges');
};

/**
 * Find all users with pagination
 * @param {Object} filters - Query filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of users
 */
const findAll = async (filters = {}, pagination = {}) => {
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = pagination;

    let query = User.find(filters);

    if (pagination.includeDeleted) {
        query = query.setOptions({ includeDeleted: true });
    }

    return await query
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

/**
 * Count users
 * @param {Object} filters - Query filters
 * @returns {Promise<number>} Count of users
 */
const count = async (filters = {}) => {
    return await User.countDocuments(filters);
};

/**
 * Create new user
 * @param {Object} userData - User data
 * @returns {Promise<Object>} Created user
 */
const create = async (userData) => {
    return await User.create(userData);
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated user
 */
const update = async (userId, updateData) => {
    return await User.findByIdAndUpdate(
        userId,
        updateData,
        { new: true, runValidators: true }
    );
};

/**
 * Soft delete user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Deleted user
 */
const softDelete = async (userId) => {
    return await User.findByIdAndUpdate(
        userId,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
    );
};

/**
 * Hard delete user (permanent)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const hardDelete = async (userId) => {
    return await User.findByIdAndDelete(userId);
};

/**
 * Restore soft-deleted user
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Restored user
 */
const restore = async (userId) => {
    return await User.findByIdAndUpdate(
        userId,
        { isDeleted: false, deletedAt: null },
        { new: true }
    ).setOptions({ includeDeleted: true });
};

module.exports = {
    findById,
    findByEmail,
    findByIds,
    findAll,
    count,
    create,
    update,
    softDelete,
    hardDelete,
    restore,
};
