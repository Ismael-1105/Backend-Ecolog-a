const logger = require('../config/logger');

/**
 * Query Optimizer Middleware
 * Validates and optimizes query parameters to prevent expensive database operations
 */

/**
 * Validate and sanitize pagination parameters
 */
const validatePagination = (req, res, next) => {
    const { page, limit } = req.query;

    // Default values
    const defaultPage = 1;
    const defaultLimit = 20;
    const maxLimit = 100; // Maximum items per page

    // Parse and validate page
    let parsedPage = parseInt(page);
    if (isNaN(parsedPage) || parsedPage < 1) {
        parsedPage = defaultPage;
    }

    // Parse and validate limit
    let parsedLimit = parseInt(limit);
    if (isNaN(parsedLimit) || parsedLimit < 1) {
        parsedLimit = defaultLimit;
    } else if (parsedLimit > maxLimit) {
        logger.warn('Limit exceeded maximum', {
            requestedLimit: parsedLimit,
            maxLimit,
            ip: req.ip,
            path: req.path
        });
        parsedLimit = maxLimit;
    }

    // Attach sanitized values to request
    req.pagination = {
        page: parsedPage,
        limit: parsedLimit
    };

    next();
};

/**
 * Validate and normalize sort parameters
 */
const validateSort = (allowedFields = []) => {
    return (req, res, next) => {
        const { sort } = req.query;

        if (!sort) {
            // Use default sort if not provided
            req.sort = { createdAt: -1 };
            return next();
        }

        // Parse sort string (e.g., "-createdAt" or "title")
        const sortObj = {};
        const sortFields = sort.split(',');

        for (const field of sortFields) {
            let fieldName = field.trim();
            let direction = 1;

            // Check for descending order (-)
            if (fieldName.startsWith('-')) {
                direction = -1;
                fieldName = fieldName.substring(1);
            }

            // Validate field if allowedFields is provided
            if (allowedFields.length > 0 && !allowedFields.includes(fieldName)) {
                logger.warn('Invalid sort field', {
                    field: fieldName,
                    allowedFields,
                    ip: req.ip,
                    path: req.path
                });
                continue;
            }

            sortObj[fieldName] = direction;
        }

        // If no valid sort fields, use default
        if (Object.keys(sortObj).length === 0) {
            req.sort = { createdAt: -1 };
        } else {
            req.sort = sortObj;
        }

        next();
    };
};

/**
 * Prevent expensive queries
 */
const preventExpensiveQueries = (req, res, next) => {
    const { page, limit } = req.pagination || {};

    // Prevent requesting very high page numbers (potential DoS)
    const maxPage = 1000;
    if (page && page > maxPage) {
        logger.warn('Excessive page number requested', {
            page,
            maxPage,
            ip: req.ip,
            path: req.path
        });

        return res.status(400).json({
            success: false,
            error: `Page number cannot exceed ${maxPage}`,
            errorCode: 'INVALID_PAGE'
        });
    }

    // Calculate skip value
    const skip = (page - 1) * limit;
    const maxSkip = 10000; // MongoDB performs poorly with large skip values

    if (skip > maxSkip) {
        logger.warn('Excessive skip value', {
            skip,
            maxSkip,
            page,
            limit,
            ip: req.ip,
            path: req.path
        });

        return res.status(400).json({
            success: false,
            error: 'Page number too high. Consider using cursor-based pagination.',
            errorCode: 'EXCESSIVE_SKIP',
            suggestion: 'Use cursor parameter instead of page for better performance'
        });
    }

    next();
};

/**
 * Validate search query
 */
const validateSearch = (req, res, next) => {
    const { q, query, search } = req.query;
    const searchQuery = q || query || search;

    if (!searchQuery) {
        return res.status(400).json({
            success: false,
            error: 'Search query is required',
            errorCode: 'MISSING_SEARCH_QUERY'
        });
    }

    // Validate search query length
    const minLength = 2;
    const maxLength = 100;

    if (searchQuery.length < minLength) {
        return res.status(400).json({
            success: false,
            error: `Search query must be at least ${minLength} characters`,
            errorCode: 'SEARCH_QUERY_TOO_SHORT'
        });
    }

    if (searchQuery.length > maxLength) {
        return res.status(400).json({
            success: false,
            error: `Search query cannot exceed ${maxLength} characters`,
            errorCode: 'SEARCH_QUERY_TOO_LONG'
        });
    }

    // Sanitize search query (remove special regex characters if not using text index)
    req.searchQuery = searchQuery.trim();

    next();
};

/**
 * Validate filters
 */
const validateFilters = (allowedFilters = []) => {
    return (req, res, next) => {
        const filters = {};

        // Only allow specified filters
        for (const filter of allowedFilters) {
            if (req.query[filter] !== undefined) {
                filters[filter] = req.query[filter];
            }
        }

        req.filters = filters;
        next();
    };
};

/**
 * Combined query optimizer middleware
 */
const optimizeQuery = (options = {}) => {
    const {
        allowedSortFields = [],
        allowedFilters = [],
        requireSearch = false
    } = options;

    return [
        validatePagination,
        validateSort(allowedSortFields),
        preventExpensiveQueries,
        ...(requireSearch ? [validateSearch] : []),
        validateFilters(allowedFilters)
    ];
};

module.exports = {
    validatePagination,
    validateSort,
    preventExpensiveQueries,
    validateSearch,
    validateFilters,
    optimizeQuery
};
