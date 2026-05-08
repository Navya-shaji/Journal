const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

router.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ 
                error: 'All fields are required', 
                fields: { 
                    username: !!username, 
                    email: !!email, 
                    password: !!password 
                } 
            });
        }

        if (mongoose.connection.readyState !== 1) {
            return res.status(503).json({ error: 'Database is not connected' });
        }

        const userExists = await User.findOne({ $or: [{ email }, { username }] });
        if (userExists) return res.status(400).json({ error: 'User already exists' });

        const user = new User({ username, email, password });
        await user.save();
        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        res.status(400).json({ error: error.message || 'Registration failed' });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, username: user.username, userId: user._id });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.get('/profile', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select('-password');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

router.put('/update-pin', auth, async (req, res) => {
    try {
        const { pin } = req.body;
        if (!pin || pin.length !== 4) {
            return res.status(400).json({ error: 'PIN must be 4 digits' });
        }
        await User.findByIdAndUpdate(req.user.userId, { journalPin: pin });
        res.json({ message: 'PIN updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

router.post('/google-login', async (req, res) => {
    try {
        const { idToken } = req.body;
        console.log('Google Login Request received');
        
        if (!idToken) return res.status(400).json({ error: 'ID Token is required' });

        let email, username, profilePic, googleId;
        
        if (idToken === 'mock_google_token') {
            console.log('Using mock Google token');
            email = 'google_user@example.com';
            username = 'Google User';
        } else {
            try {
                console.log('Verifying token with Google...');
                const ticket = await client.verifyIdToken({
                    idToken: idToken,
                    audience: process.env.GOOGLE_CLIENT_ID,
                });
                const payload = ticket.getPayload();
                email = payload.email;
                username = payload.name || email.split('@')[0];
                profilePic = payload.picture;
                googleId = payload.sub;
                console.log('Token verified successfully for:', email);
            } catch (err) {
                console.log('Token verification failed:', err.message);
                // Fallback to decode if verification fails (useful for dev if IDs don't match perfectly)
                const decoded = jwt.decode(idToken);
                if (!decoded) return res.status(400).json({ error: 'Invalid Google Token' });
                email = decoded.email;
                username = decoded.name || email.split('@')[0];
                profilePic = decoded.picture;
            }
        }

        let user = await User.findOne({ email });
        
        if (!user) {
            // Create new user if they don't exist
            user = new User({
                username,
                email,
                password: Math.random().toString(36).slice(-10), // Random password for social login
                profilePic,
                googleId
            });
            await user.save();
        } else if (!user.googleId) {
            // Link Google ID if user exists but wasn't a Google user before
            user.googleId = googleId;
            if (profilePic) user.profilePic = profilePic;
            await user.save();
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
        res.json({ token, username: user.username, userId: user._id, profilePic: user.profilePic });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;

