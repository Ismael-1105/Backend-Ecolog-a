const commentRepository = require('../repositories/commentRepository');
const videoRepository = require('../repositories/videoRepository');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Comment Service
 * Handles business logic for video comments
 */

/**
 * Create a comment
 * @param {string} videoId - Video ID
 * @param {string} userId - User ID
 * @param {string} comentario - Comment text
 * @returns {Promise<Object>} Created comment
 */
const createComment = async (videoId, userId, comentario) => {
    // Verify video exists
    const video = await videoRepository.findById(videoId);

    if (!video) {
        throw ErrorResponse.notFound('Video not found');
    }

    const comment = await commentRepository.create({
        video_id: videoId,
        autor_id: userId,
        comentario,
    });

    logger.info('Comment created', {
        commentId: comment._id,
        videoId,
        userId,
    });

    return comment;
};

/**
 * Get comments for a video
 * @param {string} videoId - Video ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated comments
 */
const getVideoComments = async (videoId, query) => {
    const { page, limit, skip } = parsePaginationParams(query, 20, 100);

    const comments = await commentRepository.findByVideoId(videoId, { skip, limit });
    const totalCount = await commentRepository.countByVideoId(videoId);

    return createPaginatedResponse(comments, page, limit, totalCount);
};

/**
 * Update a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @param {string} userRole - User role
 * @param {string} comentario - Updated comment text
 * @returns {Promise<Object>} Updated comment
 */
const updateComment = async (commentId, userId, userRole, comentario) => {
    const comment = await commentRepository.findById(commentId);

    if (!comment) {
        throw ErrorResponse.notFound('Comment not found');
    }

    // Check ownership or admin rights
    if (comment.autor_id.toString() !== userId && userRole !== 'Administrador' && userRole !== 'SuperAdmin') {
        throw ErrorResponse.forbidden('You can only update your own comments');
    }

    const updatedComment = await commentRepository.update(commentId, { comentario });

    logger.info('Comment updated', {
        commentId,
        updatedBy: userId,
    });

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
    if (comment.autor_id.toString() !== userId && userRole !== 'Administrador' && userRole !== 'SuperAdmin') {
        throw ErrorResponse.forbidden('You can only delete your own comments');
    }

    await commentRepository.deleteById(commentId);

    logger.info('Comment deleted', {
        commentId,
        deletedBy: userId,
    });
};

module.exports = {
    createComment,
    getVideoComments,
    updateComment,
    deleteComment,
};
