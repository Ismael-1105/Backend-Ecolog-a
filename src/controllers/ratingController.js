
const Rating = require('../models/Rating');
const Video = require('../models/Video');

// @desc    Rate a video
// @route   POST /api/videos/:videoId/rate
// @access  Private
const addRating = async (req, res) => {
    const { videoId } = req.params;
    const { valoracion } = req.body;
    // TODO: Get user from auth middleware
    const user_id = req.user.id;

    try {
        const video = await Video.findById(videoId);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        let rating = await Rating.findOne({ video_id: videoId, user_id });

        if (rating) {
            // Update rating
            rating.valoracion = valoracion;
        } else {
            // Create new rating
            rating = new Rating({
                video_id: videoId,
                user_id,
                valoracion,
            });
        }

        await rating.save();

        res.status(201).json(rating);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    addRating,
};
