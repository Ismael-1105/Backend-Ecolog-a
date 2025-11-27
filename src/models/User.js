
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
  role: {
    type: String,
    enum: ['Estudiante', 'Docente', 'Administrador', 'SuperAdmin'],
    default: 'Estudiante',
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

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ isDeleted: 1 });
UserSchema.index({ role: 1 });

// Query middleware to exclude soft-deleted users by default
UserSchema.pre(/^find/, function (next) {
  // Only apply if not explicitly querying deleted users
  if (!this.getOptions().includeDeleted) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
});

module.exports = mongoose.model('User', UserSchema);
