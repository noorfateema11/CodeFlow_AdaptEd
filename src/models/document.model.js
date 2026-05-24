const mongoose = require('mongoose');

const DocumentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    originalName: {
        type: String,
        required: true,
        trim: true
    },
    extractedText: {
        type: String,
        required: true
    },
    processedContent: {
        dyslexiaFriendly: { type: String, default: null },
        audioSummary:     { type: String, default: null },
        simplifiedText:   { type: String, default: null }
    },
    disabilityTypeAtUpload: {
        type: String,
        enum: ['none', 'dyslexia', 'blind', 'deaf', 'visual-learning'],
        default: 'none'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Document', DocumentSchema);
