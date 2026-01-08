const badgeRepository = require('../repositories/badgeRepository');
const userRepository = require('../repositories/userRepository');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');

/**
 * Badge Service
 * Handles business logic for badge operations and auto-awarding
 */

/**
 * Get all badges
 * @returns {Promise<Array>} Array of badges
 */
const getAllBadges = async () => {
    return await badgeRepository.findAll();
};

/**
 * Get badge by ID
 * @param {string} badgeId - Badge ID
 * @returns {Promise<Object>} Badge data
 */
const getBadgeById = async (badgeId) => {
    const badge = await badgeRepository.findById(badgeId);

    if (!badge) {
        throw ErrorResponse.notFound('Badge not found');
    }

    return badge;
};

/**
 * Get user's badges
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of user's badges with details
 */
const getUserBadges = async (userId) => {
    const user = await userRepository.findById(userId, { populate: true });

    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    // Populate badge details
    const badgesWithDetails = await Promise.all(
        user.badges.map(async (userBadge) => {
            const badge = await badgeRepository.findById(userBadge.badgeId);
            return {
                ...badge.toObject(),
                earnedAt: userBadge.earnedAt,
            };
        })
    );

    return badgesWithDetails;
};

/**
 * Award badge to user
 * @param {string} userId - User ID
 * @param {string} badgeId - Badge ID
 * @param {string} awardedBy - Admin user ID (for manual badges)
 * @returns {Promise<Object>} Updated user
 */
const awardBadge = async (userId, badgeId, awardedBy = null) => {
    const user = await userRepository.findById(userId);
    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    const badge = await badgeRepository.findById(badgeId);
    if (!badge) {
        throw ErrorResponse.notFound('Badge not found');
    }

    // Check if user already has this badge
    const hasBadge = user.badges.some(
        (userBadge) => userBadge.badgeId.toString() === badgeId
    );

    if (hasBadge) {
        throw ErrorResponse.badRequest('User already has this badge');
    }

    // Award badge
    const updatedUser = await userRepository.update(userId, {
        $push: {
            badges: {
                badgeId,
                earnedAt: new Date(),
            },
        },
        $inc: { points: 10 }, // Award points for earning badge
    });

    logger.info('Badge awarded', {
        userId,
        badgeId,
        badgeName: badge.name,
        awardedBy: awardedBy || 'auto',
    });

    return updatedUser;
};

/**
 * Check and award auto badges to a user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of newly awarded badges
 */
const checkAndAwardAutoBadges = async (userId) => {
    const user = await userRepository.findById(userId);
    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    const autoBadges = await badgeRepository.findAutoBadges();
    const newlyAwardedBadges = [];

    for (const badge of autoBadges) {
        // Check if user already has this badge
        const hasBadge = user.badges.some(
            (userBadge) => userBadge.badgeId.toString() === badge._id.toString()
        );

        if (hasBadge) {
            continue;
        }

        // Check if user meets criteria
        const meetsCondition = checkBadgeCondition(user, badge.criteria);

        if (meetsCondition) {
            try {
                await awardBadge(userId, badge._id.toString());
                newlyAwardedBadges.push(badge);
            } catch (error) {
                logger.error('Error awarding auto badge', {
                    userId,
                    badgeId: badge._id,
                    error: error.message,
                });
            }
        }
    }

    return newlyAwardedBadges;
};

/**
 * Check if user meets badge condition
 * @param {Object} user - User object
 * @param {Object} criteria - Badge criteria
 * @returns {boolean} Whether user meets condition
 */
const checkBadgeCondition = (user, criteria) => {
    if (!criteria || !criteria.condition || !criteria.threshold) {
        return false;
    }

    switch (criteria.condition) {
        case 'videos_uploaded':
            return user.stats.videosUploaded >= criteria.threshold;

        case 'comments_made':
            return user.stats.commentsPosted >= criteria.threshold;

        case 'likes_received':
            return user.stats.likesReceived >= criteria.threshold;

        case 'followers_count':
            return user.followers.length >= criteria.threshold;

        case 'videos_approved':
            // This would need additional logic to count approved videos
            return user.stats.videosUploaded >= criteria.threshold;

        case 'days_active': {
            const daysActive = Math.floor(
                (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
            );
            return daysActive >= criteria.threshold;
        }

        default:
            return false;
    }
};

/**
 * Create a new badge
 * @param {Object} badgeData - Badge data
 * @param {string} userId - Admin user ID
 * @returns {Promise<Object>} Created badge
 */
const createBadge = async (badgeData, userId) => {
    const badge = await badgeRepository.create(badgeData);

    logger.info('Badge created', {
        badgeId: badge._id,
        name: badge.name,
        createdBy: userId,
    });

    return badge;
};

/**
 * Update a badge
 * @param {string} badgeId - Badge ID
 * @param {Object} updateData - Data to update
 * @param {string} userId - Admin user ID
 * @returns {Promise<Object>} Updated badge
 */
const updateBadge = async (badgeId, updateData, userId) => {
    const badge = await badgeRepository.findById(badgeId);

    if (!badge) {
        throw ErrorResponse.notFound('Badge not found');
    }

    const updatedBadge = await badgeRepository.update(badgeId, updateData);

    logger.info('Badge updated', { badgeId, updatedBy: userId });

    return updatedBadge;
};

/**
 * Delete a badge
 * @param {string} badgeId - Badge ID
 * @param {string} userId - Admin user ID
 * @returns {Promise<void>}
 */
const deleteBadge = async (badgeId, userId) => {
    const badge = await badgeRepository.findById(badgeId);

    if (!badge) {
        throw ErrorResponse.notFound('Badge not found');
    }

    await badgeRepository.softDelete(badgeId);

    logger.info('Badge deleted', { badgeId, deletedBy: userId });
};

module.exports = {
    getAllBadges,
    getBadgeById,
    getUserBadges,
    awardBadge,
    checkAndAwardAutoBadges,
    createBadge,
    updateBadge,
    deleteBadge,
};
