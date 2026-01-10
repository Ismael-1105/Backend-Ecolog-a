const tokenService = require('../services/tokenService');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Authentication Middleware
 * Verifies JWT access token and attaches user to request
 */
module.exports = function (req, res, next) {
    // Get token from header (support Authorization: Bearer and x-auth-token)
    let token = null;
    const authHeader = req.header('authorization') || req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else {
        token = req.header('x-auth-token');
    }

    if (!token) {
        return next(ErrorResponse.unauthorized('Authorization token missing', 'TOKEN_MISSING'));
    }

    try {
        // Verify token using token service
        const decoded = tokenService.verifyAccessToken(token);
        req.user = decoded.user;

        // Log successful authentication
        logger.debug('User authenticated', {
            userId: req.user.id,
            role: req.user.role,
            path: req.path,
        });

        next();
    } catch (err) {
        logger.warn('Authentication failed', {
            error: err.message,
            path: req.path,
            ip: req.ip,
        });

        return next(err);
    }

};

