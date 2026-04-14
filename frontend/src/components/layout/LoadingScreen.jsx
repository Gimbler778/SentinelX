import React from 'react';

export default function LoadingScreen() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      background: 'var(--bg-void)',
      gap: '24px',
    }}>
      {/* Logo mark */}
      <div style={{ position: 'relative' }}>
        <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
          <path d="M24 4L6 12V24C6 33.94 13.94 43.28 24 46C34.06 43.28 42 33.94 42 24V12L24 4Z"
            stroke="var(--accent)" strokeWidth="1.5" fill="none"
            style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}
          />
          <path d="M24 10L12 16V24C12 30.63 17.38 36.94 24 39C30.62 36.94 36 30.63 36 24V16L24 10Z"
            fill="var(--accent-dim)" stroke="var(--accent)" strokeWidth="1"
          />
          <path d="M18 24L22 28L30 20" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <div style={{
          position: 'absolute',
          inset: '-8px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, var(--accent-dim) 0%, transparent 70%)',
          animation: 'pulse-glow 2s ease infinite',
        }} />
      </div>

      {/* Name */}
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: 'var(--font-display)',
          fontWeight: 800,
          fontSize: '1.25rem',
          letterSpacing: '0.15em',
          color: 'var(--text-primary)',
          textTransform: 'uppercase',
        }}>SentinelX</div>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--text-tertiary)',
          marginTop: '4px',
          letterSpacing: '0.1em',
        }}>INITIALIZING SYSTEMS...</div>
      </div>

      {/* Animated dots */}
      <div style={{ display: 'flex', gap: '6px' }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: 'var(--accent)',
            animation: `dot-pulse 1.4s ease-in-out ${i * 0.16}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
