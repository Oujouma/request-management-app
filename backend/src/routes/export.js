const express = require('express');
const ExcelJS = require('exceljs');
const pool = require('../db/connection');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

router.use(authMiddleware);

router.get('/excel', async (req, res) => {
  try {
    let result;

    if (req.user.role === 'expeditor') {
      // Expeditors get all requests
      result = await pool.query(
        `SELECT r.*, u.full_name as created_by_name
         FROM requests r
         JOIN users u ON r.created_by = u.id
         ORDER BY r.created_at DESC`
      );
    } else {
      // Correspondents get only their own requests
      result = await pool.query(
        `SELECT r.*, u.full_name as created_by_name
         FROM requests r
         JOIN users u ON r.created_by = u.id
         WHERE r.created_by = $1
         ORDER BY r.created_at DESC`,
        [req.user.id]
      );
    }

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Requests');

    sheet.columns = [
      { header: 'ID', key: 'id', width: 8 },
      { header: 'Client Name', key: 'client_name', width: 25 },
      { header: 'Reference', key: 'reference', width: 20 },
      { header: 'Article Code', key: 'article_code', width: 20 },
      { header: 'Quantity', key: 'quantity', width: 12 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Notes', key: 'notes', width: 30 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created By', key: 'created_by_name', width: 20 },
      { header: 'Created At', key: 'created_at', width: 20 }
    ];

    sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
    sheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: '006963' }
    };

    result.rows.forEach((row) => {
      sheet.addRow({
        ...row,
        date: new Date(row.date).toLocaleDateString(),
        created_at: new Date(row.created_at).toLocaleString()
      });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=requests.xlsx');

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.log('Export error:', err.message);
    res.status(500).json({ error: 'Export failed' });
  }
});

module.exports = router;
