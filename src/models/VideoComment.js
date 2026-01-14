const mongoose = require('mongoose');

const VideoCommentSchema = new mongoose.Schema({
    videoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Video',
        required: [true, 'Video is required'],
        index: true
    },
    authorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Author is required']
    },
    content: {
        type: String,
        required: [true, 'Content is required'],
        trim: true,
        maxlength: [2000, 'Content cannot exceed 2000 characters']
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'VideoComment',
        default: null,
        index: true
    },
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    isDeleted: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for reply count
VideoCommentSchema.virtual('replyCount', {
    ref: 'VideoComment',
    localField: '_id',
    foreignField: 'parentComment',
    count: true
});

// Virtual for replies (nested comments)
VideoCommentSchema.virtual('replies', {
    ref: 'VideoComment',
    localField: '_id',
    foreignField: 'parentComment'
});

// Virtual for like count
VideoCommentSchema.virtual('likeCount').get(function () {
    return this.likes ? this.likes.length : 0;
});

// Index for efficient queries
VideoCommentSchema.index({ videoId: 1, createdAt: -1 });
VideoCommentSchema.index({ parentComment: 1, createdAt: 1 });
VideoCommentSchema.index({ authorId: 1 });

module.exports = mongoose.model('VideoComment', VideoCommentSchema);
