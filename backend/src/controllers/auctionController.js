const Auction = require('../models/Auction');
const Bid = require('../models/Bid');
const { redis, placeAtomicBid, setInitialPrice } = require('../utils/redis');

// @desc    Create new auction
// @route   POST /api/auctions
// @access  Private (Auctioneer)
exports.createAuction = async (req, res) => {
    try {
        const { title, description, starting_price, start_time, end_time } = req.body;
        const userId = (req.user.id || req.user._id)?.toString();
        
        // Enforce auctioneer role on backend
        if (req.user.role !== 'auctioneer') {
            return res.status(403).json({ message: 'Only auctioneers can create auctions' });
        }

        const pin = Math.floor(100000 + Math.random() * 900000).toString();

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
                await redis.del('auctions:all'); // Clear cache
            } catch (redisErr) {
                console.warn('Failed to sync with Redis:', redisErr.message);
            }
        }

        res.status(201).json({
            id: auction._id,
            title: auction.title,
            description: auction.description,
            starting_price: auction.startingPrice,
            current_price: auction.currentPrice,
            start_time: auction.startTime,
            end_time: auction.endTime,
            status: auction.status,
            pin: auction.pin
        });
    } catch (error) {
        console.error('Create Auction Error:', error);
        res.status(500).json({ message: 'Error creating auction', error: error.message });
    }
};

// @desc    Get auctions owned by the user (with pins)
// @route   GET /api/auctions/owned
// @access  Private (Auctioneer)
exports.getMyAuctions = async (req, res) => {
    try {
        const userId = (req.user.id || req.user._id)?.toString();
        const auctions = await Auction.find({ createdBy: userId }).sort({ createdAt: -1 });
        const modifiedAuctions = auctions.map(a => ({
            id: a._id,
            title: a.title,
            description: a.description,
            current_price: a.currentPrice,
            start_time: a.startTime,
            end_time: a.endTime,
            status: a.status,
            pin: a.pin // Return pin for the owner
        }));
        res.json(modifiedAuctions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching your auctions', error: error.message });
    }
};

// @desc    Get all auctions
// @route   GET /api/auctions
// @access  Public
exports.getAuctions = async (req, res) => {
    try {
        // Try to get from Cache first
        const cacheKey = 'auctions:all';
        if (redis.status === 'ready') {
            const cachedAuctions = await redis.get(cacheKey);
            if (cachedAuctions) {
                return res.json(JSON.parse(cachedAuctions));
            }
        }

        const auctions = await Auction.find().sort({ createdAt: -1 });
        const modifiedAuctions = auctions.map(a => ({
            id: a._id,
            title: a.title,
            description: a.description,
            current_price: a.currentPrice,
            start_time: a.startTime,
            end_time: a.endTime,
            status: a.status
        }));

        // Cache for 60 seconds
        if (redis.status === 'ready') {
            await redis.set(cacheKey, JSON.stringify(modifiedAuctions), 'EX', 60);
        }

        res.json(modifiedAuctions);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching auctions', error: error.message });
    }
};

// @desc    Get single auction
// @route   GET /api/auctions/:id
// @access  Public (but private for owner to get PIN)
exports.getAuctionById = async (req, res) => {
    try {
        const auction = await Auction.findById(req.params.id);
        if (!auction) return res.status(404).json({ message: 'Auction not found' });

        // Get latest price from Redis for maximum speed
        let currentPrice = auction.currentPrice;
        if (redis.status === 'ready') {
            const redisPrice = await redis.get(`auction:${req.params.id}:price`);
            if (redisPrice) currentPrice = parseFloat(redisPrice);
        }

        const requesterId = req.user.id || req.user._id?.toString();
        const isOwner = auction.createdBy.toString() === requesterId;
        
        let winner = null;
        if (auction.status === 'ended' || auction.status === 'active') {
             // Always check for the highest bid to show the current "leader" or final "winner"
             const topBid = await Bid.findOne({ auction: auction._id })
                 .sort({ amount: -1 })
                 .populate('user', 'username');
             
             if (topBid) {
                 winner = {
                     username: topBid.user.username,
                     amount: topBid.amount,
                     userId: topBid.user._id
                 };
             }
        }

        const result = {
            id: auction._id,
            title: auction.title,
            description: auction.description,
            starting_price: auction.startingPrice,
            current_price: currentPrice,
            start_time: auction.startTime,
            end_time: auction.endTime,
            status: auction.status,
            pin: isOwner ? auction.pin : undefined,
            isOwner,
            winner
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
    const userId = req.user.id || req.user._id?.toString();
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
            username: req.user.username,
            amount,
            time: new Date()
        });

        // Clear listing cache for updated prices
        if (redis.status === 'ready') await redis.del('auctions:all');

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
        const userId = req.user.id || req.user._id?.toString();
        if (auction.createdBy.toString() !== userId) {
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

        // Clear listing cache for updated status
        const { redis } = require('../utils/redis');
        if (redis.status === 'ready') await redis.del('auctions:all');

        res.json({ message: 'Auction ended successfully', status: 'ended' });
    } catch (error) {
        res.status(500).json({ message: 'Error ending auction', error: error.message });
    }
};
