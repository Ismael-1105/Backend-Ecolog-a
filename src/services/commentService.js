const commentRepository = require('../repositories/commentRepository');
const userRepository = require('../repositories/userRepository');
const videoRepository = require('../repositories/videoRepository');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Comment Service
 * Handles business logic for comment operations
 */

/**
 * Get comments for a video
 * @param {string} videoId - Video ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated comments
 */
const getVideoComments = async (videoId, query) => {
    const { page, limit, skip } = parsePaginationParams(query, 20, 100);

    // Verify video exists
    const video = await videoRepository.findById(videoId);
    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    // Get top-level comments only
    const comments = await commentRepository.findByVideoId(videoId, {
        skip,
        limit,
        populate: true,
    });

    const totalCount = await commentRepository.count({ videoId, parentComment: null });

    return createPaginatedResponse(comments, page, limit, totalCount);
};

/**
 * Get replies to a comment
 * @param {string} commentId - Comment ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated replies
 */
const getCommentReplies = async (commentId, query) => {
    const { page, limit, skip } = parsePaginationParams(query, 20, 100);

    // Verify parent comment exists
    const parentComment = await commentRepository.findById(commentId);
    if (!parentComment) {
        throw ErrorResponse.notFound('Comment not found');
    }

    const replies = await commentRepository.findReplies(commentId, {
        skip,
        limit,
        populate: true,
    });

    const totalCount = await commentRepository.count({ parentComment: commentId });

    return createPaginatedResponse(replies, page, limit, totalCount);
};

/**
 * Get comment thread (with nested replies)
 * @param {string} commentId - Comment ID
 * @param {number} maxDepth - Maximum nesting depth
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
 * @param {Object} commentData - Comment data
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Created comment
 */
const createComment = async (videoId, commentData, userId) => {
    // Verify video exists
    const video = await videoRepository.findById(videoId);
    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    // If replying to a comment, verify it exists
    if (commentData.parentComment) {
        const parentComment = await commentRepository.findById(commentData.parentComment);
        if (!parentComment) {
            throw ErrorResponse.notFound('Parent comment not found');
        }

        // Verify parent comment belongs to the same video
        if (parentComment.videoId.toString() !== videoId) {
            throw ErrorResponse.badRequest('Parent comment does not belong to this video');
        }
    }

    const comment = await commentRepository.create({
        videoId,
        authorId: userId,
        content: commentData.content,
        parentComment: commentData.parentComment || null,
    });

    // Update user stats
    await userRepository.update(userId, {
        $inc: { 'stats.commentsPosted': 1, points: 1 },
    });

    logger.info('Comment created', {
        commentId: comment._id,
        videoId,
        userId,
        isReply: !!commentData.parentComment,
    });

    return comment;
};

/**
 * Update a comment
 * @param {string} commentId - Comment ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<Object>} Updated comment
 */
const updateComment = async (commentId, updateData, userId, userRole) => {
    const comment = await commentRepository.findById(commentId);

    if (!comment) {
        throw ErrorResponse.notFound('Comment not found');
    }

    // Check ownership or admin rights
    if (
        comment.authorId.toString() !== userId &&
        userRole !== 'Administrador' &&
        userRole !== 'SuperAdmin'
    ) {
        throw ErrorResponse.forbidden('You can only update your own comments');
    }

    // Only allow updating content
    const allowedUpdates = { content: updateData.content };

    const updatedComment = await commentRepository.update(commentId, allowedUpdates);

    logger.info('Comment updated', { commentId, userId });

    return updatedComment;
};

/**
 * Delete a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @returns {Promise<void>}
 */
const deleteComment = async (commentId, userId, userRole) => {
    const comment = await commentRepository.findById(commentId);

    if (!comment) {
        throw ErrorResponse.notFound('Comment not found');
    }

    // Check ownership or admin rights
    if (
        comment.authorId.toString() !== userId &&
        userRole !== 'Administrador' &&
        userRole !== 'SuperAdmin'
    ) {
        throw ErrorResponse.forbidden('You can only delete your own comments');
    }

    await commentRepository.softDelete(commentId);

    // Update user stats
    await userRepository.update(comment.authorId, {
        $inc: { 'stats.commentsPosted': -1, points: -1 },
    });

    logger.info('Comment deleted', { commentId, userId });
};

/**
 * Like/unlike a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated comment
 */
const toggleLike = async (commentId, userId) => {
    const comment = await commentRepository.findById(commentId);

    if (!comment) {
        throw ErrorResponse.notFound('Comment not found');
    }

    const updatedComment = await commentRepository.like(commentId, userId);

    const hasLiked = updatedComment.likes.includes(userId);

    logger.info('Comment like toggled', {
        commentId,
        userId,
        action: hasLiked ? 'liked' : 'unliked',
    });

    return updatedComment;
};

module.exports = {
    getVideoComments,
    getCommentReplies,
    getCommentThread,
    createComment,
    updateComment,
    deleteComment,
    toggleLike,
};
