const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String, 
        required: true
    },
    disabilityType: {
        type: String,
        enum: ['none', 'dyslexia', 'blind', 'deaf', 'visual-learning'],
        default: 'none'
    },
    features: {
        type: Array,
        default: []
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('User', UserSchema);