
const Video = require('../models/Video');

// @desc    Upload a video
// @route   POST /api/videos
// @access  Private

const uploadVideo = async (req, res) => {
    const { titulo, descripcion } = req.body;
    if (!req.file) {
        return res.status(400).json({ message: 'Video file is required' });
    }
    const url_video = req.file.path.replace(/\\/g, '/');

    // TODO: Get user from auth middleware
    const autor_id = req.user.id;

    try {
        const newVideo = new Video({
            titulo,
            descripcion,
            url_video,
            autor_id,
        });

        const video = await newVideo.save();

        res.status(201).json(video);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};


// @desc    Get all public videos
// @route   GET /api/videos
// @access  Public
const getPublicVideos = async (req, res) => {
    try {
        const videos = await Video.find({ aprobado: true }).populate('autor_id', 'name institution');
        res.json(videos);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Approve a video
// @route   PUT /api/videos/:id/approve
// @access  Private/Admin

const approveVideo = async (req, res) => {
    try {
        const video = await Video.findById(req.params.id);

        if (!video) {
            return res.status(404).json({ message: 'Video not found' });
        }

        video.aprobado = true;

        await video.save();

        res.json(video);
    } catch (err) {
        console.error(err);
        if (err.kind === 'ObjectId') {
            return res.status(404).json({ message: 'Video not found' });
        }
        res.status(500).json({ message: 'Server Error' });
    }
};


module.exports = {
    uploadVideo,
    getPublicVideos,
    approveVideo,
};
