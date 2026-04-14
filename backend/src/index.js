import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { rateLimit } from 'express-rate-limit';
import passport from 'passport';
import { connectDB } from './config/database.js';
import { initRabbitMQ, subscribe } from './config/rabbitmq.js';
import { initPrometheus, websocketConnections } from './config/prometheus.js';
import { initPassport } from './config/passport.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Routes
import authRoutes from './routes/auth.js';
import logsRoutes from './routes/logs.js';
import alertsRoutes from './routes/alerts.js';
import scansRoutes from './routes/scans.js';
import monitoringRoutes from './routes/monitoring.js';

dotenv.config();

const app = express();
const server = createServer(app);

// ── WebSocket Server ──────────────────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: '/ws' });
const wsClients = new Set();

wss.on('connection', (ws, req) => {
  wsClients.add(ws);
  websocketConnections.inc();
  console.log(`WS client connected. Total: ${wsClients.size}`);

  ws.on('close', () => {
    wsClients.delete(ws);
    websocketConnections.dec();
  });

  ws.on('error', (err) => {
    console.warn('WS error:', err.message);
    wsClients.delete(ws);
  });

  // Send welcome + current timestamp
  ws.send(JSON.stringify({
    type: 'connected',
    data: { message: 'SentinelX WebSocket connected', timestamp: new Date().toISOString() },
  }));
});

export function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, timestamp: new Date().toISOString() });
  for (const client of wsClients) {
    if (client.readyState === 1) { // OPEN
      client.send(msg);
    }
  }
}

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false, // Disabled for API
  crossOriginEmbedderPolicy: false,
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter limit on auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many auth attempts.' },
});
app.use('/auth', authLimiter);

// Passport (no sessions — we use JWT)
initPassport();
app.use(passport.initialize());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/auth', authRoutes);
app.use('/api/logs', logsRoutes);
app.use('/api/alerts', alertsRoutes);
app.use('/api/scans', scansRoutes);
app.use('/api/monitoring', monitoringRoutes);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    wsClients: wsClients.size,
  });
});

app.use(notFound);
app.use(errorHandler);

// ── RabbitMQ Consumers ────────────────────────────────────────────────────────
async function setupConsumers() {
  // Forward new alerts to all WS clients
  await subscribe('alerts', async (msg) => {
    if (msg.alert) {
      broadcast('alert', msg.alert);
    }
  });

  // Forward scan updates
  await subscribe('scans', async (msg) => {
    if (msg.scanId) {
      broadcast('scan_update', msg);
    }
  });
}

// ── Boot ──────────────────────────────────────────────────────────────────────
async function boot() {
  try {
    await connectDB();
    await initRabbitMQ();
    await setupConsumers().catch(err => console.warn('Consumer setup skipped:', err.message));
    initPrometheus(app);

    const PORT = parseInt(process.env.PORT) || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log('');
      console.log('  ███████╗███████╗███╗   ██╗████████╗██╗███╗   ██╗███████╗██╗     ██╗  ██╗');
      console.log('  ██╔════╝██╔════╝████╗  ██║╚══██╔══╝██║████╗  ██║██╔════╝██║     ╚██╗██╔╝');
      console.log('  ███████╗█████╗  ██╔██╗ ██║   ██║   ██║██╔██╗ ██║█████╗  ██║      ╚███╔╝ ');
      console.log('  ╚════██║██╔══╝  ██║╚██╗██║   ██║   ██║██║╚██╗██║██╔══╝  ██║      ██╔██╗ ');
      console.log('  ███████║███████╗██║ ╚████║   ██║   ██║██║ ╚████║███████╗███████╗██╔╝ ██╗');
      console.log('  ╚══════╝╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝╚══════╝╚══════╝╚═╝  ╚═╝');
      console.log('');
      console.log(`  🚀  API      → http://localhost:${PORT}/api`);
      console.log(`  📊  Metrics  → http://localhost:${PORT}/metrics`);
      console.log(`  🔌  WS       → ws://localhost:${PORT}/ws`);
      console.log(`  🔐  Auth     → http://localhost:${PORT}/auth/google`);
      console.log('');
    });
  } catch (err) {
    console.error('❌ Boot failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  }
}

boot();

export { app, wss };
