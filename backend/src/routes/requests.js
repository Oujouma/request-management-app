const express = require('express');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// All routes below require login
router.use(authMiddleware);

// CREATE a new request (correspondents only)
router.post('/', async (req, res) => {
  try {
    if (req.user.role !== 'correspondent') {
      return res.status(403).json({ error: 'Only correspondents can create requests' });
    }

    const { client_name, reference, article_code, quantity, date, notes } = req.body;

    const result = await pool.query(
      `INSERT INTO requests (client_name, reference, article_code, quantity, date, notes, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [client_name, reference, article_code, quantity, date, notes, req.user.id]
    );

    res.status(201).json({
      message: 'Request created successfully',
      request: result.rows[0]
    });
  } catch (err) {
    console.log('Create request error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET all requests
router.get('/', async (req, res) => {
  try {
    let query;

    if (req.user.role === 'expeditor') {
      // Expeditors see all requests
      query = await pool.query(
        `SELECT r.*, u.full_name as created_by_name
         FROM requests r
         JOIN users u ON r.created_by = u.id
         ORDER BY r.created_at DESC`
      );
    } else {
      // Correspondents see only their own requests
      query = await pool.query(
        `SELECT r.*, u.full_name as created_by_name
         FROM requests r
         JOIN users u ON r.created_by = u.id
         WHERE r.created_by = $1
         ORDER BY r.created_at DESC`,
        [req.user.id]
      );
    }

    res.json({ requests: query.rows });
  } catch (err) {
    console.log('Get requests error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// UPDATE request status (expeditors only)
router.patch('/:id/status', async (req, res) => {
  try {
    if (req.user.role !== 'expeditor') {
      return res.status(403).json({ error: 'Only expeditors can update status' });
    }

    const { id } = req.params;
    const { status, comment } = req.body;

    // Get the current status before updating
    const current = await pool.query('SELECT * FROM requests WHERE id = $1', [id]);

    if (current.rows.length === 0) {
      return res.status(404).json({ error: 'Request not found' });
    }

    const oldStatus = current.rows[0].status;

    // Update the request status
    await pool.query(
      'UPDATE requests SET status = $1, updated_at = NOW() WHERE id = $2',
      [status, id]
    );

    // Save the change in history
    await pool.query(
      `INSERT INTO request_history (request_id, changed_by, old_status, new_status, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [id, req.user.id, oldStatus, status, comment]
    );

    // Notify the correspondent who created the request
    const request = current.rows[0];
    await pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [request.created_by, `Your request "${request.client_name}" status changed to ${status}`]
    );

    res.json({ message: 'Status updated successfully' });
  } catch (err) {
    console.log('Update status error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET history for a specific request
router.get('/:id/history', async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `SELECT rh.*, u.full_name as changed_by_name
       FROM request_history rh
       JOIN users u ON rh.changed_by = u.id
       WHERE rh.request_id = $1
       ORDER BY rh.changed_at DESC`,
      [id]
    );

    res.json({ history: result.rows });
  } catch (err) {
    console.log('Get history error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;