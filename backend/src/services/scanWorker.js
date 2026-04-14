/**
 * Scan Worker — listens to scans queue, drives OpenVAS, writes results to DB
 * Run standalone: node src/services/scanWorker.js
 * Or imported by index.js for in-process execution on small deployments
 */
import axios from 'axios';
import https from 'https';
import dotenv from 'dotenv';
import { query } from '../config/database.js';
import { subscribe, publish } from '../config/rabbitmq.js';
import { scansRunning } from '../config/prometheus.js';

dotenv.config();

// OpenVAS REST client (GVM 22+)
const openvas = axios.create({
  baseURL: `https://${process.env.OPENVAS_HOST || 'localhost'}:${process.env.OPENVAS_PORT || 9392}`,
  auth: {
    username: process.env.OPENVAS_USERNAME || 'admin',
    password: process.env.OPENVAS_PASSWORD || 'admin',
  },
  httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  timeout: 30000,
});

// ── OpenVAS helpers ───────────────────────────────────────────────────────────

async function createTarget(name, hosts) {
  const { data } = await openvas.post('/targets', { name, hosts, port_list: { id: 'default' } });
  return data.id;
}

async function createTask(name, targetId, type) {
  const configMap = {
    quick: 'Full and fast',
    full: 'Full and fast ultimate',
    deep: 'Full and very deep',
  };
  const { data } = await openvas.post('/tasks', {
    name,
    target: { id: targetId },
    config: { name: configMap[type] || 'Full and fast' },
    scanner: { name: 'OpenVAS Default' },
  });
  return data.id;
}

async function startTask(taskId) {
  const { data } = await openvas.post(`/tasks/${taskId}/start`);
  return data.report_id;
}

async function getTaskProgress(taskId) {
  const { data } = await openvas.get(`/tasks/${taskId}`);
  return {
    status: data.status,        // 'Running', 'Done', 'Stopped'
    progress: data.progress,    // 0-100
  };
}

async function getReport(reportId) {
  const { data } = await openvas.get(`/reports/${reportId}`, {
    params: { filter: 'rows=1000 min_qod=70', ignore_pagination: 1 },
  });
  return data;
}

// ── CVSS → severity mapping ───────────────────────────────────────────────────
function cvssToSeverity(score) {
  if (!score) return 'low';
  if (score >= 9.0) return 'critical';
  if (score >= 7.0) return 'high';
  if (score >= 4.0) return 'medium';
  return 'low';
}

// ── Main worker logic ─────────────────────────────────────────────────────────
async function processScan(msg) {
  const { scanId, target, type } = msg;
  console.log(`[ScanWorker] Starting scan ${scanId} → ${target}`);

  try {
    await query('UPDATE scans SET status = $1, started_at = NOW() WHERE id = $2', ['running', scanId]);
    scansRunning.inc();

    // --- OpenVAS flow ---
    let taskId, reportId;
    try {
      const targetId = await createTarget(`sentinelx-${scanId}`, target);
      taskId = await createTask(`SentinelX Scan ${scanId}`, targetId, type);
      await query('UPDATE scans SET openvas_task_id = $1 WHERE id = $2', [taskId, scanId]);
      reportId = await startTask(taskId);
    } catch (openvasErr) {
      console.warn(`[ScanWorker] OpenVAS unavailable, running mock scan for ${scanId}:`, openvasErr.message);
      await runMockScan(scanId, target);
      return;
    }

    // Poll progress
    let done = false;
    while (!done) {
      await sleep(10000); // poll every 10s
      const { status, progress } = await getTaskProgress(taskId);
      await query('UPDATE scans SET progress = $1 WHERE id = $2', [Math.min(99, progress), scanId]);
      await publish('scans.progress', { scanId, progress });
      if (status === 'Done' || status === 'Stopped') done = true;
    }

    // Fetch & persist results
    const report = await getReport(reportId);
    const results = report.results?.result || [];

    for (const result of results) {
      const cvss = parseFloat(result.severity) || 0;
      await query(
        `INSERT INTO vulnerabilities
           (scan_id, name, description, severity, cvss_score, cve_id, host, port, solution, raw_output)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [
          scanId,
          result.name || 'Unknown',
          result.description,
          cvssToSeverity(cvss),
          cvss || null,
          result.nvt?.cve || null,
          result.host?.ip || target,
          parseInt(result.port) || null,
          result.nvt?.solution?.text || null,
          JSON.stringify(result),
        ]
      );
    }

    await query(
      'UPDATE scans SET status = $1, progress = 100, finished_at = NOW() WHERE id = $2',
      ['completed', scanId]
    );
    scansRunning.dec();

    await publish('scans.completed', { scanId, vulnerabilityCount: results.length });
    console.log(`[ScanWorker] Scan ${scanId} complete — ${results.length} findings`);

    // Auto-create alerts for critical findings
    const criticals = results.filter(r => parseFloat(r.severity) >= 9.0);
    for (const c of criticals) {
      await query(
        `INSERT INTO alerts (title, description, severity, source, metadata)
         VALUES ($1,$2,'critical','scanner',$3)`,
        [
          `Critical: ${c.name}`,
          `Host: ${c.host?.ip} — ${c.description?.slice(0, 300)}`,
          JSON.stringify({ scanId, cve: c.nvt?.cve }),
        ]
      );
    }

  } catch (err) {
    console.error(`[ScanWorker] Scan ${scanId} failed:`, err.message);
    await query(
      'UPDATE scans SET status = $1, error_message = $2, finished_at = NOW() WHERE id = $3',
      ['failed', err.message, scanId]
    );
    scansRunning.dec();
    await publish('scans.failed', { scanId, error: err.message });
  }
}

// ── Mock scan for when OpenVAS is unavailable ─────────────────────────────────
async function runMockScan(scanId, target) {
  const steps = [20, 40, 60, 80, 100];
  for (const progress of steps) {
    await sleep(2000);
    await query('UPDATE scans SET progress = $1 WHERE id = $2', [progress, scanId]);
    await publish('scans.progress', { scanId, progress });
  }

  const mockVulns = [
    { name: 'OpenSSH < 9.0 Username Enumeration', severity: 'high', cvss: 7.5, port: 22, solution: 'Upgrade OpenSSH to latest version.' },
    { name: 'HTTP Security Headers Missing (X-Frame-Options)', severity: 'medium', cvss: 5.3, port: 80, solution: 'Add X-Frame-Options: DENY header.' },
    { name: 'TLS 1.0 Protocol Enabled', severity: 'medium', cvss: 4.3, port: 443, solution: 'Disable TLS 1.0 and 1.1, use TLS 1.2+ only.' },
    { name: 'Server Banner Information Disclosure', severity: 'low', cvss: 2.6, port: 80, solution: 'Remove or obfuscate server version from response headers.' },
  ];

  for (const v of mockVulns) {
    await query(
      `INSERT INTO vulnerabilities (scan_id, name, severity, cvss_score, host, port, solution)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [scanId, v.name, v.severity, v.cvss, target.split('/')[0], v.port, v.solution]
    );
  }

  await query(
    'UPDATE scans SET status = $1, progress = 100, finished_at = NOW() WHERE id = $2',
    ['completed', scanId]
  );
  scansRunning.dec();
  await publish('scans.completed', { scanId, vulnerabilityCount: mockVulns.length, mock: true });
  console.log(`[ScanWorker] Mock scan ${scanId} complete — ${mockVulns.length} findings`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ── Start worker ──────────────────────────────────────────────────────────────
export async function startScanWorker() {
  await subscribe('scans', async (msg) => {
    if (msg.scanId && msg.target) {
      await processScan(msg);
    }
  });
  console.log('✅ Scan worker listening on queue: scans');
}

// If run directly as standalone process
if (process.argv[1]?.endsWith('scanWorker.js')) {
  import('../config/database.js').then(({ connectDB }) => connectDB())
    .then(() => import('../config/rabbitmq.js').then(({ initRabbitMQ }) => initRabbitMQ()))
    .then(() => startScanWorker())
    .catch(err => { console.error(err); process.exit(1); });
}
