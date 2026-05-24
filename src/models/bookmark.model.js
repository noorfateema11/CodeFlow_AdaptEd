const mongoose = require('mongoose');

const BookmarkSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        required: true
    },
    bookmarkedAt: {
        type: Date,
        default: Date.now
    }
});

BookmarkSchema.index(
    { userId: 1, lessonId: 1 },
    { unique: true }
);

module.exports = mongoose.model('Bookmark', BookmarkSchema);