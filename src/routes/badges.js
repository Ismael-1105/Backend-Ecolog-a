const express = require('express');
const router = express.Router();
const badgeController = require('../controllers/badgeController');
const auth = require('../middlewares/auth');
const rbac = require('../middlewares/rbac');
const { body } = require('express-validator');
const validate = require('../middlewares/validate');

/**
 * Badge Routes
 * All routes related to badge management
 */

// Validation rules
const createBadgeValidation = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ max: 50 }).withMessage('Name cannot exceed 50 characters'),
    body('description')
        .trim()
        .notEmpty().withMessage('Description is required')
        .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),
    body('icon')
        .optional()
        .trim(),
    body('color')
        .optional()
        .trim()
        .matches(/^#[0-9A-F]{6}$/i).withMessage('Color must be a valid hex code'),
    body('criteria.type')
        .optional()
        .isIn(['manual', 'auto']).withMessage('Criteria type must be manual or auto'),
    body('criteria.condition')
        .optional()
        .isIn(['videos_uploaded', 'comments_made', 'likes_received', 'days_active', 'followers_count', 'videos_approved'])
        .withMessage('Invalid criteria condition'),
    body('criteria.threshold')
        .optional()
        .isInt({ min: 1 }).withMessage('Threshold must be a positive integer'),
    body('rarity')
        .optional()
        .isIn(['common', 'uncommon', 'rare', 'epic', 'legendary'])
        .withMessage('Invalid rarity'),
    validate
];

/**
 * Public routes
 */

// Get all badges
router.get('/', badgeController.getAllBadges);

// Get badge by ID
router.get('/:id', badgeController.getBadgeById);

/**
 * Protected routes - Admin only
 */

// Create badge
router.post(
    '/',
    auth,
    rbac.requireRole(['Administrador', 'SuperAdmin']),
    createBadgeValidation,
    badgeController.createBadge
);

// Update badge
router.put(
    '/:id',
    auth,
    rbac.requireRole(['Administrador', 'SuperAdmin']),
    badgeController.updateBadge
);

// Delete badge
router.delete(
    '/:id',
    auth,
    rbac.requireRole(['Administrador', 'SuperAdmin']),
    badgeController.deleteBadge
);

// Award badge to user (manual)
router.post(
    '/users/:userId/badges/:badgeId',
    auth,
    rbac.requireRole(['Administrador', 'SuperAdmin']),
    badgeController.awardBadge
);

module.exports = router;
