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
const path = require('path');
const fs = require('fs');

// Configure multer for profile pictures
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const profilePictureStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Use storage root for profile pictures, not UPLOAD_PATH (which is for videos)
        const uploadPath = path.join('./storage', 'profile-pictures');
        ensureDirectoryExists(uploadPath);
        cb(null, uploadPath);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname);
        cb(null, `profile-${req.user.id}-${uniqueSuffix}${ext}`);
    },
});

const profilePictureUpload = multer({
    storage: profilePictureStorage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
        const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

        const ext = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype;

        if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed'));
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
