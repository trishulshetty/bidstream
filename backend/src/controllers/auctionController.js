const Auction = require('../models/auctionModel');
const db = require('../config/db');
const { placeAtomicBid, setInitialPrice } = require('../utils/redis');

exports.createAuction = async (req, res) => {
    try {
        const { title, description, starting_price, start_time, end_time } = req.body;
        const userId = req.user.id; // From auth middleware

        const auction = await Auction.create(title, description, starting_price, start_time, end_time, userId);

        // Initialize price in Redis
        await setInitialPrice(auction.id, starting_price);

        res.status(201).json(auction);
    } catch (error) {
        res.status(500).json({ message: 'Error creating auction', error: error.message });
    }
};

exports.getAuctions = async (req, res) => {
    try {
        const auctions = await Auction.getAll();
        res.json(auctions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
};

exports.getAuctionById = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });
        res.json(auction);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching auction', error: error.message });
    }
};

exports.placeBid = async (req, res) => {
    const { id: auctionId } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;
    const io = req.app.get('io');

    try {
        // 1. Core Logic: Use Redis Lua Script for Atomicity
        const result = await placeAtomicBid(auctionId, amount, userId);

        if (result === 1) {
            // Success: Sync to PostgreSQL (Background or Transactional)
            // Here we use a standard query for the bid record
            await db.query(
                'INSERT INTO bids (auction_id, user_id, amount) VALUES ($1, $2, $3)',
                [auctionId, userId, amount]
            );

            // Update auction current price in DB
            await Auction.updatePrice(auctionId, amount);

            // 2. Real-time broadcast
            io.to(`auction_${auctionId}`).emit('new_bid', {
                auctionId,
                userId,
                amount,
                time: new Date()
            });

            return res.json({ message: 'Bid placed successfully', amount });
        } else if (result === 0) {
            return res.status(400).json({ message: 'Bid must be higher than current price' });
        } else {
            return res.status(404).json({ message: 'Auction not found in cache' });
        }
    } catch (error) {
        console.error('Bidding error:', error);
        res.status(500).json({ message: 'Error placing bid', error: error.message });
    }
};
