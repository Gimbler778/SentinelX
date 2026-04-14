import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import { monitoringAPI } from '../services/api';
import StatCard from '../components/dashboard/StatCard';
import ThreatMap from '../components/dashboard/ThreatMap';
import LiveFeed from '../components/dashboard/LiveFeed';
import SeverityChart from '../components/dashboard/SeverityChart';
import ServiceHealth from '../components/dashboard/ServiceHealth';
import RecentScans from '../components/dashboard/RecentScans';

export default function DashboardPage() {
  const { user, getAvatarUrl } = useAuth();
  const { addToast } = useApp();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const { data } = await monitoringAPI.getDashboardStats();
      setStats(data);
    } catch (err) {
      // Use mock data for demo
      setStats(MOCK_STATS);
    } finally {
      setLoading(false);
    }
  };

  const greeting = getGreeting();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Welcome banner */}
      <div className="card" style={{
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-elevated) 100%)',
        borderColor: 'var(--border-medium)',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative accent line */}
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '3px',
          background: 'var(--accent)',
          boxShadow: '0 0 12px var(--accent-glow)',
        }} />

        <img
          src={user?.avatar || getAvatarUrl(user?.email || 'user', 'bottts')}
          alt="avatar"
          style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            border: '2px solid var(--accent)',
            background: 'var(--bg-surface)',
          }}
          onError={e => { e.target.src = getAvatarUrl('fallback', 'identicon'); }}
        />

        <div style={{ flex: 1 }}>
          <div style={{
            fontSize: '1.05rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
          }}>
            {greeting}, <span style={{ color: 'var(--accent)' }}>{user?.name?.split(' ')[0] || 'Operator'}</span>
          </div>
          <div style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)',
            marginTop: '2px',
          }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            {' '}&mdash;{' '}
            Last login: {user?.lastLogin ? new Date(user.lastLogin).toLocaleTimeString() : 'Just now'}
          </div>
        </div>

        {/* Security score */}
        <div style={{
          textAlign: 'right',
          padding: '8px 16px',
          background: 'var(--green-dim)',
          border: '1px solid rgba(0,255,136,0.2)',
          borderRadius: '6px',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--green)', lineHeight: 1 }}>94</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-tertiary)', marginTop: '2px', letterSpacing: '0.06em' }}>SECURITY SCORE</div>
        </div>
      </div>

      {/* Stat cards row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
        <StatCard
          label="Active Threats"
          value={loading ? null : (stats?.activeThreats ?? 3)}
          delta="-2 from yesterday"
          deltaType="positive"
          icon="shield"
          color="var(--red)"
        />
        <StatCard
          label="Logs / Hour"
          value={loading ? null : (stats?.logsPerHour ?? 12847)}
          delta="+18% from avg"
          deltaType="neutral"
          icon="terminal"
          color="var(--accent)"
          format="number"
        />
        <StatCard
          label="Open Alerts"
          value={loading ? null : (stats?.openAlerts ?? 7)}
          delta="2 critical"
          deltaType="warning"
          icon="bell"
          color="var(--yellow)"
        />
        <StatCard
          label="Scans Today"
          value={loading ? null : (stats?.scansToday ?? 4)}
          delta="1 in progress"
          deltaType="neutral"
          icon="scan"
          color="var(--purple)"
        />
      </div>

      {/* Main content grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '20px' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <SeverityChart />
          <RecentScans />
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <ServiceHealth />
          <LiveFeed />
        </div>
      </div>
    </div>
  );
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

const MOCK_STATS = {
  activeThreats: 3,
  logsPerHour: 12847,
  openAlerts: 7,
  scansToday: 4,
};
