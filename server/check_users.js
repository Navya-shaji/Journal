require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function check() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find().select('username email _id');
        console.log('Registered Users:', users);
    } catch (err) {
        console.error('Check failed:', err);
    } finally {
        await mongoose.disconnect();
    }
}
check();
