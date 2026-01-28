const mongoose = require('mongoose');

const offerSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    description: {
        type: String,
        required: true
    },
    discountType: {
        type: String,
        required: true,
        enum: ['percentage', 'flat'],
        default: 'percentage'
    },
    discountValue: {
        type: Number,
        required: true,
        default: 0
    },
    applicableTo: {
        type: String,
        required: true,
        enum: ['all', 'category', 'dish'],
        default: 'all'
    },
    targetId: {
        type: String, // Can be category name or dish ID
        default: 'all'
    },
    isActive: {
        type: Boolean,
        default: true
    },
    validUntil: {
        type: Date
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Offer', offerSchema);
