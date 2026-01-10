const Comment = require('../models/Comment');
const Post = require('../models/Post');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Comment Post Service
 * Business logic for forum post comment operations
 */

class CommentPostService {
    /**
     * Create a comment on a post
     * @param {string} postId - Post ID
     * @param {Object} commentData - Comment data
     * @param {string} userId - User ID
     * @returns {Object} Created comment
     */
    static async createComment(postId, commentData, userId) {
        const { content, parentComment = null } = commentData;

        if (!content) {
            throw ErrorResponse.badRequest('Comment content is required', 'MISSING_CONTENT');
        }

        try {
            // Verify post exists
            const post = await Post.findById(postId);
            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            // If this is a reply, verify parent comment exists
            if (parentComment) {
                const parent = await Comment.findById(parentComment);
                if (!parent) {
                    throw ErrorResponse.notFound('Parent comment not found', 'PARENT_NOT_FOUND');
                }
            }

            const comment = await Comment.create({
                content,
                post: postId,
                author: userId,
                parentComment,
            });

            await comment.populate('author', 'name profilePicture');

            logger.info('Comment created successfully', {
                commentId: comment._id,
                postId,
                userId,
            });

            return comment;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error creating comment', { error: error.message, postId });
            throw ErrorResponse.internal('Error creating comment');
        }
    }

    /**
     * Get comments for a post
     * @param {string} postId - Post ID
     * @param {Object} options - Query options
     * @returns {Object} Comments and pagination info
     */
    static async getCommentsByPost(postId, options = {}) {
        const {
            page = 1,
            limit = 20,
            sort = 'createdAt',
        } = options;

        try {
            // Verify post exists
            const post = await Post.findById(postId);
            if (!post) {
                throw ErrorResponse.notFound('Post not found', 'POST_NOT_FOUND');
            }

            const skip = (page - 1) * limit;

            const comments = await Comment.find({ post: postId })
                .populate('author', 'name profilePicture')
                .sort(sort)
                .skip(skip)
                .limit(limit);

            const total = await Comment.countDocuments({ post: postId });

            return {
                comments,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total,
                    pages: Math.ceil(total / limit),
                },
            };
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error fetching comments', { error: error.message, postId });
            throw ErrorResponse.internal('Error fetching comments');
        }
    }

    /**
     * Get comment by ID
     * @param {string} commentId - Comment ID
     * @returns {Object} Comment
     */
    static async getCommentById(commentId) {
        try {
            const comment = await Comment.findById(commentId)
                .populate('author', 'name profilePicture');

            if (!comment) {
                throw ErrorResponse.notFound('Comment not found', 'COMMENT_NOT_FOUND');
            }

            return comment;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error fetching comment', { error: error.message, commentId });
            throw ErrorResponse.internal('Error fetching comment');
        }
    }

    /**
     * Update comment
     * @param {string} commentId - Comment ID
     * @param {Object} updateData - Data to update
     * @param {string} userId - User ID
     * @param {string} userRole - User role
     * @returns {Object} Updated comment
     */
    static async updateComment(commentId, updateData, userId, userRole) {
        try {
            const comment = await Comment.findById(commentId);

            if (!comment) {
                throw ErrorResponse.notFound('Comment not found', 'COMMENT_NOT_FOUND');
            }

            // Check authorization
            const isAuthor = comment.author.toString() === userId;
            const isAdmin = userRole === 'admin' || userRole === 'superadmin';

            if (!isAuthor && !isAdmin) {
                throw ErrorResponse.forbidden(
                    'You are not authorized to update this comment',
                    'UNAUTHORIZED'
                );
            }

            // Update content
            if (updateData.content) {
                comment.content = updateData.content;
            }

            await comment.save();
            await comment.populate('author', 'name profilePicture');

            logger.info('Comment updated successfully', {
                commentId,
                userId,
            });

            return comment;
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error updating comment', { error: error.message, commentId });
            throw ErrorResponse.internal('Error updating comment');
        }
    }

    /**
     * Delete comment
     * @param {string} commentId - Comment ID
     * @param {string} userId - User ID
     * @param {string} userRole - User role
     * @returns {Object} Success message
     */
    static async deleteComment(commentId, userId, userRole) {
        try {
            const comment = await Comment.findById(commentId);

            if (!comment) {
                throw ErrorResponse.notFound('Comment not found', 'COMMENT_NOT_FOUND');
            }

            // Check authorization
            const isAuthor = comment.author.toString() === userId;
            const isAdmin = userRole === 'admin' || userRole === 'superadmin';

            if (!isAuthor && !isAdmin) {
                throw ErrorResponse.forbidden(
                    'You are not authorized to delete this comment',
                    'UNAUTHORIZED'
                );
            }

            await comment.deleteOne();

            logger.info('Comment deleted successfully', {
                commentId,
                userId,
            });

            return {
                message: 'Comment deleted successfully',
            };
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error deleting comment', { error: error.message, commentId });
            throw ErrorResponse.internal('Error deleting comment');
        }
    }

    /**
     * Like/unlike a comment
     * @param {string} commentId - Comment ID
     * @param {string} userId - User ID
     * @returns {Object} Updated comment with like count
     */
    static async toggleLike(commentId, userId) {
        try {
            const comment = await Comment.findById(commentId);

            if (!comment) {
                throw ErrorResponse.notFound('Comment not found', 'COMMENT_NOT_FOUND');
            }

            // Initialize likes array if it doesn't exist
            if (!comment.likes) {
                comment.likes = [];
            }

            const likeIndex = comment.likes.indexOf(userId);

            if (likeIndex > -1) {
                // Unlike
                comment.likes.splice(likeIndex, 1);
            } else {
                // Like
                comment.likes.push(userId);
            }

            await comment.save();

            logger.info('Comment like toggled', {
                commentId,
                userId,
                liked: likeIndex === -1,
            });

            return {
                comment,
                liked: likeIndex === -1,
                likeCount: comment.likes.length,
            };
        } catch (error) {
            if (error instanceof ErrorResponse) {
                throw error;
            }
            logger.error('Error toggling comment like', { error: error.message, commentId });
            throw ErrorResponse.internal('Error toggling comment like');
        }
    }
}

module.exports = CommentPostService;
