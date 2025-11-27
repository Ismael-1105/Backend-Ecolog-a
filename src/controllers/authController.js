const authService = require('../services/authService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Register user
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerUser = asyncHandler(async (req, res) => {
    const deviceInfo = {
        userAgent: req.get('user-agent'),
        ip: req.ip,
    };

    const result = await authService.registerUser(req.body, deviceInfo);

    res.status(201).json({
        success: true,
        data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            refreshTokenExpiresAt: result.refreshTokenExpiresAt,
        },
    });
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const deviceInfo = {
        userAgent: req.get('user-agent'),
        ip: req.ip,
    };

    const result = await authService.loginUser(email, password, deviceInfo);

    res.json({
        success: true,
        data: {
            user: result.user,
            accessToken: result.accessToken,
            refreshToken: result.refreshToken,
            refreshTokenExpiresAt: result.refreshTokenExpiresAt,
        },
    });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh
 * @access  Public
 */
const refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (!refreshToken) {
        return res.status(400).json({
            success: false,
            error: 'Refresh token is required',
        });
    }

    const deviceInfo = {
        userAgent: req.get('user-agent'),
        ip: req.ip,
    };

    const result = await authService.refreshAccessToken(refreshToken, deviceInfo);

    res.json({
        success: true,
        data: {
            accessToken: result.accessToken,
            user: result.user,
        },
    });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logoutUser = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;

    if (refreshToken) {
        await authService.logoutUser(refreshToken);
    }

    res.json({
        success: true,
        message: 'Logged out successfully',
    });
});

/**
 * @desc    Logout from all devices
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
const logoutAllDevices = asyncHandler(async (req, res) => {
    await authService.logoutAllDevices(req.user.id);

    res.json({
        success: true,
        message: 'Logged out from all devices successfully',
    });
});

/**
 * @desc    Change password
 * @route   PUT /api/auth/change-password
 * @access  Private
 */
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    await authService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
        success: true,
        message: 'Password changed successfully. Please login again.',
    });
});

module.exports = {
    registerUser,
    loginUser,
    refreshToken,
    logoutUser,
    logoutAllDevices,
    changePassword,
};
