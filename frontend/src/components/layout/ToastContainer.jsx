import React from 'react';
import { useApp } from '../../context/AppContext';

const TOAST_ICONS = {
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ',
};

const TOAST_COLORS = {
  success: 'var(--green)',
  error: 'var(--red)',
  warning: 'var(--yellow)',
  info: 'var(--accent)',
};

export default function ToastContainer() {
  const { notifications, removeToast } = useApp();

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      zIndex: 9999,
      pointerEvents: 'none',
    }}>
      {notifications.map((toast) => (
        <div key={toast.id}
          onClick={() => removeToast(toast.id)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 16px',
            background: 'var(--bg-elevated)',
            border: `1px solid ${TOAST_COLORS[toast.type]}40`,
            borderLeft: `3px solid ${TOAST_COLORS[toast.type]}`,
            borderRadius: '6px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
            animation: 'slideInLeft 0.25s ease',
            pointerEvents: 'auto',
            cursor: 'pointer',
            minWidth: '260px',
            maxWidth: '360px',
          }}>
          <span style={{
            color: TOAST_COLORS[toast.type],
            fontFamily: 'var(--font-mono)',
            fontSize: '0.75rem',
            fontWeight: 700,
          }}>{TOAST_ICONS[toast.type]}</span>
          <span style={{
            fontSize: '0.8rem',
            color: 'var(--text-secondary)',
            flex: 1,
          }}>{toast.message}</span>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.6rem',
            color: 'var(--text-muted)',
          }}>{toast.time.toLocaleTimeString('en-US', { hour12: false })}</span>
        </div>
      ))}
    </div>
  );
}
