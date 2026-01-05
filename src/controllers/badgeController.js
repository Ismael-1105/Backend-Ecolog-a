const badgeService = require('../services/badgeService');
const asyncHandler = require('../middlewares/asyncHandler');

/**
 * @desc    Get all badges
 * @route   GET /api/badges
 * @access  Public
 */
const getAllBadges = asyncHandler(async (req, res) => {
    const badges = await badgeService.getAllBadges();

    res.json({
        success: true,
        data: badges,
    });
});

/**
 * @desc    Get badge by ID
 * @route   GET /api/badges/:id
 * @access  Public
 */
const getBadgeById = asyncHandler(async (req, res) => {
    const badge = await badgeService.getBadgeById(req.params.id);

    res.json({
        success: true,
        data: badge,
    });
});

/**
 * @desc    Get user's badges
 * @route   GET /api/users/:userId/badges
 * @access  Public
 */
const getUserBadges = asyncHandler(async (req, res) => {
    const badges = await badgeService.getUserBadges(req.params.userId);

    res.json({
        success: true,
        data: badges,
    });
});

/**
 * @desc    Award badge to user (manual)
 * @route   POST /api/users/:userId/badges/:badgeId
 * @access  Private/Admin
 */
const awardBadge = asyncHandler(async (req, res) => {
    const user = await badgeService.awardBadge(
        req.params.userId,
        req.params.badgeId,
        req.user.id
    );

    res.json({
        success: true,
        message: 'Badge awarded successfully',
        data: user,
    });
});

/**
 * @desc    Create a badge
 * @route   POST /api/badges
 * @access  Private/Admin
 */
const createBadge = asyncHandler(async (req, res) => {
    const badge = await badgeService.createBadge(req.body, req.user.id);

    res.status(201).json({
        success: true,
        data: badge,
    });
});

/**
 * @desc    Update a badge
 * @route   PUT /api/badges/:id
 * @access  Private/Admin
 */
const updateBadge = asyncHandler(async (req, res) => {
    const badge = await badgeService.updateBadge(req.params.id, req.body, req.user.id);

    res.json({
        success: true,
        data: badge,
    });
});

/**
 * @desc    Delete a badge
 * @route   DELETE /api/badges/:id
 * @access  Private/Admin
 */
const deleteBadge = asyncHandler(async (req, res) => {
    await badgeService.deleteBadge(req.params.id, req.user.id);

    res.json({
        success: true,
        message: 'Badge deleted successfully',
    });
});

module.exports = {
    getAllBadges,
    getBadgeById,
    getUserBadges,
    awardBadge,
    createBadge,
    updateBadge,
    deleteBadge,
};
