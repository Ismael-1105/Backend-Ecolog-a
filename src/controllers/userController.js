const userService = require('../services/userService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Get all users
 * @route   GET /api/users
 * @access  Private/Admin
 */
const getAllUsers = asyncHandler(async (req, res) => {
    const result = await userService.getAllUsers(req.query);

    res.json({
        success: true,
        ...result,
    });
});

/**
 * @desc    Get user by ID
 * @route   GET /api/users/:id
 * @access  Private
 */
const getUserById = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(
        req.params.id,
        req.user.id,
        req.user.role
    );

    res.json({
        success: true,
        data: user,
    });
});

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 * @access  Private
 */
const getMyProfile = asyncHandler(async (req, res) => {
    const user = await userService.getUserById(
        req.user.id,
        req.user.id,
        req.user.role
    );

    res.json({
        success: true,
        data: user,
    });
});

/**
 * @desc    Update user
 * @route   PUT /api/users/:id
 * @access  Private
 */
const updateUser = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(
        req.params.id,
        req.body,
        req.user.id,
        req.user.role
    );

    res.json({
        success: true,
        data: user,
        message: 'User updated successfully',
    });
});

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/me
 * @access  Private
 */
const updateMyProfile = asyncHandler(async (req, res) => {
    const user = await userService.updateUser(
        req.user.id,
        req.body,
        req.user.id,
        req.user.role
    );

    res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully',
    });
});

/**
 * @desc    Update profile picture
 * @route   PUT /api/users/me/profile-picture
 * @access  Private
 */
const updateProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'Profile picture file is required',
        });
    }

    const user = await userService.updateProfilePicture(
        req.user.id,
        req.file
    );

    res.json({
        success: true,
        data: user,
        message: 'Profile picture updated successfully',
    });
});

/**
 * @desc    Delete user
 * @route   DELETE /api/users/:id
 * @access  Private/Admin
 */
const deleteUser = asyncHandler(async (req, res) => {
    await userService.deleteUser(req.params.id, req.user.id, req.user.role);

    res.json({
        success: true,
        message: 'User deleted successfully',
    });
});

/**
 * @desc    Delete own account
 * @route   DELETE /api/users/me
 * @access  Private
 */
const deleteMyAccount = asyncHandler(async (req, res) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            error: 'Password is required to delete account',
        });
    }

    await userService.deleteOwnAccount(req.user.id, password);

    res.json({
        success: true,
        message: 'Account deleted successfully',
    });
});

module.exports = {
    getAllUsers,
    getUserById,
    getMyProfile,
    updateUser,
    updateMyProfile,
    updateProfilePicture,
    deleteUser,
    deleteMyAccount,
};
