import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';

function genMetricPoint(base, variance) {
  return Math.max(0, base + (Math.random() - 0.5) * variance);
}

function initSeries(base, variance, len = 30) {
  return Array.from({ length: len }, (_, i) => {
    const t = new Date(Date.now() - (len - i) * 10000);
    return {
      time: t.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: genMetricPoint(base, variance),
    };
  });
}

const METRIC_CONFIGS = [
  { key: 'cpu', label: 'CPU Usage', unit: '%', base: 42, variance: 20, color: 'var(--accent)', max: 100 },
  { key: 'memory', label: 'Memory', unit: '%', base: 67, variance: 8, color: 'var(--purple)', max: 100 },
  { key: 'rps', label: 'Requests/s', unit: '', base: 340, variance: 120, color: 'var(--green)', max: null },
  { key: 'latency', label: 'P95 Latency', unit: 'ms', base: 45, variance: 30, color: 'var(--yellow)', max: null },
];

const CustomTooltip = ({ active, payload, label, unit }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '5px',
      padding: '8px 12px', fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
    }}>
      <div style={{ color: 'var(--text-tertiary)', marginBottom: '4px' }}>{label}</div>
      <div style={{ color: payload[0]?.color, fontWeight: 700 }}>
        {payload[0]?.value?.toFixed(1)}{unit}
      </div>
    </div>
  );
};

function MetricChart({ config, data }) {
  const latest = data[data.length - 1]?.value || 0;
  const prev = data[data.length - 2]?.value || 0;
  const delta = latest - prev;

  return (
    <div className="card" style={{ padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>
            {config.label}
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
              {latest.toFixed(1)}
            </span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>{config.unit}</span>
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontFamily: 'var(--font-mono)', fontSize: '0.7rem',
            color: delta > 0 ? 'var(--red)' : 'var(--green)',
            marginBottom: '4px',
          }}>
            {delta > 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}{config.unit}
          </div>
          <div style={{
            width: '8px', height: '8px', borderRadius: '50%', background: config.color,
            marginLeft: 'auto', boxShadow: `0 0 6px ${config.color}`,
            animation: 'pulse-glow 2s infinite',
          }} />
        </div>
      </div>

      {config.max && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ height: '3px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(100, latest)}%`,
              background: latest > 80 ? 'var(--red)' : latest > 60 ? 'var(--yellow)' : config.color,
              borderRadius: '2px', transition: 'width 0.5s ease',
            }} />
          </div>
        </div>
      )}

      <ResponsiveContainer width="100%" height={80}>
        <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`grad-${config.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={config.color} stopOpacity={0.3} />
              <stop offset="100%" stopColor={config.color} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="value" stroke={config.color} fill={`url(#grad-${config.key})`} strokeWidth={1.5} dot={false} />
          <Tooltip content={<CustomTooltip unit={config.unit} />} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function MonitoringPage() {
  const [metrics, setMetrics] = useState(() =>
    Object.fromEntries(METRIC_CONFIGS.map(c => [c.key, initSeries(c.base, c.variance)]))
  );

  const [httpData, setHttpData] = useState(initSeries(340, 80));
  const [rabbitData, setRabbitData] = useState(
    Array.from({ length: 30 }, (_, i) => ({
      time: `${i}s`,
      published: genMetricPoint(120, 40),
      consumed: genMetricPoint(115, 35),
    }))
  );

  useEffect(() => {
    const t = setInterval(() => {
      const now = new Date().toLocaleTimeString('en-US', { hour12: false });
      setMetrics(prev => {
        const next = { ...prev };
        METRIC_CONFIGS.forEach(c => {
          const newPoint = { time: now, value: genMetricPoint(c.base, c.variance) };
          next[c.key] = [...prev[c.key].slice(1), newPoint];
        });
        return next;
      });
      setRabbitData(prev => [...prev.slice(1), {
        time: now,
        published: genMetricPoint(120, 40),
        consumed: genMetricPoint(115, 35),
      }]);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '4px' }}>
            // PROMETHEUS SCRAPE — 15s interval
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '5px 10px', background: 'var(--green-dim)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '5px' }}>
          <span className="status-dot online" />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--green)' }}>LIVE METRICS</span>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        {METRIC_CONFIGS.map(config => (
          <MetricChart key={config.key} config={config} data={metrics[config.key]} />
        ))}
      </div>

      {/* RabbitMQ message throughput */}
      <div className="card" style={{ padding: '20px' }}>
        <div style={{ marginBottom: '16px' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', marginBottom: '3px' }}>RabbitMQ Message Throughput</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-tertiary)' }}>Published vs Consumed — queues: logs, alerts, scans</div>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={rabbitData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-dim)" vertical={false} />
            <XAxis dataKey="time" tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} interval={4} />
            <YAxis tick={{ fontFamily: 'Space Mono', fontSize: 9, fill: 'var(--text-muted)' }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border-medium)', borderRadius: '5px', fontFamily: 'Space Mono', fontSize: '0.7rem' }} />
            <Line type="monotone" dataKey="published" stroke="var(--accent)" strokeWidth={1.5} dot={false} name="Published" />
            <Line type="monotone" dataKey="consumed" stroke="var(--purple)" strokeWidth={1.5} dot={false} name="Consumed" />
          </LineChart>
        </ResponsiveContainer>
        <div style={{ display: 'flex', gap: '16px', marginTop: '8px', justifyContent: 'center' }}>
          {[{ label: 'Published', color: 'var(--accent)' }, { label: 'Consumed', color: 'var(--purple)' }].map(({ label, color }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <div style={{ width: '16px', height: '2px', background: color, borderRadius: '1px' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-tertiary)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Prometheus targets table */}
      <div className="card" style={{ padding: '0' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.875rem' }}>Prometheus Targets</div>
        </div>
        <table>
          <thead>
            <tr>
              <th>ENDPOINT</th>
              <th>JOB</th>
              <th>STATE</th>
              <th>LAST SCRAPE</th>
              <th>DURATION</th>
            </tr>
          </thead>
          <tbody>
            {[
              { endpoint: 'localhost:3000/metrics', job: 'backend', state: 'up', scrape: '3s ago', duration: '4ms' },
              { endpoint: 'localhost:9090/metrics', job: 'prometheus', state: 'up', scrape: '8s ago', duration: '2ms' },
            ].map(t => (
              <tr key={t.endpoint}>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{t.endpoint}</span></td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{t.job}</span></td>
                <td>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.65rem', fontWeight: 700,
                    color: t.state === 'up' ? 'var(--green)' : 'var(--red)',
                    padding: '2px 8px', background: t.state === 'up' ? 'var(--green-dim)' : 'var(--red-dim)',
                    borderRadius: '3px', textTransform: 'uppercase',
                  }}>{t.state}</span>
                </td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{t.scrape}</span></td>
                <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{t.duration}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
