const Redis = require('ioredis');
const dotenv = require('dotenv');

dotenv.config();

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  retryStrategy(times) {
    if (times > 5) {
        // Stop logging every retry to keep console clean
        return null; 
    }
    return Math.min(times * 200, 2000);
  },
  maxRetriesPerRequest: null, // Critical for socket.io adapter
};

// Main client for general use
const redis = new Redis(redisConfig);

// Clients for Socket.io adapter (need separate instances)
const pubClient = new Redis(redisConfig);
const subClient = new Redis(redisConfig);

redis.on('error', (err) => console.error('Redis Error:', err.message));
pubClient.on('error', (err) => console.error('Redis Pub Error:', err.message));
subClient.on('error', (err) => console.error('Redis Sub Error:', err.message));

redis.on('connect', () => console.log('✅ Main Redis Connected'));

// Lua Script for Atomic Bidding
// KEYS[1]: auction_current_price_key (e.g., "auction:123:price")
// ARGV[1]: bid_amount
// ARGV[2]: user_id
// RETURNS: 1 if success, 0 if bid too low, -1 if auction not found/inactive
const bidScript = `
  local current_price = redis.call('GET', KEYS[1])
  if not current_price then
    -- If not in redis, we might need to seed it, but for now return -1
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
  try {
    const result = await redis.eval(bidScript, 1, `auction:${auctionId}:price`, bidAmount, userId);
    return result;
  } catch (err) {
    console.error('Redis Eval Error:', err);
    return -2; // Redis execution error
  }
};

const setInitialPrice = async (auctionId, price) => {
  await redis.set(`auction:${auctionId}:price`, price);
  // Set TTL to 24 hours to keep memory clean (optional for project)
  await redis.expire(`auction:${auctionId}:price`, 86400); 
};

module.exports = { 
  redis, 
  pubClient, 
  subClient, 
  placeAtomicBid, 
  setInitialPrice 
};

