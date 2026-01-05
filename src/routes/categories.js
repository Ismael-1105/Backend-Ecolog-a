const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

/**
 * Category Routes
 * All routes related to category management
 */

// Validation rules
const createCategoryValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('icon')
        .optional()
        .trim(),
    body('color')
        .optional()
        .trim()
        .matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex code'),
    body('parentCategory')
        .optional()
        .isMongoId().withMessage('Parent category must be a valid ID'),
    body('order')
        .optional()
        .isInt({ min: 0 }).withMessage('Order must be a positive integer'),
    validate
];

const updateCategoryValidation = [
    body('name')
        .optional()
        .trim()
        .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('icon')
        .optional()
        .trim(),
    body('color')
        .optional()
        .trim()
        .matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex code'),
    body('parentCategory')
        .optional()
        .isMongoId().withMessage('Parent category must be a valid ID'),
    body('order')
        .optional()
        .isInt({ min: 0 }).withMessage('Order must be a positive integer'),
    validate
];

/**
 * Public routes
 */

// Get all categories
router.get('/', categoryController.getAllCategories);

// Get top-level categories
router.get('/top', categoryController.getTopLevelCategories);

// Get category by slug
router.get('/slug/:slug', categoryController.getCategoryBySlug);

// Get category by ID
router.get('/:id', categoryController.getCategoryById);

// Get subcategories
router.get('/:id/subcategories', categoryController.getSubcategories);

/**
 * Protected routes - Admin only
 */

// Create category
router.post(
    '/',
    auth,
    rbac.requireRole(['Administrador', 'SuperAdmin']),
    createCategoryValidation,
    categoryController.createCategory
);

// Update category
router.put(
    '/:id',
    auth,
    rbac.requireRole(['Administrador', 'SuperAdmin']),
    updateCategoryValidation,
    categoryController.updateCategory
);

// Delete category
router.delete(
    '/:id',
    auth,
    rbac.requireRole(['Administrador', 'SuperAdmin']),
    categoryController.deleteCategory
);

module.exports = router;
