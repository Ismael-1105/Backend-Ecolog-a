const bcrypt = require('bcrypt');
const User = require('../models/User');
const tokenService = require('./tokenService');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Authentication Service
 * Handles user registration, login, and authentication logic
 */

/**
 * Register a new user
 * @param {Object} userData - User registration data
 * @param {Object} deviceInfo - Device information for token generation
 * @returns {Promise<Object>} User and tokens
 */
const registerUser = async (userData, deviceInfo = {}) => {
    const { name, email, password, institution, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email }).select('+password');
    if (existingUser) {
        throw ErrorResponse.conflict('Email already registered', 'EMAIL_EXISTS');
    }

    // Prevent registration as admin roles
    if (role && (role === 'Administrador' || role === 'SuperAdmin')) {
        throw ErrorResponse.forbidden('Cannot register as admin role', 'INVALID_ROLE');
    }

    // Hash password with dynamic salt
    const saltRounds = 12; // Increased from default 10 for better security
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await User.create({
        name,
        email,
        password: hashedPassword,
        institution,
        role: role || 'Estudiante',
    });

    // Generate tokens
    const accessToken = tokenService.generateAccessToken({
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
        },
    });

    const refreshToken = await tokenService.generateRefreshToken(
        user._id,
        deviceInfo
    );

    logger.info('User registered successfully', {
        userId: user._id,
        email: user.email,
        role: user.role,
        ip: deviceInfo.ip,
    });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
        user: userResponse,
        accessToken,
        refreshToken: refreshToken.token,
        refreshTokenExpiresAt: refreshToken.expiresAt,
    };
};

/**
 * Login user
 * @param {string} email - User email
 * @param {string} password - User password
 * @param {Object} deviceInfo - Device information for token generation
 * @returns {Promise<Object>} User and tokens
 */
const loginUser = async (email, password, deviceInfo = {}) => {
    // Find user and include password field
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        logger.warn('Login attempt with non-existent email', {
            email,
            ip: deviceInfo.ip,
        });
        throw ErrorResponse.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Check if user is deleted
    if (user.isDeleted) {
        logger.warn('Login attempt with deleted account', {
            userId: user._id,
            email,
            ip: deviceInfo.ip,
        });
        throw ErrorResponse.unauthorized('Account has been deleted', 'ACCOUNT_DELETED');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        logger.warn('Login attempt with invalid password', {
            userId: user._id,
            email,
            ip: deviceInfo.ip,
        });
        throw ErrorResponse.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Generate tokens
    const accessToken = tokenService.generateAccessToken({
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
        },
    });

    const refreshToken = await tokenService.generateRefreshToken(
        user._id,
        deviceInfo
    );

    logger.info('User logged in successfully', {
        userId: user._id,
        email: user.email,
        ip: deviceInfo.ip,
    });

    // Return user without password
    const userResponse = user.toObject();
    delete userResponse.password;

    return {
        user: userResponse,
        accessToken,
        refreshToken: refreshToken.token,
        refreshTokenExpiresAt: refreshToken.expiresAt,
    };
};

/**
 * Refresh access token
 * @param {string} refreshToken - Refresh token
 * @param {Object} deviceInfo - Device information
 * @returns {Promise<Object>} New access token and optionally new refresh token
 */
const refreshAccessToken = async (refreshToken, deviceInfo = {}) => {
    // Verify refresh token
    const tokenDoc = await tokenService.verifyRefreshToken(refreshToken);

    // Get user
    const user = await User.findById(tokenDoc.user);

    if (!user) {
        throw ErrorResponse.unauthorized('User not found', 'USER_NOT_FOUND');
    }

    if (user.isDeleted) {
        throw ErrorResponse.unauthorized('Account has been deleted', 'ACCOUNT_DELETED');
    }

    // Generate new access token
    const accessToken = tokenService.generateAccessToken({
        user: {
            id: user._id,
            email: user.email,
            role: user.role,
        },
    });

    logger.info('Access token refreshed', {
        userId: user._id,
        ip: deviceInfo.ip,
    });

    return {
        accessToken,
        user: {
            id: user._id,
            email: user.email,
            name: user.name,
            role: user.role,
        },
    };
};

/**
 * Logout user (revoke refresh token)
 * @param {string} refreshToken - Refresh token to revoke
 * @returns {Promise<void>}
 */
const logoutUser = async (refreshToken) => {
    await tokenService.revokeRefreshToken(refreshToken);

    logger.info('User logged out successfully');
};

/**
 * Logout from all devices (revoke all refresh tokens)
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const logoutAllDevices = async (userId) => {
    await tokenService.revokeAllUserTokens(userId);

    logger.info('User logged out from all devices', { userId });
};

/**
 * Change user password
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @returns {Promise<void>}
 */
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId).select('+password');

    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

    if (!isPasswordValid) {
        throw ErrorResponse.unauthorized('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Hash new password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    user.password = hashedPassword;
    await user.save();

    // Revoke all refresh tokens for security
    await tokenService.revokeAllUserTokens(userId);

    logger.info('Password changed successfully', { userId });
};

module.exports = {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    logoutAllDevices,
    changePassword,
};
