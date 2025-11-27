/**
 * Async Handler Wrapper
 * Eliminates the need for try-catch blocks in async route handlers
 * Automatically catches errors and passes them to the error handling middleware
 */

const asyncHandler = (fn) => (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
