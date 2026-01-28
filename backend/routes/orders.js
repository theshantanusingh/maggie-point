const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const Dish = require('../models/Dish');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');
const { recordActivity } = require('../utils/activityLogger');

// Create new order
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { items, deliveryDetails, customDeliveryTime } = req.body;

        // Validate items
        if (!items || items.length === 0) {
            return res.status(400).json({ message: 'No items in order' });
        }

        // Calculate total and fetch dish details
        let totalAmount = 0;
        const orderItems = [];

        for (const item of items) {
            const dish = await Dish.findById(item.dishId);
            if (!dish) {
                return res.status(404).json({ message: `Dish ${item.dishId} not found` });
            }
            if (!dish.isAvailable) {
                return res.status(400).json({ message: `${dish.name} is not available` });
            }

            const quantity = item.quantity || 1;
            totalAmount += dish.price * quantity;

            orderItems.push({
                dishId: dish._id,
                name: dish.name,
                price: dish.price,
                quantity,
                emoji: dish.emoji
            });
        }

        // Calculate fee
        const type = req.body.deliveryType || 'room';
        const fee = type === 'room' ? 10 : 0;
        totalAmount += fee;

        // Create order
        const order = new Order({
            userId: req.user.userId,
            items: orderItems,
            totalAmount,
            deliveryDetails: {
                floor: deliveryDetails?.floor || req.user.floor,
                room: deliveryDetails?.room || req.user.room,
                mobile: deliveryDetails?.mobile || req.user.mobile,
                specialInstructions: deliveryDetails?.specialInstructions
            },
            deliveryType: type,
            convenienceFee: fee,
            customDeliveryTime,
            status: 'payment_pending'
        });

        await order.save();

        await recordActivity({
            user: req.user.userId,
            action: 'ORDER_PLACED',
            details: `Order placed: #${order._id.toString().slice(-6).toUpperCase()} (Total: ₹${totalAmount})`,
            metadata: { orderId: order._id, totalAmount },
            req
        });

        logger.info(`Order Created: ${order._id} for User: ${req.user.userId} (Total: ₹${totalAmount})`);

        res.status(201).json({
            message: 'Order created successfully',
            order
        });
    } catch (error) {
        logger.error(`Create Order Error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// Submit payment details
router.put('/:orderId/payment', authenticateToken, async (req, res) => {
    try {
        const { utrNumber, transactionId } = req.body;
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        order.paymentDetails.utrNumber = utrNumber;
        order.paymentDetails.transactionId = transactionId;
        order.status = 'pending'; // Waiting for admin verification

        await order.save();

        await recordActivity({
            user: req.user.userId,
            action: 'PAYMENT_SUBMITTED',
            details: `Payment submitted for Order #${order._id.toString().slice(-6).toUpperCase()} (UTR: ${utrNumber})`,
            metadata: { orderId: order._id, utrNumber },
            req
        });

        logger.info(`Payment Submitted for Order: ${order._id} (UTR: ${utrNumber})`);

        res.json({
            message: 'Payment details submitted. Waiting for verification.',
            order
        });
    } catch (error) {
        logger.error(`Payment Submit Error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get user's orders
router.get('/my-orders', authenticateToken, async (req, res) => {
    try {
        const orders = await Order.find({ userId: req.user.userId })
            .sort({ createdAt: -1 })
            .populate('items.dishId');

        res.json({ orders });
    } catch (error) {
        logger.error(`Get My Orders Error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get single order details
router.get('/:orderId', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId)
            .populate('items.dishId')
            .populate('userId', 'firstName lastName email mobile floor room');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        // Check if user owns this order or is admin
        if (order.userId._id.toString() !== req.user.userId.toString() && !req.user.isAdmin) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        res.json({ order });
    } catch (error) {
        logger.error(`Get Order Detail Error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

// Cancel order (user can cancel if payment not verified)
router.put('/:orderId/cancel', authenticateToken, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        if (order.userId.toString() !== req.user.userId.toString()) {
            return res.status(403).json({ message: 'Unauthorized' });
        }

        if (order.status !== 'payment_pending' && order.status !== 'pending') {
            return res.status(400).json({ message: 'Cannot cancel order at this stage' });
        }

        order.status = 'cancelled';
        order.cancelledAt = new Date();
        order.cancellationReason = req.body.reason || 'Cancelled by user';

        await order.save();

        await recordActivity({
            user: req.user.userId,
            action: 'ORDER_CANCELLED',
            details: `Order #${order._id.toString().slice(-6).toUpperCase()} cancelled by user. Reason: ${order.cancellationReason}`,
            metadata: { orderId: order._id, reason: order.cancellationReason },
            req
        });

        logger.info(`Order Cancelled by User: ${order._id}`);

        res.json({
            message: 'Order cancelled successfully',
            order
        });
    } catch (error) {
        logger.error(`Cancel Order Error: ${error.message}`);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
