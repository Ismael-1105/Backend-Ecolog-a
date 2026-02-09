const mongoose = require('mongoose');

/**
 * RefreshToken Model
 * Stores refresh tokens for JWT authentication
 */
const RefreshTokenSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    token: {
        type: String,
        required: true,
        unique: true,
    },
    expiresAt: {
        type: Date,
        required: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    isRevoked: {
        type: Boolean,
        default: false,
    },
    // Device information for security tracking
    deviceInfo: {
        userAgent: String,
        ip: String,
    },
    // Track when token was last used
    lastUsedAt: {
        type: Date,
        default: Date.now,
    },
});

// Index for faster queries
RefreshTokenSchema.index({ user: 1 });
// Note: token already has unique index from schema definition
// Note: expiresAt index is created below with TTL

// Automatically delete expired tokens (TTL index)
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
