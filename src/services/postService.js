const postRepository = require('../repositories/post.repository');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Post Service
 * Business logic for forum post operations
 */

class PostService {
    /**
     * Create a new post
     * @param {Object} postData - Post data
     * @param {string} userId - User ID (optional)
     * @returns {Object} Created post
     */
    static async createPost(postData, userId = null) {
        const { title, content, category, attachments = [] } = postData;

        // Validate required fields
        if (!title || !content) {
            throw ErrorResponse.badRequest('Title and content are required', 'MISSING_FIELDS');
        }

        if (!category) {
            throw ErrorResponse.badRequest('Category is required', 'MISSING_CATEGORY');
        }

        // Validate attachments limit
        if (attachments.length > 5) {
            throw ErrorResponse.badRequest('Maximum 5 attachments allowed per post', 'TOO_MANY_ATTACHMENTS');
        }

        try {
            const newPostData = {
                title,
                content,
                category,
                attachments
            };

            // Add author if user is authenticated
            if (userId) {
                newPostData.author = userId;
            }

            const post = await postRepository.create(newPostData);

            // Populate author if it exists
            if (post.author) {
                const populatedPost = await postRepository.findById(post._id, {
                    populate: 'author',
                    lean: false
                });

                logger.info('Post created successfully', {
                    postId: post._id,
                    userId,
                    attachmentsCount: attachments.length
                });

                return populatedPost;
            }

            logger.info('Post created successfully', {
                postId: post._id,
                userId,
                attachmentsCount: attachments.length
            });

            return post;
        } catch (error) {
            logger.error('Error creating post', { error: error.message });
            throw ErrorResponse.internal('Error creating post');
        }
    }

    /**
     * Get all posts with pagination
     * @param {Object} options - Query options
     * @returns {Object} Posts and pagination info
     */
    static async getPosts(options = {}) {
        const {
            page = 1,
            limit = 20,
            sort = '-createdAt',
            category = null,
        } = options;

        try {
            // Parse sort string to object
            const sortObj = {};
            if (sort.startsWith('-')) {
                sortObj[sort.substring(1)] = -1;
            } else {
                sortObj[sort] = 1;
            }

            const filters = {};

            // Filter by category if provided
            if (category) {
                filters.category = category;
            }

            const posts = await postRepository.findAll(filters, {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sortObj,
                populate: 'author',
                select: 'title content category author likes dislikes views createdAt updatedAt',
                lean: true
            });

            const total = await postRepository.count(filters);

            return {
                posts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error fetching posts', { error: error.message });
            throw ErrorResponse.internal('Error fetching posts');
        }
    }

    /**
     * Get post by ID
     * @param {string} postId - Post ID
     * @param {boolean} incrementViews - Whether to increment view count
     * @returns {Object} Post
     */
    static async getPostById(postId, incrementViews = false) {
        try {
            const post = await postRepository.findById(postId, {
                populate: 'author',
                lean: false
            });

            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            // Increment views if requested
            if (incrementViews) {
                await postRepository.incrementViews(postId);
                post.views += 1;
            }

            return post;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error fetching post', { error: error.message, postId });
            throw ErrorResponse.internal('Error fetching post');
        }
    }

    /**
     * Update post
     * @param {string} postId - Post ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - User ID
     * @param {string} userRole - User role
     * @returns {Object} Updated post
     */
    static async updatePost(postId, updateData, userId, userRole) {
        try {
            const post = await postRepository.findById(postId, { lean: false });

            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            // Check authorization
            const isAuthor = post.author && post.author.toString() === userId;
            const isAdmin = userRole === 'Administrador' || userRole === 'SuperAdmin';

            if (!isAuthor && !isAdmin) {
                throw ErrorResponse.forbidden(
                    'You are not authorized to update this post',
                    'UNAUTHORIZED'
                );
            }

            // Update allowed fields
            const allowedFields = ['title', 'content', 'category'];
            const filteredData = {};

            allowedFields.forEach(field => {
                if (updateData[field] !== undefined) {
                    filteredData[field] = updateData[field];
                }
            });

            const updatedPost = await postRepository.update(postId, filteredData);

            logger.info('Post updated successfully', {
                postId,
                userId,
            });

            return updatedPost;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error updating post', { error: error.message, postId });
            throw ErrorResponse.internal('Error updating post');
        }
    }

    /**
     * Delete post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @param {string} userRole - User role
     * @returns {Object} Success message
     */
    static async deletePost(postId, userId, userRole) {
        try {
            const post = await postRepository.findById(postId, { lean: false });

            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            // Check authorization
            const isAuthor = post.author && post.author.toString() === userId;
            const isAdmin = userRole === 'Administrador' || userRole === 'SuperAdmin';

            if (!isAuthor && !isAdmin) {
                throw ErrorResponse.forbidden(
                    'You are not authorized to delete this post',
                    'UNAUTHORIZED'
                );
            }

            // Soft delete
            await postRepository.delete(postId);

            logger.info('Post deleted successfully', {
                postId,
                userId,
            });

            return {
                message: 'Post deleted successfully',
            };
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error deleting post', { error: error.message, postId });
            throw ErrorResponse.internal('Error deleting post');
        }
    }

    /**
     * Like/unlike a post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Object} Updated post with like count
     */
    static async toggleLike(postId, userId) {
        try {
            const post = await postRepository.findById(postId, { lean: false });

            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            // Check if user already liked
            const hasLiked = post.likes && post.likes.some(id => id.toString() === userId);

            let updatedPost;
            if (hasLiked) {
                // Remove like
                updatedPost = await postRepository.removeLike(postId, userId);
            } else {
                // Add like (and remove dislike if exists)
                updatedPost = await postRepository.addLike(postId, userId);
            }

            logger.info('Post like toggled', {
                postId,
                userId,
                liked: !hasLiked,
            });

            return {
                post: updatedPost,
                liked: !hasLiked,
                likeCount: updatedPost.likes ? updatedPost.likes.length : 0,
            };
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error toggling post like', { error: error.message, postId });
            throw ErrorResponse.internal('Error toggling post like');
        }
    }

    /**
     * Dislike/un-dislike a post
     * @param {string} postId - Post ID
     * @param {string} userId - User ID
     * @returns {Object} Updated post with dislike count
     */
    static async toggleDislike(postId, userId) {
        try {
            const post = await postRepository.findById(postId, { lean: false });

            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            // Check if user already disliked
            const hasDisliked = post.dislikes && post.dislikes.some(id => id.toString() === userId);

            let updatedPost;
            if (hasDisliked) {
                // Remove dislike
                updatedPost = await postRepository.removeDislike(postId, userId);
            } else {
                // Add dislike (and remove like if exists)
                updatedPost = await postRepository.addDislike(postId, userId);
            }

            logger.info('Post dislike toggled', {
                postId,
                userId,
                disliked: !hasDisliked,
            });

            return {
                post: updatedPost,
                disliked: !hasDisliked,
                dislikeCount: updatedPost.dislikes ? updatedPost.dislikes.length : 0,
            };
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error toggling post dislike', { error: error.message, postId });
            throw ErrorResponse.internal('Error toggling post dislike');
        }
    }

    /**
     * Get posts by author
     * @param {string} authorId - Author ID
     * @param {Object} options - Query options
     * @returns {Object} Posts and pagination info
     */
    static async getPostsByAuthor(authorId, options = {}) {
        const {
            page = 1,
            limit = 20,
            sort = '-createdAt',
        } = options;

        try {
            // Parse sort string to object
            const sortObj = {};
            if (sort.startsWith('-')) {
                sortObj[sort.substring(1)] = -1;
            } else {
                sortObj[sort] = 1;
            }

            const posts = await postRepository.findByAuthor(authorId, {
                page: parseInt(page),
                limit: parseInt(limit),
                sort: sortObj,
                populate: 'author',
                lean: true
            });

            const total = await postRepository.count({ author: authorId });

            return {
                posts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error fetching posts by author', { error: error.message, authorId });
            throw ErrorResponse.internal('Error fetching posts by author');
        }
    }

    /**
     * Search posts by text
     * @param {string} query - Search query
     * @param {Object} options - Query options
     * @returns {Object} Posts and pagination info
     */
    static async searchPosts(query, options = {}) {
        const {
            page = 1,
            limit = 20,
            category = null,
        } = options;

        try {
            const posts = await postRepository.search(query, {
                page: parseInt(page),
                limit: parseInt(limit),
                category,
                populate: 'author',
                lean: true
            });

            // Count is approximate for text search
            const total = posts.length;

            return {
                posts,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            logger.error('Error searching posts', { error: error.message, query });
            throw ErrorResponse.internal('Error searching posts');
        }
    }

    /**
     * Get trending posts
     * @param {Object} options - Query options
     * @returns {Object} Trending posts
     */
    static async getTrendingPosts(options = {}) {
        const {
            limit = 10,
            category = null,
            timeframe = 7
        } = options;

        try {
            const posts = await postRepository.findTrending({
                limit: parseInt(limit),
                category,
                timeframe: parseInt(timeframe)
            });

            return {
                posts,
                timeframe: `${timeframe} days`
            };
        } catch (error) {
            logger.error('Error fetching trending posts', { error: error.message });
            throw ErrorResponse.internal('Error fetching trending posts');
        }
    }

    /**
     * Pin/unpin a post
     * @param {string} postId - Post ID
     * @param {string} adminId - Admin ID
     * @param {boolean} pin - Whether to pin or unpin
     * @returns {Object} Updated post
     */
    static async togglePin(postId, adminId, pin = true) {
        try {
            const post = await postRepository.findById(postId, { lean: false });

            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            let updatedPost;
            if (pin) {
                updatedPost = await postRepository.pin(postId, adminId);
            } else {
                updatedPost = await postRepository.unpin(postId);
            }

            logger.info('Post pin toggled', {
                postId,
                adminId,
                pinned: pin,
            });

            return updatedPost;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error toggling post pin', { error: error.message, postId });
            throw ErrorResponse.internal('Error toggling post pin');
        }
    }
}

module.exports = PostService;

