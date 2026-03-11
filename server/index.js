require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

app.use((req, res, next) => {
    next();
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/entries', require('./routes/entries'));

app.get('/', (req, res) => {
    res.send('Journaling App Backend is running');
});

app.get('/api/ping', (req, res) => {
    res.json({ message: 'Pong!' });
});

const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URL;

if (mongoURI) {
    mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
    })
    .catch(err => {
    });
}

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        env: {
            hasMongoUri: !!(process.env.MONGODB_URI || process.env.MONGO_URL),
            nodeEnv: process.env.NODE_ENV
        }
    });
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {});
}

module.exports = app;
