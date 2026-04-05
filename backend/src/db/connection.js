const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

// Create a connection to the database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection between the two versions 
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.log('Database connection FAILED:', err.message);
  } else {
    console.log('Database connected successfully!');
  }
});

module.exports = pool;