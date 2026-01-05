
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    select: false, // Don't include password in queries by default
  },
  institution: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  // Enhanced profile fields
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
  },
  location: {
    type: String,
    maxlength: [100, 'Location cannot exceed 100 characters'],
  },
  website: {
    type: String,
    maxlength: [200, 'Website URL cannot exceed 200 characters'],
  },
  role: {
    type: String,
    enum: ['Estudiante', 'Docente', 'Administrador', 'SuperAdmin'],
    default: 'Estudiante',
  },
  // Following system
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Badges earned
  badges: [{
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
    },
    earnedAt: {
      type: Date,
      default: Date.now,
    },
  }],
  // Gamification
  points: {
    type: Number,
    default: 0,
  },
  level: {
    type: Number,
    default: 1,
  },
  // Statistics
  stats: {
    videosUploaded: {
      type: Number,
      default: 0,
    },
    commentsPosted: {
      type: Number,
      default: 0,
    },
    likesReceived: {
      type: Number,
      default: 0,
    },
    videosWatched: {
      type: Number,
      default: 0,
    },
  },
  // Verification
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedAt: {
    type: Date,
  },
  // Account status
  isActive: {
    type: Boolean,
    default: true,
  },
  lastLoginAt: {
    type: Date,
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
  timestamps: true, // Adds createdAt and updatedAt automatically
});

// Virtual for follower count
UserSchema.virtual('followerCount').get(function () {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
UserSchema.virtual('followingCount').get(function () {
  return this.following ? this.following.length : 0;
});

// Virtual for badge count
UserSchema.virtual('badgeCount').get(function () {
  return this.badges ? this.badges.length : 0;
});

// Ensure virtuals are included in JSON
UserSchema.set('toJSON', { virtuals: true });
UserSchema.set('toObject', { virtuals: true });

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ isDeleted: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ points: -1 }); // For leaderboard
UserSchema.index({ 'stats.videosUploaded': -1 }); // For top contributors
UserSchema.index({ followers: 1 }); // For following queries
UserSchema.index({ following: 1 }); // For followers queries

// Query middleware to exclude soft-deleted users by default
UserSchema.pre(/^find/, function (next) {
  // Only apply if not explicitly querying deleted users
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
