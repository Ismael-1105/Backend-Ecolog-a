
const express = require('express');
const { param } = require('express-validator');
const router = express.Router();
const { getUsers, getUserById } = require('../controllers/userController');
const auth = require('../middlewares/auth');
const admin = require('../middlewares/admin');
const handleValidation = require('../middlewares/validate');

// @route   GET api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', [auth, admin], getUsers);

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get('/:id', [auth, param('id').isMongoId(), handleValidation], getUserById);

module.exports = router;
