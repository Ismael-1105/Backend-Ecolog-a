
const errorHandler = (err, req, res, next) => {
    // eslint-disable-next-line no-console
    console.error(err);

    // Handle Express Validator errors
    if (err && err.errors && Array.isArray(err.errors)) {
        return res.status(400).json({
            message: 'Validation failed',
            errors: err.errors,
        });
    }

    // Multer file filter/size errors
    if (err && (err.code === 'LIMIT_FILE_SIZE' || err.code === 'LIMIT_UNEXPECTED_FILE')) {
        return res.status(400).json({
            message: 'Upload error',
            detail: err.message,
        });
    }

    // Mongoose validation errors
    if (err && err.name === 'ValidationError') {
        return res.status(400).json({
            message: 'Validation error',
            errors: Object.values(err.errors).map((e) => ({ field: e.path, message: e.message })),
        });
    }

    const status = err.statusCode || 500;
    const message = err.message || 'Internal server error';
    return res.status(status).json({ message });
};

module.exports = errorHandler;
