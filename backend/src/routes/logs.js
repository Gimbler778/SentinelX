import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { publish } from '../config/rabbitmq.js';
import { logsIngested } from '../config/prometheus.js';

const router = Router();
router.use(authenticate);

// GET /api/logs — paginated, filterable
router.get('/', async (req, res) => {
  try {
    const {
      level, source, search,
      limit = 100, offset = 0,
      from, to,
    } = req.query;

    let conditions = ['1=1'];
    const params = [];
    let p = 1;

    if (level && level !== 'all') {
      conditions.push(`level = $${p++}`); params.push(level);
    }
    if (source && source !== 'all') {
      conditions.push(`source = $${p++}`); params.push(source);
    }
    if (search) {
      conditions.push(`(message ILIKE $${p} OR source ILIKE $${p})`); params.push(`%${search}%`); p++;
    }
    if (from) {
      conditions.push(`created_at >= $${p++}`); params.push(new Date(from));
    }
    if (to) {
      conditions.push(`created_at <= $${p++}`); params.push(new Date(to));
    }

    const where = conditions.join(' AND ');
    const [countResult, logsResult] = await Promise.all([
      query(`SELECT COUNT(*) FROM logs WHERE ${where}`, params),
      query(
        `SELECT id, level, source, message, metadata, created_at AS timestamp
         FROM logs WHERE ${where}
         ORDER BY created_at DESC
         LIMIT $${p++} OFFSET $${p++}`,
        [...params, parseInt(limit), parseInt(offset)]
      ),
    ]);

    res.json({
      total: parseInt(countResult.rows[0].count),
      logs: logsResult.rows,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs/stats
router.get('/stats', async (req, res) => {
  try {
    const { rows } = await query(`
      SELECT
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS last_hour,
        COUNT(*) FILTER (WHERE level = 'error' AND created_at > NOW() - INTERVAL '24 hours') AS errors_24h,
        COUNT(*) FILTER (WHERE level = 'warning' AND created_at > NOW() - INTERVAL '24 hours') AS warnings_24h,
        COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') AS total_24h,
        source, COUNT(*) AS count
      FROM logs
      GROUP BY source
      ORDER BY count DESC
      LIMIT 10
    `);
    res.json({ stats: rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/logs/:id
router.get('/:id', async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM logs WHERE id = $1', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Log not found' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/logs — ingest a log event
router.post('/', async (req, res) => {
  try {
    const { level = 'info', source = 'api', message, metadata = {} } = req.body;
    if (!message) return res.status(400).json({ error: 'message is required' });

    const { rows } = await query(
      `INSERT INTO logs (level, source, message, metadata, user_id)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [level, source, message, JSON.stringify(metadata), req.user.id]
    );

    // Publish to RabbitMQ for downstream processing
    await publish('logs.new', { log: rows[0] });

    // Track in Prometheus
    logsIngested.inc({ level, source });

    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/logs/:id
router.delete('/:id', async (req, res) => {
  try {
    const { rowCount } = await query('DELETE FROM logs WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (!rowCount) return res.status(404).json({ error: 'Log not found' });
    res.json({ deleted: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
