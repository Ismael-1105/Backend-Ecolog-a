const VideoComment = require('../models/VideoComment');

/**
 * Comment Repository
 * Handles database operations for VideoComment model
 */

/**
 * Find comment by ID
 * @param {string} commentId - Comment ID
 * @param {Object} options - Query options
 * @returns {Promise<Object>} Comment document
 */
const findById = async (commentId, options = {}) => {
    let query = VideoComment.findById(commentId);

    if (options.populate) {
        query = query
            .populate('authorId', 'name profilePicture isVerified')
            .populate('videoId', 'title');
    }

    if (options.includeDeleted) {
        query = query.setOptions({ includeDeleted: true });
    }

    return await query;
};

/**
 * Find all comments with filters and pagination
 * @param {Object} filters - Query filters
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of comments
 */
const findAll = async (filters = {}, pagination = {}) => {
    const { skip = 0, limit = 20, sort = { createdAt: -1 }, populate = true } = pagination;

    let query = VideoComment.find(filters);

    if (populate) {
        query = query.populate('authorId', 'name profilePicture isVerified badges');
    }

    if (pagination.includeDeleted) {
        query = query.setOptions({ includeDeleted: true });
    }

    return await query
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

/**
 * Find comments by video ID
 * @param {string} videoId - Video ID
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of comments
 */
const findByVideoId = async (videoId, pagination = {}) => {
    const { skip = 0, limit = 20, sort = { createdAt: -1 }, populate = true } = pagination;

    let query = VideoComment.find({ videoId, parentComment: null });

    if (populate) {
        query = query
            .populate('authorId', 'name profilePicture isVerified badges')
            .populate({
                path: 'replies',
                populate: {
                    path: 'authorId',
                    select: 'name profilePicture isVerified'
                }
            })
            .populate({
                path: 'replies',
                populate: {
                    path: 'replies',
                    populate: {
                        path: 'authorId',
                        select: 'name profilePicture isVerified'
                    }
                }
            })
            .populate({
                path: 'replies',
                populate: {
                    path: 'replies',
                    populate: {
                        path: 'replies',
                        populate: {
                            path: 'authorId',
                            select: 'name profilePicture isVerified'
                        }
                    }
                }
            })
            .populate({
                path: 'replies',
                populate: {
                    path: 'replies',
                    populate: {
                        path: 'replies',
                        populate: {
                            path: 'replies',
                            populate: {
                                path: 'authorId',
                                select: 'name profilePicture isVerified'
                            }
                        }
                    }
                }
            });
    }

    return await query
        .sort(sort)
        .skip(skip)
        .limit(limit);
};

/**
 * Find replies to a comment
 * @param {string} parentCommentId - Parent comment ID
 * @param {Object} pagination - Pagination options
 * @returns {Promise<Array>} Array of reply comments
 */
const findReplies = async (parentCommentId, pagination = {}) => {
    return await findAll({ parentComment: parentCommentId }, pagination);
};

/**
 * Find comment thread (comment + all nested replies)
 * @param {string} commentId - Comment ID
 * @param {number} maxDepth - Maximum nesting depth
 * @returns {Promise<Object>} Comment with nested replies
 */
const findThread = async (commentId, maxDepth = 3) => {
    const comment = await findById(commentId, { populate: true });

    if (!comment || maxDepth <= 0) {
        return comment;
    }

    // Recursively get replies
    const replies = await findReplies(commentId, { populate: true });

    if (replies.length > 0 && maxDepth > 1) {
        VideoComment.replies = await Promise.all(
            replies.map(reply => findThread(reply._id.toString(), maxDepth - 1))
        );
    } else {
        VideoComment.replies = replies;
    }

    return comment;
};

/**
 * Count comments
 * @param {Object} filters - Query filters
 * @returns {Promise<number>} Count of comments
 */
const count = async (filters = {}) => {
    return await VideoComment.countDocuments(filters);
};

/**
 * Create new comment
 * @param {Object} commentData - Comment data
 * @returns {Promise<Object>} Created comment
 */
const create = async (commentData) => {
    const comment = await VideoComment.create(commentData);
    return await findById(comment._id, { populate: true });
};

/**
 * Update comment
 * @param {string} commentId - Comment ID
 * @param {Object} updateData - Data to update
 * @returns {Promise<Object>} Updated comment
 */
const update = async (commentId, updateData) => {
    return await VideoComment.findByIdAndUpdate(
        commentId,
        updateData,
        { new: true, runValidators: true }
    ).populate('authorId', 'name profilePicture isVerified');
};

/**
 * Like a comment
 * @param {string} commentId - Comment ID
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Updated comment
 */
const like = async (commentId, userId) => {
    // Remove from likes if already liked, add if not
    const comment = await VideoComment.findById(commentId);

    if (!comment) {
        return null;
    }

    const hasLiked = VideoComment.likes.includes(userId);

    if (hasLiked) {
        // Unlike
        return await VideoComment.findByIdAndUpdate(
            commentId,
            { $pull: { likes: userId } },
            { new: true }
        ).populate('authorId', 'name profilePicture isVerified');
    } else {
        // Like
        return await VideoComment.findByIdAndUpdate(
            commentId,
            { $addToSet: { likes: userId } },
            { new: true }
        ).populate('authorId', 'name profilePicture isVerified');
    }
};

/**
 * Soft delete comment
 * @param {string} commentId - Comment ID
 * @returns {Promise<Object>} Deleted comment
 */
const softDelete = async (commentId) => {
    return await VideoComment.findByIdAndUpdate(
        commentId,
        { isDeleted: true, deletedAt: new Date() },
        { new: true }
    );
};

/**
 * Hard delete comment (permanent)
 * @param {string} commentId - Comment ID
 * @returns {Promise<void>}
 */
const hardDelete = async (commentId) => {
    return await VideoComment.findByIdAndDelete(commentId);
};

/**
 * Delete all comments for a video
 * @param {string} videoId - Video ID
 * @returns {Promise<void>}
 */
const deleteByVideoId = async (videoId) => {
    return await VideoComment.updateMany(
        { videoId },
        { isDeleted: true, deletedAt: new Date() }
    );
};

module.exports = {
    findById,
    findAll,
    findByVideoId,
    findReplies,
    findThread,
    count,
    create,
    update,
    like,
    softDelete,
    hardDelete,
    deleteByVideoId,
};
