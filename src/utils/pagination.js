/**
 * Pagination Utility
 * Provides reusable pagination logic for database queries
 */

/**
 * Calculate pagination metadata
 * @param {number} page - Current page number (1-indexed)
 * @param {number} limit - Items per page
 * @param {number} totalCount - Total number of items
 * @returns {Object} Pagination metadata
 */
const getPaginationMetadata = (page, limit, totalCount) => {
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        currentPage: page,
        totalPages,
        totalItems: totalCount,
        itemsPerPage: limit,
        hasNextPage,
        hasPrevPage,
        nextPage: hasNextPage ? page + 1 : null,
        prevPage: hasPrevPage ? page - 1 : null,
    };
};

/**
 * Parse and validate pagination parameters from request query
 * @param {Object} query - Express request query object
 * @param {number} defaultLimit - Default limit if not provided
 * @param {number} maxLimit - Maximum allowed limit
 * @returns {Object} Validated page and limit
 */
const parsePaginationParams = (query, defaultLimit = 10, maxLimit = 100) => {
    let page = parseInt(query.page, 10) || 1;
    let limit = parseInt(query.limit, 10) || defaultLimit;

    // Ensure page is at least 1
    page = Math.max(1, page);

    // Ensure limit is within bounds
    limit = Math.min(Math.max(1, limit), maxLimit);

    const skip = (page - 1) * limit;

    return { page, limit, skip };
};

/**
 * Create paginated response object
 * @param {Array} data - Array of items for current page
 * @param {number} page - Current page number
 * @param {number} limit - Items per page
 * @param {number} totalCount - Total number of items
 * @returns {Object} Paginated response
 */
const createPaginatedResponse = (data, page, limit, totalCount) => {
    const pagination = getPaginationMetadata(page, limit, totalCount);

    return {
        success: true,
        data,
        pagination,
    };
};

module.exports = {
    getPaginationMetadata,
    parsePaginationParams,
    createPaginatedResponse,
};
