const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET all notifications for the logged-in user
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ notifications: result.rows });
  } catch (err) {
    console.log('Get notifications error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET count of unread notifications
router.get('/unread-count', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.user.id]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.log('Count error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark all notifications as read
router.patch('/read-all', async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read' });
  } catch (err) {
    console.log('Mark read error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;