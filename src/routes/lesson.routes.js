const express = require('express');

const router = express.Router();

const {
    createLesson,
    getAllLessons
} = require('../controllers/lessonController');

const authMiddleware = require('../middlewares/auth.middlewares');

router.get('/', authMiddleware, getAllLessons);

router.post('/', createLesson);

module.exports = router;