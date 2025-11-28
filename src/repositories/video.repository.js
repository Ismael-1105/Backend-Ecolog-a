const Video = require('../models/Video');

/**
 * Video Repository
 * Data access layer for Video model
 */

class VideoRepository {
    /**
     * Create a new video
     * @param {Object} videoData - Video data
     * @returns {Promise<Object>} Created video
     */
    async create(videoData) {
        const video = new Video(videoData);
        return await video.save();
    }

    /**
     * Find video by ID
     * @param {string} id - Video ID
     * @param {Object} options - Query options
     * @returns {Promise<Object|null>} Video or null
     */
    async findById(id, options = {}) {
        let query = Video.findById(id);

        if (options.populate) {
            query = query.populate(options.populate);
        }

        if (options.includeDeleted) {
            query = query.setOptions({ includeDeleted: true });
        }

        return await query;
    }

    /**
     * Find all videos with filters
     * @param {Object} filters - Query filters
     * @param {Object} options - Query options (pagination, sort, populate)
     * @returns {Promise<Array>} Array of videos
     */
    async findAll(filters = {}, options = {}) {
        const {
            page = 1,
            limit = 10,
            sort = { createdAt: -1 },
            populate = 'author',
        } = options;

        const skip = (page - 1) * limit;

        let query = Video.find(filters)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        if (populate) {
            query = query.populate(populate);
        }

        return await query;
    }

    /**
     * Find approved videos only
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of approved videos
     */
    async findApproved(options = {}) {
        return await this.findAll({ approved: true }, options);
    }

    /**
     * Find videos by author
     * @param {string} authorId - Author ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of videos
     */
    async findByAuthor(authorId, options = {}) {
        return await this.findAll({ author: authorId }, options);
    }

    /**
     * Update video
     * @param {string} id - Video ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object|null>} Updated video or null
     */
    async update(id, updateData) {
        return await Video.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('author');
    }

    /**
     * Soft delete video
     * @param {string} id - Video ID
     * @returns {Promise<Object|null>} Deleted video or null
     */
    async delete(id) {
        return await Video.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
    }

    /**
     * Permanently delete video
     * @param {string} id - Video ID
     * @returns {Promise<Object|null>} Deleted video or null
     */
    async hardDelete(id) {
        return await Video.findByIdAndDelete(id);
    }

    /**
     * Approve video
     * @param {string} id - Video ID
     * @returns {Promise<Object|null>} Approved video or null
     */
    async approve(id) {
        return await this.update(id, { approved: true });
    }

    /**
     * Count videos with filters
     * @param {Object} filters - Query filters
     * @returns {Promise<number>} Count of videos
     */
    async count(filters = {}) {
        return await Video.countDocuments(filters);
    }

    /**
     * Add like to video
     * @param {string} videoId - Video ID
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} Updated video
     */
    async addLike(videoId, userId) {
        return await Video.findByIdAndUpdate(
            videoId,
            {
                $addToSet: { likes: userId },
                $pull: { dislikes: userId }
            },
            { new: true }
        );
    }

    /**
     * Add dislike to video
     * @param {string} videoId - Video ID
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} Updated video
     */
    async addDislike(videoId, userId) {
        return await Video.findByIdAndUpdate(
            videoId,
            {
                $addToSet: { dislikes: userId },
                $pull: { likes: userId }
            },
            { new: true }
        );
    }

    /**
     * Increment view count
     * @param {string} videoId - Video ID
     * @returns {Promise<Object|null>} Updated video
     */
    async incrementViews(videoId) {
        return await Video.findByIdAndUpdate(
            videoId,
            { $inc: { views: 1 } },
            { new: true }
        );
    }
}

module.exports = new VideoRepository();
