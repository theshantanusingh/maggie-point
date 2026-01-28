const express = require('express');
const router = express.Router();
const Offer = require('../models/Offer');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { recordActivity } = require('../utils/activityLogger');

// Get all offers (Admin)
router.get('/admin', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const offers = await Offer.find().sort({ createdAt: -1 });
        res.json({ offers });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching offers', error: error.message });
    }
});

// Get active offers (Public)
router.get('/active', async (req, res) => {
    try {
        const offers = await Offer.find({ isActive: true });
        res.json({ offers });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching active offers', error: error.message });
    }
});

// Create offer
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const offer = await Offer.create({
            ...req.body,
            createdBy: req.user.userId
        });

        await recordActivity({
            user: req.user.userId,
            action: 'OFFER_CREATED',
            details: `Created new offer: ${offer.title}`,
            req
        });

        res.status(201).json({ message: 'Offer created', offer });
    } catch (error) {
        res.status(500).json({ message: 'Error creating offer', error: error.message });
    }
});

// Update offer
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        await recordActivity({
            user: req.user.userId,
            action: 'OFFER_UPDATED',
            details: `Updated offer: ${offer.title} (Active: ${offer.isActive})`,
            req
        });

        res.json({ message: 'Offer updated', offer });
    } catch (error) {
        res.status(500).json({ message: 'Error updating offer', error: error.message });
    }
});

// Delete offer
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
        const offer = await Offer.findByIdAndDelete(req.params.id);
        if (!offer) return res.status(404).json({ message: 'Offer not found' });

        await recordActivity({
            user: req.user.userId,
            action: 'OFFER_DELETED',
            details: `Deleted offer: ${offer.title}`,
            req
        });

        res.json({ message: 'Offer deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting offer', error: error.message });
    }
});

module.exports = router;
