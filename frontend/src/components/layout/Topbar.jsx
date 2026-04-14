import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';

const PAGE_TITLES = {
  '/dashboard': { title: 'Dashboard', subtitle: 'Security operations overview' },
  '/logs': { title: 'Log Stream', subtitle: 'Real-time system event logs' },
  '/alerts': { title: 'Alerts', subtitle: 'Active security notifications' },
  '/scans': { title: 'Vulnerability Scans', subtitle: 'OpenVAS-powered scanning' },
  '/monitoring': { title: 'Monitoring', subtitle: 'Prometheus metrics & health' },
  '/settings': { title: 'Settings', subtitle: 'System configuration' },
};

export default function Topbar() {
  const { pathname } = useLocation();
  const { user, getAvatarUrl } = useAuth();
  const { addToast } = useApp();
  const [time, setTime] = React.useState(new Date());

  React.useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const page = PAGE_TITLES[pathname] || { title: 'SentinelX', subtitle: '' };

  return (
    <header style={{
      height: '56px',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 24px',
      gap: '16px',
      position: 'sticky',
      top: 0,
      zIndex: 90,
    }}>
      {/* Page title */}
      <div style={{ flex: 1 }}>
        <div style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '10px',
        }}>
          <h1 style={{
            fontWeight: 700,
            fontSize: '0.95rem',
            color: 'var(--text-primary)',
            letterSpacing: '0.02em',
          }}>{page.title}</h1>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
          }}>//{page.subtitle}</span>
        </div>
      </div>

      {/* Clock */}
      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.7rem',
        color: 'var(--text-tertiary)',
        letterSpacing: '0.05em',
        padding: '4px 10px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '4px',
      }}>
        {time.toLocaleTimeString('en-US', { hour12: false })}
      </div>

      {/* Status indicator */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '4px 10px',
        background: 'var(--green-dim)',
        border: '1px solid rgba(0,255,136,0.2)',
        borderRadius: '4px',
      }}>
        <span className="status-dot online" />
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--green)',
          letterSpacing: '0.05em',
        }}>SYSTEMS ONLINE</span>
      </div>

      {/* User avatar */}
      <img
        src={user?.avatar || getAvatarUrl(user?.email || 'user', 'bottts')}
        alt="user"
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '50%',
          border: '1px solid var(--border-medium)',
          background: 'var(--bg-card)',
          cursor: 'pointer',
        }}
        title={user?.name}
        onError={e => { e.target.src = getAvatarUrl('fallback', 'identicon'); }}
      />
    </header>
  );
}
