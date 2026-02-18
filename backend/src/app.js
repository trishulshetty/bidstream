const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctionRoutes');

const app = express();

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Middlewares
app.use(helmet());
app.use(limiter);
app.use(morgan('dev'));
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);


// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

module.exports = app;
