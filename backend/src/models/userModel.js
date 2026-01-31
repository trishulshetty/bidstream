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

  try{
    await db.query(queryText);
    console.log("DB Created/Already Exists");
  }
  catch(err)
  {
    console.error("Error creating User Table");
  };
  
};

module.exports = {createTable};