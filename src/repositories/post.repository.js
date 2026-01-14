const Post = require('../models/Post');

/**
 * Post Repository
 * Data access layer for Post model with optimized queries
 */

class PostRepository {
    /**
     * Create a new post
     * @param {Object} postData - Post data
     * @returns {Promise<Object>} Created post
     */
    async create(postData) {
        const post = new Post(postData);
        return await post.save();
    }

    /**
     * Find post by ID
     * @param {string} id - Post ID
     * @param {Object} options - Query options
     * @returns {Promise<Object|null>} Post or null
     */
    async findById(id, options = {}) {
        let query = Post.findById(id);

        if (options.populate) {
            query = query.populate(options.populate);
        }

        if (options.includeDeleted) {
            query = query.setOptions({ includeDeleted: true });
        }

        if (options.lean) {
            query = query.lean();
        }

        return await query;
    }

    /**
     * Find all posts with filters
     * @param {Object} filters - Query filters
     * @param {Object} options - Query options (pagination, sort, populate)
     * @returns {Promise<Array>} Array of posts
     */
    async findAll(filters = {}, options = {}) {
        const {
            page = 1,
            limit = 20,
            sort = { createdAt: -1 },
            populate = 'author',
            lean = true,
            select = null
        } = options;

        const skip = (page - 1) * limit;

        let query = Post.find(filters)
            .sort(sort)
            .skip(skip)
            .limit(limit);

        if (populate) {
            query = query.populate(populate);
        }

        if (select) {
            query = query.select(select);
        }

        if (lean) {
            query = query.lean();
        }

        return await query;
    }

    /**
     * Find posts by category
     * @param {string} category - Category name
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of posts
     */
    async findByCategory(category, options = {}) {
        return await this.findAll({ category }, options);
    }

    /**
     * Find posts by author
     * @param {string} authorId - Author ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of posts
     */
    async findByAuthor(authorId, options = {}) {
        return await this.findAll({ author: authorId }, options);
    }

    /**
     * Full-text search in posts
     * @param {string} searchQuery - Search query
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of matching posts
     */
    async search(searchQuery, options = {}) {
        const {
            page = 1,
            limit = 20,
            category = null,
            populate = 'author',
            lean = true
        } = options;

        const skip = (page - 1) * limit;

        const filters = {
            $text: { $search: searchQuery }
        };

        if (category) {
            filters.category = category;
        }

        let query = Post.find(filters, {
            score: { $meta: 'textScore' }
        })
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit);

        if (populate) {
            query = query.populate(populate);
        }

        if (lean) {
            query = query.lean();
        }

        return await query;
    }

    /**
     * Get trending posts (by popularity score)
     * @param {Object} options - Query options
     * @returns {Promise<Array>} Array of trending posts
     */
    async findTrending(options = {}) {
        const {
            limit = 10,
            category = null,
            timeframe = 7 // days
        } = options;

        const dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - timeframe);

        const filters = {
            createdAt: { $gte: dateThreshold }
        };

        if (category) {
            filters.category = category;
        }

        // Use aggregation for better performance
        return await Post.aggregate([
            { $match: filters },
            {
                $addFields: {
                    likeCount: { $size: { $ifNull: ['$likes', []] } },
                    dislikeCount: { $size: { $ifNull: ['$dislikes', []] } },
                    ageInDays: {
                        $divide: [
                            { $subtract: [new Date(), '$createdAt'] },
                            1000 * 60 * 60 * 24
                        ]
                    }
                }
            },
            {
                $addFields: {
                    popularityScore: {
                        $subtract: [
                            {
                                $add: [
                                    { $multiply: ['$likeCount', 2] },
                                    { $multiply: ['$views', 0.3] }
                                ]
                            },
                            {
                                $add: [
                                    '$dislikeCount',
                                    { $multiply: ['$ageInDays', 0.1] }
                                ]
                            }
                        ]
                    }
                }
            },
            { $sort: { popularityScore: -1 } },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author'
                }
            },
            { $unwind: { path: '$author', preserveNullAndEmptyArrays: true } }
        ]);
    }

    /**
     * Update post
     * @param {string} id - Post ID
     * @param {Object} updateData - Data to update
     * @returns {Promise<Object|null>} Updated post or null
     */
    async update(id, updateData) {
        return await Post.findByIdAndUpdate(
            id,
            updateData,
            { new: true, runValidators: true }
        ).populate('author', 'name profilePicture');
    }

    /**
     * Soft delete post
     * @param {string} id - Post ID
     * @returns {Promise<Object|null>} Deleted post or null
     */
    async delete(id) {
        return await Post.findByIdAndUpdate(
            id,
            { isDeleted: true, deletedAt: new Date() },
            { new: true }
        );
    }

    /**
     * Permanently delete post
     * @param {string} id - Post ID
     * @returns {Promise<Object|null>} Deleted post or null
     */
    async hardDelete(id) {
        return await Post.findByIdAndDelete(id);
    }

    /**
     * Count posts with filters
     * @param {Object} filters - Query filters
     * @returns {Promise<number>} Count of posts
     */
    async count(filters = {}) {
        return await Post.countDocuments(filters);
    }

    /**
     * Add like to post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} Updated post
     */
    async addLike(postId, userId) {
        return await Post.findByIdAndUpdate(
            postId,
            {
                $addToSet: { likes: userId },
                $pull: { dislikes: userId }
            },
            { new: true }
        );
    }

    /**
     * Remove like from post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} Updated post
     */
    async removeLike(postId, userId) {
        return await Post.findByIdAndUpdate(
            postId,
            { $pull: { likes: userId } },
            { new: true }
        );
    }

    /**
     * Add dislike to post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} Updated post
     */
    async addDislike(postId, userId) {
        return await Post.findByIdAndUpdate(
            postId,
            {
                $addToSet: { dislikes: userId },
                $pull: { likes: userId }
            },
            { new: true }
        );
    }

    /**
     * Remove dislike from post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} Updated post
     */
    async removeDislike(postId, userId) {
        return await Post.findByIdAndUpdate(
            postId,
            { $pull: { dislikes: userId } },
            { new: true }
        );
    }

    /**
     * Increment view count
     * @param {string} postId - Post ID
     * @returns {Promise<Object|null>} Updated post
     */
    async incrementViews(postId) {
        return await Post.findByIdAndUpdate(
            postId,
            { $inc: { views: 1 } },
            { new: true }
        );
    }

    /**
     * Pin post
     * @param {string} postId - Post ID
     * @param {string} adminId - Admin ID
     * @returns {Promise<Object|null>} Updated post
     */
    async pin(postId, adminId) {
        return await Post.findByIdAndUpdate(
            postId,
            {
                isPinned: true,
                pinnedAt: new Date(),
                pinnedBy: adminId
            },
            { new: true }
        );
    }

    /**
     * Unpin post
     * @param {string} postId - Post ID
     * @returns {Promise<Object|null>} Updated post
     */
    async unpin(postId) {
        return await Post.findByIdAndUpdate(
            postId,
            {
                isPinned: false,
                pinnedAt: null,
                pinnedBy: null
            },
            { new: true }
        );
    }

    /**
     * Get posts with cursor-based pagination
     * @param {Object} filters - Query filters
     * @param {Object} options - Cursor pagination options
     * @returns {Promise<Object>} Posts and cursor info
     */
    async findWithCursor(filters = {}, options = {}) {
        const {
            limit = 20,
            cursor = null,
            sort = { createdAt: -1 },
            populate = 'author',
            lean = true
        } = options;

        // Build query with cursor
        const query = { ...filters };
        if (cursor) {
            // Decode cursor (base64 encoded timestamp)
            const decodedCursor = Buffer.from(cursor, 'base64').toString('utf-8');
            const cursorDate = new Date(decodedCursor);

            // Add cursor condition based on sort direction
            if (sort.createdAt === -1) {
                query.createdAt = { $lt: cursorDate };
            } else {
                query.createdAt = { $gt: cursorDate };
            }
        }

        let queryBuilder = Post.find(query)
            .sort(sort)
            .limit(limit + 1); // Fetch one extra to determine if there are more

        if (populate) {
            queryBuilder = queryBuilder.populate(populate);
        }

        if (lean) {
            queryBuilder = queryBuilder.lean();
        }

        const posts = await queryBuilder;

        // Check if there are more results
        const hasMore = posts.length > limit;
        if (hasMore) {
            posts.pop(); // Remove the extra item
        }

        // Generate next cursor
        let nextCursor = null;
        if (hasMore && posts.length > 0) {
            const lastPost = posts[posts.length - 1];
            nextCursor = Buffer.from(lastPost.createdAt.toISOString()).toString('base64');
        }

        return {
            posts,
            nextCursor,
            hasMore
        };
    }
}

module.exports = new PostRepository();
