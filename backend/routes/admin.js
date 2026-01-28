const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Dish = require('../models/Dish');
const logger = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const { recordActivity } = require('../utils/activityLogger');
const Activity = require('../models/Activity');

// ===== DISH MANAGEMENT =====

// Get all dishes (public)
router.get('/dishes', async (req, res) => {
    try {
        const dishes = await Dish.find().sort({ category: 1, createdAt: -1 });
        res.json({ dishes });
    } catch (error) {
        logger.error(`Get Dishes Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch dishes', error: error.message });
    }
});

// Get available dishes only (public)
router.get('/dishes/available', async (req, res) => {
    try {
        const dishes = await Dish.find({ isAvailable: true }).sort({ category: 1, createdAt: -1 });
        res.json({ dishes });
    } catch (error) {
        logger.error(`Get Available Dishes Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch dishes', error: error.message });
    }
});

// Create dish (admin only)
router.post('/dishes', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, price, category, emoji } = req.body;

        if (!name || !description || !price || !category) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const dish = await Dish.create({
            name,
            description,
            price,
            category,
            emoji: emoji || '🍜',
            createdBy: req.user.userId
        });

        await recordActivity({
            user: req.user.userId,
            action: 'DISH_CREATED',
            details: `New dish created: ${name} (₹${price})`,
            metadata: { dishId: dish._id, name, price },
            req
        });

        logger.info(`Dish Created: ${dish.name} by Admin: ${req.user.userId}`);

        res.status(201).json({
            message: 'Dish created successfully',
            dish
        });
    } catch (error) {
        logger.error(`Create Dish Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to create dish', error: error.message });
    }
});

// Update dish (admin only)
router.put('/dishes/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, description, price, category, emoji, isAvailable } = req.body;

        const dish = await Dish.findByIdAndUpdate(
            req.params.id,
            { name, description, price, category, emoji, isAvailable },
            { new: true, runValidators: true }
        );

        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }

        await recordActivity({
            user: req.user.userId,
            action: 'DISH_UPDATED',
            details: `Dish updated: ${dish.name}`,
            metadata: { dishId: dish._id, updates: req.body },
            req
        });

        logger.info(`Dish Updated: ${dish.name} by Admin: ${req.user.userId}`);

        res.json({
            message: 'Dish updated successfully',
            dish
        });
    } catch (error) {
        logger.error(`Update Dish Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to update dish', error: error.message });
    }
});

// Delete dish (admin only)
router.delete('/dishes/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const dish = await Dish.findByIdAndDelete(req.params.id);

        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }

        await recordActivity({
            user: req.user.userId,
            action: 'DISH_DELETED',
            details: `Dish deleted: ${dish.name}`,
            metadata: { dishId: req.params.id, name: dish.name },
            req
        });

        logger.info(`Dish Deleted: ${req.params.id} by Admin: ${req.user.userId}`);

        res.json({ message: 'Dish deleted successfully' });
    } catch (error) {
        logger.error(`Delete Dish Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to delete dish', error: error.message });
    }
});

// ===== USER MANAGEMENT =====

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({
            count: users.length,
            users
        });
    } catch (error) {
        logger.error(`Get Users Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

// Get single user (admin only)
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        logger.error(`Get User Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
});

// Update user (admin only)
router.put('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { firstName, lastName, email, mobile, floor, room } = req.body;

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { firstName, lastName, email, mobile, floor, room },
            { new: true, runValidators: true }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        logger.info(`User details Updated: ${user.email} by Admin: ${req.user.userId}`);

        res.json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        logger.error(`Update User Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
});

// Create user (admin only) - Manual creation via helpline
router.post('/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { firstName, lastName, email, mobile, floor, room, password, isAdmin: isStartAdmin } = req.body;

        // Validate
        if (!firstName || !lastName || !email || !password || !floor || !room) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Check exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists with this email' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            firstName,
            lastName,
            email,
            mobile,
            password: hashedPassword,
            floor,
            room,
            isVerified: true, // Admin created users are verified
            isAdmin: isStartAdmin || false
        });

        logger.info(`User Created by Admin: ${user.email}`);

        res.status(201).json({
            message: 'User created successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        logger.error(`Create User Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to create user', error: error.message });
    }
});

// Reset User Password (admin only)
router.put('/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 4) {
            return res.status(400).json({ message: 'Password must be at least 4 characters long' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await User.findByIdAndUpdate(
            req.params.id,
            { password: hashedPassword },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        logger.info(`User Password Reset: ${user.email} by Admin: ${req.user.userId}`);

        res.json({ message: 'Password reset successfully' });

    } catch (error) {
        logger.error(`Reset Password Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to reset password', error: error.message });
    }
});

// Delete user (admin only)
router.delete('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        logger.warn(`User Deleted: ${user.email} by Admin: ${req.user.userId}`);

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        logger.error(`Delete User Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
});

// ===== ADMIN MANAGEMENT =====

// Get all admins (admin only)
router.get('/admins', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const admins = await User.find({ isAdmin: true }).select('-password').sort({ createdAt: -1 });
        res.json({
            count: admins.length,
            admins
        });
    } catch (error) {
        logger.error(`Get Admins Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch admins', error: error.message });
    }
});

// Make user admin (admin only)
router.post('/admins/promote/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.isAdmin) {
            return res.status(400).json({ message: 'User is already an admin' });
        }

        user.isAdmin = true;
        await user.save();

        logger.info(`User Promoted to Admin: ${user.email} by Admin: ${req.user.userId}`);

        res.json({
            message: `${user.firstName} ${user.lastName} is now an admin`,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        logger.error(`Promote Admin Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to promote user', error: error.message });
    }
});

// Remove admin privileges (admin only)
router.post('/admins/demote/:userId', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isAdmin) {
            return res.status(400).json({ message: 'User is not an admin' });
        }

        // Prevent self-demotion
        if (user._id.toString() === req.user.userId.toString()) {
            return res.status(400).json({ message: 'You cannot remove your own admin privileges' });
        }

        user.isAdmin = false;
        await user.save();

        logger.warn(`User Demoted from Admin: ${user.email} by Admin: ${req.user.userId}`);

        res.json({
            message: `${user.firstName} ${user.lastName} is no longer an admin`,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                isAdmin: user.isAdmin
            }
        });
    } catch (error) {
        logger.error(`Demote Admin Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to demote user', error: error.message });
    }
});

// ===== DASHBOARD STATS =====

// Get dashboard statistics (admin only)
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalAdmins = await User.countDocuments({ isAdmin: true });
        const totalDishes = await Dish.countDocuments();
        const availableDishes = await Dish.countDocuments({ isAvailable: true });

        res.json({
            totalUsers,
            totalAdmins,
            totalDishes,
            availableDishes,
            regularUsers: totalUsers - totalAdmins
        });
    } catch (error) {
        logger.error(`Get Stats Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
    }
});

// ===== FINANCE & PAYMENTS =====

// Get all payments (order payments)
router.get('/finance/payments', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const Order = require('../models/Order');
        const { search } = req.query;

        let query = { 'paymentDetails.utrNumber': { $exists: true, $ne: '' } };

        if (search) {
            query.$or = [
                { 'paymentDetails.utrNumber': { $regex: search, $options: 'i' } },
                { 'paymentDetails.transactionId': { $regex: search, $options: 'i' } }
            ];
        }

        const payments = await Order.find(query)
            .sort({ createdAt: -1 })
            .populate('userId', 'firstName lastName email');

        // Calculate total verified revenue
        const totalRevenueResult = await Order.aggregate([
            { $match: { 'paymentDetails.paymentVerified': true } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);

        res.json({
            payments,
            totalRevenue: totalRevenueResult[0]?.total || 0
        });
    } catch (error) {
        logger.error(`Get Finance Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch finance records', error: error.message });
    }
});

// ===== ACTIVITY FEED =====

// Get recent activities (admin only)
router.get('/activities', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { limit = 50, action } = req.query;
        const filter = action ? { action } : {};

        const activities = await Activity.find(filter)
            .sort({ timestamp: -1 })
            .limit(parseInt(limit))
            .populate('user', 'firstName lastName email');

        res.json({ activities });
    } catch (error) {
        logger.error(`Get Activities Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch activities', error: error.message });
    }
});

// Get raw logs (admin only)
router.get('/logs/:type', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { type } = req.params; // 'app' or 'error'
        const logFile = path.join(__dirname, `../logs/${type}.log`);

        if (!fs.existsSync(logFile)) {
            return res.status(404).json({ message: 'Log file not found' });
        }

        const logs = fs.readFileSync(logFile, 'utf8');
        res.json({ logs });
    } catch (error) {
        logger.error(`Get Logs Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to fetch logs', error: error.message });
    }
});

// ===== EMAIL TOOL =====

const { sendBulkEmail } = require('../services/emailService');

// POST /api/admin/send-bulk-email
router.post('/send-bulk-email', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { userIds, subject, content } = req.body;

        if (!userIds || !subject || !content) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const users = await User.find({ _id: { $in: userIds } });

        let successCount = 0;
        let failCount = 0;

        // Sequence sending to avoid rate limits/spam triggers
        for (const user of users) {
            const success = await sendBulkEmail(user, subject, content);
            if (success) successCount++;
            else failCount++;
        }

        await recordActivity({
            user: req.user.userId,
            action: 'BULK_EMAIL_SENT',
            details: `Bulk email sent to ${successCount} users. Subject: ${subject}`,
            metadata: { userIds, subject, successCount, failCount },
            req
        });

        res.json({
            message: `Emails sent successfully! Success: ${successCount}, Failed: ${failCount}`,
            successCount,
            failCount
        });

    } catch (error) {
        logger.error(`Bulk Email Error: ${error.message}`);
        res.status(500).json({ message: 'Failed to send bulk emails', error: error.message });
    }
});

module.exports = router;
