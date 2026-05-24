const express = require('express');

const multer = require('multer');

const router = express.Router();

const authMiddleware = require('../middlewares/auth.middlewares');

const {
    uploadPdf,
    getMyDocuments,
    getDocumentById
} = require('../controllers/pdf.controller');

const upload = multer({
    storage: multer.memoryStorage(),

    limits: {
        fileSize: 10 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(
                new Error('Only PDF files are allowed'),
                false
            );
        }
    }
});

router.get('/status', (req, res) => {
    res.status(200).json({
        message: 'PDF route subsystem is online'
    });
});

router.post(
    '/upload',
    authMiddleware,
    upload.single('pdf'),
    uploadPdf
);

router.get(
    '/my-documents',
    authMiddleware,
    getMyDocuments
);

router.get(
    '/:id',
    authMiddleware,
    getDocumentById
);

module.exports = router;