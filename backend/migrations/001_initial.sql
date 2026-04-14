-- SentinelX Database Schema
-- Run with: psql $DATABASE_URL -f migrations/001_initial.sql

-- ── Extensions ────────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- for fast text search

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  google_id     TEXT UNIQUE NOT NULL,
  email         TEXT UNIQUE NOT NULL,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'analyst' CHECK (role IN ('admin', 'analyst', 'viewer')),
  avatar        TEXT,
  avatar_style  TEXT DEFAULT 'bottts',
  avatar_seed   TEXT,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- ── Logs ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  level      TEXT NOT NULL DEFAULT 'info' CHECK (level IN ('debug', 'info', 'warning', 'error', 'critical')),
  source     TEXT NOT NULL DEFAULT 'system',
  message    TEXT NOT NULL,
  metadata   JSONB DEFAULT '{}',
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_level      ON logs(level);
CREATE INDEX IF NOT EXISTS idx_logs_source     ON logs(source);
CREATE INDEX IF NOT EXISTS idx_logs_created_at ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_logs_message_trgm ON logs USING GIN(message gin_trgm_ops);

-- Partition hint: for high volume, partition by month on created_at

-- ── Alerts ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title            TEXT NOT NULL,
  description      TEXT,
  severity         TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
  status           TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved')),
  source           TEXT NOT NULL DEFAULT 'system',
  metadata         JSONB DEFAULT '{}',
  acknowledged_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  acknowledged_at  TIMESTAMPTZ,
  resolved_by      UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_severity   ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_status     ON alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- ── Scans ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS scans (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        TEXT NOT NULL,
  target      TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'full' CHECK (type IN ('quick', 'full', 'deep')),
  status      TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled')),
  progress    INTEGER NOT NULL DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  openvas_task_id TEXT,
  error_message   TEXT,
  created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
  started_at  TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scans_status     ON scans(status);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON scans(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_created_by ON scans(created_by);

-- ── Vulnerabilities ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS vulnerabilities (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scan_id     UUID NOT NULL REFERENCES scans(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  severity    TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  cvss_score  DECIMAL(3,1),
  cve_id      TEXT,
  host        TEXT NOT NULL,
  port        INTEGER,
  protocol    TEXT,
  solution    TEXT,
  references  TEXT[],
  raw_output  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vulns_scan_id  ON vulnerabilities(scan_id);
CREATE INDEX IF NOT EXISTS idx_vulns_severity ON vulnerabilities(severity);
CREATE INDEX IF NOT EXISTS idx_vulns_cve_id   ON vulnerabilities(cve_id);

-- ── updated_at triggers ───────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at   ON users;
DROP TRIGGER IF EXISTS trg_alerts_updated_at  ON alerts;
DROP TRIGGER IF EXISTS trg_scans_updated_at   ON scans;

CREATE TRIGGER trg_users_updated_at   BEFORE UPDATE ON users   FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_alerts_updated_at  BEFORE UPDATE ON alerts  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_scans_updated_at   BEFORE UPDATE ON scans   FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Seed data (dev only) ──────────────────────────────────────────────────────
-- Insert some demo alerts so the dashboard isn't empty on first run
INSERT INTO alerts (title, description, severity, source, status) VALUES
  ('Demo: Brute Force Detected',    'SSH brute force from 192.168.1.45. Insert real alerts via API.', 'critical', 'auth',    'open'),
  ('Demo: Port Scan',               'TCP SYN scan on 1024 ports from 10.0.0.99.',                    'high',     'network', 'open'),
  ('Demo: Weak TLS on :443',        'TLS 1.0 still enabled on the frontend proxy.',                  'medium',   'scanner', 'acknowledged'),
  ('Demo: Certificate Expiring',    'api.internal cert expires in 14 days.',                         'low',      'system',  'open')
ON CONFLICT DO NOTHING;

INSERT INTO logs (level, source, message) VALUES
  ('info',    'system',  'SentinelX initialized — database schema applied'),
  ('info',    'auth',    'Demo: auth log — replace with real events'),
  ('warning', 'network', 'Demo: anomalous traffic spike detected on eth0'),
  ('error',   'waf',     'Demo: SQL injection payload blocked from 203.0.113.1')
ON CONFLICT DO NOTHING;
