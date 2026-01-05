const userRepository = require('../repositories/userRepository');
const { parsePaginationParams, createPaginatedResponse } = require('../utils/pagination');
const ErrorResponse = require('../utils/ErrorResponse');
const logger = require('../config/logger');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs').promises;

/**
 * User Service
 * Handles business logic for user operations
 */

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @param {string} requesterId - ID of user making the request
 * @param {string} requesterRole - Role of user making the request
 * @returns {Promise<Object>} User data
 */
const getUserById = async (userId, requesterId, requesterRole) => {
    const user = await userRepository.findById(userId);

    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    // Only allow users to see their own data unless admin
    if (userId !== requesterId && requesterRole !== 'Administrador' && requesterRole !== 'SuperAdmin') {
        throw ErrorResponse.forbidden('Access denied');
    }

    return user;
};

/**
 * Get all users with pagination
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated users
 */
const getAllUsers = async (query) => {
    const { page, limit, skip } = parsePaginationParams(query);

    const filters = {};
    if (query.role) {
        filters.role = query.role;
    }

    const users = await userRepository.findAll(filters, { skip, limit });
    const totalCount = await userRepository.count(filters);

    return createPaginatedResponse(users, page, limit, totalCount);
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updateData - Data to update
 * @param {string} requesterId - ID of user making the request
 * @param {string} requesterRole - Role of user making the request
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (userId, updateData, requesterId, requesterRole) => {
    // Only allow users to update their own data unless admin
    if (userId !== requesterId && requesterRole !== 'Administrador' && requesterRole !== 'SuperAdmin') {
        throw ErrorResponse.forbidden('Access denied');
    }

    // Fields that users can update themselves
    const allowedFields = ['name', 'institution', 'bio', 'location', 'website'];

    // Fields that only the user themselves can update
    const selfOnlyFields = ['email'];

    // Fields that only admins can update
    const adminOnlyFields = ['role', 'isVerified'];

    // Filter update data based on permissions
    const filteredData = {};

    Object.keys(updateData).forEach((key) => {
        if (allowedFields.includes(key)) {
            filteredData[key] = updateData[key];
        } else if (selfOnlyFields.includes(key) && userId === requesterId) {
            filteredData[key] = updateData[key];
        } else if (adminOnlyFields.includes(key) && (requesterRole === 'Administrador' || requesterRole === 'SuperAdmin')) {
            // Only SuperAdmin can set SuperAdmin role
            if (key === 'role' && updateData[key] === 'SuperAdmin' && requesterRole !== 'SuperAdmin') {
                throw ErrorResponse.forbidden('Only SuperAdmin can assign SuperAdmin role');
            }
            filteredData[key] = updateData[key];
        }
    });

    // Don't allow updating password through this method
    delete filteredData.password;

    // If email is being changed, check if it's already in use
    if (filteredData.email) {
        const existingUser = await userRepository.findByEmail(filteredData.email);
        if (existingUser && existingUser._id.toString() !== userId) {
            throw ErrorResponse.conflict('Email already in use', 'EMAIL_EXISTS');
        }
    }

    const user = await userRepository.update(userId, filteredData);

    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    logger.info('User updated', {
        userId,
        updatedBy: requesterId,
        updatedFields: Object.keys(filteredData),
    });

    return user;
};

/**
 * Update profile picture
 * @param {string} userId - User ID
 * @param {Object} file - Uploaded file
 * @returns {Promise<Object>} Updated user
 */
const updateProfilePicture = async (userId, file) => {
    const user = await userRepository.findById(userId);

    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    // Delete old profile picture if exists
    if (user.profilePicture) {
        try {
            await fs.unlink(user.profilePicture);
            logger.info('Old profile picture deleted', { path: user.profilePicture });
        } catch (error) {
            logger.warn('Failed to delete old profile picture', {
                error: error.message,
                path: user.profilePicture,
            });
        }
    }

    // Update with new profile picture path
    const profilePicturePath = file.path.replace(/\\/g, '/');
    const updatedUser = await userRepository.update(userId, {
        profilePicture: profilePicturePath,
    });

    logger.info('Profile picture updated', {
        userId,
        newPath: profilePicturePath,
    });

    return updatedUser;
};

/**
 * Follow a user
 * @param {string} userId - User ID who is following
 * @param {string} targetUserId - User ID to follow
 * @returns {Promise<Object>} Updated user
 */
const followUser = async (userId, targetUserId) => {
    // Can't follow yourself
    if (userId === targetUserId) {
        throw ErrorResponse.badRequest('Cannot follow yourself');
    }

    // Verify target user exists
    const targetUser = await userRepository.findById(targetUserId);
    if (!targetUser) {
        throw ErrorResponse.notFound('User not found');
    }

    const user = await userRepository.findById(userId);

    // Check if already following
    if (user.following.includes(targetUserId)) {
        throw ErrorResponse.badRequest('Already following this user');
    }

    // Add to following list
    await userRepository.update(userId, {
        $addToSet: { following: targetUserId },
    });

    // Add to target's followers list
    await userRepository.update(targetUserId, {
        $addToSet: { followers: userId },
    });

    logger.info('User followed', { userId, targetUserId });

    return await userRepository.findById(userId);
};

/**
 * Unfollow a user
 * @param {string} userId - User ID who is unfollowing
 * @param {string} targetUserId - User ID to unfollow
 * @returns {Promise<Object>} Updated user
 */
const unfollowUser = async (userId, targetUserId) => {
    // Can't unfollow yourself
    if (userId === targetUserId) {
        throw ErrorResponse.badRequest('Cannot unfollow yourself');
    }

    const user = await userRepository.findById(userId);

    // Check if actually following
    if (!user.following.includes(targetUserId)) {
        throw ErrorResponse.badRequest('Not following this user');
    }

    // Remove from following list
    await userRepository.update(userId, {
        $pull: { following: targetUserId },
    });

    // Remove from target's followers list
    await userRepository.update(targetUserId, {
        $pull: { followers: userId },
    });

    logger.info('User unfollowed', { userId, targetUserId });

    return await userRepository.findById(userId);
};

/**
 * Get user's followers
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated followers
 */
const getFollowers = async (userId, query) => {
    const { page, limit, skip } = parsePaginationParams(query, 20, 100);

    const user = await userRepository.findById(userId, { populate: true });
    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    // Get populated followers
    const followers = await userRepository.findByIds(user.followers, { skip, limit });
    const totalCount = user.followers.length;

    return createPaginatedResponse(followers, page, limit, totalCount);
};

/**
 * Get user's following
 * @param {string} userId - User ID
 * @param {Object} query - Query parameters
 * @returns {Promise<Object>} Paginated following
 */
const getFollowing = async (userId, query) => {
    const { page, limit, skip } = parsePaginationParams(query, 20, 100);

    const user = await userRepository.findById(userId, { populate: true });
    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    // Get populated following
    const following = await userRepository.findByIds(user.following, { skip, limit });
    const totalCount = user.following.length;

    return createPaginatedResponse(following, page, limit, totalCount);
};

/**
 * Delete user (soft delete)
 * @param {string} userId - User ID
 * @param {string} requesterId - ID of user making the request
 * @param {string} requesterRole - Role of user making the request
 * @returns {Promise<void>}
 */
const deleteUser = async (userId, requesterId, requesterRole) => {
    // Only admins can delete users
    if (requesterRole !== 'Administrador' && requesterRole !== 'SuperAdmin') {
        throw ErrorResponse.forbidden('Only administrators can delete users');
    }

    // Prevent deleting yourself
    if (userId === requesterId) {
        throw ErrorResponse.badRequest('Cannot delete your own account through this endpoint');
    }

    const user = await userRepository.findById(userId);

    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    // Only SuperAdmin can delete other admins
    if ((user.role === 'Administrador' || user.role === 'SuperAdmin') && requesterRole !== 'SuperAdmin') {
        throw ErrorResponse.forbidden('Only SuperAdmin can delete administrators');
    }

    await userRepository.softDelete(userId);

    logger.info('User deleted', { userId, deletedBy: requesterId });
};

/**
 * Delete own account
 * @param {string} userId - User ID
 * @param {string} password - User password for confirmation
 * @returns {Promise<void>}
 */
const deleteOwnAccount = async (userId, password) => {
    const user = await userRepository.findById(userId, { includePassword: true });

    if (!user) {
        throw ErrorResponse.notFound('User not found');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
        throw ErrorResponse.unauthorized('Invalid password', 'INVALID_PASSWORD');
    }

    // Soft delete the account
    await userRepository.softDelete(userId);

    logger.info('User deleted own account', { userId });
};

module.exports = {
    getUserById,
    getAllUsers,
    updateUser,
    updateProfilePicture,
    followUser,
    unfollowUser,
    getFollowers,
    getFollowing,
    deleteUser,
    deleteOwnAccount,
};
