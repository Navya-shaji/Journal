const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const Entry = require('../models/Entry');
const router = express.Router();

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ error: 'No token, authorization denied' });
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(401).json({ error: 'Token is not valid' });
    }
};

router.post('/', auth, async (req, res) => {
    try {
        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database is not connected' });
        }
        const { content, mood, tags, styling } = req.body;
        const entry = new Entry({
            user: req.user.userId,
            content,
            mood: mood || 'Neutral',
            tags,
            styling
        });
        await entry.save();
        res.status(201).json(entry);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.get('/id/:id', auth, async (req, res) => {
    try {
        const entry = await Entry.findOne({ _id: req.params.id, user: req.user.userId });
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        res.json(entry);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/:user', auth, async (req, res) => {
    try {
        if (String(req.user.userId) !== String(req.params.user)) {
            return res.status(403).json({ error: 'Not authorized' });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await Entry.countDocuments({ user: req.params.user });
        const entries = await Entry.find({ user: req.params.user })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            entries,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalEntries: total
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/:id', auth, async (req, res) => {
    try {
        const { content, mood, tags, styling } = req.body;
        const entry = await Entry.findOneAndUpdate(
            { _id: req.params.id, user: req.user.userId },
            { content, mood, tags, styling, updatedAt: Date.now() },
            { new: true }
        );
        if (!entry) return res.status(404).json({ error: 'Entry not found or unauthorized' });
        res.json(entry);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

router.delete('/:id', auth, async (req, res) => {
    try {
        const deleted = await Entry.findOneAndDelete({ _id: req.params.id, user: req.user.userId });
        if (!deleted) return res.status(404).json({ error: 'Entry not found or unauthorized' });
        res.json({ message: 'Entry deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.delete('/user/:userId', auth, async (req, res) => {
    try {
        if (req.user.userId !== req.params.userId) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        await Entry.deleteMany({ user: req.params.userId });
        res.json({ message: 'All entries deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
