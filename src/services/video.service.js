const videoRepository = require('../repositories/video.repository');
const { deleteFile } = require('../config/cloudinary');
const ErrorResponse = require('../utils/ErrorResponse');

/**
 * Video Service
 * Business logic layer for video operations
 */

class VideoService {
    /**
     * Upload a new video with thumbnail
     * @param {Object} videoFile - Uploaded video file from multer
     * @param {Object} thumbnailFile - Uploaded thumbnail file from multer
     * @param {Object} videoData - Video metadata (title, description)
     * @param {string} userId - ID of the user uploading
     * @returns {Promise<Object>} Created video
     */
    async uploadVideo(videoFile, thumbnailFile, videoData, userId) {
        // Validate files
        if (!videoFile) {
            throw new ErrorResponse('Video file is required', 400, 'VIDEO_REQUIRED');
        }
        if (!thumbnailFile) {
            throw new ErrorResponse('Thumbnail is required', 400, 'THUMBNAIL_REQUIRED');
        }

        // Prepare video data
        const newVideoData = {
            title: videoData.title,
            description: videoData.description,
            videoUrl: videoFile.path,
            videoPublicId: videoFile.filename,
            thumbnailUrl: thumbnailFile.path,
            thumbnailPublicId: thumbnailFile.filename,
            author: userId,
            duration: videoData.duration || null,
            fileSize: videoFile.size,
            approved: true, // Auto-approve videos (temporary for development)
        };

        // Create video in database
        const video = await videoRepository.create(newVideoData);
        return await videoRepository.findById(video._id, { populate: 'author' });
    }

    /**
     * Get all videos with filters and pagination
     * @param {Object} filters - Query filters
     * @param {Object} options - Pagination and sort options
     * @returns {Promise<Object>} Videos and pagination info
     */
    async getVideos(filters = {}, options = {}) {
        const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;

        const videos = await videoRepository.findAll(filters, {
            page,
            limit,
            sort,
            populate: 'author'
        });

        const total = await videoRepository.count(filters);

        return {
            videos,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    /**
     * Get approved videos only
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Approved videos and pagination
     */
    async getApprovedVideos(options = {}) {
        return await this.getVideos({ approved: true }, options);
    }

    /**
     * Get video by ID
     * @param {string} id - Video ID
     * @param {boolean} incrementViews - Whether to increment view count
     * @returns {Promise<Object>} Video
     */
    async getVideoById(id, incrementViews = false) {
        const video = await videoRepository.findById(id, { populate: 'author' });

        if (!video) {
            throw new ErrorResponse('Video not found', 404, 'VIDEO_NOT_FOUND');
        }

        // Increment views if requested
        if (incrementViews) {
            await videoRepository.incrementViews(id);
            video.views += 1;
        }

        return video;
    }

    /**
     * Get videos by author
     * @param {string} authorId - Author ID
     * @param {Object} options - Pagination options
     * @returns {Promise<Object>} Videos and pagination
     */
    async getVideosByAuthor(authorId, options = {}) {
        return await this.getVideos({ author: authorId }, options);
    }

    /**
     * Approve a video
     * @param {string} id - Video ID
     * @param {string} adminId - ID of admin approving
     * @returns {Promise<Object>} Approved video
     */
    async approveVideo(id, adminId) {
        const video = await videoRepository.findById(id);

        if (!video) {
            throw new ErrorResponse('Video not found', 404, 'VIDEO_NOT_FOUND');
        }

        if (video.approved) {
            throw new ErrorResponse('Video is already approved', 400, 'ALREADY_APPROVED');
        }

        return await videoRepository.approve(id);
    }

    /**
     * Update video
     * @param {string} id - Video ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - ID of user updating
     * @param {string} userRole - Role of user updating
     * @returns {Promise<Object>} Updated video
     */
    async updateVideo(id, updateData, userId, userRole) {
        const video = await videoRepository.findById(id);

        if (!video) {
            throw new ErrorResponse('Video not found', 404, 'VIDEO_NOT_FOUND');
        }

        // Check permissions
        const isAuthor = video.author.toString() === userId;
        const isAdmin = ['Administrador', 'SuperAdmin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            throw new ErrorResponse('Not authorized to update this video', 403, 'FORBIDDEN');
        }

        // Only allow updating certain fields
        const allowedFields = ['title', 'description'];
        const filteredData = {};

        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) {
                filteredData[field] = updateData[field];
            }
        });

        return await videoRepository.update(id, filteredData);
    }

    /**
     * Delete video
     * @param {string} id - Video ID
     * @param {string} userId - ID of user deleting
     * @param {string} userRole - Role of user deleting
     * @returns {Promise<Object>} Deletion result
     */
    async deleteVideo(id, userId, userRole) {
        const video = await videoRepository.findById(id);

        if (!video) {
            throw new ErrorResponse('Video not found', 404, 'VIDEO_NOT_FOUND');
        }

        // Check permissions
        const isAuthor = video.author.toString() === userId;
        const isAdmin = ['Administrador', 'SuperAdmin'].includes(userRole);

        if (!isAuthor && !isAdmin) {
            throw new ErrorResponse('Not authorized to delete this video', 403, 'FORBIDDEN');
        }

        // Delete files from Cloudinary
        try {
            await deleteFile(video.videoPublicId, 'video');
            await deleteFile(video.thumbnailPublicId, 'image');
        } catch (error) {
            console.error('Error deleting files from Cloudinary:', error);
            // Continue with database deletion even if Cloudinary deletion fails
        }

        // Soft delete from database
        await videoRepository.delete(id);

        return { message: 'Video deleted successfully' };
    }

    /**
     * Like a video
     * @param {string} videoId - Video ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated video
     */
    async likeVideo(videoId, userId) {
        const video = await videoRepository.findById(videoId);

        if (!video) {
            throw new ErrorResponse('Video not found', 404, 'VIDEO_NOT_FOUND');
        }

        return await videoRepository.addLike(videoId, userId);
    }

    /**
     * Dislike a video
     * @param {string} videoId - Video ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Updated video
     */
    async dislikeVideo(videoId, userId) {
        const video = await videoRepository.findById(videoId);

        if (!video) {
            throw new ErrorResponse('Video not found', 404, 'VIDEO_NOT_FOUND');
        }

        return await videoRepository.addDislike(videoId, userId);
    }
}

module.exports = new VideoService();
