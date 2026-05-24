const mongoose = require('mongoose');

const LessonSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
    },
    standardContent: {
        type: String,
        required: true
    },
    accessibilityContent: {
        dyslexiaFriendlyText: { type: String },
        audioUrl: { type: String },
        videoSignLanguageUrl: { type: String },
        simplifiedText: { type: String }
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Lesson', LessonSchema);