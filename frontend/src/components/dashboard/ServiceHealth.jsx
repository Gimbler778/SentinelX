import React, { useState, useEffect } from 'react';

const SERVICES = [
  { name: 'PostgreSQL', type: 'database', status: 'online', latency: 4, uptime: '99.9%' },
  { name: 'RabbitMQ', type: 'queue', status: 'online', latency: 2, uptime: '99.7%' },
  { name: 'Prometheus', type: 'metrics', status: 'online', latency: 8, uptime: '100%' },
  { name: 'OpenVAS', type: 'scanner', status: 'warning', latency: 120, uptime: '98.2%' },
  { name: 'WebSocket', type: 'realtime', status: 'online', latency: 1, uptime: '99.5%' },
];

const STATUS_COLORS = {
  online: 'var(--green)',
  warning: 'var(--yellow)',
  offline: 'var(--red)',
};

export default function ServiceHealth() {
  const [services, setServices] = useState(SERVICES);
  const [lastCheck, setLastCheck] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => {
      setLastCheck(new Date());
      // Simulate minor latency fluctuation
      setServices(prev => prev.map(s => ({
        ...s,
        latency: Math.max(1, s.latency + Math.floor((Math.random() - 0.5) * 4)),
      })));
    }, 15000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="card" style={{ padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Service Health</div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.6rem',
          color: 'var(--text-muted)',
        }}>
          checked {lastCheck.toLocaleTimeString('en-US', { hour12: false })}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        {services.map((svc) => (
          <div key={svc.name} className="hoverable" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '5px',
          }}>
            <span className="status-dot" style={{
              background: STATUS_COLORS[svc.status],
              animation: svc.status === 'online' ? 'pulse-glow 2s infinite' : 'none',
            }} />

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-primary)' }}>{svc.name}</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>{svc.type}</div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.7rem',
                color: svc.latency > 100 ? 'var(--yellow)' : 'var(--text-secondary)',
              }}>{svc.latency}ms</div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                color: 'var(--text-muted)',
              }}>{svc.uptime}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Overall status bar */}
      <div style={{
        marginTop: '14px',
        padding: '8px 12px',
        background: 'var(--green-dim)',
        border: '1px solid rgba(0,255,136,0.15)',
        borderRadius: '5px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="status-dot online" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--green)' }}>4/5 SERVICES NOMINAL</span>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>1 WARNING</span>
      </div>
    </div>
  );
}
