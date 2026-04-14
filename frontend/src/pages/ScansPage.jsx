import React, { useState, useEffect } from 'react';
import { scansAPI } from '../services/api';
import { useApp } from '../context/AppContext';

const MOCK_SCANS = [
  {
    id: '1', target: '10.0.0.0/24', name: 'Internal Network', status: 'completed',
    progress: 100, startedAt: new Date(Date.now() - 7200000), finishedAt: new Date(Date.now() - 3600000),
    vulnerabilities: [
      { id: 'v1', name: 'Apache Path Traversal (CVE-2024-1234)', severity: 'critical', host: '10.0.0.20', port: 80, solution: 'Upgrade Apache to 2.4.50+' },
      { id: 'v2', name: 'OpenSSH Username Enumeration', severity: 'high', host: '10.0.0.20', port: 22, solution: 'Disable username enumeration in sshd_config' },
      { id: 'v3', name: 'Weak TLS Cipher Suites', severity: 'medium', host: '10.0.0.15', port: 443, solution: 'Disable RC4, DES, and export-grade ciphers' },
      { id: 'v4', name: 'HTTP Security Headers Missing', severity: 'low', host: '10.0.0.20', port: 80, solution: 'Add X-Frame-Options, CSP, HSTS headers' },
      { id: 'v5', name: 'Default Credentials (admin/admin)', severity: 'critical', host: '10.0.0.5', port: 9392, solution: 'Change default OpenVAS credentials immediately' },
    ],
  },
  {
    id: '2', target: '192.168.1.0/24', name: 'Dev Network', status: 'running',
    progress: 64, startedAt: new Date(Date.now() - 1800000), finishedAt: null,
    vulnerabilities: [
      { id: 'v6', name: 'Outdated OpenSSL Version', severity: 'high', host: '192.168.1.10', port: 443, solution: 'Upgrade OpenSSL to 3.x' },
    ],
  },
];

const SEV_COLORS = { critical: 'var(--red)', high: 'var(--orange)', medium: 'var(--yellow)', low: 'var(--green)' };
const STATUS_COLORS = { completed: 'var(--green)', running: 'var(--accent)', failed: 'var(--red)', queued: 'var(--yellow)' };

export default function ScansPage() {
  const [scans, setScans] = useState(MOCK_SCANS);
  const [selected, setSelected] = useState(null);
  const [showNew, setShowNew] = useState(false);
  const [sevFilter, setSevFilter] = useState('all');
  const { addToast } = useApp();

  // Simulate running scan progress
  useEffect(() => {
    const t = setInterval(() => {
      setScans(prev => prev.map(s =>
        s.status === 'running' && s.progress < 100
          ? { ...s, progress: Math.min(100, s.progress + Math.random() * 3) }
          : s
      ));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  const startScan = (formData) => {
    const newScan = {
      id: String(Date.now()),
      target: formData.target,
      name: formData.name || formData.target,
      status: 'running',
      progress: 0,
      startedAt: new Date(),
      finishedAt: null,
      vulnerabilities: [],
    };
    setScans(prev => [newScan, ...prev]);
    setShowNew(false);
    addToast(`Scan started: ${newScan.target}`, 'info');
  };

  const selectedScan = selected ? scans.find(s => s.id === selected) : null;
  const vulns = selectedScan?.vulnerabilities || [];
  const filteredVulns = sevFilter === 'all' ? vulns : vulns.filter(v => v.severity === sevFilter);

  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 104px)' }}>
      {/* Left — scan list */}
      <div style={{ width: '320px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={() => setShowNew(true)} className="btn-primary" style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '10px',
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M8 3v10M3 8h10" strokeLinecap="round" />
          </svg>
          New Scan
        </button>

        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {scans.map(scan => {
            const critCount = scan.vulnerabilities.filter(v => v.severity === 'critical').length;
            const highCount = scan.vulnerabilities.filter(v => v.severity === 'high').length;
            return (
              <div key={scan.id}
                onClick={() => setSelected(scan.id === selected ? null : scan.id)}
                className="card hoverable"
                style={{
                  padding: '14px 16px',
                  cursor: 'pointer',
                  border: selected === scan.id ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                  background: selected === scan.id ? 'var(--bg-elevated)' : 'var(--bg-card)',
                }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>{scan.name}</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700,
                    color: STATUS_COLORS[scan.status], textTransform: 'uppercase',
                  }}>
                    {scan.status === 'running' && <span style={{ animation: 'blink 1s infinite', marginRight: '3px' }}>●</span>}
                    {scan.status}
                  </span>
                </div>

                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-tertiary)', marginBottom: '8px' }}>
                  {scan.target}
                </div>

                {scan.status === 'running' && (
                  <div style={{ marginBottom: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)' }}>Progress</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--accent)' }}>{Math.round(scan.progress)}%</span>
                    </div>
                    <div style={{ height: '3px', background: 'var(--bg-surface)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${scan.progress}%`,
                        background: 'linear-gradient(90deg, var(--accent), var(--purple))',
                        borderRadius: '2px', transition: 'width 0.5s ease',
                        boxShadow: '0 0 6px var(--accent-glow)',
                      }} />
                    </div>
                  </div>
                )}

                {scan.status === 'completed' && (
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {critCount > 0 && <span className="badge badge-critical">{critCount} critical</span>}
                    {highCount > 0 && <span className="badge badge-high">{highCount} high</span>}
                    {scan.vulnerabilities.length === 0 && (
                      <span className="badge badge-success">Clean</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right — vulnerability details */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
        {!selectedScan ? (
          <div className="card" style={{
            flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-muted)', gap: '12px',
          }}>
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="var(--border-medium)" strokeWidth="1.5">
              <rect x="4" y="4" width="18" height="18" rx="2" />
              <rect x="26" y="4" width="18" height="18" rx="2" />
              <rect x="4" y="26" width="18" height="18" rx="2" />
              <path d="M26 35h14M33 26v18" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>Select a scan to view vulnerabilities</span>
          </div>
        ) : (
          <>
            {/* Scan header */}
            <div className="card" style={{ padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h2 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '4px' }}>{selectedScan.name}</h2>
                  <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-tertiary)' }}>
                    Target: {selectedScan.target} &nbsp;·&nbsp; Started: {new Date(selectedScan.startedAt).toLocaleString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {['all','critical','high','medium','low'].map(s => (
                    <button key={s} onClick={() => setSevFilter(s)} style={{
                      padding: '4px 10px',
                      background: sevFilter === s ? (s === 'all' ? 'var(--accent-dim)' : `${SEV_COLORS[s] || 'var(--accent)'}20`) : 'transparent',
                      color: sevFilter === s ? (s === 'all' ? 'var(--accent)' : SEV_COLORS[s]) : 'var(--text-tertiary)',
                      border: `1px solid ${sevFilter === s ? (s === 'all' ? 'rgba(0,229,255,0.25)' : `${SEV_COLORS[s]}40`) : 'var(--border-subtle)'}`,
                      borderRadius: '4px',
                      fontFamily: 'var(--font-mono)', fontSize: '0.6rem', fontWeight: 700,
                      textTransform: 'uppercase', letterSpacing: '0.05em', cursor: 'pointer',
                    }}>{s}</button>
                  ))}
                </div>
              </div>

              {/* Vuln summary */}
              <div style={{ display: 'flex', gap: '12px', marginTop: '14px' }}>
                {['critical','high','medium','low'].map(sev => {
                  const count = vulns.filter(v => v.severity === sev).length;
                  return (
                    <div key={sev} style={{
                      flex: 1, padding: '10px', background: `${SEV_COLORS[sev]}10`,
                      border: `1px solid ${SEV_COLORS[sev]}25`, borderRadius: '6px', textAlign: 'center',
                    }}>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: SEV_COLORS[sev], lineHeight: 1 }}>{count}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{sev}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Vuln list */}
            <div className="card" style={{ flex: 1, overflow: 'auto', padding: 0 }}>
              {filteredVulns.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedScan.status === 'running' ? '// Scan in progress...' : '// No vulnerabilities at this severity level'}
                </div>
              ) : (
                <table style={{ width: '100%' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'var(--bg-card)', zIndex: 1 }}>
                    <tr>
                      <th>VULNERABILITY</th>
                      <th>SEVERITY</th>
                      <th>HOST</th>
                      <th>PORT</th>
                      <th>REMEDIATION</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVulns.map(vuln => (
                      <tr key={vuln.id}>
                        <td style={{ color: 'var(--text-primary)', fontWeight: 500, fontSize: '0.82rem' }}>{vuln.name}</td>
                        <td><span className={`badge badge-${vuln.severity}`}>{vuln.severity}</span></td>
                        <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{vuln.host}</span></td>
                        <td><span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem' }}>{vuln.port}</span></td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-tertiary)', maxWidth: '200px' }}>{vuln.solution}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </div>

      {/* New scan modal */}
      {showNew && <NewScanModal onSubmit={startScan} onClose={() => setShowNew(false)} />}
    </div>
  );
}

function NewScanModal({ onSubmit, onClose }) {
  const [form, setForm] = useState({ target: '', name: '', type: 'full' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.target) return;
    onSubmit(form);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 999,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      backdropFilter: 'blur(4px)',
    }} onClick={onClose}>
      <div className="card" style={{
        width: '460px', padding: '28px',
        animation: 'fadeIn 0.2s ease',
        border: '1px solid var(--border-medium)',
      }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ fontWeight: 700, fontSize: '1rem' }}>Launch New Scan</h3>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '1.2rem' }}>×</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Target (IP / Range / Hostname) *
            </label>
            <input
              value={form.target}
              onChange={e => setForm(p => ({ ...p, target: e.target.value }))}
              placeholder="10.0.0.0/24 or api.example.com"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Scan Name (optional)
            </label>
            <input
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. Production Network Q2"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
              Scan Type
            </label>
            <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
              <option value="quick">Quick — Common vulnerabilities only</option>
              <option value="full">Full — Comprehensive (recommended)</option>
              <option value="deep">Deep — All plugins (slow)</option>
            </select>
          </div>

          <div style={{ padding: '12px', background: 'var(--yellow-dim)', border: '1px solid rgba(255,184,0,0.2)', borderRadius: '6px' }}>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--yellow)', lineHeight: 1.6 }}>
              ⚠ Only scan systems you are authorized to test.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <button type="button" onClick={onClose} className="btn-ghost" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" className="btn-primary" style={{ flex: 1 }}>Launch Scan</button>
          </div>
        </form>
      </div>
    </div>
  );
}
