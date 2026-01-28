const mongoose = require('mongoose');

const inventorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    quantity: {
        type: Number,
        default: 0
    },
    unit: {
        type: String,
        required: true,
        enum: ['kg', 'gm', 'pcs', 'liters', 'packets']
    },
    minThreshold: {
        type: Number,
        default: 5,
        description: 'Notify when quantity falls below this'
    },
    category: {
        type: String,
        required: true,
        enum: ['Raw Material', 'Packaging', 'Spices', 'Other']
    },
    lastUpdatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Inventory', inventorySchema);
