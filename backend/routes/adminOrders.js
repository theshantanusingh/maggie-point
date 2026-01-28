const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// Get all orders (admin only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.query;
        const filter = status ? { status } : {};

        const orders = await Order.find(filter)
            .sort({ createdAt: -1 })
            .populate('userId', 'firstName lastName email mobile floor room')
            .populate('items.dishId');

        res.json({ orders });
    } catch (error) {
        console.error('Get all orders error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Verify payment (admin only)
router.put('/:orderId/verify-payment', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.paymentDetails.paymentVerified = true;
        order.paymentDetails.verifiedBy = req.user.userId;
        order.paymentDetails.verifiedAt = new Date();
        order.status = 'confirmed';
        order.confirmedAt = new Date();

        await order.save();

        res.json({
            message: 'Payment verified and order confirmed',
            order
        });
    } catch (error) {
        console.error('Verify payment error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update order status (admin only)
router.put('/:orderId/status', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const validStatuses = ['pending', 'confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        order.status = status;

        // Update timestamps based on status
        switch (status) {
            case 'confirmed':
                order.confirmedAt = new Date();
                break;
            case 'preparing':
                order.preparingAt = new Date();
                break;
            case 'out_for_delivery':
                order.outForDeliveryAt = new Date();
                break;
            case 'delivered':
                order.deliveredAt = new Date();
                break;
            case 'cancelled':
                order.cancelledAt = new Date();
                order.cancellationReason = req.body.reason || 'Cancelled by admin';
                break;
        }

        await order.save();

        res.json({
            message: `Order status updated to ${status}`,
            order
        });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Update estimated time (admin only)
router.put('/:orderId/time', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { minutes } = req.body;
        const order = await Order.findById(req.params.orderId);

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        order.estimatedDeliveryTime = minutes;
        await order.save();

        res.json({
            message: 'Estimated delivery time updated',
            order
        });
    } catch (error) {
        console.error('Update time error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// Get order statistics (admin only)
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const stats = await Order.aggregate([
            {
                $group: {
                    _id: '$status',
                    count: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' }
                }
            }
        ]);

        const totalOrders = await Order.countDocuments();
        const totalRevenue = await Order.aggregate([
            { $match: { 'paymentDetails.paymentVerified': true } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            stats,
            totalOrders,
            totalRevenue: totalRevenue[0]?.total || 0
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
