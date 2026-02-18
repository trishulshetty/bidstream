const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
});

redis.on('error', (err) => {
    console.error('Redis Error:', err);
});

redis.on('connect', () => {
    console.log('Connected to Redis');
});

// Lua Script for Atomic Bidding
// KEYS[1]: auction_current_price_key (e.g., "auction:123:price")
// ARGV[1]: bid_amount
// ARGV[2]: user_id
// RETURNS: 1 if success, 0 if bid too low, -1 if auction not found/inactive
const bidScript = `
  local current_price = redis.call('GET', KEYS[1])
  if not current_price then
    return -1
  end
  
  if tonumber(ARGV[1]) > tonumber(current_price) then
    redis.call('SET', KEYS[1], ARGV[1])
    -- Store last bidder for this auction
    redis.call('SET', KEYS[1] .. ':last_bidder', ARGV[2])
    return 1
  else
    return 0
  end
`;

const placeAtomicBid = async (auctionId, bidAmount, userId) => {
    const result = await redis.eval(bidScript, 1, `auction:${auctionId}:price`, bidAmount, userId);
    return result;
};

const setInitialPrice = async (auctionId, price) => {
    await redis.set(`auction:${auctionId}:price`, price);
};

module.exports = { redis, placeAtomicBid, setInitialPrice };
