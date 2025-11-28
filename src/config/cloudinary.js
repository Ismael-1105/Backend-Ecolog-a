const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const dotenv = require("dotenv");


// Cargar variables de entorno
dotenv.config();



/**
 * Cloudinary Configuration
 * Handles video and image uploads to Cloudinary
 */

// Check if Cloudinary is configured (not using placeholder values)



const isCloudinaryConfigured = () => {
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    // Check if all variables exist and are not placeholder values
    return cloudName &&
        apiKey &&
        apiSecret &&
        cloudName !== 'name' &&
        apiKey !== 'key' &&
        apiSecret !== 'secret';
};

const cloudinaryConfigured = isCloudinaryConfigured();

if (cloudinaryConfigured) {
    // Configure Cloudinary only if credentials are provided
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
    console.log('✅ Cloudinary configured successfully');
} else {
    console.warn('⚠️  Cloudinary not configured. Video uploads will not work. Please set CLOUDINARY_* environment variables.');
}

/**
 * Storage configuration for videos
 */
const videoStorage = cloudinaryConfigured ? new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: process.env.CLOUDINARY_FOLDER || 'ecolearn-videos',
        resource_type: 'video',
        allowed_formats: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'mpeg'],
        transformation: [
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ],
    },
}) : null;

/**
 * Storage configuration for thumbnails
 */
const thumbnailStorage = cloudinaryConfigured ? new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: `${process.env.CLOUDINARY_FOLDER || 'ecolearn-videos'}/thumbnails`,
        resource_type: 'image',
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
            { width: 1280, height: 720, crop: 'limit' },
            { quality: 'auto' },
            { fetch_format: 'auto' }
        ],
    },
}) : null;

/**
 * Delete a file from Cloudinary
 * @param {string} publicId - The public ID of the file to delete
 * @param {string} resourceType - Type of resource ('video' or 'image')
 * @returns {Promise<Object>} Deletion result
 */
const deleteFile = async (publicId, resourceType = 'video') => {
    if (!cloudinaryConfigured) {
        throw new Error('Cloudinary is not configured');
    }

    try {
        const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType
        });
        return result;
    } catch (error) {
        console.error('Error deleting file from Cloudinary:', error);
        throw error;
    }
};

/**
 * Get video metadata
 * @param {string} publicId - The public ID of the video
 * @returns {Promise<Object>} Video metadata
 */
const getVideoMetadata = async (publicId) => {
    if (!cloudinaryConfigured) {
        throw new Error('Cloudinary is not configured');
    }

    try {
        const result = await cloudinary.api.resource(publicId, {
            resource_type: 'video'
        });
        return result;
    } catch (error) {
        console.error('Error fetching video metadata:', error);
        throw error;
    }
};

module.exports = {
    cloudinary,
    videoStorage,
    thumbnailStorage,
    deleteFile,
    getVideoMetadata,
    cloudinaryConfigured
};
