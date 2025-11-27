
const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true,
  },
  descripcion: {
    type: String,
    required: true,
  },
  url_video: {
    type: String,
    required: true,
  },
  thumbnail: {
    type: String, // Path to thumbnail image
  },
  autor_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  aprobado: {
    type: Boolean,
    default: true,
  },
  fecha_creacion: {
    type: Date,
    default: Date.now,
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
  // Video metadata
  duration: {
    type: Number, // Duration in seconds
  },
  fileSize: {
    type: Number, // File size in bytes
  },
  views: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
VideoSchema.index({ autor_id: 1 });
VideoSchema.index({ fecha_creacion: -1 }); // Descending for newest first
VideoSchema.index({ aprobado: 1, isDeleted: 1 });
VideoSchema.index({ titulo: 'text', descripcion: 'text' }); // Text search

// Query middleware to exclude soft-deleted videos by default
VideoSchema.pre(/^find/, function (next) {
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('Video', VideoSchema);
