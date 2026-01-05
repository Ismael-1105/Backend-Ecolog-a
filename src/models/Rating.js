
const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  // New English fields (primary)
  videoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one rating per user per video
RatingSchema.index({ videoId: 1, userId: 1 }, { unique: true });

// Backward compatibility: Map old Spanish fields to new English fields
RatingSchema.virtual('video_id').get(function () {
  return this.videoId;
});

RatingSchema.virtual('user_id').get(function () {
  return this.userId;
});

RatingSchema.virtual('valoracion').get(function () {
  return this.rating;
});

// Ensure virtuals are included in JSON
RatingSchema.set('toJSON', { virtuals: true });
RatingSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Rating', RatingSchema);
