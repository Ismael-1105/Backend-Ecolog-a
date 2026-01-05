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
  // Categories and tags
  categories: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
  }],
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
  }],
  // Moderation
  approved: {
    type: Boolean,
    default: true, // Auto-approve for development (change to false for production)
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvedAt: {
    type: Date,
  },
  // Pinned posts (for admins)
  isPinned: {
    type: Boolean,
    default: false,
  },
  pinnedAt: {
    type: Date,
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  // Engagement
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
  // File info
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

// Virtual for comment count (populated separately)
VideoSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'videoId',
  count: true,
});

// Virtual for popularity score
VideoSchema.virtual('popularityScore').get(function () {
  const likes = this.likeCount || 0;
  const dislikes = this.dislikeCount || 0;
  const views = this.views || 0;
  const comments = this.commentCount || 0;

  // Calculate age in days
  const ageInDays = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);

  // Popularity algorithm: newer content gets boost
  const score = (likes * 2) + (views * 0.5) + (comments * 3) - (dislikes * 1) - (ageInDays * 0.1);

  return Math.max(0, score); // Ensure non-negative
});

// Ensure virtuals are included in JSON
VideoSchema.set('toJSON', { virtuals: true });
VideoSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
VideoSchema.index({ author: 1 });
VideoSchema.index({ createdAt: -1 }); // Descending for newest first
VideoSchema.index({ approved: 1, isDeleted: 1 });
VideoSchema.index({ isPinned: -1, createdAt: -1 }); // Pinned first, then by date
VideoSchema.index({ categories: 1 }); // For category filtering
VideoSchema.index({ tags: 1 }); // For tag filtering
VideoSchema.index({ title: 'text', description: 'text', tags: 'text' }); // Full-text search

// Compound index for trending videos
VideoSchema.index({ approved: 1, isDeleted: 1, views: -1, createdAt: -1 });

// Query middleware to exclude soft-deleted videos by default
VideoSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Video', VideoSchema);
