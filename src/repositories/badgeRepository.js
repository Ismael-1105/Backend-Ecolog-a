const Badge = require('../models/Badge');

/**
 * Badge Repository
 * Handles database operations for Badge model
 */

/**
 * Find badge by ID
 * @param {string} badgeId - Badge ID
 * @returns {Promise<Object>} Badge document
 */
const findById = async (badgeId) => {
    return await Badge.findById(badgeId);
};

/**
 * Find badge by slug
 * @param {string} slug - Badge slug
 * @returns {Promise<Object>} Badge document
 */
const findBySlug = async (slug) => {
    return await Badge.findOne({ slug, isActive: true });
};

/**
 * Find all badges
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of badges
 */
const findAll = async (filters = {}, options = {}) => {
    const { sort = { order: 1, name: 1 } } = options;

    return await Badge.find({ ...filters, isActive: true }).sort(sort);
};

/**
 * Find auto-awarded badges
 * @returns {Promise<Array>} Array of auto badges
 */
const findAutoBadges = async () => {
    return await findAll({ 'criteria.type': 'auto' });
};

/**
 * Find badges by rarity
 * @param {string} rarity - Badge rarity
 * @returns {Promise<Array>} Array of badges
 */
const findByRarity = async (rarity) => {
    return await findAll({ rarity });
};

/**
 * Count badges
 * @param {Object} filters - Query filters
 * @returns {Promise<number>} Count of badges
 */
const count = async (filters = {}) => {
    return await Badge.countDocuments({ ...filters, isActive: true });
};

/**
 * Create new badge
 * @param {Object} badgeData - Badge data
 * @returns {Promise<Object>} Created badge
 */
const create = async (badgeData) => {
    return await Badge.create(badgeData);
};

/**
 * Update badge
 * @param {string} badgeId - Badge ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated badge
 */
const update = async (badgeId, updateData) => {
    return await Badge.findByIdAndUpdate(
        badgeId,
        updateData,
        { new: true, runValidators: true }
    );
};

/**
 * Delete badge (soft delete by setting isActive to false)
 * @param {string} badgeId - Badge ID
 * @returns {Promise<Object>} Deleted badge
 */
const softDelete = async (badgeId) => {
    return await Badge.findByIdAndUpdate(
        badgeId,
        { isActive: false },
        { new: true }
    );
};

/**
 * Hard delete badge (permanent)
 * @param {string} badgeId - Badge ID
 * @returns {Promise<void>}
 */
const hardDelete = async (badgeId) => {
    return await Badge.findByIdAndDelete(badgeId);
};

module.exports = {
    findById,
    findBySlug,
    findAll,
    findAutoBadges,
    findByRarity,
    count,
    create,
    update,
    softDelete,
    hardDelete,
};
