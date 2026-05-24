const Bookmark = require('../models/bookmark.model');

exports.toggleBookmark = async (req, res) => {
    try {
        const { lessonId } = req.body;

        const userId = req.user.userId;

        const existingBookmark = await Bookmark.findOne({
            userId,
            lessonId
        });

        if (existingBookmark) {
            await Bookmark.findByIdAndDelete(
                existingBookmark._id
            );

            return res.status(200).json({
                message: "Bookmark removed successfully",
                isBookmarked: false
            });
        }

        const newBookmark = new Bookmark({
            userId,
            lessonId
        });

        await newBookmark.save();

        res.status(201).json({
            message: "Bookmark added successfully",
            isBookmarked: true,
            bookmark: newBookmark
        });
    } catch (error) {
        res.status(500).json({
            message: "Error toggling bookmark",
            error: error.message
        });
    }
};

exports.getBookmarks = async (req, res) => {
    try {
        const userId = req.user.userId;

        const bookmarks = await Bookmark.find({
            userId
        }).populate('lessonId', 'title category');

        res.status(200).json(bookmarks);
    } catch (error) {
        res.status(500).json({
            message: "Error fetching bookmarks",
            error: error.message
        });
    }
};