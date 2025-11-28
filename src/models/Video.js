const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters']
  },
  videoUrl: {
    type: String,
    required: [true, 'Video URL is required'],
  },
  videoPublicId: {
    type: String,
    required: true,
  },
  thumbnailUrl: {
    type: String,
    required: [true, 'Thumbnail is required'],
  },
  thumbnailPublicId: {
    type: String,
    required: true,
  },
  duration: {
    type: Number, // Duration in seconds
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Author is required'],
  },
  approved: {
    type: Boolean,
    default: true, // Auto-approve for development (change to false for production)
  },
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  views: {
    type: Number,
    default: 0,
  },
  fileSize: {
    type: Number, // File size in bytes
  },
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // Adds createdAt and updatedAt
});

// Virtual for like count
VideoSchema.virtual('likeCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual for dislike count
VideoSchema.virtual('dislikeCount').get(function () {
  return this.dislikes ? this.dislikes.length : 0;
});

// Ensure virtuals are included in JSON
VideoSchema.set('toJSON', { virtuals: true });
VideoSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
VideoSchema.index({ author: 1 });
VideoSchema.index({ createdAt: -1 }); // Descending for newest first
VideoSchema.index({ approved: 1, isDeleted: 1 });
VideoSchema.index({ title: 'text', description: 'text' }); // Text search

// Query middleware to exclude soft-deleted videos by default
VideoSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Video', VideoSchema);
