/**
 * 📊 BidStream — Redis Real-Time Stats
 * =====================================
 * This script provides a live dashboard of your Redis state.
 * Run this in a separate terminal during your demo.
 *
 * It monitors:
 * - Active auctions in Redis
 * - Current highest prices
 * - Last 5 bidders for each auction
 *
 * RUN: node scripts/stats.js
 */

const Redis = require('ioredis');

const R = "\x1b[31m", G = "\x1b[32m", Y = "\x1b[33m",
      B = "\x1b[34m", M = "\x1b[35m", C = "\x1b[36m",
      W = "\x1b[0m",  BOLD = "\x1b[1m", DIM = "\x1b[2m", INV = "\x1b[7m";

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
});

async function getStats() {
  process.stdout.write('\x1Bc'); // Clear screen
  console.log(`${BOLD}${INV}      BIDSTREAM REDIS MONITOR      ${W}  [${new Date().toLocaleTimeString()}]`);
  console.log(`─`.repeat(56));

  try {
    const keys = await redis.keys('auction:*:price');
    
    if (keys.length === 0) {
      console.log(`\n  ${DIM}No active auctions found in Redis.${W}`);
      console.log(`  ${DIM}Try running 'npm run benchmark' to seed data.${W}\n`);
    } else {
      console.log(`\n  ${BOLD}${C}ACTIVE AUCTIONS:${W}\n`);
      
      for (const key of keys) {
        const auctionId = key.split(':')[1];
        const price = await redis.get(key);
        const lastBidder = await redis.get(`${key}:last_bidder`) || "no one";
        
        // Key logic from utils/redis.js uses auction:${auctionId}:price
        // and also auction:history:${auctionId} from my scripts.
        // Let's try to find history too.
        const historyKey = `auction:history:${auctionId}`;
        const rawHist = await redis.lrange(historyKey, 0, 4);
        const history = rawHist.map(h => JSON.parse(h));

        console.log(`  ${BOLD}${B}ID:${W} ${auctionId.padEnd(20)} ${BOLD}${G}TOP PRICE: ₹${price}${W}`);
        console.log(`  ${DIM}Last Bidder: ${lastBidder}${W}`);
        
        if (history.length > 0) {
          console.log(`  ${DIM}Recent Bids:${W}`);
          history.forEach((b, i) => {
            console.log(`    ${i+1}. ${b.bidder || b.user} @ ₹${b.amount}`);
          });
        }
        console.log(`─`.repeat(56));
      }
    }
  } catch (err) {
    console.log(`${R}Error connecting to Redis: ${err.message}${W}`);
  }

  setTimeout(getStats, 2000); // Refresh every 2 seconds
}

console.log(`${G}Starting monitor...${W}`);
getStats();
