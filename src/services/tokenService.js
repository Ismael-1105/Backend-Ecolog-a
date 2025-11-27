const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const RefreshToken = require('../models/RefreshToken');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Token Service
 * Handles JWT token generation, verification, and refresh token management
 */

/**
 * Generate Access Token
 * @param {Object} payload - User data to encode in token
 * @returns {string} JWT access token
 */
const generateAccessToken = (payload) => {
    const secret = process.env.JWT_SECRET;
    const expiresIn = process.env.JWT_ACCESS_EXPIRE || '15m';

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    return jwt.sign(payload, secret, {
        expiresIn,
        issuer: 'ecolearn-loja',
    });
};

/**
 * Generate Refresh Token
 * @param {string} userId - User ID
 * @param {Object} deviceInfo - Device information (userAgent, ip)
 * @returns {Promise<Object>} Refresh token and expiration date
 */
const generateRefreshToken = async (userId, deviceInfo = {}) => {
    // Generate a random token
    const token = crypto.randomBytes(40).toString('hex');

    // Calculate expiration date
    const expiresIn = process.env.JWT_REFRESH_EXPIRE || '7d';
    const expiresAt = new Date();

    // Parse expiration string (e.g., '7d', '24h', '60m')
    const match = expiresIn.match(/^(\d+)([dhm])$/);
    if (match) {
        const value = parseInt(match[1]);
        const unit = match[2];

        switch (unit) {
            case 'd':
                expiresAt.setDate(expiresAt.getDate() + value);
                break;
            case 'h':
                expiresAt.setHours(expiresAt.getHours() + value);
                break;
            case 'm':
                expiresAt.setMinutes(expiresAt.getMinutes() + value);
                break;
        }
    } else {
        // Default to 7 days
        expiresAt.setDate(expiresAt.getDate() + 7);
    }

    // Save refresh token to database
    const refreshToken = await RefreshToken.create({
        user: userId,
        token,
        expiresAt,
        deviceInfo,
    });

    logger.info('Refresh token generated', {
        userId,
        expiresAt,
        ip: deviceInfo.ip,
    });

    return {
        token: refreshToken.token,
        expiresAt: refreshToken.expiresAt,
    };
};

/**
 * Verify Access Token
 * @param {string} token - JWT access token
 * @returns {Object} Decoded token payload
 */
const verifyAccessToken = (token) => {
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        throw new Error('JWT_SECRET is not defined in environment variables');
    }

    try {
        return jwt.verify(token, secret);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw ErrorResponse.unauthorized('Access token expired', 'TOKEN_EXPIRED');
        }
        if (error.name === 'JsonWebTokenError') {
            throw ErrorResponse.unauthorized('Invalid access token', 'INVALID_TOKEN');
        }
        throw error;
    }
};

/**
 * Verify Refresh Token
 * @param {string} token - Refresh token
 * @returns {Promise<Object>} Refresh token document
 */
const verifyRefreshToken = async (token) => {
    const refreshToken = await RefreshToken.findOne({ token });

    if (!refreshToken) {
        throw ErrorResponse.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    if (refreshToken.isRevoked) {
        logger.warn('Attempted to use revoked refresh token', {
            userId: refreshToken.user,
            token: token.substring(0, 10) + '...',
        });
        throw ErrorResponse.unauthorized('Refresh token has been revoked', 'TOKEN_REVOKED');
    }

    if (refreshToken.expiresAt < new Date()) {
        throw ErrorResponse.unauthorized('Refresh token expired', 'TOKEN_EXPIRED');
    }

    // Update last used timestamp
    refreshToken.lastUsedAt = new Date();
    await refreshToken.save();

    return refreshToken;
};

/**
 * Revoke Refresh Token
 * @param {string} token - Refresh token to revoke
 * @returns {Promise<void>}
 */
const revokeRefreshToken = async (token) => {
    const refreshToken = await RefreshToken.findOne({ token });

    if (!refreshToken) {
        throw ErrorResponse.notFound('Refresh token not found');
    }

    refreshToken.isRevoked = true;
    await refreshToken.save();

    logger.info('Refresh token revoked', {
        userId: refreshToken.user,
    });
};

/**
 * Revoke All User Refresh Tokens
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
const revokeAllUserTokens = async (userId) => {
    await RefreshToken.updateMany(
        { user: userId, isRevoked: false },
        { isRevoked: true }
    );

    logger.info('All refresh tokens revoked for user', { userId });
};

/**
 * Clean up expired tokens
 * @returns {Promise<number>} Number of deleted tokens
 */
const cleanupExpiredTokens = async () => {
    const result = await RefreshToken.deleteMany({
        expiresAt: { $lt: new Date() },
    });

    logger.info('Expired tokens cleaned up', { count: result.deletedCount });
    return result.deletedCount;
};

/**
 * Rotate Refresh Token
 * Creates a new refresh token and revokes the old one
 * @param {string} oldToken - Old refresh token
 * @param {Object} deviceInfo - Device information
 * @returns {Promise<Object>} New refresh token
 */
const rotateRefreshToken = async (oldToken, deviceInfo = {}) => {
    // Verify old token
    const oldRefreshToken = await verifyRefreshToken(oldToken);

    // Generate new token
    const newRefreshToken = await generateRefreshToken(
        oldRefreshToken.user,
        deviceInfo
    );

    // Revoke old token
    await revokeRefreshToken(oldToken);

    logger.info('Refresh token rotated', {
        userId: oldRefreshToken.user,
    });

    return newRefreshToken;
};

module.exports = {
    generateAccessToken,
    generateRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    revokeRefreshToken,
    revokeAllUserTokens,
    cleanupExpiredTokens,
    rotateRefreshToken,
};
