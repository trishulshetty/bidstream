const express = require('express');
const router = express.Router();
const auctionController = require('../controllers/auctionController');
const authMiddleware = require('../middlewares/authMiddleware');

router.get('/', auctionController.getAuctions);
router.get('/:id', auctionController.getAuctionById);

// Protected routes
router.post('/', authMiddleware, auctionController.createAuction);
router.post('/:id/bid', authMiddleware, auctionController.placeBid);

module.exports = router;
