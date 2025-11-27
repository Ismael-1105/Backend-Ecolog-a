
const Comment = require('../models/Comment');
const Video = require('../models/Video');

// @desc    Add a comment to a video
// @route   POST /api/videos/:videoId/comments
// @access  Private
const addComment = async (req, res) => {
    const { videoId } = req.params;
    const { comentario } = req.body;
    // TODO: Get user from auth middleware
    const autor_id = req.user.id;

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        const newComment = new Comment({
            video_id: videoId,
            autor_id,
            comentario,
        });

        const comment = await newComment.save();

        res.status(201).json(comment);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addComment,
};
