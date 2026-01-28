const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false // Some actions might be system-generated
    },
    action: {
        type: String,
        required: true,
        enum: [
            'LOGIN', 'LOGOUT', 'SIGNUP',
            'ORDER_PLACED', 'ORDER_STATUS_UPDATED', 'ORDER_CANCELLED', 'PAYMENT_SUBMITTED', 'PAYMENT_VERIFIED',
            'DISH_CREATED', 'DISH_UPDATED', 'DISH_DELETED',
            'INVENTORY_ADDED', 'INVENTORY_UPDATED', 'INVENTORY_DELETED',
            'USER_PROMOTED', 'USER_DEMOTED', 'USER_DELETED', 'PASSWORD_RESET'
        ]
    },
    details: {
        type: String,
        required: true
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    ip: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

activitySchema.index({ timestamp: -1 });
activitySchema.index({ action: 1 });

module.exports = mongoose.model('Activity', activitySchema);
