const Redis = require('ioredis');
const { redis: mainRedis } = require('../utils/redis');

// Sleep utility for simulating network delay in naive logic
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Lua Script for Atomic Bidding (Same as in benchmark.js)
const ATOMIC_BID_LUA = `
  local current_price = tonumber(redis.call('GET', KEYS[1]) or 0)
  local bid_amount = tonumber(ARGV[1])
  local user = ARGV[2]

  if bid_amount > current_price then
    redis.call('SET', KEYS[1], bid_amount)
    local history_item = '{"user":"' .. user .. '","amount":' .. bid_amount .. ',"ts":' .. ARGV[3] .. '}'
    redis.call('LPUSH', KEYS[2], history_item)
    return 1 -- SUCCESS
  else
    return 0 -- REJECTED
  end
`;

exports.runSimulation = async (req, res) => {
    const io = req.app.get('io');
    const BIDS_COUNT = parseInt(req.query.count) || 1000;
    const BASE_PRICE = 5000;
    
    // Generate randomized bids
    const allBids = Array.from({ length: BIDS_COUNT }, (_, i) => ({
        user: `Bidder-${String(i + 1).padStart(3, '0')}`,
        amount: BASE_PRICE + Math.floor(Math.random() * 10000) + 1,
    }));

    // --- Scenario 1: Naive Logic ---
    let memoryDB = { price: BASE_PRICE, history: [] };
    let lostUpdates = 0;

    async function placeBidNaive(user, amount) {
        const current = memoryDB.price;
        // Simulate network delay
        await sleep(Math.random() * 20 + 5);
        
        if (amount > current) {
            const actualPriceBeforeWrite = memoryDB.price;
            memoryDB.price = amount;
            memoryDB.history.push({ user, amount, ts: Date.now() });
            if (actualPriceBeforeWrite !== current) {
                lostUpdates++;
            }
            return true;
        }
        return false;
    }

    // --- Scenario 2: Redis ACID ---
    const PRICE_KEY = "sim:auction:price";
    const HIST_KEY = "sim:auction:history";
    
    if (mainRedis.status !== 'ready') {
        return res.status(500).json({ message: "Redis is not connected" });
    }

    await mainRedis.set(PRICE_KEY, BASE_PRICE);
    await mainRedis.del(HIST_KEY);

    async function placeBidRedis(user, amount) {
        const result = await mainRedis.eval(ATOMIC_BID_LUA, 2, PRICE_KEY, HIST_KEY, amount, user, Date.now());
        return result === 1;
    }

    // Run Naive Simulation
    io.emit('sim_progress', { stage: 'naive', progress: 0 });
    const naiveStart = Date.now();
    // We run in chunks or with a small delay to not block the event loop entirely if possible, 
    // but Promise.all is fine for 1000.
    await Promise.all(allBids.map(async (b, idx) => {
        await placeBidNaive(b.user, b.amount);
        if (idx % 100 === 0) io.emit('sim_progress', { stage: 'naive', progress: (idx / BIDS_COUNT) * 100 });
    }));
    const naiveTime = Date.now() - naiveStart;

    // Run Redis Simulation
    io.emit('sim_progress', { stage: 'redis', progress: 0 });
    const redisStart = Date.now();
    await Promise.all(allBids.map(async (b, idx) => {
        await placeBidRedis(b.user, b.amount);
        if (idx % 100 === 0) io.emit('sim_progress', { stage: 'redis', progress: (idx / BIDS_COUNT) * 100 });
    }));
    const redisTime = Date.now() - redisStart;

    // Verify Integrity
    const checkIntegrity = (history) => {
        let errors = 0;
        for (let i = 1; i < history.length; i++) {
            if (history[i].amount <= history[i - 1].amount) errors++;
        }
        return errors;
    };

    const naiveIntegErrors = checkIntegrity(memoryDB.history);
    
    const rawRedisHist = await mainRedis.lrange(HIST_KEY, 0, -1);
    const redisHistory = rawRedisHist.map(h => JSON.parse(h)).reverse();
    const redisIntegErrors = checkIntegrity(redisHistory);
    const finalRedisPrice = await mainRedis.get(PRICE_KEY);

    const report = {
        summary: {
            bidsCount: BIDS_COUNT,
            basePrice: BASE_PRICE
        },
        naive: {
            timeMs: naiveTime,
            throughput: (BIDS_COUNT / (naiveTime / 1000)).toFixed(0),
            lostUpdates,
            integrityErrors: naiveIntegErrors,
            finalPrice: memoryDB.price
        },
        redis: {
            timeMs: redisTime,
            throughput: (BIDS_COUNT / (redisTime / 1000)).toFixed(0),
            lostUpdates: 0,
            integrityErrors: redisIntegErrors,
            finalPrice: parseInt(finalRedisPrice)
        }
    };

    io.emit('sim_complete', report);
    res.json(report);
};
