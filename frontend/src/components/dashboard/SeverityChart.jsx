import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from 'recharts';

const MOCK_DATA = [
  { time: '00:00', critical: 1, high: 3, medium: 7, low: 12 },
  { time: '02:00', critical: 0, high: 2, medium: 5, low: 8 },
  { time: '04:00', critical: 0, high: 1, medium: 3, low: 6 },
  { time: '06:00', critical: 2, high: 4, medium: 8, low: 14 },
  { time: '08:00', critical: 1, high: 6, medium: 12, low: 20 },
  { time: '10:00', critical: 3, high: 8, medium: 15, low: 24 },
  { time: '12:00', critical: 2, high: 5, medium: 11, low: 18 },
  { time: '14:00', critical: 1, high: 4, medium: 9, low: 16 },
  { time: '16:00', critical: 4, high: 7, medium: 13, low: 21 },
  { time: '18:00', critical: 2, high: 5, medium: 10, low: 17 },
  { time: '20:00', critical: 1, high: 3, medium: 8, low: 13 },
  { time: '22:00', critical: 0, high: 2, medium: 6, low: 10 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)',
      border: '1px solid var(--border-medium)',
      borderRadius: '6px',
      padding: '10px 14px',
      fontFamily: 'var(--font-mono)',
      fontSize: '0.7rem',
    }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '6px' }}>{label}</div>
      {payload.map(p => (
        <div key={p.dataKey} style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', color: p.fill, marginBottom: '2px' }}>
          <span>{p.name?.toUpperCase()}</span>
          <span style={{ fontWeight: 700 }}>{p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function SeverityChart() {
  const [view, setView] = useState('area');

  return (
    <div className="card" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>Alert Volume</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Last 24 hours by severity</div>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-surface)',
          borderRadius: '6px',
          border: '1px solid var(--border-subtle)',
          overflow: 'hidden',
        }}>
          {['area', 'bar'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '5px 12px',
              background: view === v ? 'var(--accent-dim)' : 'transparent',
              color: view === v ? 'var(--accent)' : 'var(--text-tertiary)',
              border: 'none',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.65rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}>{v}</button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={200}>
        {view === 'area' ? (
          <AreaChart data={MOCK_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <defs>
              {[
                { key: 'critical', color: '#ff3b5c' },
                { key: 'high', color: '#ff6b2b' },
                { key: 'medium', color: '#ffb800' },
                { key: 'low', color: '#00ff88' },
              ].map(({ key, color }) => (
                <linearGradient key={key} id={`grad-${key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Area type="monotone" dataKey="critical" name="Critical" stroke="#ff3b5c" fill="url(#grad-critical)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="high" name="High" stroke="#ff6b2b" fill="url(#grad-high)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="medium" name="Medium" stroke="#ffb800" fill="url(#grad-medium)" strokeWidth={1.5} />
            <Area type="monotone" dataKey="low" name="Low" stroke="#00ff88" fill="url(#grad-low)" strokeWidth={1.5} />
          </AreaChart>
        ) : (
          <BarChart data={MOCK_DATA} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontFamily: 'Space Mono', fontSize: 10, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="critical" name="Critical" fill="#ff3b5c" radius={[2,2,0,0]} maxBarSize={16} />
            <Bar dataKey="high" name="High" fill="#ff6b2b" radius={[2,2,0,0]} maxBarSize={16} />
            <Bar dataKey="medium" name="Medium" fill="#ffb800" radius={[2,2,0,0]} maxBarSize={16} />
            <Bar dataKey="low" name="Low" fill="#00ff88" radius={[2,2,0,0]} maxBarSize={16} />
          </BarChart>
        )}
      </ResponsiveContainer>

      {/* Legend */}
      <div style={{ display: 'flex', gap: '16px', marginTop: '12px', justifyContent: 'center' }}>
        {[
          { label: 'Critical', color: '#ff3b5c' },
          { label: 'High', color: '#ff6b2b' },
          { label: 'Medium', color: '#ffb800' },
          { label: 'Low', color: '#00ff88' },
        ].map(({ label, color }) => (
          <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: color }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
