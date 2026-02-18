const db = require('../config/db');

const createTable = async () => {
  const queryText = `CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username VARCHAR(50) UNIQUE NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role VARCHAR(20) DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `;

  try {
    await db.query(queryText);
    console.log("Users Table Created/Already Exists");
  } catch (err) {
    console.error("Error creating User Table", err);
  };
};

const findByEmail = async (email) => {
  const queryText = 'SELECT * FROM users WHERE email = $1';
  const { rows } = await db.query(queryText, [email]);
  return rows[0];
};

const create = async (username, email, passwordHash, role = 'user') => {
  const queryText = `
    INSERT INTO users (username, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, username, email, role
  `;
  const { rows } = await db.query(queryText, [username, email, passwordHash, role]);
  return rows[0];
};

module.exports = { createTable, findByEmail, create };
