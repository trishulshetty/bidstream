const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const dotenv = require('dotenv');
const connectMongoDB = require('./src/config/mongo');

// Only keeping these for reference if you still want Postgres for auctions,
// but for now we focus on MongoDB for Auth as requested.
// const { createTable: createUserTable } = require('./src/models/userModel');
// const { createTable: createAuctionTable } = require('./src/models/auctionModel');

dotenv.config();

// Connect to MongoDB
connectMongoDB();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5001;

// Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_auction', async ({ auctionId, pin }) => {
        try {
            const Auction = require('./src/models/Auction');
            const auction = await Auction.findById(auctionId);

            if (!auction) {
                return socket.emit('error', { message: 'Auction not found' });
            }

            if (auction.pin !== pin) {
                return socket.emit('join_failed', { message: 'Incorrect PIN' });
            }

            socket.join(`auction_${auctionId}`);
            socket.emit('join_success', { auctionId, pin: auction.pin });
            console.log(`User ${socket.id} joined auction ${auctionId} with correct PIN`);
        } catch (error) {
            console.error('Socket join error:', error);
            socket.emit('error', { message: 'Internal server error' });
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// App-wide access to io
app.set('io', io);

server.listen(PORT, async () => {
    console.log(`Server Running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
