const mongoose = require('mongoose');

const BadgeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Badge name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Badge name cannot exceed 50 characters'],
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        required: [true, 'Badge description is required'],
        maxlength: [200, 'Description cannot exceed 200 characters'],
    },
    icon: {
        type: String, // Emoji or icon identifier
        default: '🏆',
    },
    color: {
        type: String, // Hex color code
        default: '#FFD700',
    },
    // Badge criteria
    criteria: {
        type: {
            type: String,
            enum: ['manual', 'auto'],
            default: 'auto',
        },
        // For auto badges
        condition: {
            type: String,
            enum: [
                'videos_uploaded',
                'comments_made',
                'likes_received',
                'days_active',
                'followers_count',
                'videos_approved',
            ],
        },
        threshold: {
            type: Number, // e.g., 10 videos, 50 comments
        },
    },
    // Badge rarity
    rarity: {
        type: String,
        enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
        default: 'common',
    },
    // Visibility
    isActive: {
        type: Boolean,
        default: true,
    },
    // Display order
    order: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Indexes
// Note: slug already has unique index from schema definition
BadgeSchema.index({ isActive: 1, order: 1 });
BadgeSchema.index({ 'criteria.type': 1, 'criteria.condition': 1 });

// Pre-save hook to generate slug
BadgeSchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

module.exports = mongoose.model('Badge', BadgeSchema);
