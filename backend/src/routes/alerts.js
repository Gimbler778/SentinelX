import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { publish } from '../config/rabbitmq.js';
import { alertsCreated } from '../config/prometheus.js';

const router = Router();
router.use(authenticate);

// GET /api/alerts
router.get('/', async (req, res) => {
  try {
    const { status, severity, limit = 50, offset = 0 } = req.query;
    let conditions = ['1=1'];
    const params = [];
    let p = 1;

    if (status && status !== 'all') { conditions.push(`status = $${p++}`); params.push(status); }
    if (severity && severity !== 'all') { conditions.push(`severity = $${p++}`); params.push(severity); }

    const where = conditions.join(' AND ');
    const [countRes, alertsRes] = await Promise.all([
      query(`SELECT COUNT(*) FROM alerts WHERE ${where}`, params),
      query(
        `SELECT a.*, u.name AS acknowledged_by_name
         FROM alerts a
         LEFT JOIN users u ON u.id = a.acknowledged_by
         WHERE ${where}
         ORDER BY
           CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END,
           created_at DESC
         LIMIT $${p++} OFFSET $${p++}`,
        [...params, parseInt(limit), parseInt(offset)]
      ),
    ]);

    res.json({ total: parseInt(countRes.rows[0].count), alerts: alertsRes.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/stats
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open') AS open_count,
        COUNT(*) FILTER (WHERE status = 'acknowledged') AS acknowledged_count,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
        COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'open') AS critical_open,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS last_24h
      FROM alerts
    `);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT a.*, u.name AS acknowledged_by_name
      FROM alerts a LEFT JOIN users u ON u.id = a.acknowledged_by
      WHERE a.id = $1`, [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Alert not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/alerts
router.post('/', async (req, res) => {
  try {
    const { title, description, severity = 'medium', source = 'api', metadata = {} } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const { rows } = await query(
      `INSERT INTO alerts (title, description, severity, source, status, metadata)
       VALUES ($1, $2, $3, $4, 'open', $5)
       RETURNING *`,
      [title, description, severity, source, JSON.stringify(metadata)]
    );

    await publish('alerts.new', { alert: rows[0] });
    alertsCreated.inc({ severity });

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/acknowledge
router.patch('/:id/acknowledge', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE alerts SET status = 'acknowledged', acknowledged_by = $1, acknowledged_at = NOW()
       WHERE id = $2 AND status = 'open'
       RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Alert not found or already acknowledged' });
    await publish('alerts.acknowledged', { alertId: rows[0].id, userId: req.user.id });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/alerts/:id/resolve
router.patch('/:id/resolve', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE alerts SET status = 'resolved', resolved_by = $1, resolved_at = NOW()
       WHERE id = $2 AND status != 'resolved'
       RETURNING *`,
      [req.user.id, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Alert not found or already resolved' });
    await publish('alerts.resolved', { alertId: rows[0].id, userId: req.user.id });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/alerts/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM alerts WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Alert not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
