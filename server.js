require('dotenv').config();

const express = require('express');
const cors = require('cors');

// ── Pillar 4: Security ────────────────────────────────────────────────────────
let helmet, rateLimit;
try { helmet = require('helmet'); } catch (_) { helmet = null; }
try { rateLimit = require('express-rate-limit'); } catch (_) { rateLimit = null; }

const { sanitizeInputs } = require('./src/middlewares/security.middleware');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/auth.routes');
const lessonRoutes = require('./src/routes/lesson.routes');
const bookmarkRoutes = require('./src/routes/bookmark.routes');
const pdfRoutes = require('./src/routes/pdf.routes');
const audioRoutes = require('./src/routes/audio.routes');

const app = express();

// Helmet: sets 15+ secure HTTP headers (XSS, clickjacking, MIME sniff, etc.)
if (helmet) {
    app.use(helmet({
        crossOriginEmbedderPolicy: false,
        contentSecurityPolicy: {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
                styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
                imgSrc: ["'self'", "data:"],
                connectSrc: ["'self'"],
            }
        }
    }));
}

// Rate limiting: global 100/15min, auth 10/15min, upload 20/15min
if (rateLimit) {
    app.use(rateLimit({ windowMs: 15*60*1000, max: 100, standardHeaders: true, legacyHeaders: false }));
    app.use('/api/auth', rateLimit({ windowMs: 15*60*1000, max: 10, message: { message: 'Too many login attempts.' } }));
    app.use('/api/pdf', rateLimit({ windowMs: 15*60*1000, max: 20, message: { message: 'Upload limit reached, try again later.' } }));
}

app.use(express.json({ limit: '11mb' }));
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*', credentials: true }));

// Input sanitization (XSS + MongoDB injection prevention) — Pillar 4
app.use(sanitizeInputs);

app.use('/api/audio', audioRoutes);
connectDB();
app.use('/api/auth', authRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/bookmarks', bookmarkRoutes);
app.use('/api/pdf', pdfRoutes);

// Global error handler — never leak stack traces to client
app.use((err, req, res, next) => {
    console.error('[adaptEd Error]', err.message);
    res.status(err.status || 500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`[adaptEd] Server running on port ${PORT}`));
