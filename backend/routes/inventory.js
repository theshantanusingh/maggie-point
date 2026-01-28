const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { recordActivity } = require('../utils/activityLogger');

// Get all inventory items
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const inventory = await Inventory.find().sort({ name: 1 });
        res.json({ inventory });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching inventory', error: error.message });
    }
});

// Add new inventory item
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { name, quantity, unit, minThreshold, category } = req.body;
        const item = await Inventory.create({
            name, quantity, unit, minThreshold, category,
            lastUpdatedBy: req.user.userId
        });

        await recordActivity({
            user: req.user.userId,
            action: 'INVENTORY_ADDED',
            details: `Added new inventory item: ${name} (${quantity} ${unit})`,
            req
        });

        res.status(201).json({ message: 'Item added', item });
    } catch (error) {
        res.status(500).json({ message: 'Error adding item', error: error.message });
    }
});

// Update inventory quantity
router.patch('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const { quantity, name } = req.body;
        const item = await Inventory.findByIdAndUpdate(
            req.params.id,
            { quantity, lastUpdatedBy: req.user.userId },
            { new: true }
        );

        if (!item) return res.status(404).json({ message: 'Item not found' });

        await recordActivity({
            user: req.user.userId,
            action: 'INVENTORY_UPDATED',
            details: `Updated inventory: ${item.name} quantity to ${quantity} ${item.unit}`,
            req
        });

        res.json({ message: 'Quantity updated', item });
    } catch (error) {
        res.status(500).json({ message: 'Error updating quantity', error: error.message });
    }
});

// Delete item
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const item = await Inventory.findByIdAndDelete(req.params.id);
        if (!item) return res.status(404).json({ message: 'Item not found' });

        await recordActivity({
            user: req.user.userId,
            action: 'INVENTORY_DELETED',
            details: `Removed inventory item: ${item.name}`,
            req
        });

        res.json({ message: 'Item removed' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting item', error: error.message });
    }
});

module.exports = router;
