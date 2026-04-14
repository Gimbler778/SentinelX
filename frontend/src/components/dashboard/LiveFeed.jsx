import React, { useState, useEffect, useRef } from 'react';

const MOCK_EVENTS = [
  { id: 1, level: 'error', message: 'Failed login attempt from 192.168.1.45', time: '14:32:07', source: 'auth' },
  { id: 2, level: 'warning', message: 'Port scan detected on :8080', time: '14:31:55', source: 'network' },
  { id: 3, level: 'info', message: 'User admin@org.com authenticated successfully', time: '14:31:43', source: 'auth' },
  { id: 4, level: 'error', message: 'SQL injection attempt blocked', time: '14:31:28', source: 'waf' },
  { id: 5, level: 'info', message: 'Vulnerability scan #47 started on 10.0.0.0/24', time: '14:31:10', source: 'scanner' },
  { id: 6, level: 'warning', message: 'High memory usage on backend-02: 89%', time: '14:30:52', source: 'system' },
];

const LEVEL_COLORS = {
  error: 'var(--red)',
  warning: 'var(--yellow)',
  info: 'var(--accent)',
  success: 'var(--green)',
};

const LEVEL_PREFIXES = {
  error: '[ERR]',
  warning: '[WRN]',
  info: '[INF]',
  success: '[OK ]',
};

let mockIdCounter = 100;

function generateMockEvent() {
  const templates = [
    { level: 'info', message: 'Heartbeat check passed for prometheus', source: 'monitoring' },
    { level: 'warning', message: `Unusual traffic spike on port ${Math.floor(Math.random() * 9000 + 1000)}`, source: 'network' },
    { level: 'info', message: `Log batch #${Math.floor(Math.random() * 999)} processed`, source: 'pipeline' },
    { level: 'error', message: `Connection timeout to 10.0.0.${Math.floor(Math.random() * 254 + 1)}`, source: 'network' },
    { level: 'success', message: 'Scan completed: 0 critical vulnerabilities', source: 'scanner' },
  ];
  const t = templates[Math.floor(Math.random() * templates.length)];
  return {
    ...t,
    id: ++mockIdCounter,
    time: new Date().toLocaleTimeString('en-US', { hour12: false }),
  };
}

export default function LiveFeed() {
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [paused, setPaused] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => {
      setEvents(prev => [generateMockEvent(), ...prev].slice(0, 40));
    }, 3000);
    return () => clearInterval(t);
  }, [paused]);

  return (
    <div className="card" style={{ padding: '18px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Live Feed</div>
          {!paused && (
            <span style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: 'var(--green)',
              animation: 'pulse-glow 1.5s infinite',
              display: 'block',
            }} />
          )}
        </div>
        <button onClick={() => setPaused(p => !p)} style={{
          background: paused ? 'var(--accent-dim)' : 'var(--bg-surface)',
          border: `1px solid ${paused ? 'var(--accent)' : 'var(--border-medium)'}`,
          borderRadius: '4px',
          color: paused ? 'var(--accent)' : 'var(--text-tertiary)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          padding: '3px 8px',
          cursor: 'pointer',
          letterSpacing: '0.06em',
        }}>
          {paused ? 'RESUME' : 'PAUSE'}
        </button>
      </div>

      {/* Event list */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.68rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1px',
        maxHeight: '280px',
        overflowY: 'auto',
      }}>
        {events.map((evt, i) => (
          <div key={evt.id} style={{
            display: 'flex',
            gap: '8px',
            padding: '4px 6px',
            borderRadius: '3px',
            opacity: i === 0 ? 1 : 0.7 + (events.length - i) * 0.01,
            animation: i === 0 ? 'fadeIn 0.3s ease' : 'none',
            background: i === 0 ? `${LEVEL_COLORS[evt.level]}08` : 'transparent',
          }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0, width: '50px' }}>{evt.time}</span>
            <span style={{ color: LEVEL_COLORS[evt.level], flexShrink: 0, width: '40px' }}>{LEVEL_PREFIXES[evt.level]}</span>
            <span style={{ color: 'var(--text-secondary)', flex: 1, wordBreak: 'break-word' }}>{evt.message}</span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div style={{
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid var(--border-dim)',
        fontFamily: 'var(--font-mono)',
        fontSize: '0.6rem',
        color: 'var(--text-muted)',
        display: 'flex',
        justifyContent: 'space-between',
      }}>
        <span>showing last {events.length} events</span>
        <span style={{ color: paused ? 'var(--yellow)' : 'var(--green)' }}>
          {paused ? '● PAUSED' : '● LIVE'}
        </span>
      </div>
    </div>
  );
}
