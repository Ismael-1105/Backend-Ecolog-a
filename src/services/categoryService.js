const categoryRepository = require('../repositories/categoryRepository');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Category Service
 * Handles business logic for category operations
 */

/**
 * Get all categories
 * @param {Object} options - Query options
 * @returns {Promise<Array>} Array of categories
 */
const getAllCategories = async (options = {}) => {
    const categories = await categoryRepository.findAll({}, options);
    return categories;
};

/**
 * Get top-level categories
 * @returns {Promise<Array>} Array of top-level categories
 */
const getTopLevelCategories = async () => {
    return await categoryRepository.findTopLevel();
};

/**
 * Get category by ID
 * @param {string} categoryId - Category ID
 * @returns {Promise<Object>} Category data
 */
const getCategoryById = async (categoryId) => {
    const category = await categoryRepository.findById(categoryId, { populate: true });

    if (!category) {
        throw ErrorResponse.notFound('Category not found');
    }

    return category;
};

/**
 * Get category by slug
 * @param {string} slug - Category slug
 * @returns {Promise<Object>} Category data
 */
const getCategoryBySlug = async (slug) => {
    const category = await categoryRepository.findBySlug(slug);

    if (!category) {
        throw ErrorResponse.notFound('Category not found');
    }

    return category;
};

/**
 * Get subcategories of a category
 * @param {string} parentId - Parent category ID
 * @returns {Promise<Array>} Array of subcategories
 */
const getSubcategories = async (parentId) => {
    // Verify parent exists
    const parent = await categoryRepository.findById(parentId);
    if (!parent) {
        throw ErrorResponse.notFound('Parent category not found');
    }

    return await categoryRepository.findByParent(parentId);
};

/**
 * Create a new category
 * @param {Object} categoryData - Category data
 * @param {string} userId - User ID (admin)
 * @returns {Promise<Object>} Created category
 */
const createCategory = async (categoryData, userId) => {
    // If has parent, verify it exists
    if (categoryData.parentCategory) {
        const parent = await categoryRepository.findById(categoryData.parentCategory);
        if (!parent) {
            throw ErrorResponse.notFound('Parent category not found');
        }
    }

    const category = await categoryRepository.create(categoryData);

    logger.info('Category created', {
        categoryId: category._id,
        name: category.name,
        createdBy: userId,
    });

    return category;
};

/**
 * Update a category
 * @param {string} categoryId - Category ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - User ID (admin)
 * @returns {Promise<Object>} Updated category
 */
const updateCategory = async (categoryId, updateData, userId) => {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
        throw ErrorResponse.notFound('Category not found');
    }

    // If changing parent, verify new parent exists
    if (updateData.parentCategory) {
        const parent = await categoryRepository.findById(updateData.parentCategory);
        if (!parent) {
            throw ErrorResponse.notFound('Parent category not found');
        }

        // Prevent circular reference
        if (updateData.parentCategory === categoryId) {
            throw ErrorResponse.badRequest('Category cannot be its own parent');
        }
    }

    const updatedCategory = await categoryRepository.update(categoryId, updateData);

    logger.info('Category updated', { categoryId, updatedBy: userId });

    return updatedCategory;
};

/**
 * Delete a category
 * @param {string} categoryId - Category ID
 * @param {string} userId - User ID (admin)
 * @returns {Promise<void>}
 */
const deleteCategory = async (categoryId, userId) => {
    const category = await categoryRepository.findById(categoryId);

    if (!category) {
        throw ErrorResponse.notFound('Category not found');
    }

    // Check if category has videos
    if (category.videoCount > 0) {
        throw ErrorResponse.badRequest(
            'Cannot delete category with videos. Please reassign videos first.'
        );
    }

    // Check if category has subcategories
    const subcategories = await categoryRepository.findByParent(categoryId);
    if (subcategories.length > 0) {
        throw ErrorResponse.badRequest(
            'Cannot delete category with subcategories. Please delete or reassign subcategories first.'
        );
    }

    await categoryRepository.softDelete(categoryId);

    logger.info('Category deleted', { categoryId, deletedBy: userId });
};

module.exports = {
    getAllCategories,
    getTopLevelCategories,
    getCategoryById,
    getCategoryBySlug,
    getSubcategories,
    createCategory,
    updateCategory,
    deleteCategory,
};
