const express = require('express');
const router = express.Router();
const { auth, isAdmin } = require('../middleware/auth');
const User = require('../models/User');
const Dish = require('../models/Dish');

// ===== DISH MANAGEMENT =====

// Get all dishes (public)
router.get('/dishes', async (req, res) => {
    try {
        const dishes = await Dish.find().sort({ category: 1, createdAt: -1 });
        res.json({ dishes });
    } catch (error) {
        console.error('Get Dishes Error:', error);
        res.status(500).json({ message: 'Failed to fetch dishes', error: error.message });
    }
});

// Get available dishes only (public)
router.get('/dishes/available', async (req, res) => {
    try {
        const dishes = await Dish.find({ isAvailable: true }).sort({ category: 1, createdAt: -1 });
        res.json({ dishes });
    } catch (error) {
        console.error('Get Available Dishes Error:', error);
        res.status(500).json({ message: 'Failed to fetch dishes', error: error.message });
    }
});

// Create dish (admin only)
router.post('/dishes', auth, isAdmin, async (req, res) => {
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
            createdBy: req.user._id
        });

        res.status(201).json({
            message: 'Dish created successfully',
            dish
        });
    } catch (error) {
        console.error('Create Dish Error:', error);
        res.status(500).json({ message: 'Failed to create dish', error: error.message });
    }
});

// Update dish (admin only)
router.put('/dishes/:id', auth, isAdmin, async (req, res) => {
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

        res.json({
            message: 'Dish updated successfully',
            dish
        });
    } catch (error) {
        console.error('Update Dish Error:', error);
        res.status(500).json({ message: 'Failed to update dish', error: error.message });
    }
});

// Delete dish (admin only)
router.delete('/dishes/:id', auth, isAdmin, async (req, res) => {
    try {
        const dish = await Dish.findByIdAndDelete(req.params.id);

        if (!dish) {
            return res.status(404).json({ message: 'Dish not found' });
        }

        res.json({ message: 'Dish deleted successfully' });
    } catch (error) {
        console.error('Delete Dish Error:', error);
        res.status(500).json({ message: 'Failed to delete dish', error: error.message });
    }
});

// ===== USER MANAGEMENT =====

// Get all users (admin only)
router.get('/users', auth, isAdmin, async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json({
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get Users Error:', error);
        res.status(500).json({ message: 'Failed to fetch users', error: error.message });
    }
});

// Get single user (admin only)
router.get('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get User Error:', error);
        res.status(500).json({ message: 'Failed to fetch user', error: error.message });
    }
});

// Update user (admin only)
router.put('/users/:id', auth, isAdmin, async (req, res) => {
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

        res.json({
            message: 'User updated successfully',
            user
        });
    } catch (error) {
        console.error('Update User Error:', error);
        res.status(500).json({ message: 'Failed to update user', error: error.message });
    }
});

// Delete user (admin only)
router.delete('/users/:id', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findByIdAndDelete(req.params.id);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Delete User Error:', error);
        res.status(500).json({ message: 'Failed to delete user', error: error.message });
    }
});

// ===== ADMIN MANAGEMENT =====

// Get all admins (admin only)
router.get('/admins', auth, isAdmin, async (req, res) => {
    try {
        const admins = await User.find({ isAdmin: true }).select('-password').sort({ createdAt: -1 });
        res.json({
            count: admins.length,
            admins
        });
    } catch (error) {
        console.error('Get Admins Error:', error);
        res.status(500).json({ message: 'Failed to fetch admins', error: error.message });
    }
});

// Make user admin (admin only)
router.post('/admins/promote/:userId', auth, isAdmin, async (req, res) => {
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
        console.error('Promote Admin Error:', error);
        res.status(500).json({ message: 'Failed to promote user', error: error.message });
    }
});

// Remove admin privileges (admin only)
router.post('/admins/demote/:userId', auth, isAdmin, async (req, res) => {
    try {
        const user = await User.findById(req.params.userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (!user.isAdmin) {
            return res.status(400).json({ message: 'User is not an admin' });
        }

        // Prevent self-demotion
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ message: 'You cannot remove your own admin privileges' });
        }

        user.isAdmin = false;
        await user.save();

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
        console.error('Demote Admin Error:', error);
        res.status(500).json({ message: 'Failed to demote user', error: error.message });
    }
});

// ===== DASHBOARD STATS =====

// Get dashboard statistics (admin only)
router.get('/stats', auth, isAdmin, async (req, res) => {
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
        console.error('Get Stats Error:', error);
        res.status(500).json({ message: 'Failed to fetch statistics', error: error.message });
    }
});

module.exports = router;
