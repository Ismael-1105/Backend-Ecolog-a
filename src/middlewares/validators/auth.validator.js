const { body, validationResult } = require('express-validator');

/**
 * Validation middleware helper
 * Checks validation results and returns errors if any
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            error: 'Validation failed',
            errorCode: 'VALIDATION_ERROR',
            details: errors.array().map(err => ({
                field: err.path,
                message: err.msg,
                value: err.value
            })),
        });
    }
    next();
};

/**
 * Register validation rules
 */
const registerValidator = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2-100 characters')
        .matches(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/).withMessage('Name can only contain letters and spaces'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail()
        .isLength({ max: 255 }).withMessage('Email too long'),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('Password must contain uppercase, lowercase, number and special character (@$!%*?&)'),

    body('institution')
        .optional()
        .trim()
        .isLength({ max: 200 }).withMessage('Institution name too long'),

    body('role')
        .optional()
        .isIn(['Estudiante', 'Docente']).withMessage('Invalid role. Must be Estudiante or Docente'),

    validate
];

/**
 * Login validation rules
 */
const loginValidator = [
    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email format')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    validate
];

/**
 * Change password validation rules
 */
const changePasswordValidator = [
    body('currentPassword')
        .notEmpty().withMessage('Current password is required'),

    body('newPassword')
        .notEmpty().withMessage('New password is required')
        .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
        .withMessage('New password must contain uppercase, lowercase, number and special character'),

    body('newPassword').custom((value, { req }) => {
        if (value === req.body.currentPassword) {
            throw new Error('New password must be different from current password');
        }
        return true;
    }),

    validate
];

/**
 * Refresh token validation rules
 */
const refreshTokenValidator = [
    body('refreshToken')
        .notEmpty().withMessage('Refresh token is required')
        .isString().withMessage('Refresh token must be a string'),

    validate
];

module.exports = {
    registerValidator,
    loginValidator,
    changePasswordValidator,
    refreshTokenValidator,
};
