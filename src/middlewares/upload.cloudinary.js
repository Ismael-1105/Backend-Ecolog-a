const multer = require('multer');
const { cloudinaryConfigured } = require('../config/cloudinary');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Multer Upload Middleware for Cloudinary
 * Handles video and thumbnail uploads simultaneously
 */

// Combined file filter for both video and thumbnail
const fileFilter = (req, file, cb) => {
    if (file.fieldname === 'video') {
        const allowedVideoTypes = [
            'video/mp4',
            'video/mpeg',
            'video/quicktime',
            'video/x-msvideo',
            'video/x-matroska',
            'video/webm',
        ];

        if (allowedVideoTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new ErrorResponse(
                    'Invalid video format. Allowed: mp4, avi, mov, mkv, webm, mpeg',
                    400,
                    'INVALID_VIDEO_FORMAT'
                ),
                false
            );
        }
    } else if (file.fieldname === 'thumbnail') {
        const allowedImageTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

        if (allowedImageTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new ErrorResponse(
                    'Invalid thumbnail format. Allowed: jpg, jpeg, png, webp',
                    400,
                    'INVALID_THUMBNAIL_FORMAT'
                ),
                false
            );
        }
    } else {
        cb(
            new ErrorResponse(
                `Unexpected field: ${file.fieldname}. Expected 'video' or 'thumbnail'`,
                400,
                'UNEXPECTED_FIELD'
            ),
            false
        );
    }
};

/**
 * Cloudinary Upload Middleware
 * Handles both video and thumbnail upload using multer.fields()
 */
const cloudinaryUpload = (req, res, next) => {
    // Check if Cloudinary is configured
    if (!cloudinaryConfigured) {
        return next(new ErrorResponse('Cloudinary is not configured. Please set up Cloudinary credentials.', 500));
    }

    // Keep API upload limit aligned with MAX_FILE_SIZE (.env / server validation).
    const maxUploadSize = parseInt(process.env.MAX_FILE_SIZE, 10) || 500 * 1024 * 1024;

    // Create multer instance with fields for video and thumbnail
    const upload = multer({
        storage: multer.diskStorage({}), // Temporary storage, Cloudinary handles actual storage
        limits: {
            fileSize: maxUploadSize,
        },
        fileFilter: fileFilter,
    }).fields([
        { name: 'video', maxCount: 1 },
        { name: 'thumbnail', maxCount: 1 }
    ]);

    // Execute upload
    upload(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // Multer-specific errors
            if (err.code === 'LIMIT_FILE_SIZE') {
                const maxSizeMb = Math.round(maxUploadSize / (1024 * 1024));
                return next(new ErrorResponse(`File too large. Maximum allowed size is ${maxSizeMb}MB per file`, 413));
            } else if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return next(new ErrorResponse(`Unexpected field: ${err.field}. Expected 'video' and 'thumbnail'`, 400));
            }
            return next(new ErrorResponse(err.message, 400));
        } else if (err) {
            // Other errors (like from fileFilter)
            return next(err);
        }

        // Validate that both files were uploaded
        if (!req.files || !req.files.video || !req.files.video[0]) {
            return next(new ErrorResponse('Video file is required', 400, 'VIDEO_REQUIRED'));
        }

        if (!req.files.thumbnail || !req.files.thumbnail[0]) {
            return next(new ErrorResponse('Thumbnail file is required', 400, 'THUMBNAIL_REQUIRED'));
        }

        // Now upload to Cloudinary
        const cloudinary = require('cloudinary').v2;

        // Upload video to Cloudinary
        const videoFile = req.files.video[0];
        const thumbnailFile = req.files.thumbnail[0];

        // Upload video
        cloudinary.uploader.upload(
            videoFile.path,
            {
                resource_type: 'video',
                folder: process.env.CLOUDINARY_FOLDER || 'ecolearn-videos',
                transformation: [
                    { quality: 'auto' },
                    { fetch_format: 'auto' }
                ]
            },
            (error, videoResult) => {
                if (error) {
                    return next(new ErrorResponse('Error uploading video to Cloudinary', 500));
                }

                // Upload thumbnail
                cloudinary.uploader.upload(
                    thumbnailFile.path,
                    {
                        resource_type: 'image',
                        folder: `${process.env.CLOUDINARY_FOLDER || 'ecolearn-videos'}/thumbnails`,
                        transformation: [
                            { width: 1280, height: 720, crop: 'limit' },
                            { quality: 'auto' },
                            { fetch_format: 'auto' }
                        ]
                    },
                    (error, thumbnailResult) => {
                        if (error) {
                            return next(new ErrorResponse('Error uploading thumbnail to Cloudinary', 500));
                        }

                        // Attach Cloudinary results to request
                        req.videoFile = {
                            path: videoResult.secure_url,
                            filename: videoResult.public_id,
                            size: videoResult.bytes,
                            duration: videoResult.duration
                        };

                        req.thumbnailFile = {
                            path: thumbnailResult.secure_url,
                            filename: thumbnailResult.public_id,
                            size: thumbnailResult.bytes
                        };

                        next();
                    }
                );
            }
        );
    });
};

module.exports = {
    cloudinaryUpload
};
