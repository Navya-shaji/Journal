require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware (Increased limit for large scrapbook data)
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
    console.log(`📡 ${new Date().toLocaleTimeString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/entries', require('./routes/entries'));

// Health Checks
app.get('/', (req, res) => {
    res.send('Journaling App Backend is running 🚀');
});

app.get('/api/ping', (req, res) => {
    res.json({ message: 'Pong! 📶' });
});

// Database Connection
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error('❌ MONGODB_URI is not defined in environment variables');
} else {
    // Log connection attempt (hiding credentials)
    const sanitizedURI = mongoURI.replace(/\/\/.*@/, '//****:****@');
    console.log(`🔌 Attempting to connect to MongoDB: ${sanitizedURI}`);

    mongoose.connect(mongoURI)
        .then(() => console.log('✅ Connected to MongoDB'))
        .catch(err => {
            console.error('❌ MongoDB Connection Error:', err.message);
        });
}

// Conditionally listen for local development
if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}

// Export the app for Vercel functions
module.exports = app;
