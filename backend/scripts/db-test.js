import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({
  path: path.resolve('../.env')
});

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

async function test() {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log("DB Connected ✅", res.rows);
  } catch (err) {
    console.error("Error ❌", err);
  }
}

test();