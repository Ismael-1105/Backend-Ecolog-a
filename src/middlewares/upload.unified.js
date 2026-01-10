const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Unified Upload Middleware
 * Provides flexible file upload configuration with security controls
 * Default max size: 50MB
 */

// Ensure upload directory exists
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Sanitize filename to prevent path traversal and other attacks
const sanitizeFilename = (filename) => {
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);

    // Remove any non-alphanumeric characters except hyphens and underscores
    const sanitized = basename
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .substring(0, 50); // Limit length

    return sanitized;
};

// File type configurations
const FILE_TYPES = {
    image: {
        mimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
        extensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
    video: {
        mimeTypes: ['video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska', 'video/webm'],
        extensions: ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.mpeg'],
        maxSize: 50 * 1024 * 1024, // 50MB
    },
    document: {
        mimeTypes: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
        extensions: ['.pdf', '.doc', '.docx', '.txt'],
        maxSize: 10 * 1024 * 1024, // 10MB
    },
    audio: {
        mimeTypes: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm'],
        extensions: ['.mp3', '.wav', '.ogg', '.webm'],
        maxSize: 20 * 1024 * 1024, // 20MB
    },
    any: {
        mimeTypes: [], // Will be populated with all types
        extensions: [], // Will be populated with all extensions
        maxSize: 50 * 1024 * 1024, // 50MB default
    }
};

// Populate 'any' type with all allowed types
FILE_TYPES.any.mimeTypes = [
    ...FILE_TYPES.image.mimeTypes,
    ...FILE_TYPES.video.mimeTypes,
    ...FILE_TYPES.document.mimeTypes,
    ...FILE_TYPES.audio.mimeTypes,
];
FILE_TYPES.any.extensions = [
    ...FILE_TYPES.image.extensions,
    ...FILE_TYPES.video.extensions,
    ...FILE_TYPES.document.extensions,
    ...FILE_TYPES.audio.extensions,
];

/**
 * Create file filter based on allowed types
 * @param {string|string[]} allowedTypes - Type(s) to allow: 'image', 'video', 'document', 'audio', 'any', or array of types
 * @returns {Function} Multer file filter function
 */
const createFileFilter = (allowedTypes = 'any') => {
    return (req, file, cb) => {
        const types = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];

        let allowedMimeTypes = [];
        let allowedExtensions = [];

        // Collect all allowed mime types and extensions
        types.forEach(type => {
            if (FILE_TYPES[type]) {
                allowedMimeTypes = [...allowedMimeTypes, ...FILE_TYPES[type].mimeTypes];
                allowedExtensions = [...allowedExtensions, ...FILE_TYPES[type].extensions];
            }
        });

        const ext = path.extname(file.originalname).toLowerCase();
        const mimeType = file.mimetype;

        // Validate both mime type and extension
        if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
            cb(null, true);
        } else {
            cb(
                new ErrorResponse(
                    `Invalid file type. Allowed formats: ${allowedExtensions.join(', ')}`,
                    400,
                    'INVALID_FILE_TYPE'
                ),
                false
            );
        }
    };
};

/**
 * Configure storage with organized directory structure
 * @param {string} baseDir - Base directory for uploads
 * @returns {multer.StorageEngine} Multer storage engine
 */
const createStorage = (baseDir = './uploads') => {
    return multer.diskStorage({
        destination: function (req, file, cb) {
            const userId = req.user ? req.user.id : 'anonymous';
            const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

            const uploadPath = path.join(
                process.env.UPLOAD_PATH || baseDir,
                userId,
                date
            );

            ensureDirectoryExists(uploadPath);
            cb(null, uploadPath);
        },
        filename: function (req, file, cb) {
            // Generate unique filename
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
            const ext = path.extname(file.originalname);
            const sanitizedBasename = sanitizeFilename(file.originalname);

            cb(null, `${sanitizedBasename}-${uniqueSuffix}${ext}`);
        },
    });
};

/**
 * Create upload middleware with custom configuration
 * @param {Object} options - Configuration options
 * @param {string|string[]} options.allowedTypes - File types to allow
 * @param {number} options.maxSize - Maximum file size in bytes (default: 50MB)
 * @param {string} options.fieldName - Field name for single upload (default: 'file')
 * @param {Array} options.fields - Array of field configurations for multiple uploads
 * @param {string} options.baseDir - Base directory for uploads
 * @returns {Function} Configured multer middleware
 */
const createUploadMiddleware = (options = {}) => {
    const {
        allowedTypes = 'any',
        maxSize = 50 * 1024 * 1024, // 50MB default
        fieldName = 'file',
        fields = null,
        baseDir = './uploads'
    } = options;

    const upload = multer({
        storage: createStorage(baseDir),
        limits: {
            fileSize: maxSize,
        },
        fileFilter: createFileFilter(allowedTypes),
    });

    // Return appropriate middleware based on configuration
    if (fields) {
        return upload.fields(fields);
    } else {
        return upload.single(fieldName);
    }
};

/**
 * Pre-configured upload middlewares for common use cases
 */
const uploadMiddlewares = {
    // Single image upload (max 10MB)
    singleImage: createUploadMiddleware({
        allowedTypes: 'image',
        maxSize: 10 * 1024 * 1024,
        fieldName: 'image'
    }),

    // Single video upload (max 50MB)
    singleVideo: createUploadMiddleware({
        allowedTypes: 'video',
        maxSize: 50 * 1024 * 1024,
        fieldName: 'video'
    }),

    // Single document upload (max 10MB)
    singleDocument: createUploadMiddleware({
        allowedTypes: 'document',
        maxSize: 10 * 1024 * 1024,
        fieldName: 'document'
    }),

    // Single audio upload (max 20MB)
    singleAudio: createUploadMiddleware({
        allowedTypes: 'audio',
        maxSize: 20 * 1024 * 1024,
        fieldName: 'audio'
    }),

    // Any single file (max 50MB)
    singleFile: createUploadMiddleware({
        allowedTypes: 'any',
        maxSize: 50 * 1024 * 1024,
        fieldName: 'file'
    }),

    // Multiple files (max 5 files, 50MB each)
    multipleFiles: multer({
        storage: createStorage('./uploads'),
        limits: {
            fileSize: 50 * 1024 * 1024,
            files: 5,
        },
        fileFilter: createFileFilter('any'),
    }).array('files', 5),
};

module.exports = {
    createUploadMiddleware,
    uploadMiddlewares,
    FILE_TYPES,
    sanitizeFilename,
};
