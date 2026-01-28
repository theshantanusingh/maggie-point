const Activity = require('../models/Activity');
const logger = require('./logger');

const recordActivity = async ({ user, action, details, metadata = {}, req = null }) => {
    try {
        const activity = new Activity({
            user: user || (req && req.user ? req.user.userId : null),
            action,
            details,
            metadata,
            ip: req ? req.ip : 'System'
        });

        await activity.save();

        // Also log to winson for file-based tracing
        logger.info(`[ACTIVITY] ${action}: ${details} (User: ${user || 'System'})`);
    } catch (error) {
        logger.error(`Error recording activity: ${error.message}`);
    }
};

module.exports = { recordActivity };
