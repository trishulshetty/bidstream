/**
 * BidStream - Race Condition Simulator
 * =====================================
 * Run this to SHOW THE PROBLEM (no Redis locking).
 * 
 * What you'll see: Two bidders submit at the same time.
 * Both read the same current bid, both think they're valid,
 * and the final state is WRONG (lost update problem).
 *
 * Usage:
 *   node scripts/simulate-race-condition.js
 */

// Fake in-memory "database" — simulates what your DB/Redis stores
let currentHighestBid = { amount: 4500, bidder: "start" };
let bidHistory = [];
let corruptionDetected = false;

// Colors for terminal output
const RED    = "\x1b[31m";
const GREEN  = "\x1b[32m";
const YELLOW = "\x1b[33m";
const BLUE   = "\x1b[34m";
const RESET  = "\x1b[0m";
const BOLD   = "\x1b[1m";

// Simulates a SLOW database read (network latency)
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ─────────────────────────────────────────────────────────────
// THE BROKEN BID FUNCTION (no locking, classic race condition)
// ─────────────────────────────────────────────────────────────
async function placeBidBROKEN(bidderName, bidAmount) {
  console.log(`${BLUE}[${bidderName}]${RESET} Step 1: Reading current bid from DB...`);

  // STEP 1: Read current highest bid
  const snapshot = currentHighestBid.amount; // Both bidders read THIS at same time
  console.log(`${BLUE}[${bidderName}]${RESET} Sees current bid = ₹${snapshot}`);

  // STEP 2: Simulate processing time (network, validation, etc.)
  // This is where the race condition opens up!
  await sleep(Math.random() * 100 + 50); // 50–150ms delay

  // STEP 3: Validate (based on the STALE snapshot, not current state!)
  if (bidAmount <= snapshot) {
    console.log(`${YELLOW}[${bidderName}]${RESET} Bid ₹${bidAmount} rejected (too low)`);
    return { success: false, reason: "Bid too low" };
  }

  // STEP 4: Write new highest bid (no check if someone else wrote first!)
  const previousBid = currentHighestBid.amount;
  currentHighestBid = { amount: bidAmount, bidder: bidderName };
  bidHistory.push({ bidder: bidderName, amount: bidAmount, timestamp: Date.now() });

  console.log(`${GREEN}[${bidderName}]${RESET} Bid ₹${bidAmount} ACCEPTED ✓ (overwrote ₹${previousBid})`);

  // DETECT CORRUPTION: if someone else already wrote a higher bid, we corrupted state
  if (previousBid !== snapshot) {
    corruptionDetected = true;
    console.log(
      `${RED}${BOLD}[CORRUPTION DETECTED]${RESET} ${RED}${bidderName} read ₹${snapshot} ` +
      `but actual before write was ₹${previousBid}. Lost update occurred!${RESET}`
    );
  }

  return { success: true, newHighest: bidAmount };
}

// ─────────────────────────────────────────────────────────────
// MAIN: Run multiple concurrent bids simultaneously
// ─────────────────────────────────────────────────────────────
async function runRaceConditionDemo() {
  console.log("\n" + "═".repeat(60));
  console.log(`${BOLD}  BidStream — Race Condition Demo (BROKEN, no Redis)${RESET}`);
  console.log("═".repeat(60));
  console.log(`\nStarting auction. Current bid: ₹${currentHighestBid.amount}`);
  console.log(`\n${YELLOW}Firing 5 concurrent bids at the same time...${RESET}\n`);

  const bids = [
    { bidder: "Alice",   amount: 5000 },
    { bidder: "Bob",     amount: 5100 },
    { bidder: "Charlie", amount: 5200 },
    { bidder: "Diana",   amount: 5050 }, // lower than Charlie — should be rejected IF Charlie wins
    { bidder: "Eve",     amount: 5300 },
  ];

  // Fire ALL bids at exactly the same time (Promise.all = concurrent)
  const results = await Promise.all(
    bids.map(({ bidder, amount }) => placeBidBROKEN(bidder, amount))
  );

  // ── Results ──────────────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log(`${BOLD}RESULTS:${RESET}`);
  console.log(`Final highest bid: ₹${currentHighestBid.amount} by ${currentHighestBid.bidder}`);
  console.log(`\nBid history (${bidHistory.length} accepted):`);
  bidHistory.forEach((b, i) => {
    console.log(`  ${i + 1}. ₹${b.amount} — ${b.bidder}`);
  });

  // ── Integrity check ───────────────────────────────────
  console.log("\n" + "─".repeat(60));
  console.log(`${BOLD}INTEGRITY CHECK:${RESET}`);

  // Check: is history in ascending order? (it should be if no race condition)
  let integrityOk = true;
  for (let i = 1; i < bidHistory.length; i++) {
    if (bidHistory[i].amount <= bidHistory[i - 1].amount) {
      console.log(
        `${RED}✗ BID OUT OF ORDER: ₹${bidHistory[i].amount} accepted after ` +
        `₹${bidHistory[i - 1].amount} — this should never happen!${RESET}`
      );
      integrityOk = false;
    }
  }

  // Count how many bidders got "accepted" — at most ONE should win per amount
  const accepted = results.filter((r) => r.success).length;
  console.log(`\nBids accepted: ${accepted} out of ${bids.length}`);

  if (corruptionDetected || !integrityOk) {
    console.log(`\n${RED}${BOLD}❌ DATA INTEGRITY COMPROMISED${RESET}`);
    console.log(`${RED}This is the race condition. In a real auction, this means:${RESET}`);
    console.log(`${RED}  - Wrong winner announced${RESET}`);
    console.log(`${RED}  - Revenue loss${RESET}`);
    console.log(`${RED}  - Potential legal issues${RESET}`);
  } else {
    console.log(`\n${GREEN}✓ No corruption detected (you got lucky with timing this run)${RESET}`);
    console.log(`${YELLOW}  Run again — corruption is probabilistic, not deterministic${RESET}`);
  }

  console.log(`\n${YELLOW}▶  Now run: node scripts/simulate-redis-fix.js to see the fix${RESET}\n`);
}

runRaceConditionDemo().catch(console.error);
