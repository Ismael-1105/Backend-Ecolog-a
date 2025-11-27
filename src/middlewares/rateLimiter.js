const rateLimit = require('express-rate-limit');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * General API Rate Limiter
 * Limits all API requests to prevent abuse
 */
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        const error = ErrorResponse.tooManyRequests(
            'Too many requests from this IP, please try again after 15 minutes'
        );
        res.status(error.statusCode).json({
            success: false,
            error: error.message,
            errorCode: error.errorCode,
        });
    },
});

/**
 * Login Rate Limiter
 * Stricter limits for login attempts to prevent brute force attacks
 */
const loginLimiter = rateLimit({
    windowMs: parseInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS) || 5, // Limit each IP to 5 login requests per windowMs
    message: 'Too many login attempts, please try again later',
    skipSuccessfulRequests: true, // Don't count successful requests
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const error = ErrorResponse.tooManyRequests(
            'Too many login attempts from this IP, please try again after 15 minutes'
        );
        res.status(error.statusCode).json({
            success: false,
            error: error.message,
            errorCode: error.errorCode,
        });
    },
});

/**
 * Register Rate Limiter
 * Limits registration attempts to prevent spam
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 registration attempts per hour
    message: 'Too many accounts created from this IP, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        const error = ErrorResponse.tooManyRequests(
            'Too many registration attempts from this IP, please try again after 1 hour'
        );
        res.status(error.statusCode).json({
            success: false,
            error: error.message,
            errorCode: error.errorCode,
        });
    },
});

/**
 * Password Reset Rate Limiter
 * Limits password reset requests
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 password reset requests per hour
    message: 'Too many password reset attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    loginLimiter,
    registerLimiter,
    passwordResetLimiter,
};
