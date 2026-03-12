const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// Get most popular references
router.get('/popular-references', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT reference, article_code, client_name,
              COUNT(*) as order_count,
              SUM(quantity) as total_quantity,
              ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM requests), 0), 1) as percentage
       FROM requests
       GROUP BY reference, article_code, client_name
       ORDER BY order_count DESC
       LIMIT 10`
    );
    res.json({ popular: result.rows });
  } catch (err) {
    console.log('Analytics error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get top clients by order count
router.get('/top-clients', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT client_name,
              COUNT(*) as order_count,
              SUM(quantity) as total_quantity,
              ROUND(COUNT(*) * 100.0 / NULLIF((SELECT COUNT(*) FROM requests), 0), 1) as percentage
       FROM requests
       GROUP BY client_name
       ORDER BY order_count DESC
       LIMIT 10`
    );
    res.json({ clients: result.rows });
  } catch (err) {
    console.log('Top clients error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;