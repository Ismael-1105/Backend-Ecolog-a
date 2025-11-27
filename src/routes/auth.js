
const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const handleValidation = require('../middlewares/validate');

// @route   POST api/auth/register
// @desc    Register user
// @access  Public
router.post(
  '/register',
  [
    body('name').isString().trim().isLength({ min: 2, max: 80 }),
    body('email').isEmail().normalizeEmail(),
    body('password').isString().isLength({ min: 6, max: 100 }),
    body('institution').optional().isString().isLength({ max: 120 }),
    body('role').optional().isIn(['Estudiante', 'Docente', 'Administrador']),
    handleValidation,
  ],
  registerUser
);


// @route   POST api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').isString().notEmpty(), handleValidation],
  loginUser
);

module.exports = router;
