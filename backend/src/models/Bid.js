const mongoose = require('mongoose');

const bidSchema = new mongoose.Schema({
    auction: {
        type: mongoose.Schema.ObjectId,
        ref: 'Auction',
        required: true
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: [true, 'Please add a bid amount']
    },
    bidTime: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Bid', bidSchema);
