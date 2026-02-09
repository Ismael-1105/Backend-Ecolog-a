const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const {
    getAllUsers,
    getUserById,
    getMyProfile,
    updateUser,
    updateMyProfile,
    updateProfilePicture,
    deleteUser,
    deleteMyAccount,
} = require('../controllers/userController');
const auth = require('../middlewares/auth');
const { requireAdmin } = require('../middlewares/rbac');
const handleValidation = require('../middlewares/validate');
const multer = require('multer');

// Import Cloudinary storage for profile pictures
const { profilePictureStorage, cloudinaryConfigured } = require('../config/cloudinary');

if (!cloudinaryConfigured) {
    console.warn('⚠️  Cloudinary not configured. Profile picture uploads will not work.');
}

// Configure multer with Cloudinary storage
const profilePictureUpload = multer({
    storage: profilePictureStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];

        if (allowedMimeTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'));
        }
    },
});

// @route   GET api/users/me
// @desc    Get current user profile
// @access  Private
router.get('/me', auth, getMyProfile);

// @route   PUT api/users/me
// @desc    Update current user profile
// @access  Private
router.put(
    '/me',
    [
        auth,
        body('name').optional().isString().trim().isLength({ min: 2, max: 80 }),
        body('email').optional().isEmail().normalizeEmail(),
        body('institution').optional().isString().isLength({ max: 120 }),
        handleValidation,
    ],
    updateMyProfile
);

// @route   PUT api/users/me/profile-picture
// @desc    Update profile picture
// @access  Private
router.put(
    '/me/profile-picture',
    [auth, profilePictureUpload.single('profilePicture')],
    updateProfilePicture
);

// @route   DELETE api/users/me
// @desc    Delete own account
// @access  Private
router.delete(
    '/me',
    [
        auth,
        body('password').isString().notEmpty().withMessage('Password is required'),
        handleValidation,
    ],
    deleteMyAccount
);

// @route   GET api/users
// @desc    Get all users
// @access  Private/Admin
router.get('/', [auth, requireAdmin], getAllUsers);

// @route   GET api/users/:id
// @desc    Get user by ID
// @access  Private
router.get(
    '/:id',
    [auth, param('id').isMongoId(), handleValidation],
    getUserById
);

// @route   PUT api/users/:id
// @desc    Update user (admin can update role)
// @access  Private
router.put(
    '/:id',
    [
        auth,
        param('id').isMongoId(),
        body('name').optional().isString().trim().isLength({ min: 2, max: 80 }),
        body('email').optional().isEmail().normalizeEmail(),
        body('institution').optional().isString().isLength({ max: 120 }),
        body('role').optional().isIn(['Estudiante', 'Docente', 'Administrador', 'SuperAdmin']),
        handleValidation,
    ],
    updateUser
);

// @route   DELETE api/users/:id
// @desc    Delete user
// @access  Private/Admin
router.delete(
    '/:id',
    [auth, requireAdmin, param('id').isMongoId(), handleValidation],
    deleteUser
);

module.exports = router;
