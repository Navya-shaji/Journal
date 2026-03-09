require('dotenv').config();
const mongoose = require('mongoose');
const Entry = require('./models/Entry');

async function check() {
    await mongoose.connect(process.env.MONGODB_URI);
    const count = await Entry.countDocuments();
    const entries = await Entry.find().limit(5);
    console.log('--- DB Check ---');
    console.log('Total entries in DB:', count);
    console.log('Recent entries sample:', JSON.stringify(entries, null, 2));
    await mongoose.disconnect();
}
check();
