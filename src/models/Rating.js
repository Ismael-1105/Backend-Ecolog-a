
const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  video_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  valoracion: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
}, {
  timestamps: true,
});

// Compound index to ensure one rating per user per video
RatingSchema.index({ video_id: 1, user_id: 1 }, { unique: true });

module.exports = mongoose.model('Rating', RatingSchema);
