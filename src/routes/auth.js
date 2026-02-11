const express = require('express');
const router = express.Router();
const {
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  logoutAllDevices,
  changePassword,
} = require('../controllers/authController');
const auth = require('../middlewares/auth');
const {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  refreshTokenValidator,
} = require('../middlewares/validators/auth.validator');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  registerValidator,
  registerUser
);

// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  loginValidator,
  loginUser
);


// @route   POST api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post(
  '/refresh',
  refreshTokenValidator,
  refreshToken
);

// @route   POST api/auth/logout
// @desc    Logout user
// @access  Private
router.post(
  '/logout',
  auth,
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
  changePasswordValidator,
  changePassword
);

module.exports = router;

