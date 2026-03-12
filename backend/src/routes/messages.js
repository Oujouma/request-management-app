const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

// GET messages for a specific request
router.get('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const result = await pool.query(
      `SELECT m.*, u.full_name as sender_name, u.role as sender_role
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.request_id = $1
       ORDER BY m.created_at ASC`,
      [requestId]
    );
    res.json({ messages: result.rows });
  } catch (err) {
    console.log('Get messages error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// SEND a message for a specific request
router.post('/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const { message } = req.body;

    if (!message || message.trim() === '') {
      return res.status(400).json({ error: 'Message cannot be empty' });
    }

    const result = await pool.query(
      `INSERT INTO messages (request_id, sender_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [requestId, req.user.id, message]
    );

    // Get sender info
    const sender = await pool.query('SELECT full_name, role FROM users WHERE id = $1', [req.user.id]);

    const fullMessage = {
      ...result.rows[0],
      sender_name: sender.rows[0].full_name,
      sender_role: sender.rows[0].role
    };

    // Send real-time update
    const io = req.app.get('io');
    io.emit('newMessage', { requestId, message: fullMessage });

    // Notify the other person
    const request = await pool.query('SELECT * FROM requests WHERE id = $1', [requestId]);
    const notifyUserId = req.user.role === 'correspondent'
      ? null  // We'll notify all expeditors later
      : request.rows[0].created_by;

    if (notifyUserId) {
      await pool.query(
        'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
        [notifyUserId, `New message on order "${request.rows[0].client_name}"`]
      );
      io.emit('newNotification', { userId: notifyUserId });
    }

    res.status(201).json({ message: fullMessage });
  } catch (err) {
    console.log('Send message error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET unread message count per request
router.get('/unread/:requestId', async (req, res) => {
  try {
    const { requestId } = req.params;
    const result = await pool.query(
      'SELECT COUNT(*) FROM messages WHERE request_id = $1',
      [requestId]
    );
    res.json({ count: parseInt(result.rows[0].count) });
  } catch (err) {
    console.log('Count error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;