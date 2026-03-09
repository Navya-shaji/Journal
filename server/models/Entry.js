const mongoose = require('mongoose');

const entrySchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    mood: { type: String, enum: ['Happy', 'Sad', 'Neutral', 'Excited', 'Anxious'], default: 'Neutral' },
    tags: [{ type: String }],
    styling: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Entry', entrySchema);
