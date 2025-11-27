
const mongoose = require('mongoose');

const CommentSchema = new mongoose.Schema({
  video_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Video',
    required: true,
  },
  autor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  comentario: {
    type: String,
    required: true,
    trim: true,
  },
  fecha_creacion: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
CommentSchema.index({ video_id: 1, fecha_creacion: -1 });
CommentSchema.index({ autor_id: 1 });

module.exports = mongoose.model('Comment', CommentSchema);
