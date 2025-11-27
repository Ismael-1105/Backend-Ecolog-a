const sanitizeHtml = require('sanitize-html');

/**
 * Sanitization Middleware Configuration
 * Protects against XSS and NoSQL injection attacks
 */

/**
 * Custom MongoDB Sanitization (Express 5 compatible)
 * Removes any keys that start with '$' or contain '.' from user input
 * Prevents NoSQL injection attacks
 */
const sanitizeObject = (obj) => {
    if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach((key) => {
            // Remove keys that start with $ or contain .
            if (key.startsWith('$') || key.includes('.')) {
                delete obj[key];
            } else if (typeof obj[key] === 'object') {
                // Recursively sanitize nested objects
                sanitizeObject(obj[key]);
            }
        });
    }
    return obj;
};

const mongoSanitizeMiddleware = (req, res, next) => {
    // Sanitize body, query, and params
    if (req.body) {
        req.body = sanitizeObject(req.body);
    }
    if (req.query) {
        req.query = sanitizeObject(req.query);
    }
    if (req.params) {
        req.params = sanitizeObject(req.params);
    }
    next();
};

/**
 * Sanitize strings recursively in an object
 */
const sanitizeStrings = (obj) => {
    if (typeof obj === 'string') {
        return sanitizeHtml(obj, {
            allowedTags: [], // Strip all HTML tags
            allowedAttributes: {},
        });
    }

    if (obj && typeof obj === 'object') {
        Object.keys(obj).forEach((key) => {
            obj[key] = sanitizeStrings(obj[key]);
        });
    }

    return obj;
};

/**
 * XSS Protection using sanitize-html
 * Sanitizes user input to prevent Cross-Site Scripting attacks
 */
const xssMiddleware = (req, res, next) => {
    // Sanitize body
    if (req.body) {
        req.body = sanitizeStrings(req.body);
    }

    // Sanitize query parameters
    if (req.query) {
        req.query = sanitizeStrings(req.query);
    }

    // Sanitize URL parameters
    if (req.params) {
        req.params = sanitizeStrings(req.params);
    }

    next();
};

module.exports = {
    mongoSanitizeMiddleware,
    xssMiddleware,
};
