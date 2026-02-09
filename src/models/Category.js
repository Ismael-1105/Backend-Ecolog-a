const mongoose = require('mongoose');

const CategorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
        maxlength: [50, 'Category name cannot exceed 50 characters'],
    },
    slug: {
        type: String,
        required: true,
        unique: true,
        lowercase: true,
        trim: true,
    },
    description: {
        type: String,
        maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    icon: {
        type: String, // Icon name or emoji
        default: '📚',
    },
    color: {
        type: String, // Hex color code
        default: '#4CAF50',
    },
    // Category hierarchy
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null,
    },
    // Statistics
    videoCount: {
        type: Number,
        default: 0,
    },
    // Visibility
    isActive: {
        type: Boolean,
        default: true,
    },
    // Ordering
    order: {
        type: Number,
        default: 0,
    },
}, {
    timestamps: true,
});

// Indexes
// Note: slug already has unique index from schema definition
CategorySchema.index({ isActive: 1, order: 1 });
CategorySchema.index({ parentCategory: 1 });

// Pre-save hook to generate slug
CategorySchema.pre('save', function (next) {
    if (this.isModified('name') && !this.slug) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
    next();
});

module.exports = mongoose.model('Category', CategorySchema);
