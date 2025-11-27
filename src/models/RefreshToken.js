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
RefreshTokenSchema.index({ token: 1 });
RefreshTokenSchema.index({ expiresAt: 1 });

// Automatically delete expired tokens
RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
