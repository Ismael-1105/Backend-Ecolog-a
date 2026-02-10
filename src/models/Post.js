const mongoose = require('mongoose');

const PostSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  content: {
    type: String,
    required: [true, 'Content is required'],
    maxlength: [5000, 'Content cannot exceed 5000 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Reciclaje',
      'Cambio Climático',
      'Energías Renovables',
      'Educación Ambiental',
      'Problemas Locales',
      'General',
      'Flora Nativa',
      'Fauna Local',
      'Conservación',
      'Agua'
    ]
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  // File attachments
  attachments: [{
    filename: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimetype: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    url: {
      type: String,
      required: true
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Engagement metrics
  likes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  dislikes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  views: {
    type: Number,
    default: 0,
    min: 0
  },
  // Moderation
  isPinned: {
    type: Boolean,
    default: false
  },
  pinnedAt: {
    type: Date
  },
  pinnedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  // Soft delete
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true
});

// Virtual for like count
PostSchema.virtual('likeCount').get(function () {
  return this.likes ? this.likes.length : 0;
});

// Virtual for dislike count
PostSchema.virtual('dislikeCount').get(function () {
  return this.dislikes ? this.dislikes.length : 0;
});

// Virtual for comment count (populated separately)
PostSchema.virtual('commentCount', {
  ref: 'Comment',
  localField: '_id',
  foreignField: 'postId',
  count: true
});

// Virtual for popularity score
PostSchema.virtual('popularityScore').get(function () {
  const likes = this.likeCount || 0;
  const dislikes = this.dislikeCount || 0;
  const views = this.views || 0;
  const comments = this.commentCount || 0;

  // Calculate age in days
  const ageInDays = (Date.now() - this.createdAt) / (1000 * 60 * 60 * 24);

  // Popularity algorithm: newer content gets boost
  const score = (likes * 2) + (views * 0.3) + (comments * 3) - (dislikes * 1) - (ageInDays * 0.1);

  return Math.max(0, score); // Ensure non-negative
});

// Ensure virtuals are included in JSON
PostSchema.set('toJSON', { virtuals: true });
PostSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
PostSchema.index({ author: 1 }); // Posts by author
PostSchema.index({ category: 1 }); // Posts by category
PostSchema.index({ createdAt: -1 }); // Newest first
PostSchema.index({ isDeleted: 1 }); // Filter deleted posts
PostSchema.index({ isPinned: -1, createdAt: -1 }); // Pinned first, then by date

// Compound indexes for common queries
PostSchema.index({ category: 1, isDeleted: 1, createdAt: -1 }); // Category listing
PostSchema.index({ author: 1, isDeleted: 1, createdAt: -1 }); // Author's posts
PostSchema.index({ isDeleted: 1, views: -1 }); // Popular posts
PostSchema.index({ isDeleted: 1, createdAt: -1 }); // Recent posts

// Text index for full-text search
PostSchema.index({
  title: 'text',
  content: 'text'
}, {
  weights: {
    title: 10,
    content: 5
  },
  name: 'post_text_index'
});

// Query middleware to exclude soft-deleted posts by default
PostSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Post', PostSchema);