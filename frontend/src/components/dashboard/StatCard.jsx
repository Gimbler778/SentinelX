import React from 'react';

const ICONS = {
  shield: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 1.5L2.25 4.5V9C2.25 13.24 5.1 17.18 9 18C12.9 17.18 15.75 13.24 15.75 9V4.5L9 1.5Z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6 9l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  terminal: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="2.5" width="16" height="13" rx="2" />
      <path d="M5 7l3.5 2L5 11M9.5 11h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  bell: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M9 1.5a4.5 4.5 0 0 1 4.5 4.5v3.5l1.5 2.5H3L4.5 9.5V6A4.5 4.5 0 0 1 9 1.5z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7.5 14.5a1.5 1.5 0 0 0 3 0" strokeLinecap="round" />
    </svg>
  ),
  scan: (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1.5" y="1.5" width="6" height="6" rx="1" />
      <rect x="10.5" y="1.5" width="6" height="6" rx="1" />
      <rect x="1.5" y="10.5" width="6" height="6" rx="1" />
      <path d="M10.5 13.5h5M13 10.5v5" strokeLinecap="round" />
    </svg>
  ),
};

const DELTA_COLORS = {
  positive: 'var(--green)',
  warning: 'var(--yellow)',
  negative: 'var(--red)',
  neutral: 'var(--text-tertiary)',
};

export default function StatCard({ label, value, delta, deltaType = 'neutral', icon, color, format }) {
  const isLoading = value === null || value === undefined;

  const formatValue = (v) => {
    if (format === 'number' && typeof v === 'number') {
      return v.toLocaleString();
    }
    return v;
  };

  return (
    <div className="card hoverable" style={{
      padding: '18px 20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      transition: 'all 0.2s ease',
      position: 'relative',
      overflow: 'hidden',
    }}
    onMouseEnter={e => {
      e.currentTarget.style.borderColor = color;
      e.currentTarget.style.boxShadow = `0 4px 24px rgba(0,0,0,0.4), 0 0 0 1px ${color}20`;
    }}
    onMouseLeave={e => {
      e.currentTarget.style.borderColor = 'var(--border-subtle)';
      e.currentTarget.style.boxShadow = 'var(--shadow-card)';
    }}>
      {/* Subtle gradient background */}
      <div style={{
        position: 'absolute',
        top: 0,
        right: 0,
        width: '80px',
        height: '80px',
        background: `radial-gradient(circle at top right, ${color}08, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          fontWeight: 700,
          letterSpacing: '0.1em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
        }}>{label}</div>

        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          background: `${color}15`,
          border: `1px solid ${color}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: color,
        }}>
          {ICONS[icon]}
        </div>
      </div>

      {isLoading ? (
        <div className="skeleton" style={{ height: '36px', width: '80px' }} />
      ) : (
        <div style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'var(--text-primary)',
          lineHeight: 1,
          letterSpacing: '-0.02em',
        }}>
          {formatValue(value)}
        </div>
      )}

      <div style={{
        fontFamily: 'var(--font-mono)',
        fontSize: '0.65rem',
        color: DELTA_COLORS[deltaType],
      }}>
        {delta}
      </div>
    </div>
  );
}
