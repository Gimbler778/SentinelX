import client from 'prom-client';

const { Registry, collectDefaultMetrics, Counter, Histogram, Gauge } = client;

export const register = new Registry();

// Collect default Node.js metrics
collectDefaultMetrics({ register });

// ── HTTP Metrics ──────────────────────────────────────────────────────────────
export const httpRequestsTotal = new Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

// ── Business Metrics ──────────────────────────────────────────────────────────
export const logsIngested = new Counter({
  name: 'sentinelx_logs_ingested_total',
  help: 'Total log events ingested',
  labelNames: ['level', 'source'],
  registers: [register],
});

export const alertsCreated = new Counter({
  name: 'sentinelx_alerts_created_total',
  help: 'Total alerts created',
  labelNames: ['severity'],
  registers: [register],
});

export const scansRunning = new Gauge({
  name: 'sentinelx_scans_running',
  help: 'Currently running vulnerability scans',
  registers: [register],
});

export const websocketConnections = new Gauge({
  name: 'sentinelx_websocket_connections',
  help: 'Active WebSocket connections',
  registers: [register],
});

export const rabbitmqMessages = new Counter({
  name: 'sentinelx_rabbitmq_messages_total',
  help: 'Total RabbitMQ messages processed',
  labelNames: ['queue', 'operation'],
  registers: [register],
});

// ── Middleware ────────────────────────────────────────────────────────────────
export function initPrometheus(app) {
  // Request tracking middleware
  app.use((req, res, next) => {
    if (req.path === '/metrics') return next();
    const end = httpRequestDuration.startTimer();
    res.on('finish', () => {
      const route = req.route?.path || req.path;
      const labels = { method: req.method, route, status_code: res.statusCode };
      httpRequestsTotal.inc(labels);
      end(labels);
    });
    next();
  });

  // Metrics endpoint
  app.get('/metrics', async (req, res) => {
    try {
      res.set('Content-Type', register.contentType);
      res.end(await register.metrics());
    } catch (err) {
      res.status(500).end(err.message);
    }
  });

  console.log('✅ Prometheus metrics initialized — endpoint: /metrics');
}
