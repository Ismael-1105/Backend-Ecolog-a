
const User = require('../models/User');

module.exports = async function (req, res, next) {
    try {
        const user = await User.findById(req.user.id);

        if (user.role !== 'Administrador') {
            return res.status(403).json({ msg: 'Access denied' });
        }

        next();
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
