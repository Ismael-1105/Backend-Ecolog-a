const Post = require('../models/Post');
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
        const { title, content, category } = postData;

        // Validate required fields
        if (!title || !content) {
            throw ErrorResponse.badRequest('Title and content are required', 'MISSING_FIELDS');
        }

        if (!category) {
            throw ErrorResponse.badRequest('Category is required', 'MISSING_CATEGORY');
        }

        try {
            const newPostData = {
                title,
                content,
                category,
            };

            // Add author if user is authenticated
            if (userId) {
                newPostData.author = userId;
            }

            const post = await Post.create(newPostData);

            // Populate author if it exists
            if (post.author) {
                await post.populate('author', 'name profilePicture');
            }

            logger.info('Post created successfully', {
                postId: post._id,
                userId,
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
            const skip = (page - 1) * limit;
            const query = {};

            // Filter by category if provided
            if (category) {
                query.category = category;
            }

            const posts = await Post.find(query)
                .populate('author', 'name profilePicture')
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await Post.countDocuments(query);

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
     * @returns {Object} Post
     */
    static async getPostById(postId) {
        try {
            const post = await Post.findById(postId)
                .populate('author', 'name profilePicture');

            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
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
            const post = await Post.findById(postId);

            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            // Check authorization
            const isAuthor = post.author && post.author.toString() === userId;
            const isAdmin = userRole === 'admin' || userRole === 'superadmin';

            if (!isAuthor && !isAdmin) {
                throw ErrorResponse.forbidden(
                    'You are not authorized to update this post',
                    'UNAUTHORIZED'
                );
            }

            // Update allowed fields
            const { title, content, category } = updateData;
            if (title) post.title = title;
            if (content) post.content = content;
            if (category) post.category = category;

            await post.save();
            await post.populate('author', 'name profilePicture');

            logger.info('Post updated successfully', {
                postId,
                userId,
            });

            return post;
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
            const post = await Post.findById(postId);

            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            // Check authorization
            const isAuthor = post.author && post.author.toString() === userId;
            const isAdmin = userRole === 'admin' || userRole === 'superadmin';

            if (!isAuthor && !isAdmin) {
                throw ErrorResponse.forbidden(
                    'You are not authorized to delete this post',
                    'UNAUTHORIZED'
                );
            }

            await post.deleteOne();

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
            const post = await Post.findById(postId);

            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            // Initialize likes array if it doesn't exist
            if (!post.likes) {
                post.likes = [];
            }

            const likeIndex = post.likes.indexOf(userId);

            if (likeIndex > -1) {
                // Unlike
                post.likes.splice(likeIndex, 1);
            } else {
                // Like
                post.likes.push(userId);
            }

            await post.save();

            logger.info('Post like toggled', {
                postId,
                userId,
                liked: likeIndex === -1,
            });

            return {
                post,
                liked: likeIndex === -1,
                likeCount: post.likes.length,
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
            const skip = (page - 1) * limit;

            const posts = await Post.find({ author: authorId })
                .populate('author', 'name profilePicture')
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await Post.countDocuments({ author: authorId });

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
}

module.exports = PostService;
