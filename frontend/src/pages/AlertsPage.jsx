import React, { useState, useEffect } from 'react';
import { alertsAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2, low: 3 };

const MOCK_ALERTS = [
  { id: '1', title: 'Brute Force Attack Detected', description: 'Multiple failed SSH login attempts from 192.168.1.45. 47 attempts in 5 minutes.', severity: 'critical', status: 'open', source: 'auth', createdAt: new Date(Date.now() - 300000), acknowledgedBy: null },
  { id: '2', title: 'SQL Injection Attempt Blocked', description: 'WAF blocked payload: SELECT * FROM users WHERE 1=1. Request origin: 203.0.113.50', severity: 'high', status: 'open', source: 'waf', createdAt: new Date(Date.now() - 900000), acknowledgedBy: null },
  { id: '3', title: 'Unauthorized Port Scan', description: 'Full TCP SYN scan detected from 10.0.0.99 on 1024 ports.', severity: 'high', status: 'acknowledged', source: 'network', createdAt: new Date(Date.now() - 1800000), acknowledgedBy: 'admin' },
  { id: '4', title: 'OpenVAS: CVE-2024-1234 Found', description: 'Critical vulnerability in Apache 2.4.49 allows path traversal. Affected host: 10.0.0.20', severity: 'critical', status: 'open', source: 'scanner', createdAt: new Date(Date.now() - 3600000), acknowledgedBy: null },
  { id: '5', title: 'TLS Certificate Expiring Soon', description: 'Certificate for api.internal.corp expires in 14 days. Auto-renewal failed.', severity: 'medium', status: 'open', source: 'system', createdAt: new Date(Date.now() - 7200000), acknowledgedBy: null },
  { id: '6', title: 'High CPU on backend-01', description: 'CPU usage at 94% for 15+ minutes. Process: node sentinelx-backend', severity: 'medium', status: 'acknowledged', source: 'monitoring', createdAt: new Date(Date.now() - 10800000), acknowledgedBy: 'ops-bot' },
  { id: '7', title: 'Suspicious DNS Query', description: 'Internal host querying known C2 domain: malware-c2-server.biz', severity: 'high', status: 'open', source: 'network', createdAt: new Date(Date.now() - 14400000), acknowledgedBy: null },
  { id: '8', title: 'Login from New Location', description: 'User bob@corp.io logged in from Singapore (usual: New York).', severity: 'low', status: 'resolved', source: 'auth', createdAt: new Date(Date.now() - 86400000), acknowledgedBy: 'admin' },
];

const SEV_COLORS = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' };
const STATUS_COLORS = { open: 'var(--red)', acknowledged: 'var(--yellow)', resolved: 'var(--green)' };

export default function AlertsPage() {
  const [alerts, setAlerts] = useState(MOCK_ALERTS);
  const [filter, setFilter] = useState('open');
  const [severity, setSeverity] = useState('all');
  const [selected, setSelected] = useState(null);
  const { addToast } = useApp();

  useEffect(() => {
    alertsAPI.getAll()
      .then(({ data }) => setAlerts(data.alerts || MOCK_ALERTS))
      .catch(() => setAlerts(MOCK_ALERTS));
  }, []);

  const acknowledge = async (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'acknowledged', acknowledgedBy: 'you' } : a));
    setSelected(prev => prev?.id === id ? { ...prev, status: 'acknowledged', acknowledgedBy: 'you' } : prev);
    addToast('Alert acknowledged', 'success');
    try { await alertsAPI.acknowledge(id); } catch (_) {}
  };

  const resolve = async (id) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, status: 'resolved' } : a));
    setSelected(prev => prev?.id === id ? { ...prev, status: 'resolved' } : prev);
    addToast('Alert resolved', 'success');
    try { await alertsAPI.resolve(id); } catch (_) {}
  };

  const filtered = alerts
    .filter(a => filter === 'all' || a.status === filter)
    .filter(a => severity === 'all' || a.severity === severity)
    .sort((a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]);

  const counts = {
    open: alerts.filter(a => a.status === 'open').length,
    acknowledged: alerts.filter(a => a.status === 'acknowledged').length,
    resolved: alerts.filter(a => a.status === 'resolved').length,
  };

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 104px)' }}>
      {/* Left — list */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
            {['all', 'open', 'acknowledged', 'resolved'].map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '7px 14px',
                background: filter === f ? 'var(--accent-dim)' : 'transparent',
                color: filter === f ? 'var(--accent)' : 'var(--text-tertiary)',
                border: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}>
                {f} {f !== 'all' && counts[f] ? `(${counts[f]})` : ''}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
            {['all', 'critical', 'high', 'medium', 'low'].map(s => (
              <button key={s} onClick={() => setSeverity(s)} style={{
                padding: '7px 12px',
                background: severity === s ? (s === 'all' ? 'var(--accent-dim)' : `${SEV_COLORS[s]}20`) : 'transparent',
                color: severity === s ? (s === 'all' ? 'var(--accent)' : SEV_COLORS[s]) : 'var(--text-tertiary)',
                border: 'none',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.62rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                cursor: 'pointer',
              }}>{s}</button>
            ))}
          </div>

          <div style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {filtered.length} alerts
          </div>
        </div>

        {/* Alert list */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {filtered.length === 0 && (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
              // No alerts matching current filters
            </div>
          )}
          {filtered.map(alert => (
            <div key={alert.id}
              onClick={() => setSelected(selected?.id === alert.id ? null : alert)}
              className="card hoverable"
              style={{
                padding: '14px 16px',
                cursor: 'pointer',
                borderLeft: `3px solid ${SEV_COLORS[alert.severity]}`,
                background: selected?.id === alert.id ? 'var(--bg-elevated)' : 'var(--bg-card)',
                border: selected?.id === alert.id ? `1px solid ${SEV_COLORS[alert.severity]}40` : '1px solid var(--border-subtle)',
                borderLeftColor: SEV_COLORS[alert.severity],
                display: 'flex',
                gap: '14px',
                alignItems: 'flex-start',
              }}>
              {/* Severity dot */}
              <div style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: SEV_COLORS[alert.severity],
                marginTop: '5px',
                flexShrink: 0,
                animation: alert.status === 'open' && alert.severity === 'critical' ? 'pulse-glow 1.5s infinite' : 'none',
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{alert.title}</span>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                    <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700,
                      color: STATUS_COLORS[alert.status],
                      textTransform: 'uppercase', letterSpacing: '0.06em',
                    }}>{alert.status}</span>
                  </div>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {alert.description}
                </div>
                <div style={{ display: 'flex', gap: '12px', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                  <span>src: {alert.source}</span>
                  <span>{timeAgo(alert.createdAt)}</span>
                  {alert.acknowledgedBy && <span>ack: {alert.acknowledgedBy}</span>}
                </div>
              </div>

              {/* Quick actions */}
              {alert.status === 'open' && (
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => acknowledge(alert.id)} className="btn-ghost" style={{ padding: '4px 10px', fontSize: '0.65rem' }}>ACK</button>
                  <button onClick={() => resolve(alert.id)} style={{
                    padding: '4px 10px', fontSize: '0.65rem', background: 'var(--green-dim)',
                    border: '1px solid rgba(0,255,136,0.2)', borderRadius: '4px', color: 'var(--green)', cursor: 'pointer',
                  }}>RESOLVE</button>
                </div>
              )}
              {alert.status === 'acknowledged' && (
                <div onClick={e => e.stopPropagation()}>
                  <button onClick={() => resolve(alert.id)} style={{
                    padding: '4px 10px', fontSize: '0.65rem', background: 'var(--green-dim)',
                    border: '1px solid rgba(0,255,136,0.2)', borderRadius: '4px', color: 'var(--green)', cursor: 'pointer',
                  }}>RESOLVE</button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Right — detail panel */}
      {selected && (
        <div className="card" style={{
          width: '360px',
          flexShrink: 0,
          padding: '20px',
          overflowY: 'auto',
          animation: 'slideInLeft 0.2s ease',
          borderColor: SEV_COLORS[selected.severity],
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>// ALERT #{selected.id}</span>
            <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
          </div>

          <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.4 }}>{selected.title}</h3>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '16px' }}>
            <span className={`badge badge-${selected.severity}`}>{selected.severity}</span>
            <span style={{
              fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700,
              color: STATUS_COLORS[selected.status], padding: '2px 8px',
              background: `${STATUS_COLORS[selected.status]}15`, borderRadius: '3px',
              textTransform: 'uppercase', letterSpacing: '0.06em',
            }}>{selected.status}</span>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Description</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{selected.description}</p>
          </div>

          <div className="divider" />

          {[
            { label: 'Source', value: selected.source },
            { label: 'Created', value: new Date(selected.createdAt).toLocaleString() },
            { label: 'Acknowledged by', value: selected.acknowledgedBy || '—' },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{value}</span>
            </div>
          ))}

          <div className="divider" />

          <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
            {selected.status === 'open' && (
              <button onClick={() => acknowledge(selected.id)} className="btn-ghost" style={{ flex: 1, fontSize: '0.75rem', padding: '9px' }}>Acknowledge</button>
            )}
            {selected.status !== 'resolved' && (
              <button onClick={() => resolve(selected.id)} className="btn-primary" style={{ flex: 1, fontSize: '0.75rem', padding: '9px', background: 'var(--green)', color: 'var(--bg-void)' }}>
                Mark Resolved
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}
