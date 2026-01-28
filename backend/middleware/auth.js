const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Verify JWT token and attach user to request
const authenticateToken = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');

        if (!token) {
            logger.warn(`Auth failed: No token provided for ${req.originalUrl}`);
            return res.status(401).json({ message: 'No authentication token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.userId);

        if (!user) {
            logger.warn(`Auth failed: User not found for token ${decoded.userId}`);
            return res.status(401).json({ message: 'User not found' });
        }

        req.user = {
            userId: user._id,
            email: user.email,
            isAdmin: user.isAdmin,
            floor: user.floor,
            room: user.room,
            mobile: user.mobile
        };
        next();
    } catch (error) {
        logger.error(`Auth Error: ${error.message} for ${req.originalUrl}`);
        res.status(401).json({ message: 'Invalid or expired token' });
    }
};

// Check if user is admin
const requireAdmin = (req, res, next) => {
    if (!req.user.isAdmin) {
        logger.warn(`Admin access denied for user: ${req.user.email} on ${req.originalUrl}`);
        return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
};

module.exports = { authenticateToken, requireAdmin };
