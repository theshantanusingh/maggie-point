const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [{
        dishId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Dish',
            required: true
        },
        name: String,
        price: Number,
        quantity: {
            type: Number,
            default: 1
        },
        emoji: String
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    paymentDetails: {
        utrNumber: String,
        transactionId: String,
        paymentVerified: {
            type: Boolean,
            default: false
        },
        verifiedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        verifiedAt: Date
    },
    status: {
        type: String,
        enum: ['pending', 'payment_pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'],
        default: 'payment_pending'
    },
    deliveryDetails: {
        floor: String,
        room: String,
        mobile: String,
        specialInstructions: String
    },
    estimatedDeliveryTime: {
        type: Number, // in minutes
        default: 10
    },
    customDeliveryTime: Number, // if user specifies
    orderPlacedAt: {
        type: Date,
        default: Date.now
    },
    confirmedAt: Date,
    preparingAt: Date,
    outForDeliveryAt: Date,
    deliveredAt: Date,
    cancelledAt: Date,
    cancellationReason: String
}, {
    timestamps: true
});

// Add index for faster queries
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1 });

module.exports = mongoose.model('Order', orderSchema);
