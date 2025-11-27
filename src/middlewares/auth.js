
const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
    // Get token from header (support Authorization: Bearer and x-auth-token)
    let token = null;
    const authHeader = req.header('authorization') || req.header('Authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
    } else {
        token = req.header('x-auth-token');
    }

    if (!token) {
        return res.status(401).json({ message: 'Authorization token missing' });
    }
    if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: 'Server misconfiguration: missing JWT secret' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded.user;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid token' });
    }
};
