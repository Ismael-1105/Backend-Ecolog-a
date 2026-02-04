const morgan = require('morgan');
const logger = require('../config/logger');
const crypto = require('crypto');

/**
 * HTTP Request Logger Middleware
 * 
 * Integrates Morgan with Winston to log all HTTP requests
 * Features:
 * - Unique request ID for tracing
 * - User ID tracking (if authenticated)
 * - Custom log format for development vs production
 * - Skip logging for static files and health checks
 */

// Generate unique request ID
const generateRequestId = () => {
    return crypto.randomUUID().split('-')[0]; // Use first segment for brevity
};

// Add request ID to request object
const requestIdMiddleware = (req, res, next) => {
    req.id = generateRequestId();
    res.setHeader('X-Request-ID', req.id);
    next();
};

// Custom Morgan tokens
morgan.token('request-id', (req) => req.id);
morgan.token('user-id', (req) => req.user?.id || 'anonymous');
morgan.token('user-email', (req) => req.user?.email || '-');

// Custom format for production (detailed JSON-like format)
const productionFormat = ':request-id :user-id :remote-addr ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent" :response-time ms';

// Custom format for development (colored, human-readable)
const developmentFormat = ':method :url :status :response-time ms - :res[content-length] [:request-id] [:user-email]';

// Determine which format to use
const logFormat = process.env.NODE_ENV === 'production' ? productionFormat : developmentFormat;

// Skip function - don't log static files (health checks are now logged for Graylog)
const skipLog = (req, res) => {
    // Skip static files (optional - comment out if you want to log them)
    if (req.url.startsWith('/uploads/')) return true;
    if (req.url.match(/\.(css|js|jpg|jpeg|png|gif|ico|svg|woff|woff2|ttf|eot)$/)) return true;

    return false;
};

// Morgan stream that writes to Winston
const stream = {
    write: (message) => {
        // Remove trailing newline
        const cleanMessage = message.trim();

        // Log at 'http' level
        logger.http(cleanMessage);
    },
};

// Create Morgan middleware
const httpLogger = morgan(logFormat, {
    stream,
    skip: skipLog,
});

// Enhanced HTTP logger with error logging
const httpLoggerWithErrors = (req, res, next) => {
    // Log request start
    const startTime = Date.now();

    // Capture original end function
    const originalEnd = res.end;

    // Override end function to log response
    res.end = function (chunk, encoding) {
        res.end = originalEnd;
        res.end(chunk, encoding);

        const duration = Date.now() - startTime;
        const { method, originalUrl, ip } = req;
        const { statusCode } = res;

        // Log errors separately
        if (statusCode >= 400) {
            logger.warn('HTTP Error Response', {
                requestId: req.id,
                method,
                url: originalUrl,
                statusCode,
                duration: `${duration}ms`,
                ip,
                userId: req.user?.id || 'anonymous',
                userAgent: req.get('user-agent'),
            });
        }

        // Log slow requests (> 1 second)
        if (duration > 1000) {
            logger.warn('Slow HTTP Request', {
                requestId: req.id,
                method,
                url: originalUrl,
                statusCode,
                duration: `${duration}ms`,
                ip,
                userId: req.user?.id || 'anonymous',
            });
        }
    };

    next();
};

module.exports = {
    requestIdMiddleware,
    httpLogger,
    httpLoggerWithErrors,
};
