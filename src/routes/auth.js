const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  logoutAllDevices,
  changePassword,
} = require('../controllers/authController');
const handleValidation = require('../middlewares/validate');
const auth = require('../middlewares/auth');
const { loginLimiter, registerLimiter } = require('../middlewares/rateLimiter');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  registerLimiter,
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }),
    body('email').isEmail().normalizeEmail(),
    body('password')
      .isString()
      .isLength({ min: 6, max: 100 })
      .withMessage('Password must be at least 6 characters long'),
    body('institution').optional().isString().isLength({ max: 120 }),
    body('role').optional().isIn(['Estudiante', 'Docente']),
    handleValidation,
  ],
  registerUser
);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  loginLimiter,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isString().notEmpty(),
    handleValidation,
  ],
  loginUser
);

// @route   POST api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post(
  '/refresh',
  [body('refreshToken').isString().notEmpty(), handleValidation],
  refreshToken
);

// @route   POST api/auth/logout
// @desc    Logout user
// @access  Private
router.post(
  '/logout',
  auth,
  [body('refreshToken').optional().isString(), handleValidation],
  logoutUser
);

// @route   POST api/auth/logout-all
// @desc    Logout from all devices
// @access  Private
router.post('/logout-all', auth, logoutAllDevices);

// @route   PUT api/auth/change-password
// @desc    Change password
// @access  Private
router.put(
  '/change-password',
  auth,
  [
    body('currentPassword').isString().notEmpty(),
    body('newPassword')
      .isString()
      .isLength({ min: 8, max: 100 })
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage(
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      ),
    handleValidation,
  ],
  changePassword
);

module.exports = router;
