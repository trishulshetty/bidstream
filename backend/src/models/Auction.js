const mongoose = require('mongoose');

const auctionSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please add a title'],
        trim: true
    },
    description: {
        type: String,
        required: [true, 'Please add a description']
    },
    startingPrice: {
        type: Number,
        required: [true, 'Please add a starting price']
    },
    currentPrice: {
        type: Number,
        default: function () {
            return this.startingPrice;
        }
    },
    startTime: {
        type: Date,
        required: [true, 'Please add a start time']
    },
    endTime: {
        type: Date,
        required: [true, 'Please add an end time']
    },
    createdBy: {
        type: mongoose.Schema.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'ended', 'paused'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Auction', auctionSchema);
