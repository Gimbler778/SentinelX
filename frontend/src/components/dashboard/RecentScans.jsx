import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { scansAPI } from '../../services/api';

const MOCK_SCANS = [
  { id: '1', target: '10.0.0.0/24', status: 'completed', vulnerabilities: { critical: 2, high: 5, medium: 12, low: 8 }, startedAt: new Date(Date.now() - 3600000), duration: '42m' },
  { id: '2', target: '192.168.1.0/24', status: 'running', vulnerabilities: { critical: 0, high: 1, medium: 3, low: 0 }, startedAt: new Date(Date.now() - 900000), duration: '15m' },
  { id: '3', target: 'api.internal.corp', status: 'completed', vulnerabilities: { critical: 0, high: 2, medium: 4, low: 11 }, startedAt: new Date(Date.now() - 86400000), duration: '28m' },
  { id: '4', target: 'db.internal.corp', status: 'failed', vulnerabilities: { critical: 0, high: 0, medium: 0, low: 0 }, startedAt: new Date(Date.now() - 172800000), duration: '—' },
];

const STATUS_CONFIG = {
  completed: { color: 'var(--green)', label: 'DONE' },
  running: { color: 'var(--accent)', label: 'LIVE' },
  failed: { color: 'var(--red)', label: 'FAIL' },
  queued: { color: 'var(--yellow)', label: 'WAIT' },
};

export default function RecentScans() {
  const [scans, setScans] = useState(MOCK_SCANS);
  const navigate = useNavigate();

  useEffect(() => {
    scansAPI.getAll({ limit: 5 })
      .then(({ data }) => setScans(data.scans || MOCK_SCANS))
      .catch(() => setScans(MOCK_SCANS));
  }, []);

  return (
    <div className="card" style={{ padding: '18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>Recent Scans</div>
        <button onClick={() => navigate('/scans')} style={{
          background: 'transparent',
          border: 'none',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.65rem',
          color: 'var(--accent)',
          cursor: 'pointer',
          letterSpacing: '0.04em',
        }}>VIEW ALL →</button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%' }}>
          <thead>
            <tr>
              <th>TARGET</th>
              <th>STATUS</th>
              <th>CRITICAL</th>
              <th>HIGH</th>
              <th>DURATION</th>
              <th>STARTED</th>
            </tr>
          </thead>
          <tbody>
            {scans.map(scan => {
              const cfg = STATUS_CONFIG[scan.status] || STATUS_CONFIG.queued;
              return (
                <tr key={scan.id} style={{ cursor: 'pointer' }} onClick={() => navigate('/scans')}>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-primary)' }}>
                      {scan.target}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.62rem',
                      fontWeight: 700,
                      color: cfg.color,
                      padding: '2px 6px',
                      background: `${cfg.color}15`,
                      borderRadius: '3px',
                    }}>
                      {scan.status === 'running' && (
                        <span style={{ marginRight: '4px', animation: 'blink 1s infinite' }}>●</span>
                      )}
                      {cfg.label}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: scan.vulnerabilities.critical > 0 ? 'var(--red)' : 'var(--text-muted)' }}>
                      {scan.vulnerabilities.critical}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: scan.vulnerabilities.high > 0 ? 'var(--orange)' : 'var(--text-muted)' }}>
                      {scan.vulnerabilities.high}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {scan.duration}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                      {timeAgo(scan.startedAt)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
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
