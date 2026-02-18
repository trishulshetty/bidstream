const db = require('../config/db');

const createTable = async () => {
    const queryText = `
    CREATE TABLE IF NOT EXISTS auctions (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      starting_price DECIMAL(12, 2) NOT NULL,
      current_price DECIMAL(12, 2) NOT NULL,
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      created_by INTEGER REFERENCES users(id),
      status VARCHAR(20) DEFAULT 'pending', -- pending, active, ended, paused
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS bids (
      id SERIAL PRIMARY KEY,
      auction_id INTEGER REFERENCES auctions(id),
      user_id INTEGER REFERENCES users(id),
      amount DECIMAL(12, 2) NOT NULL,
      bid_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_bids_auction_id ON bids(auction_id);
  `;

    try {
        await db.query(queryText);
        console.log("Auctions and Bids Tables Created/Already Exists");
    } catch (err) {
        console.error("Error creating Auctions/Bids Tables", err);
    };
};

const create = async (title, description, startingPrice, startTime, endTime, createdBy) => {
    const queryText = `
    INSERT INTO auctions (title, description, starting_price, current_price, start_time, end_time, created_by, status)
    VALUES ($1, $2, $3, $3, $4, $5, $6, 'pending')
    RETURNING *
  `;
    const { rows } = await db.query(queryText, [title, description, startingPrice, startTime, endTime, createdBy]);
    return rows[0];
};

const findById = async (id) => {
    const queryText = 'SELECT * FROM auctions WHERE id = $1';
    const { rows } = await db.query(queryText, [id]);
    return rows[0];
};

const getAll = async () => {
    const queryText = 'SELECT * FROM auctions ORDER BY created_at DESC';
    const { rows } = await db.query(queryText);
    return rows;
};

const updatePrice = async (auctionId, newPrice) => {
    const queryText = 'UPDATE auctions SET current_price = $1 WHERE id = $2 RETURNING *';
    const { rows } = await db.query(queryText, [newPrice, auctionId]);
    return rows[0];
};

module.exports = { createTable, create, findById, getAll, updatePrice };
