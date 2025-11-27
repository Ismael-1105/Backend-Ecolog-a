/**
 * Custom Error Response Class
 * Extends the native Error class to include HTTP status codes and error codes
 */
class ErrorResponse extends Error {
    /**
     * @param {string} message - Error message
     * @param {number} statusCode - HTTP status code
     * @param {string} errorCode - Custom error code for client handling
     */
    constructor(message, statusCode, errorCode = null) {
        super(message);
        this.statusCode = statusCode;
        this.errorCode = errorCode;
        this.isOperational = true; // Distinguish operational errors from programming errors

        Error.captureStackTrace(this, this.constructor);
    }

    /**
     * Factory method for 400 Bad Request errors
     */
    static badRequest(message = 'Bad Request', errorCode = 'BAD_REQUEST') {
        return new ErrorResponse(message, 400, errorCode);
    }

    /**
     * Factory method for 401 Unauthorized errors
     */
    static unauthorized(message = 'Unauthorized', errorCode = 'UNAUTHORIZED') {
        return new ErrorResponse(message, 401, errorCode);
    }

    /**
     * Factory method for 403 Forbidden errors
     */
    static forbidden(message = 'Forbidden', errorCode = 'FORBIDDEN') {
        return new ErrorResponse(message, 403, errorCode);
    }

    /**
     * Factory method for 404 Not Found errors
     */
    static notFound(message = 'Resource not found', errorCode = 'NOT_FOUND') {
        return new ErrorResponse(message, 404, errorCode);
    }

    /**
     * Factory method for 409 Conflict errors
     */
    static conflict(message = 'Conflict', errorCode = 'CONFLICT') {
        return new ErrorResponse(message, 409, errorCode);
    }

    /**
     * Factory method for 422 Unprocessable Entity errors
     */
    static unprocessableEntity(message = 'Unprocessable Entity', errorCode = 'UNPROCESSABLE_ENTITY') {
        return new ErrorResponse(message, 422, errorCode);
    }

    /**
     * Factory method for 429 Too Many Requests errors
     */
    static tooManyRequests(message = 'Too many requests', errorCode = 'TOO_MANY_REQUESTS') {
        return new ErrorResponse(message, 429, errorCode);
    }

    /**
     * Factory method for 500 Internal Server errors
     */
    static internal(message = 'Internal Server Error', errorCode = 'INTERNAL_ERROR') {
        return new ErrorResponse(message, 500, errorCode);
    }
}

module.exports = ErrorResponse;
