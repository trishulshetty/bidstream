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

            // Get user from the token and attach to request
            // Note: MongoDB uses _id. The token was signed with { id: user._id }
            req.user = await User.findById(decoded.id);

            if (!req.user) {
                return res.status(401).json({ message: 'User no longer exists' });
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
