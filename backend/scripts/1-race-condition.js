/**
 * BidStream — Script 1: Race Condition Demo (BROKEN)
 * ===================================================
 * DROP THIS IN:  backend/scripts/1-race-condition.js
 * RUN WITH:      node scripts/1-race-condition.js
 *
 * No Redis. No locks. Shows exactly what goes wrong
 * when 10 bidders hit your auction at the same time.
 *
 * Show this to the interviewer FIRST — this is the problem.
 */

const R = "\x1b[31m", G = "\x1b[32m", Y = "\x1b[33m",
      B = "\x1b[34m", W = "\x1b[0m",  D = "\x1b[2m",  BOLD = "\x1b[1m";

// ── Fake in-memory DB (simulates your MongoDB document) ──────
let auctionState = {
  currentBid:    4500,
  currentBidder: "no one",
};
let acceptedBids = [];       // bids that "went through"
let corruptionCount = 0;

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ─────────────────────────────────────────────────────────────
// THE BROKEN BID FUNCTION — what happens WITHOUT Redis locking
// ─────────────────────────────────────────────────────────────
async function placeBid_BROKEN(bidder, amount) {
  // STEP 1 — Read current bid from "DB"
  // All 10 bidders do this at the SAME time → all see ₹4500
  const snapshot = auctionState.currentBid;
  console.log(`${B}[${bidder}]${W} READ  → current bid = ₹${snapshot}`);

  // STEP 2 — Simulate network/processing delay
  // This is the danger window — anyone can write before us
  await sleep(Math.random() * 150 + 50);   // 50–200ms gap

  // STEP 3 — Validate against the STALE snapshot (not real current)
  if (amount <= snapshot) {
    console.log(`${Y}[${bidder}]${W} SKIP  → ₹${amount} too low vs snapshot ₹${snapshot}`);
    return { accepted: false };
  }

  // STEP 4 — Write without checking if someone else wrote first!
  const truePrevious = auctionState.currentBid;   // actual value right now
  auctionState.currentBid    = amount;
  auctionState.currentBidder = bidder;
  acceptedBids.push({ bidder, amount, at: Date.now() });

  if (truePrevious !== snapshot) {
    // We validated against ₹4500 but overwrote ₹${truePrevious} — WRONG
    corruptionCount++;
    console.log(
      `${R}${BOLD}[RACE!]${W}${R} ${bidder} validated vs ₹${snapshot} ` +
      `but overwrote ₹${truePrevious} — LOST UPDATE${W}`
    );
  } else {
    console.log(`${G}[${bidder}]${W} WRITE → ₹${amount} accepted (prev ₹${truePrevious})`);
  }

  return { accepted: true, amount };
}

// ─────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${"═".repeat(58)}`);
  console.log(`${BOLD}  BidStream — Race Condition Demo  (NO Redis, BROKEN)${W}`);
  console.log(`${"═".repeat(58)}`);
  console.log(`\nAuction starts. Current bid: ₹${auctionState.currentBid}`);
  console.log(`\n${Y}Firing 10 concurrent bids simultaneously...${W}\n`);

  // All bids fire at the exact same moment → Promise.all
  await Promise.all([
    placeBid_BROKEN("Alice",   5000),
    placeBid_BROKEN("Bob",     5100),
    placeBid_BROKEN("Charlie", 5200),
    placeBid_BROKEN("Diana",   4800),  // should be rejected
    placeBid_BROKEN("Eve",     5300),
    placeBid_BROKEN("Frank",   5150),
    placeBid_BROKEN("Grace",   5250),
    placeBid_BROKEN("Heidi",   4900),  // should be rejected
    placeBid_BROKEN("Ivan",    5400),
    placeBid_BROKEN("Judy",    5050),
  ]);

  // ── Report ─────────────────────────────────────────────────
  console.log(`\n${"─".repeat(58)}`);
  console.log(`${BOLD}FINAL STATE:${W}`);
  console.log(`  Winner declared: ${auctionState.currentBidder} @ ₹${auctionState.currentBid}`);
  console.log(`  Bids accepted  : ${acceptedBids.length}`);

  console.log(`\n${BOLD}INTEGRITY CHECK:${W}`);

  // Bids must be strictly ascending — any violation = corruption
  let violations = 0;
  for (let i = 1; i < acceptedBids.length; i++) {
    if (acceptedBids[i].amount <= acceptedBids[i - 1].amount) {
      violations++;
      console.log(
        `  ${R}✗ OUT OF ORDER: ₹${acceptedBids[i].amount} accepted ` +
        `after ₹${acceptedBids[i - 1].amount}${W}`
      );
    }
  }

  if (corruptionCount > 0 || violations > 0) {
    console.log(`\n  ${R}${BOLD}❌ DATA CORRUPTED${W}`);
    console.log(`  ${R}  Race conditions : ${corruptionCount}${W}`);
    console.log(`  ${R}  Order violations: ${violations}${W}`);
    console.log(`\n  ${R}In a real auction this means:${W}`);
    console.log(`  ${R}  • Wrong winner gets the item${W}`);
    console.log(`  ${R}  • Lower bid overwrote a higher one${W}`);
    console.log(`  ${R}  • Revenue loss + legal liability${W}`);
  } else {
    console.log(`  ${Y}No corruption this run — try again, it's probabilistic${W}`);
  }

  console.log(`\n${Y}▶  Now run: node scripts/2-redis-fix.js${W}\n`);
}

main().catch(console.error);
