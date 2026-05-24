const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth.middlewares');
const AudioProgress = require('../models/audioProgress.model');

/**
 * POST /api/audio/progress/:documentId
 * Save (upsert) the user's audio progress for a document.
 * Body: { currentTime: number, duration: number }
 */
router.post('/progress/:documentId', authMiddleware, async (req, res) => {
    try {
        const { currentTime, duration } = req.body;
        const userId = req.user.userId;
        const { documentId } = req.params;

        if (typeof currentTime !== 'number' || currentTime < 0) {
            return res.status(400).json({ message: 'currentTime must be a non-negative number.' });
        }

        const percentListened = duration > 0
            ? Math.min(100, Math.round((currentTime / duration) * 100))
            : 0;

        const progress = await AudioProgress.findOneAndUpdate(
            { userId, documentId },
            {
                currentTime,
                duration: duration || 0,
                percentListened,
                lastUpdated: new Date()
            },
            { upsert: true, new: true }
        );

        res.status(200).json({
            message: 'Progress saved.',
            currentTime: progress.currentTime,
            duration: progress.duration,
            percentListened: progress.percentListened
        });
    } catch (error) {
        console.error('Save audio progress error:', error);
        res.status(500).json({ message: 'Error saving progress.', error: error.message });
    }
});

/**
 * GET /api/audio/progress/:documentId
 * Retrieve the user's saved audio progress for a document.
 */
router.get('/progress/:documentId', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const { documentId } = req.params;

        const progress = await AudioProgress.findOne({ userId, documentId });

        if (!progress) {
            // No saved progress yet — return zeroed defaults
            return res.status(200).json({ currentTime: 0, duration: 0, percentListened: 0 });
        }

        res.status(200).json({
            currentTime: progress.currentTime,
            duration: progress.duration,
            percentListened: progress.percentListened,
            lastUpdated: progress.lastUpdated
        });
    } catch (error) {
        console.error('Get audio progress error:', error);
        res.status(500).json({ message: 'Error fetching progress.', error: error.message });
    }
});

/**
 * GET /api/audio/progress
 * Get progress for ALL documents for the current user (for a library view).
 */
router.get('/progress', authMiddleware, async (req, res) => {
    try {
        const userId = req.user.userId;
        const allProgress = await AudioProgress.find({ userId })
            .select('documentId currentTime duration percentListened lastUpdated')
            .sort({ lastUpdated: -1 });

        res.status(200).json(allProgress);
    } catch (error) {
        console.error('Get all progress error:', error);
        res.status(500).json({ message: 'Error fetching progress.', error: error.message });
    }
});

module.exports = router;
