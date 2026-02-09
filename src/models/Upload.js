const mongoose = require('mongoose');

/**
 * Upload Schema
 * Tracks all files uploaded by users
 */
const uploadSchema = new mongoose.Schema(
    {
        filename: {
            type: String,
            required: [true, 'Filename is required'],
            unique: true,
            trim: true,
        },
        originalName: {
            type: String,
            required: [true, 'Original filename is required'],
            trim: true,
        },
        title: {
            type: String,
            required: [true, 'Title is required'],
            trim: true,
            maxlength: [200, 'Title cannot exceed 200 characters'],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [1000, 'Description cannot exceed 1000 characters'],
        },
        category: {
            type: String,
            trim: true,
            required: [true, 'Category is required'],
            enum: {
                values: ['Biodiversidad', 'Conservación', 'Educación Ambiental', 'Recursos Naturales'],
                message: '{VALUE} is not a valid category',
            },
        },
        mimetype: {
            type: String,
            required: [true, 'MIME type is required'],
        },
        size: {
            type: Number,
            required: [true, 'File size is required'],
            min: [0, 'File size cannot be negative'],
        },
        fileType: {
            type: String,
            required: [true, 'File type is required'],
            enum: {
                values: ['document', 'image', 'video', 'audio', 'other'],
                message: '{VALUE} is not a valid file type',
            },
        },
        url: {
            type: String,
            required: [true, 'File URL is required'],
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'Uploader is required'],
        },
        downloads: {
            type: Number,
            default: 0,
            min: [0, 'Downloads cannot be negative'],
        },
    },
    {
        timestamps: true,
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Indexes for better query performance
uploadSchema.index({ uploadedBy: 1, createdAt: -1 });
uploadSchema.index({ fileType: 1 });
uploadSchema.index({ category: 1 });
uploadSchema.index({ title: 'text', description: 'text' }); // Text search

// Virtual for formatted file size
uploadSchema.virtual('formattedSize').get(function () {
    const bytes = this.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
});

// Virtual to populate uploader info
uploadSchema.virtual('uploader', {
    ref: 'User',
    localField: 'uploadedBy',
    foreignField: '_id',
    justOne: true,
});

// Static method to determine file type from mimetype
uploadSchema.statics.getFileTypeFromMimetype = function (mimetype) {
    if (mimetype.startsWith('image/')) return 'image';
    if (mimetype.startsWith('video/')) return 'video';
    if (mimetype.startsWith('audio/')) return 'audio';
    if (
        mimetype.includes('pdf') ||
        mimetype.includes('document') ||
        mimetype.includes('text') ||
        mimetype.includes('msword') ||
        mimetype.includes('wordprocessingml')
    ) {
        return 'document';
    }
    return 'other';
};

// Instance method to increment downloads
uploadSchema.methods.incrementDownloads = async function () {
    this.downloads += 1;
    return this.save();
};

const Upload = mongoose.model('Upload', uploadSchema);

module.exports = Upload;
