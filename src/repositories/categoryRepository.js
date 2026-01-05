const Category = require('../models/Category');

/**
 * Category Repository
 * Handles database operations for Category model
 */

/**
 * Find category by ID
 * @param {string} categoryId - Category ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Category document
 */
const findById = async (categoryId, options = {}) => {
    let query = Category.findById(categoryId);

    if (options.populate) {
        query = query.populate('parentCategory', 'name slug icon');
    }

    return await query;
};

/**
 * Find category by slug
 * @param {string} slug - Category slug
 * @returns {Promise<Object>} Category document
 */
const findBySlug = async (slug) => {
    return await Category.findOne({ slug, isActive: true });
};

/**
 * Find all categories
 * @param {Object} filters - Query filters
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of categories
 */
const findAll = async (filters = {}, options = {}) => {
    const { sort = { order: 1, name: 1 } } = options;

    let query = Category.find({ ...filters, isActive: true });

    if (options.populate) {
        query = query.populate('parentCategory', 'name slug');
    }

    return await query.sort(sort);
};

/**
 * Find top-level categories (no parent)
 * @returns {Promise<Array>} Array of top-level categories
 */
const findTopLevel = async () => {
    return await findAll({ parentCategory: null });
};

/**
 * Find subcategories of a parent category
 * @param {string} parentId - Parent category ID
 * @returns {Promise<Array>} Array of subcategories
 */
const findByParent = async (parentId) => {
    return await findAll({ parentCategory: parentId });
};

/**
 * Count categories
 * @param {Object} filters - Query filters
 * @returns {Promise<number>} Count of categories
 */
const count = async (filters = {}) => {
    return await Category.countDocuments({ ...filters, isActive: true });
};

/**
 * Create new category
 * @param {Object} categoryData - Category data
 * @returns {Promise<Object>} Created category
 */
const create = async (categoryData) => {
    return await Category.create(categoryData);
};

/**
 * Update category
 * @param {string} categoryId - Category ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated category
 */
const update = async (categoryId, updateData) => {
    return await Category.findByIdAndUpdate(
        categoryId,
        updateData,
        { new: true, runValidators: true }
    );
};

/**
 * Increment video count for category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Updated category
 */
const incrementVideoCount = async (categoryId) => {
    return await Category.findByIdAndUpdate(
        categoryId,
        { $inc: { videoCount: 1 } },
        { new: true }
    );
};

/**
 * Decrement video count for category
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Updated category
 */
const decrementVideoCount = async (categoryId) => {
    return await Category.findByIdAndUpdate(
        categoryId,
        { $inc: { videoCount: -1 } },
        { new: true }
    );
};

/**
 * Delete category (soft delete by setting isActive to false)
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Deleted category
 */
const softDelete = async (categoryId) => {
    return await Category.findByIdAndUpdate(
        categoryId,
        { isActive: false },
        { new: true }
    );
};

/**
 * Hard delete category (permanent)
 * @param {string} categoryId - Category ID
 * @returns {Promise<void>}
 */
const hardDelete = async (categoryId) => {
    return await Category.findByIdAndDelete(categoryId);
};

module.exports = {
    findById,
    findBySlug,
    findAll,
    findTopLevel,
    findByParent,
    count,
    create,
    update,
    incrementVideoCount,
    decrementVideoCount,
    softDelete,
    hardDelete,
};
