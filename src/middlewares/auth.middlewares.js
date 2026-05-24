const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    
    const token = req.header('Authorization');

    if (!token) {
        return res.status(401).json({ message: "No token, authorization denied" });
    }

    try {
        const decoded = jwt.verify(token.split(" ")[1] || token, process.env.JWT_SECRET || 'fallback_secret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ message: "Token is not valid" });
    }
};