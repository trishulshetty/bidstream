/**
 * BidStream - Redis Bid Route
 * ============================
 * Drop this into your Express backend.
 * Replace your existing bid route with this.
 *
 * File: src/routes/bidRoute.js  (or wherever your bid routes live)
 *
 * Requires:
 *   npm install ioredis
 *   Docker: docker run -d --name bidstream-redis -p 6379:6379 redis:alpine
 */

const express = require("express");
const router  = express.Router();
const Redis   = require("ioredis");

// ── Redis client ──────────────────────────────────────────────
const redis = new Redis(process.env.REDIS_URL || "redis://localhost:6379");

redis.on("connect", () => console.log("✅ Redis connected"));
redis.on("error",   (e) => console.error("Redis error:", e.message));

// ─────────────────────────────────────────────────────────────
// Core bid processor (same logic as the simulation scripts)
// ─────────────────────────────────────────────────────────────
// Use the central redis utility if possible, but keep this file stand-alone for the demo if needed.
// However, since we have src/utils/redis.js, we should use that logic.
const { placeAtomicBid } = require("../utils/redis");

async function placeBidWithRedis(auctionId, bidderId, bidAmount, retryCount = 0) {
  // We use the central placeAtomicBid which uses a Lua script for 100% atomicity
  const result = await placeAtomicBid(auctionId, bidAmount, bidderId);
  
  // result = 1 (success), 0 (bid too low), -1 (auction not found), -2 (error)
  if (result === 1) {
    return { success: true, newHighest: bidAmount };
  } else if (result === 0) {
    return { success: false, reason: "Bid must be higher than current price" };
  } else {
    return { success: false, reason: "Auction error or internal failure" };
  }
}

// ─────────────────────────────────────────────────────────────
// GET /api/bids/:auctionId — get current bid + recent history
// ─────────────────────────────────────────────────────────────
router.get("/:auctionId", async (req, res) => {
  try {
    const { auctionId } = req.params;
    const bidKey     = `auction:currentBid:${auctionId}`;
    const historyKey = `auction:history:${auctionId}`;

    const [currentBid, rawHistory] = await Promise.all([
      redis.get(bidKey),
      redis.lrange(historyKey, 0, 9), // last 10 bids
    ]);

    const history = rawHistory.map((h) => JSON.parse(h));

    res.json({
      auctionId,
      currentBid: currentBid ? parseFloat(currentBid) : null,
      history,
    });
  } catch (err) {
    console.error("GET bid error:", err);
    res.status(500).json({ error: "Failed to fetch bid data" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/bids/:auctionId — place a bid
// ─────────────────────────────────────────────────────────────
router.post("/:auctionId", async (req, res) => {
  try {
    const { auctionId } = req.params;
    const { amount }    = req.body;

    // Get authenticated user from middleware
    // (assumes you have auth middleware setting req.user)
    const bidderId = req.user?.id || req.body.bidderId;

    // ── Input validation ──────────────────────────────────────
    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ error: "Invalid bid amount" });
    }

    if (!bidderId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    // ── Idempotency: prevent duplicate bids ──────────────────
    const idempotencyKey = `bid:idempotency:${req.headers["x-idempotency-key"] || ""}`;
    if (req.headers["x-idempotency-key"]) {
      const cached = await redis.get(idempotencyKey);
      if (cached) {
        return res.json(JSON.parse(cached)); // return cached result
      }
    }

    // ── Process bid with Redis lock ───────────────────────────
    const result = await placeBidWithRedis(auctionId, bidderId, parseFloat(amount));

    // Cache idempotency result for 5 minutes
    if (req.headers["x-idempotency-key"]) {
      await redis.set(idempotencyKey, JSON.stringify(result), "EX", 300);
    }

    if (!result.success) {
      return res.status(409).json({ error: result.reason, currentBid: result.currentBid });
    }

    // ── Emit real-time update via Socket.io ──────────────────
    // (assumes you pass io via app.get("io") or similar)
    // const io = req.app.get("io");
    // if (io) {
    //   io.to(auctionId).emit("bid:new", {
    //     auctionId,
    //     amount: result.newHighest,
    //     bidderId,
    //     timestamp: new Date().toISOString(),
    //   });
    // }

    return res.status(201).json({
      message:    "Bid placed successfully",
      newHighest: result.newHighest,
      auctionId,
      bidderId,
    });

  } catch (err) {
    console.error("POST bid error:", err);
    res.status(500).json({ error: "Failed to process bid" });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/bids/:auctionId/init — initialize auction starting bid
// Call this when you create a new auction
// ─────────────────────────────────────────────────────────────
router.post("/:auctionId/init", async (req, res) => {
  try {
    const { auctionId }   = req.params;
    const { startingBid } = req.body;

    const bidKey = `auction:currentBid:${auctionId}`;

    // Only set if not already set (NX)
    const set = await redis.set(bidKey, startingBid.toString(), "NX");

    if (!set) {
      return res.status(409).json({ error: "Auction already initialized" });
    }

    res.json({ message: "Auction initialized", auctionId, startingBid });
  } catch (err) {
    res.status(500).json({ error: "Failed to initialize auction" });
  }
});

module.exports = router;
