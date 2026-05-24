const express = require('express');
const router = express.Router();
const { signup, login, getProfile, updateDisability } = require('../controllers/auth.controllers');
const authMiddleware = require('../middlewares/auth.middlewares');

router.post('/signup', signup);
router.post('/login', login);

router.get('/profile', authMiddleware, getProfile);
router.patch('/disability', authMiddleware, updateDisability);

module.exports = router;