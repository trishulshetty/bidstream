# High-Concurrency Auction System

A robust, distributed auction platform designed to handle thousands of bids per second while preventing race conditions, deadlocks, and data corruption.

## System Architecture

- Frontend: React.js (Real-time updates via WebSockets)
- Backend: Node.js + Express
- Database: PostgreSQL (Transactional integrity/ACID)
- High-Speed Layer: Redis (Atomic Lua scripts & Pub/Sub)
- Reverse Proxy: Nginx (Load balancing)

## Solving Concurrency Challenges

### 1. Race Conditions (The "Double Spend" Problem)
To prevent two users from winning the same auction at the same millisecond, we implement Redis Atomic Execution.
- Solution: Lua Scripts. Redis executes these scripts as a single atomic operation, ensuring no other command can interfere during the price check and update.

### 2. Deadlocks
We prevent circular waiting by implementing Resource Ordering. 
- Protocol: Transactions always acquire locks in a strict global order: Auction_Item first, then User_Wallet.

### 3. Main Thread Blocking
CPU-intensive tasks (like PDF invoice generation) are offloaded to Worker Threads or a message queue to keep the Node.js event loop responsive for new bids.

## Key Features
- Optimistic/Pessimistic Locking: Using PostgreSQL SELECT FOR UPDATE.
- Idempotency: Unique request keys to prevent duplicate bids from lag.
- Rate Limiting: Token Bucket algorithm to stop bot spam.
- Real-time: Instant price broadcasting via Socket.io.

