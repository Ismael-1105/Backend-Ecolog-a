const multer = require('multer');
const path = require('path');
const fs = require('fs');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Multer Upload Configuration
 * Organized storage by user ID and date
 */

// Ensure upload directory exists
const ensureDirectoryExists = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const userId = req.user ? req.user.id : 'anonymous';
        const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

        const uploadPath = path.join(
            process.env.UPLOAD_PATH || './storage/videos',
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
        const basename = path.basename(file.originalname, ext);

        // Sanitize filename
        const sanitizedBasename = basename
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .substring(0, 50);

        cb(null, `${sanitizedBasename}-${uniqueSuffix}${ext}`);
    },
});

// File filter - Accept only video files
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = [
        'video/mp4',
        'video/mpeg',
        'video/quicktime',
        'video/x-msvideo',
        'video/x-matroska',
        'video/webm',
    ];

    const allowedExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.mpeg'];

    const ext = path.extname(file.originalname).toLowerCase();
    const mimeType = file.mimetype;

    if (allowedMimeTypes.includes(mimeType) && allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(
            ErrorResponse.badRequest(
                `Invalid file type. Allowed formats: ${allowedExtensions.join(', ')}`,
                'INVALID_FILE_TYPE'
            ),
            false
        );
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500MB default
    },
    fileFilter: fileFilter,
});

// Export single file upload middleware
module.exports = upload.single('video');
