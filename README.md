# BidStream - High-Concurrency Auction System

BidStream is a distributed auction platform designed to handle thousands of bids per second using horizontal scaling and atomic operations.

## Features
- **Atomic Bidding**: Redis Lua scripts ensure no race conditions during peak bidding.
- **Real-time Updates**: WebSockets (Socket.io) for live price broadcasting.
- **Transactional Integrity**: PostgreSQL for persistent ACID-compliant data storage.
- **Security**: JWT authentication, role-based access control, and rate limiting.

## Tech Stack
- **Frontend**: React + Vite + Axios + Socket.io-client
- **Backend**: Node.js + Express + PostgreSQL + Redis
- **Infra**: Docker Compose

## Getting Started

### 1. Prerequisites
- Node.js (v16+)
- Docker & Docker Compose (or local PostgreSQL and Redis)

### 2. Infrastructure Setup
If you have Docker installed, run:
```bash
docker-compose up -d
```
This will start PostgreSQL (port 5432) and Redis (port 6379).

### 3. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```
   *The server runs on http://localhost:5001*

### 4. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
   *The app runs on http://localhost:5173*

## Usage
1. Open the app and **Register** twice: one as "Auctioneer" and one as "Bidder".
2. The Auctioneer can create an auction from the Lobby.
3. The Bidder can join the auction and place bids.
4. Watch the price update in real-time across all windows!
