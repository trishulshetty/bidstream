const http = require('http');
const { Server } = require('socket.io');
const app = require('./src/app');
const { createTable: createUserTable } = require('./src/models/userModel');
const { createTable: createAuctionTable } = require('./src/models/auctionModel');
const dotenv = require('dotenv');

dotenv.config();

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5001;

// Initialize Database Tables
const initDB = async () => {
    try {
        await createUserTable();
        await createAuctionTable();
        // More tables will be added here
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Error initializing database:', error);
    }
};

// Socket.io Connection Logic
io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('join_auction', (auctionId) => {
        socket.join(`auction_${auctionId}`);
        console.log(`User ${socket.id} joined auction ${auctionId}`);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

// App-wide access to io
app.set('io', io);

server.listen(PORT, async () => {
    await initDB();
    console.log(`Server Running on port ${PORT}`);
});

