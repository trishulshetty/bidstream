const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');

            // 1. Try to get user from Redis cache
            const { redis } = require('../utils/redis');
            const cacheKey = `user:${decoded.id}`;
            let cachedUser = null;
            
            if (redis.status === 'ready') {
                const data = await redis.get(cacheKey);
                if (data) cachedUser = JSON.parse(data);
            }

            if (cachedUser) {
                req.user = cachedUser;
            } else {
                // 2. Fallback to MongoDB
                req.user = await User.findById(decoded.id);
                if (!req.user) {
                    return res.status(401).json({ message: 'User no longer exists' });
                }
                // 3. Cache the user for 10 minutes
                if (redis.status === 'ready') {
                    await redis.set(cacheKey, JSON.stringify(req.user), 'EX', 600);
                }
            }

            next();
        } catch (error) {
            console.error('Auth Middleware Error:', error);
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

module.exports = authMiddleware;
