import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { publish } from '../config/rabbitmq.js';
import { scansRunning } from '../config/prometheus.js';

const router = Router();
router.use(authenticate);

// GET /api/scans
router.get('/', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    let conditions = ['1=1'];
    const params = [];
    let p = 1;

    if (status) { conditions.push(`s.status = $${p++}`); params.push(status); }

    const where = conditions.join(' AND ');
    const { rows } = await query(
      `SELECT s.*,
         u.name AS created_by_name,
         COUNT(v.id) AS vulnerability_count,
         COUNT(v.id) FILTER (WHERE v.severity = 'critical') AS critical_count,
         COUNT(v.id) FILTER (WHERE v.severity = 'high') AS high_count,
         COUNT(v.id) FILTER (WHERE v.severity = 'medium') AS medium_count,
         COUNT(v.id) FILTER (WHERE v.severity = 'low') AS low_count
       FROM scans s
       LEFT JOIN users u ON u.id = s.created_by
       LEFT JOIN vulnerabilities v ON v.scan_id = s.id
       WHERE ${where}
       GROUP BY s.id, u.name
       ORDER BY s.created_at DESC
       LIMIT $${p++} OFFSET $${p++}`,
      [...params, parseInt(limit), parseInt(offset)]
    );
    res.json({ scans: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scans/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM scans WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Scan not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scans/:id/vulnerabilities
router.get('/:id/vulnerabilities', async (req, res) => {
  try {
    const { severity } = req.query;
    let conditions = ['scan_id = $1'];
    const params = [req.params.id];
    if (severity && severity !== 'all') { conditions.push(`severity = $2`); params.push(severity); }

    const { rows } = await query(
      `SELECT * FROM vulnerabilities WHERE ${conditions.join(' AND ')}
       ORDER BY CASE severity WHEN 'critical' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END`,
      params
    );
    res.json({ vulnerabilities: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scans — create and launch scan
router.post('/', async (req, res) => {
  try {
    const { target, name, type = 'full' } = req.body;
    if (!target) return res.status(400).json({ error: 'target is required' });

    const { rows } = await query(
      `INSERT INTO scans (target, name, type, status, progress, created_by)
       VALUES ($1, $2, $3, 'queued', 0, $4)
       RETURNING *`,
      [target, name || target, type, req.user.id]
    );

    const scan = rows[0];

    // Publish scan job to RabbitMQ — scanner worker picks this up
    await publish('scans.start', { scanId: scan.id, target, type });
    scansRunning.inc();

    // Update status to running
    await query('UPDATE scans SET status = $1, started_at = NOW() WHERE id = $2', ['running', scan.id]);

    res.status(201).json({ ...scan, status: 'running' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/scans/:id/cancel
router.patch('/:id/cancel', async (req, res) => {
  try {
    const { rows } = await query(
      `UPDATE scans SET status = 'cancelled', finished_at = NOW()
       WHERE id = $1 AND status IN ('queued', 'running')
       RETURNING *`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Scan not found or already finished' });
    scansRunning.dec();
    await publish('scans.cancel', { scanId: rows[0].id });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/scans/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM scans WHERE id = $1', [req.params.id]);
    if (!rowCount) return res.status(404).json({ error: 'Scan not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
