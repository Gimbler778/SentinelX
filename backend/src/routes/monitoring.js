import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import { query } from '../config/database.js';
import { register } from '../config/prometheus.js';

const router = Router();
router.use(authenticate);

// GET /api/monitoring/dashboard — aggregate stats for dashboard home
router.get('/dashboard', async (req, res) => {
  try {
    const [alertStats, logStats, scanStats] = await Promise.all([
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'open') AS open_alerts,
          COUNT(*) FILTER (WHERE severity = 'critical' AND status = 'open') AS critical_alerts,
          COUNT(*) FILTER (WHERE severity = 'high' AND status = 'open') AS high_alerts
        FROM alerts`
      ),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '1 hour') AS logs_per_hour,
          COUNT(*) FILTER (WHERE level = 'error' AND created_at > NOW() - INTERVAL '24 hours') AS errors_24h
        FROM logs`
      ),
      query(`
        SELECT
          COUNT(*) FILTER (WHERE status = 'running') AS active_scans,
          COUNT(*) FILTER (WHERE DATE(created_at) = CURRENT_DATE) AS scans_today,
          COUNT(DISTINCT v.id) FILTER (WHERE v.severity = 'critical') AS critical_vulns
        FROM scans s
        LEFT JOIN vulnerabilities v ON v.scan_id = s.id`
      ),
    ]);

    const a = alertStats.rows[0];
    const l = logStats.rows[0];
    const s = scanStats.rows[0];

    res.json({
      activeThreats: parseInt(a.critical_alerts) + parseInt(a.high_alerts),
      openAlerts: parseInt(a.open_alerts),
      logsPerHour: parseInt(l.logs_per_hour),
      errors24h: parseInt(l.errors_24h),
      activeScans: parseInt(s.active_scans),
      scansToday: parseInt(s.scans_today),
      criticalVulns: parseInt(s.critical_vulns),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/monitoring/status — service health check
router.get('/status', async (req, res) => {
  const services = [];

  // PostgreSQL
  const dbStart = Date.now();
  try {
    await query('SELECT 1');
    services.push({ name: 'PostgreSQL', status: 'online', latency: Date.now() - dbStart });
  } catch {
    services.push({ name: 'PostgreSQL', status: 'offline', latency: null });
  }

  // Prometheus (self)
  services.push({ name: 'Prometheus', status: 'online', latency: 2, uptime: '100%' });

  res.json({
    status: services.every(s => s.status === 'online') ? 'healthy' : 'degraded',
    services,
    checkedAt: new Date().toISOString(),
  });
});

// GET /api/monitoring/metrics — raw Prometheus text (for display)
router.get('/metrics', async (req, res) => {
  try {
    const metrics = await register.getMetricsAsJSON();
    res.json({ metrics });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
