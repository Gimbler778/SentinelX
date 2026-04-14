import React, { useState, useEffect, useRef, useCallback } from 'react';
import { logsAPI } from '../services/api';

const LEVELS = ['all', 'error', 'warning', 'info', 'debug'];
const SOURCES = ['all', 'auth', 'network', 'system', 'scanner', 'waf', 'pipeline', 'database'];

const LEVEL_COLORS = {
  error: 'var(--red)',
  warning: 'var(--yellow)',
  info: 'var(--accent)',
  debug: 'var(--text-tertiary)',
  success: 'var(--green)',
};

let idSeq = 1000;
function makeLog(overrides = {}) {
  const templates = [
    { level: 'error', source: 'auth', message: `Failed login from ${randIp()} — 3 attempts` },
    { level: 'warning', source: 'network', message: `Anomalous packet rate on eth0: ${randInt(1000,9999)} pps` },
    { level: 'info', source: 'system', message: `Cron job completed in ${randInt(10,500)}ms` },
    { level: 'info', source: 'auth', message: `Session created for user ${randUser()}` },
    { level: 'error', source: 'database', message: `Query timeout after 30s on table logs` },
    { level: 'warning', source: 'scanner', message: `OpenVAS scan stalled at ${randInt(40,90)}%` },
    { level: 'info', source: 'pipeline', message: `Message batch flushed to queue: ${randInt(100,999)} events` },
    { level: 'debug', source: 'system', message: `GC pause: ${randInt(5,80)}ms heap=${randInt(200,800)}MB` },
    { level: 'error', source: 'waf', message: `XSS payload blocked from ${randIp()}` },
    { level: 'info', source: 'network', message: `DNS resolution for api.internal: ${randInt(1,20)}ms` },
  ];
  const t = templates[Math.floor(Math.random() * templates.length)];
  return { id: ++idSeq, timestamp: new Date().toISOString(), ...t, ...overrides };
}

function randIp() { return `${randInt(1,254)}.${randInt(1,254)}.${randInt(1,254)}.${randInt(1,254)}`; }
function randUser() { return ['alice@corp.io','bob@corp.io','charlie@corp.io','admin@corp.io'][randInt(0,3)]; }
function randInt(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }

const SEED_LOGS = Array.from({ length: 60 }, (_, i) => {
  const l = makeLog();
  l.timestamp = new Date(Date.now() - (60 - i) * 8000).toISOString();
  return l;
});

export default function LogsPage() {
  const [logs, setLogs] = useState(SEED_LOGS);
  const [search, setSearch] = useState('');
  const [level, setLevel] = useState('all');
  const [source, setSource] = useState('all');
  const [live, setLive] = useState(true);
  const [selected, setSelected] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 50;
  const bottomRef = useRef(null);
  const containerRef = useRef(null);
  const liveRef = useRef(live);
  liveRef.current = live;

  // Simulate live log stream
  useEffect(() => {
    const t = setInterval(() => {
      if (!liveRef.current) return;
      setLogs(prev => [makeLog(), ...prev].slice(0, 500));
    }, 2000);
    return () => clearInterval(t);
  }, []);

  const filtered = logs.filter(l => {
    if (level !== 'all' && l.level !== level) return false;
    if (source !== 'all' && l.source !== source) return false;
    if (search && !l.message.toLowerCase().includes(search.toLowerCase()) &&
        !l.source.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const paginated = filtered.slice(0, page * PER_PAGE);

  const exportLogs = () => {
    const csv = ['timestamp,level,source,message',
      ...filtered.map(l => `"${l.timestamp}","${l.level}","${l.source}","${l.message}"`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
    a.download = `sentinelx-logs-${Date.now()}.csv`; a.click();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', height: 'calc(100vh - 104px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <svg style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-tertiary)' }}
            width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="6.5" cy="6.5" r="4.5" /><path d="M10 10l3 3" strokeLinecap="round" />
          </svg>
          <input
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search logs..."
            style={{ paddingLeft: '32px', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}
          />
        </div>

        {/* Level filter */}
        <div style={{ display: 'flex', background: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '6px', overflow: 'hidden' }}>
          {LEVELS.map(l => (
            <button key={l} onClick={() => { setLevel(l); setPage(1); }} style={{
              padding: '7px 12px',
              background: level === l ? 'var(--accent-dim)' : 'transparent',
              color: level === l ? 'var(--accent)' : 'var(--text-tertiary)',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.62rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
            }}>{l}</button>
          ))}
        </div>

        {/* Source filter */}
        <select value={source} onChange={e => { setSource(e.target.value); setPage(1); }}
          style={{ width: 'auto', fontFamily: 'var(--font-mono)', fontSize: '0.75rem', padding: '7px 10px' }}>
          {SOURCES.map(s => <option key={s} value={s}>{s === 'all' ? 'All sources' : s}</option>)}
        </select>

        {/* Live toggle */}
        <button onClick={() => setLive(p => !p)} style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px',
          background: live ? 'var(--green-dim)' : 'var(--bg-card)',
          border: `1px solid ${live ? 'rgba(0,255,136,0.25)' : 'var(--border-medium)'}`,
          borderRadius: '6px',
          color: live ? 'var(--green)' : 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700,
          letterSpacing: '0.06em', cursor: 'pointer',
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: live ? 'var(--green)' : 'var(--text-muted)', animation: live ? 'pulse-glow 1.5s infinite' : 'none' }} />
          {live ? 'LIVE' : 'PAUSED'}
        </button>

        {/* Export */}
        <button onClick={exportLogs} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M8 2v8M5 7l3 3 3-3M2 12v1a1 1 0 001 1h10a1 1 0 001-1v-1" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Export CSV
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'flex', gap: '16px', fontFamily: 'var(--font-mono)', fontSize: '0.65rem' }}>
        <span style={{ color: 'var(--text-muted)' }}>{filtered.length.toLocaleString()} events</span>
        {['error','warning','info'].map(l => (
          <span key={l} style={{ color: LEVEL_COLORS[l] }}>
            {logs.filter(x => x.level === l).length} {l}
          </span>
        ))}
        <span style={{ marginLeft: 'auto', color: 'var(--text-tertiary)' }}>
          {logs.length.toLocaleString()} total in buffer
        </span>
      </div>

      {/* Log table */}
      <div ref={containerRef} className="card" style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        <table style={{ width: '100%', tableLayout: 'fixed' }}>
          <colgroup>
            <col style={{ width: '160px' }} />
            <col style={{ width: '72px' }} />
            <col style={{ width: '90px' }} />
            <col />
          </colgroup>
          <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 2 }}>
            <tr>
              <th>TIMESTAMP</th>
              <th>LEVEL</th>
              <th>SOURCE</th>
              <th>MESSAGE</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((log, i) => (
              <tr key={log.id}
                onClick={() => setSelected(selected?.id === log.id ? null : log)}
                style={{
                  cursor: 'pointer',
                  background: selected?.id === log.id ? 'var(--accent-dim)' : (i === 0 && live ? `${LEVEL_COLORS[log.level]}06` : 'transparent'),
                  animation: i === 0 && live ? 'fadeIn 0.3s ease' : 'none',
                }}>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    {new Date(log.timestamp).toLocaleTimeString('en-US', { hour12: false })}.
                    <span style={{ color: 'var(--text-tertiary)' }}>
                      {String(new Date(log.timestamp).getMilliseconds()).padStart(3,'0')}
                    </span>
                  </span>
                </td>
                <td>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.6rem',
                    fontWeight: 700,
                    color: LEVEL_COLORS[log.level],
                    padding: '1px 5px',
                    background: `${LEVEL_COLORS[log.level]}15`,
                    borderRadius: '2px',
                    textTransform: 'uppercase',
                  }}>{log.level}</span>
                </td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    {log.source}
                  </span>
                </td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {log.message}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginated.length < filtered.length && (
          <div style={{ padding: '16px', textAlign: 'center' }}>
            <button onClick={() => setPage(p => p + 1)} className="btn-ghost" style={{ fontSize: '0.75rem' }}>
              Load more ({filtered.length - paginated.length} remaining)
            </button>
          </div>
        )}
      </div>

      {/* Detail panel */}
      {selected && (
        <div className="card" style={{
          padding: '16px',
          background: 'var(--bg-elevated)',
          border: '1px solid var(--accent)',
          animation: 'fadeIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--accent)', fontWeight: 700 }}>
              // EVENT DETAIL — ID #{selected.id}
            </span>
            <button onClick={() => setSelected(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1rem' }}>×</button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { label: 'Timestamp', value: selected.timestamp },
              { label: 'Level', value: selected.level.toUpperCase() },
              { label: 'Source', value: selected.source },
              { label: 'Event ID', value: `#${selected.id}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '3px', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)' }}>{value}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: '12px', padding: '10px', background: 'var(--bg-surface)', borderRadius: '4px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', marginBottom: '4px', textTransform: 'uppercase' }}>Message</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-primary)', lineHeight: 1.6 }}>{selected.message}</div>
          </div>
        </div>
      )}
    </div>
  );
}
