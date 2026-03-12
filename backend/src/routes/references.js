const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/search', async (req, res) => {
  try {
    const { query } = req.query;
    const result = await pool.query(
      `SELECT * FROM client_references
       WHERE reference ILIKE $1 OR client_name ILIKE $1 OR article_code ILIKE $1
       ORDER BY client_name ASC
       LIMIT 10`,
      [`%${query}%`]
    );
    res.json({ references: result.rows });
  } catch (err) {
    console.log('Search error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM client_references ORDER BY client_name ASC');
    res.json({ references: result.rows });
  } catch (err) {
    console.log('Get references error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { client_name, reference, article_code } = req.body;
    const result = await pool.query(
      'INSERT INTO client_references (client_name, reference, article_code) VALUES ($1, $2, $3) RETURNING *',
      [client_name, reference, article_code]
    );
    res.status(201).json({ reference: result.rows[0] });
  } catch (err) {
    console.log('Add reference error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;