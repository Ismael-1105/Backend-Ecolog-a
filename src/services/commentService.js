const commentRepository = require('../repositories/commentRepository');
const videoRepository = require('../repositories/video.repository');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Comment Service
 * Handles business logic for comment operations
 */

/**
 * Get comments for a video with pagination
 * @param {string} videoId - Video ID
 * @param {Object} query - Query parameters (page, limit, etc)
 * @returns {Promise<Object>} Paginated comments
 */
const getVideoComments = async (videoId, query = {}) => {
    // Verify video exists
    const video = await videoRepository.findById(videoId);
    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    const { page, limit, skip } = parsePaginationParams(query);

    // Get top-level comments only
    const comments = await commentRepository.findByVideoId(videoId, {
        skip,
        limit,
        sort: { createdAt: -1 },
        populate: true,
    });

    const totalCount = await commentRepository.count({
        videoId,
        parentComment: null,
    });

    return createPaginatedResponse(comments, page, limit, totalCount);
};

/**
 * Get replies to a comment with pagination
 * @param {string} commentId - Parent comment ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated replies
 */
const getCommentReplies = async (commentId, query = {}) => {
    // Verify parent comment exists
    const parentComment = await commentRepository.findById(commentId);
    if (!parentComment) {
        throw ErrorResponse.notFound('Comment not found');
    }

    const { page, limit, skip } = parsePaginationParams(query);

    const replies = await commentRepository.findReplies(commentId, {
        skip,
        limit,
        sort: { createdAt: 1 },
        populate: true,
    });

    const totalCount = await commentRepository.count({
        parentComment: commentId,
    });

    return createPaginatedResponse(replies, page, limit, totalCount);
};

/**
 * Get complete comment thread (with nested replies)
 * @param {string} commentId - Comment ID
 * @param {number} maxDepth - Maximum nesting depth (default 3)
 * @returns {Promise<Object>} Comment with nested replies
 */
const getCommentThread = async (commentId, maxDepth = 3) => {
    const comment = await commentRepository.findThread(commentId, maxDepth);

    if (!comment) {
        throw ErrorResponse.notFound('Comment not found');
    }

    return comment;
};

/**
 * Create a new comment
 * @param {string} videoId - Video ID
 * @param {Object} commentData - Comment content and optional parentComment
 * @param {string} userId - Author user ID
 * @returns {Promise<Object>} Created comment
 */
const createComment = async (videoId, commentData, userId) => {
    // Validate video exists
    const video = await videoRepository.findById(videoId);
    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    // Validate content
    if (!commentData.content || typeof commentData.content !== 'string') {
        throw ErrorResponse.badRequest('Comment content is required');
    }

    if (commentData.content.trim().length === 0) {
        throw ErrorResponse.badRequest('Comment content cannot be empty');
    }

    if (commentData.content.length > 2000) {
        throw ErrorResponse.badRequest('Comment cannot exceed 2000 characters');
    }

    // If this is a reply, validate parent comment
    let parentCommentId = null;
    if (commentData.parentComment) {
        const parentComment = await commentRepository.findById(commentData.parentComment);
        if (!parentComment) {
            throw ErrorResponse.notFound('Parent comment not found');
        }
        parentCommentId = commentData.parentComment;
    }

    // Create comment
    const newComment = await commentRepository.create({
        videoId,
        authorId: userId,
        content: commentData.content,
        parentComment: parentCommentId || null,
    });

    logger.info('Comment created', {
        commentId: newComment._id,
        videoId,
        authorId: userId,
    });

    return newComment;
};

/**
 * Update a comment
 * @param {string} commentId - Comment ID
 * @param {Object} updateData - Updated comment data
 * @param {string} userId - User ID making the request
 * @param {string} userRole - User role
 * @returns {Promise<Object>} Updated comment
 */
const updateComment = async (commentId, updateData, userId, userRole) => {
    // Get comment
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
        throw ErrorResponse.notFound('Comment not found');
    }

    // Check authorization: only author or admin can update
    if (comment.authorId.toString() !== userId && userRole !== 'Administrador' && userRole !== 'SuperAdmin') {
        throw ErrorResponse.forbidden('You can only edit your own comments');
    }

    // Validate updated content
    if (updateData.content) {
        if (typeof updateData.content !== 'string' || updateData.content.trim().length === 0) {
            throw ErrorResponse.badRequest('Comment content cannot be empty');
        }

        if (updateData.content.length > 2000) {
            throw ErrorResponse.badRequest('Comment cannot exceed 2000 characters');
        }
    }

    // Only allow content to be updated (not parent, video, author)
    const fieldsToUpdate = {
        content: updateData.content || comment.content,
        updatedAt: new Date(),
    };

    const updatedComment = await commentRepository.update(commentId, fieldsToUpdate);

    logger.info('Comment updated', {
        commentId,
        updatedBy: userId,
    });

    return updatedComment;
};

/**
 * Delete a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID making the request
 * @param {string} userRole - User role
 * @returns {Promise<void>}
 */
const deleteComment = async (commentId, userId, userRole) => {
    const comment = await commentRepository.findById(commentId, { includeDeleted: true });
    if (!comment) {
        throw ErrorResponse.notFound('Comment not found');
    }

    // Check authorization: only author or admin can delete
    if (comment.authorId.toString() !== userId && userRole !== 'Administrador' && userRole !== 'SuperAdmin') {
        throw ErrorResponse.forbidden('You can only delete your own comments');
    }

    // Soft delete
    await commentRepository.softDelete(commentId);

    logger.info('Comment deleted', {
        commentId,
        deletedBy: userId,
    });
};

/**
 * Like/unlike a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated comment with like status
 */
const toggleLike = async (commentId, userId) => {
    const comment = await commentRepository.findById(commentId);
    if (!comment) {
        throw ErrorResponse.notFound('Comment not found');
    }

    const updatedComment = await commentRepository.like(commentId, userId);

    const liked = updatedComment.likes.some(id => id.toString() === userId);

    logger.info(`Comment ${liked ? 'liked' : 'unliked'}`, {
        commentId,
        userId,
    });

    return {
        ...updatedComment.toObject(),
        liked,
    };
};

/**
 * Delete all comments for a video (bulk operation)
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
const deleteVideoComments = async (videoId) => {
    await commentRepository.deleteByVideoId(videoId);

    logger.info('All comments deleted for video', { videoId });
};

module.exports = {
    getVideoComments,
    getCommentReplies,
    getCommentThread,
    createComment,
    updateComment,
    deleteComment,
    toggleLike,
    deleteVideoComments,
};
