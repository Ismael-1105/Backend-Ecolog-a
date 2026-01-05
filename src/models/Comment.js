
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  // New English fields (primary)
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
  },
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: [2000, 'Comment cannot exceed 2000 characters'],
  },
  // Nested comments support
  parentComment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Comment',
    default: null,
  },
  // Engagement metrics
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false,
  },
  deletedAt: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true, // createdAt, updatedAt
});

// Virtual for like count
CommentSchema.virtual('likeCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual for reply count
CommentSchema.virtual('replyCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'parentComment',
  count: true,
});

// Ensure virtuals are included in JSON
CommentSchema.set('toJSON', { virtuals: true });
CommentSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
CommentSchema.index({ videoId: 1, createdAt: -1 });
CommentSchema.index({ authorId: 1 });
CommentSchema.index({ parentComment: 1 }); // For nested comments
CommentSchema.index({ isDeleted: 1 });

// Compound index for getting top-level comments
CommentSchema.index({ videoId: 1, parentComment: 1, createdAt: -1 });

// Query middleware to exclude soft-deleted comments by default
CommentSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

// Backward compatibility: Map old Spanish fields to new English fields
CommentSchema.virtual('video_id').get(function () {
  return this.videoId;
});

CommentSchema.virtual('autor_id').get(function () {
  return this.authorId;
});

CommentSchema.virtual('comentario').get(function () {
  return this.content;
});

CommentSchema.virtual('fecha_creacion').get(function () {
  return this.createdAt;
});

module.exports = mongoose.model('Comment', CommentSchema);
