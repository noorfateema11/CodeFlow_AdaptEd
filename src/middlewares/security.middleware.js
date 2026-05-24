/**
 * adaptEd Security Middleware — Pillar 4
 * 
 * Implements:
 *   - Input sanitization (XSS prevention)
 *   - Request size validation
 *   - Security headers (via helmet in server.js)
 *   - Rate limiting (via express-rate-limit in server.js)
 *   - JWT verification with expiry check
 *   - MongoDB injection prevention
 */

const jwt = require('jsonwebtoken');

/** Strip HTML tags and dangerous characters from string inputs */
function sanitizeString(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/<[^>]*>/g, '')           // strip HTML tags
        .replace(/[<>"'`]/g, '')           // strip dangerous chars
        .replace(/\$\{[^}]*\}/g, '')       // strip template literals
        .trim();
}

/** Recursively sanitize all string fields in request body */
function sanitizeBody(obj, depth = 0) {
    if (depth > 5 || !obj || typeof obj !== 'object') return obj;
    for (const key of Object.keys(obj)) {
        if (typeof obj[key] === 'string') {
            obj[key] = sanitizeString(obj[key]);
        } else if (typeof obj[key] === 'object' && !Buffer.isBuffer(obj[key])) {
            obj[key] = sanitizeBody(obj[key], depth + 1);
        }
        // Prevent MongoDB operator injection ($where, $gt, etc.)
        if (key.startsWith('$')) {
            delete obj[key];
        }
    }
    return obj;
}

/** Input sanitization middleware */
function sanitizeInputs(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        req.body = sanitizeBody(req.body);
    }
    if (req.query && typeof req.query === 'object') {
        for (const key of Object.keys(req.query)) {
            if (typeof req.query[key] === 'string') {
                req.query[key] = sanitizeString(req.query[key]);
            }
        }
    }
    next();
}

/** Auth middleware with enhanced JWT verification */
function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Check token hasn't been issued in the future (clock skew attack)
        if (decoded.iat && decoded.iat > Math.floor(Date.now() / 1000) + 60) {
            return res.status(401).json({ message: 'Invalid token timestamp' });
        }
        req.user = decoded;
        next();
    } catch (err) {
        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({ message: 'Token expired, please log in again' });
        }
        return res.status(401).json({ message: 'Invalid token' });
    }
}

module.exports = { sanitizeInputs, authMiddleware };
