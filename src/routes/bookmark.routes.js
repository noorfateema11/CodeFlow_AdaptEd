const express = require('express');

const router = express.Router();

const {
    toggleBookmark,
    getBookmarks
} = require('../controllers/bookmarkController');

const authMiddleware = require('../middlewares/auth.middlewares');

router.post('/toggle', authMiddleware, toggleBookmark);

router.get('/', authMiddleware, getBookmarks);

module.exports = router;