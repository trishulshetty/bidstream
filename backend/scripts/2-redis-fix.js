/**
 * BidStream — Script 2: Redis Fix (CORRECT)
 * ==========================================
 * DROP THIS IN:  backend/scripts/2-redis-fix.js
 * RUN WITH:      node scripts/2-redis-fix.js
 *
 * Connects to your REAL local-redis Docker container (port 6379).
 * Uses SETNX distributed lock + WATCH/MULTI/EXEC.
 *
 * Show this SECOND — this is the solution.
 *
 * Requires:  ioredis  (already in your backend's package.json)
 */

// ── Uses YOUR existing Redis client pattern ──────────────────
// Your backend already uses ioredis — this reuses the same setup
const Redis = require("ioredis");

const redis = new Redis({
  host: "127.0.0.1",
  port: 6379,
  lazyConnect: false,
  retryStrategy: () => null,   // don't retry — fail fast in demo
});

const R = "\x1b[31m", G = "\x1b[32m", Y = "\x1b[33m",
      C = "\x1b[36m", W = "\x1b[0m",  D = "\x1b[2m",  BOLD = "\x1b[1m";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────
// THE FIXED BID FUNCTION — with Redis distributed locking
// This is the function you add to your existing bid route/controller
// ─────────────────────────────────────────────────────────────
async function placeBid_FIXED(auctionId, bidder, amount, retry = 0) {
  const LOCK_KEY    = `auction:lock:${auctionId}`;
  const BID_KEY     = `auction:currentBid:${auctionId}`;
  const HISTORY_KEY = `auction:history:${auctionId}`;

  // ── 1. Acquire distributed lock (SETNX) ─────────────────
  // Redis is single-threaded → only ONE caller gets NX=OK
  const lockOwner = `${bidder}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const acquired  = await redis.set(LOCK_KEY, lockOwner, "NX", "PX", 5000);
  //                                                      ^^   ^^
  //                  Only set if key doesn't exist ──────┘    └── Auto-expire in 5s (deadlock protection)

  if (!acquired) {
    if (retry >= 4) {
      console.log(`${Y}[${bidder}]${W} ✗ Could not get lock after ${retry} retries`);
      return { accepted: false, reason: "lock_timeout" };
    }
    const backoff = 30 + retry * 50;   // 30ms, 80ms, 130ms, 180ms
    console.log(`${Y}[${bidder}]${W} ⏳ Lock busy, retry in ${backoff}ms... (attempt ${retry + 1})`);
    await sleep(backoff);
    return placeBid_FIXED(auctionId, bidder, amount, retry + 1);
  }

  console.log(`${C}[${bidder}]${W} 🔒 Lock acquired`);

  try {
    // ── 2. WATCH the bid key ─────────────────────────────────
    // If it changes before EXEC → transaction aborts automatically
    await redis.watch(BID_KEY);

    // ── 3. Read current bid ──────────────────────────────────
    const currentStr = await redis.get(BID_KEY);
    const current    = currentStr ? parseFloat(currentStr) : 0;
    console.log(`${C}[${bidder}]${W} READ  → current = ₹${current}, my bid = ₹${amount}`);

    // ── 4. Validate against REAL current value (not stale!) ──
    if (amount <= current) {
      await redis.unwatch();
      console.log(`${Y}[${bidder}]${W} ✗ Rejected — ₹${amount} ≤ current ₹${current}`);
      return { accepted: false, reason: "bid_too_low", current };
    }

    // ── 5. Atomic write: MULTI → queue commands → EXEC ───────
    const multi = redis.multi();
    multi.set(BID_KEY, amount.toString());
    multi.lpush(HISTORY_KEY, JSON.stringify({
      bidder,
      amount,
      timestamp: new Date().toISOString(),
    }));
    multi.expire(HISTORY_KEY, 86400);   // keep history 24h

    const result = await multi.exec();
    // result = null if WATCH detected someone else wrote first → retry

    if (!result) {
      console.log(`${Y}[${bidder}]${W} WATCH triggered → concurrent write, retrying...`);
      return placeBid_FIXED(auctionId, bidder, amount, retry + 1);
    }

    // ── 6. Persist to MongoDB (durability layer) ─────────────
    // In your real controller, call your Mongoose model here:
    //   await Bid.create({ auction: auctionId, bidder, amount });
    // We simulate the DB write with a small delay
    await sleep(5);

    console.log(`${G}[${bidder}]${W} ✅ ₹${amount} CONFIRMED — new highest bid`);
    return { accepted: true, newHighest: amount };

  } finally {
    // ── 7. Release lock — ONLY if we still own it ────────────
    // Lua script runs atomically in Redis — prevents releasing
    // a lock that expired and was grabbed by someone else
    await redis.eval(
      `if redis.call("get",KEYS[1])==ARGV[1] then return redis.call("del",KEYS[1]) else return 0 end`,
      1, LOCK_KEY, lockOwner
    );
    console.log(`${C}[${bidder}]${W} 🔓 Lock released`);
  }
}

// ─────────────────────────────────────────────────────────────
// CLEANUP helper — wipe test keys from Redis before/after
// ─────────────────────────────────────────────────────────────
async function cleanup(auctionId) {
  await redis.del(
    `auction:lock:${auctionId}`,
    `auction:currentBid:${auctionId}`,
    `auction:history:${auctionId}`
  );
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  const AUCTION_ID    = "demo-auction-001";
  const STARTING_BID  = 4500;

  console.log(`\n${"═".repeat(58)}`);
  console.log(`${BOLD}  BidStream — Redis Fix Demo  (CORRECT behavior)${W}`);
  console.log(`${"═".repeat(58)}`);

  // Check Redis is up
  try {
    await redis.ping();
    console.log(`\n${G}✅ Connected to local-redis (Docker port 6379)${W}`);
  } catch (e) {
    console.log(`\n${R}❌ Redis not reachable. Is local-redis container running?${W}`);
    console.log(`   Run: docker start local-redis`);
    process.exit(1);
  }

  await cleanup(AUCTION_ID);
  await redis.set(`auction:currentBid:${AUCTION_ID}`, STARTING_BID.toString());
  console.log(`\nAuction starts. Current bid: ₹${STARTING_BID}`);
  console.log(`\n${Y}Firing 10 concurrent bids simultaneously...${W}\n`);

  // Same 10 bids fired concurrently — Redis lock serializes them
  const results = await Promise.all([
    placeBid_FIXED(AUCTION_ID, "Alice",   5000),
    placeBid_FIXED(AUCTION_ID, "Bob",     5100),
    placeBid_FIXED(AUCTION_ID, "Charlie", 5200),
    placeBid_FIXED(AUCTION_ID, "Diana",   4800),
    placeBid_FIXED(AUCTION_ID, "Eve",     5300),
    placeBid_FIXED(AUCTION_ID, "Frank",   5150),
    placeBid_FIXED(AUCTION_ID, "Grace",   5250),
    placeBid_FIXED(AUCTION_ID, "Heidi",   4900),
    placeBid_FIXED(AUCTION_ID, "Ivan",    5400),
    placeBid_FIXED(AUCTION_ID, "Judy",    5050),
  ]);

  // ── Report ─────────────────────────────────────────────────
  const finalBid  = await redis.get(`auction:currentBid:${AUCTION_ID}`);
  const rawHist   = await redis.lrange(`auction:history:${AUCTION_ID}`, 0, -1);
  const history   = rawHist.map((h) => JSON.parse(h)).reverse();   // chronological

  console.log(`\n${"─".repeat(58)}`);
  console.log(`${BOLD}FINAL STATE:${W}`);
  console.log(`  Final highest bid : ₹${finalBid}`);
  console.log(`  Bids accepted     : ${results.filter((r) => r.accepted).length} / 10`);
  console.log(`  Bids rejected     : ${results.filter((r) => !r.accepted).length} / 10`);

  console.log(`\n  Bid history (accepted, in order):`);
  history.forEach((b, i) => {
    console.log(`    ${i + 1}. ₹${b.amount.toFixed(0).padStart(5)} — ${b.bidder}`);
  });

  // ── Integrity verification ────────────────────────────────
  console.log(`\n${BOLD}INTEGRITY CHECK:${W}`);
  let ok = true;
  for (let i = 1; i < history.length; i++) {
    if (history[i].amount <= history[i - 1].amount) {
      ok = false;
      console.log(`  ${R}✗ OUT OF ORDER: ₹${history[i].amount} after ₹${history[i - 1].amount}${W}`);
    }
  }

  if (ok) {
    console.log(`  ${G}${BOLD}✅ All bids in correct ascending order${W}`);
    console.log(`  ${G}✅ No lost updates. No race condition. No corruption.${W}`);
  }

  // ── Show Redis monitor tip ────────────────────────────────
  console.log(`\n${"─".repeat(58)}`);
  console.log(`${BOLD}💡 For the interviewer — show Redis commands live:${W}`);
  console.log(`  Open a second terminal and run:`);
  console.log(`  ${C}docker exec -it local-redis redis-cli monitor${W}`);
  console.log(`  Then re-run this script — they'll see SETNX, WATCH,`);
  console.log(`  MULTI, EXEC firing in real time.\n`);

  console.log(`${Y}▶  Now run: node scripts/3-load-test.js${W}\n`);

  await cleanup(AUCTION_ID);
  redis.disconnect();
}

main().catch((err) => {
  console.error(err);
  redis.disconnect();
});
