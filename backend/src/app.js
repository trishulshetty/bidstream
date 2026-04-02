const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const authRoutes = require('./routes/auth');
const auctionRoutes = require('./routes/auctionRoutes');
const simulatorRoutes = require('./routes/simulatorRoutes');

const app = express();

// Rate Limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Increased limit for development/testing
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Middlewares
app.use(helmet());
app.use(limiter);
app.use(morgan('dev'));

const allowedOrigins = [
  'http://localhost:5173',
  'http://bidstream-frontend.s3-website.ap-south-1.amazonaws.com'
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
app.use(express.json());


// Routes
app.use('/api/auth', authRoutes);
app.use('/api/auctions', auctionRoutes);
app.use('/api/simulator', simulatorRoutes);


// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

module.exports = app;
