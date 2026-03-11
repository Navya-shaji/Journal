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

let lastDbError = null;

if (mongoURI) {
    mongoose.connect(mongoURI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
    }).catch(err => {
        lastDbError = `Initial connection error: ${err.message}`;
    });

    mongoose.connection.on('error', err => {
        lastDbError = `Runtime connection error: ${err.message}`;
    });

    mongoose.connection.on('disconnected', () => {
    });
}

app.get('/health', (req, res) => {
    res.json({ status: 'ok', location: 'root' });
});

app.get('/api/status', (req, res) => {
    res.json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
        readyState: mongoose.connection.readyState,
        error: lastDbError,
        env: {
            hasMongoUri: !!(process.env.MONGODB_URI || process.env.MONGO_URL),
        }
    });
});

if (require.main === module) {
    app.listen(PORT, '0.0.0.0', () => {});
}

module.exports = app;
