const categoryService = require('../services/categoryService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Get all categories
 * @route   GET /api/categories
 * @access  Public
 */
const getAllCategories = asyncHandler(async (req, res) => {
    const categories = await categoryService.getAllCategories({ populate: true });

    res.json({
        success: true,
        data: categories,
    });
});

/**
 * @desc    Get top-level categories
 * @route   GET /api/categories/top
 * @access  Public
 */
const getTopLevelCategories = asyncHandler(async (req, res) => {
    const categories = await categoryService.getTopLevelCategories();

    res.json({
        success: true,
        data: categories,
    });
});

/**
 * @desc    Get category by ID
 * @route   GET /api/categories/:id
 * @access  Public
 */
const getCategoryById = asyncHandler(async (req, res) => {
    const category = await categoryService.getCategoryById(req.params.id);

    res.json({
        success: true,
        data: category,
    });
});

/**
 * @desc    Get category by slug
 * @route   GET /api/categories/slug/:slug
 * @access  Public
 */
const getCategoryBySlug = asyncHandler(async (req, res) => {
    const category = await categoryService.getCategoryBySlug(req.params.slug);

    res.json({
        success: true,
        data: category,
    });
});

/**
 * @desc    Get subcategories
 * @route   GET /api/categories/:id/subcategories
 * @access  Public
 */
const getSubcategories = asyncHandler(async (req, res) => {
    const subcategories = await categoryService.getSubcategories(req.params.id);

    res.json({
        success: true,
        data: subcategories,
    });
});

/**
 * @desc    Create a category
 * @route   POST /api/categories
 * @access  Private/Admin
 */
const createCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.createCategory(req.body, req.user.id);

    res.status(201).json({
        success: true,
        data: category,
    });
});

/**
 * @desc    Update a category
 * @route   PUT /api/categories/:id
 * @access  Private/Admin
 */
const updateCategory = asyncHandler(async (req, res) => {
    const category = await categoryService.updateCategory(
        req.params.id,
        req.body,
        req.user.id
    );

    res.json({
        success: true,
        data: category,
    });
});

/**
 * @desc    Delete a category
 * @route   DELETE /api/categories/:id
 * @access  Private/Admin
 */
const deleteCategory = asyncHandler(async (req, res) => {
    await categoryService.deleteCategory(req.params.id, req.user.id);

    res.json({
        success: true,
        message: 'Category deleted successfully',
    });
});

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
