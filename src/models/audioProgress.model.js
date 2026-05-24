const mongoose = require('mongoose');

const AudioProgressSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document',
        required: true,
        index: true
    },
    currentTime: {
        type: Number,
        default: 0,
        min: 0
    },
    duration: {
        type: Number,
        default: 0,
        min: 0
    },
    // Percentage listened (0–100), computed from currentTime/duration
    percentListened: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
});

// Compound unique index so each user has one progress record per document
AudioProgressSchema.index({ userId: 1, documentId: 1 }, { unique: true });

module.exports = mongoose.model('AudioProgress', AudioProgressSchema);
