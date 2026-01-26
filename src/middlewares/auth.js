const tokenService = require('../services/tokenService');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Authentication Middleware
 * Verifies JWT access token and attaches user to request
 * Returns 401 immediately if token is missing or invalid
 */
module.exports = function (req, res, next) {
    try {
        // Get token from header (support Authorization: Bearer and x-auth-token)
        let token = null;
        const authHeader = req.header('authorization') || req.header('Authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.substring(7);
        } else {
            token = req.header('x-auth-token');
        }

        // Return 401 immediately if no token
        if (!token) {
            logger.warn('Authentication failed: No token provided', {
                path: req.path,
                ip: req.ip,
            });
            return res.status(401).json({
                success: false,
                error: 'Authorization token missing',
                code: 'TOKEN_MISSING'
            });
        }

        // Verify token using token service
        const decoded = tokenService.verifyAccessToken(token);

        // Attach user to request
        req.user = decoded.user;

        // Log successful authentication
        logger.debug('User authenticated', {
            userId: req.user.id,
            role: req.user.role,
            path: req.path,
        });

        next();
    } catch (err) {
        // Return 401 for any token verification errors
        logger.warn('Authentication failed: Invalid token', {
            error: err.message,
            path: req.path,
            ip: req.ip,
        });

        return res.status(401).json({
            success: false,
            error: 'Invalid or expired token',
            code: 'INVALID_TOKEN'
        });
    }
};
