const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { redis, placeAtomicBid, setInitialPrice } = require('../utils/redis');

// @desc    Create new auction
// @route   POST /api/auctions
// @access  Private (Auctioneer)
exports.createAuction = async (req, res) => {
    try {
        const { title, description, starting_price, start_time, end_time } = req.body;
        const userId = req.user.id; const pin = Math.floor(100000 + Math.random() * 900000).toString();

        const auction = await Auction.create({
            title,
            description,
            startingPrice: starting_price,
            currentPrice: starting_price,
            startTime: start_time,
            endTime: end_time,
            createdBy: userId,
            pin
        });
        // Initialize price in Redis if connected
        if (redis.status === 'ready') {
            try {
                await setInitialPrice(auction._id.toString(), starting_price);
            } catch (redisErr) {
                console.warn('Failed to sync with Redis:', redisErr.message);
            }
        }

        res.status(201).json(auction);
    } catch (error) {
        res.status(500).json({ message: 'Error creating auction', error: error.message });
    }
};

// @desc    Get all auctions
// @route   GET /api/auctions
// @access  Public
exports.getAuctions = async (req, res) => {
    try {
        const auctions = await Auction.find().sort({ createdAt: -1 });
        // Map fields to match frontend expectations if necessary
        const modifiedAuctions = auctions.map(a => ({
            id: a._id,
            title: a.title,
            description: a.description,
            current_price: a.currentPrice,
            start_time: a.startTime,
            end_time: a.endTime,
            status: a.status
        }));
        res.json(modifiedAuctions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
};

// @desc    Get single auction
// @route   GET /api/auctions/:id
// @access  Public
exports.getAuctionById = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        // Match frontend field names and exclude PIN for security
        const { pin: auctionPin, ...rest } = auction._doc;
        const result = {
            id: auction._id,
            ...rest,
            current_price: auction.currentPrice
        };

        res.json(result);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching auction', error: error.message });
    }
};

// @desc    Place a bid
// @route   POST /api/auctions/:id/bid
// @access  Private (Bidder)
exports.placeBid = async (req, res) => {
    const { id: auctionId } = req.params;
    const { amount } = req.body;
    const userId = req.user.id;
    const io = req.app.get('io');

    try {
        const auction = await Auction.findById(auctionId);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        // Simple validation if Redis is not active
        if (amount <= auction.currentPrice) {
            return res.status(400).json({ message: 'Bid must be higher than current price' });
        }

        let redisSuccess = false;
        // 1. Optional: Use Redis for atomicity if available
        if (redis.status === 'ready') {
            try {
                const result = await placeAtomicBid(auctionId, amount, userId);
                if (result === 1) redisSuccess = true;
                else if (result === 0) return res.status(400).json({ message: 'Bid too low (sync error)' });
            } catch (redisErr) {
                console.warn('Redis bid failed, falling back to MongoDB:', redisErr.message);
            }
        }

        // 2. Persistent Save (MongoDB)
        // If Redis isn't used, we should ideally use a transaction here, 
        // but for simplicity in this dev stage:
        auction.currentPrice = amount;
        await auction.save();

        await Bid.create({
            auction: auctionId,
            user: userId,
            amount: amount
        });

        // 3. Real-time broadcast
        io.to(`auction_${auctionId}`).emit('new_bid', {
            auctionId,
            userId,
            amount,
            time: new Date()
        });

        return res.json({ message: 'Bid placed successfully', amount });

    } catch (error) {
        console.error('Bidding error:', error);
        res.status(500).json({ message: 'Error placing bid', error: error.message });
    }
};

// @desc    End/Stop auction
// @route   POST /api/auctions/:id/end
// @access  Private (Auctioneer)
exports.endAuction = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        // Only owner can end
        if (auction.createdBy.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        auction.status = 'ended';
        await auction.save();

        // Broadcast to all users in the room
        const io = req.app.get('io');
        io.to(`auction_${req.params.id}`).emit('auction_status_update', {
            auctionId: req.params.id,
            status: 'ended'
        });

        res.json({ message: 'Auction ended successfully', status: 'ended' });
    } catch (error) {
        res.status(500).json({ message: 'Error ending auction', error: error.message });
    }
};
