require('dotenv').config();
const mongoose = require('mongoose');
const Entry = require('./models/Entry');

async function check() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected!');
        const count = await Entry.countDocuments();
        console.log(`Entry count: ${count}`);
        const entries = await Entry.find().limit(5);
        console.log('Recent entries:', entries);
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}
check();
