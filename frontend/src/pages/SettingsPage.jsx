import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';
import api from '../services/api';

const DICEBEAR_STYLES = [
  { id: 'bottts', label: 'Bottts', desc: 'Robot avatars' },
  { id: 'avataaars', label: 'Avataaars', desc: 'Cartoon faces' },
  { id: 'identicon', label: 'Identicon', desc: 'Geometric patterns' },
  { id: 'initials', label: 'Initials', desc: 'Letter-based' },
  { id: 'pixel-art', label: 'Pixel Art', desc: 'Retro pixels' },
  { id: 'lorelei', label: 'Lorelei', desc: 'Illustrated style' },
  { id: 'fun-emoji', label: 'Fun Emoji', desc: 'Emoji characters' },
  { id: 'thumbs', label: 'Thumbs', desc: 'Thumb up style' },
];

export default function SettingsPage() {
  const { user, updateUser, getAvatarUrl, logout } = useAuth();
  const { addToast } = useApp();

  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || 'admin',
  });
  const [avatarStyle, setAvatarStyle] = useState('bottts');
  const [avatarSeed, setAvatarSeed] = useState(user?.email || 'sentinel');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');

  const previewUrl = getAvatarUrl(avatarSeed, avatarStyle);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const newAvatar = getAvatarUrl(avatarSeed, avatarStyle);
      await api.patch('/auth/profile', { ...profile, avatarStyle, avatarSeed, avatar: newAvatar });
      updateUser({ ...profile, avatar: newAvatar });
      addToast('Profile saved successfully', 'success');
    } catch (err) {
      // offline demo — just update locally
      const newAvatar = getAvatarUrl(avatarSeed, avatarStyle);
      updateUser({ ...profile, avatar: newAvatar });
      addToast('Profile updated (offline mode)', 'info');
    } finally {
      setSaving(false);
    }
  };

  const TABS = [
    { id: 'profile', label: 'Profile & Avatar' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security', label: 'Security' },
    { id: 'system', label: 'System' },
  ];

  return (
    <div style={{ maxWidth: '820px', display: 'flex', flexDirection: 'column', gap: '0' }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '24px',
      }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
            padding: '10px 20px',
            background: 'transparent',
            border: 'none',
            borderBottom: activeTab === tab.id ? '2px solid var(--accent)' : '2px solid transparent',
            color: activeTab === tab.id ? 'var(--accent)' : 'var(--text-tertiary)',
            fontFamily: 'var(--font-display)',
            fontWeight: activeTab === tab.id ? 600 : 400,
            fontSize: '0.875rem',
            cursor: 'pointer',
            marginBottom: '-1px',
            transition: 'all 0.15s ease',
          }}>{tab.label}</button>
        ))}
      </div>

      {activeTab === 'profile' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px' }}>
          {/* Left — form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '0.95rem' }}>Profile Information</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Display Name', key: 'name', type: 'text', placeholder: 'Your name' },
                  { label: 'Email Address', key: 'email', type: 'email', placeholder: 'you@example.com', disabled: true },
                  { label: 'Role', key: 'role', type: 'text', placeholder: 'admin', disabled: true },
                ].map(({ label, key, type, placeholder, disabled }) => (
                  <div key={key}>
                    <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>
                      {label} {disabled && '(from Google)'}
                    </label>
                    <input
                      type={type}
                      value={profile[key]}
                      onChange={e => !disabled && setProfile(p => ({ ...p, [key]: e.target.value }))}
                      placeholder={placeholder}
                      disabled={disabled}
                      style={{ opacity: disabled ? 0.5 : 1, cursor: disabled ? 'not-allowed' : 'text' }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Avatar seed customization */}
            <div className="card" style={{ padding: '24px' }}>
              <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.95rem' }}>Avatar Seed</h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Change the seed to get a different avatar for the selected style
              </p>
              <input
                value={avatarSeed}
                onChange={e => setAvatarSeed(e.target.value)}
                placeholder="Enter any text as avatar seed"
              />
              <button
                onClick={() => setAvatarSeed(Math.random().toString(36).slice(2))}
                className="btn-ghost"
                style={{ marginTop: '10px', fontSize: '0.75rem', width: '100%' }}>
                🎲 Randomize Seed
              </button>
            </div>
          </div>

          {/* Right — avatar picker */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Preview */}
            <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>
                Current Avatar
              </div>
              <img
                src={previewUrl}
                alt="avatar preview"
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  border: '2px solid var(--accent)',
                  background: 'var(--bg-surface)',
                  boxShadow: '0 0 20px var(--accent-dim)',
                  margin: '0 auto',
                  display: 'block',
                }}
              />
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
                {profile.name || 'Operator'}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '3px' }}>
                {avatarStyle} / {avatarSeed.slice(0, 12)}...
              </div>
            </div>

            {/* Style picker */}
            <div className="card" style={{ padding: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.62rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                DiceBear Style
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {DICEBEAR_STYLES.map(style => (
                  <button
                    key={style.id}
                    onClick={() => setAvatarStyle(style.id)}
                    style={{
                      padding: '8px',
                      background: avatarStyle === style.id ? 'var(--accent-dim)' : 'var(--bg-surface)',
                      border: `1px solid ${avatarStyle === style.id ? 'var(--accent)' : 'var(--border-subtle)'}`,
                      borderRadius: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}>
                    <img
                      src={getAvatarUrl(avatarSeed, style.id)}
                      alt={style.label}
                      style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-card)', flexShrink: 0 }}
                    />
                    <div>
                      <div style={{ fontSize: '0.72rem', fontWeight: 600, color: avatarStyle === style.id ? 'var(--accent)' : 'var(--text-primary)' }}>{style.label}</div>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.58rem', color: 'var(--text-muted)' }}>{style.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button onClick={saveProfile} disabled={saving} className="btn-primary" style={{
              opacity: saving ? 0.7 : 1,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            }}>
              {saving ? 'Saving...' : '💾 Save Changes'}
            </button>
          </div>
        </div>
      )}

      {activeTab === 'notifications' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '0.95rem' }}>Notification Preferences</h3>
          {[
            { label: 'Critical Alerts', desc: 'Notify on CRITICAL severity alerts', defaultOn: true },
            { label: 'High Severity Alerts', desc: 'Notify on HIGH severity alerts', defaultOn: true },
            { label: 'Scan Completion', desc: 'Notify when vulnerability scans complete', defaultOn: true },
            { label: 'System Health', desc: 'Notify on service outages or degradation', defaultOn: false },
            { label: 'Log Anomalies', desc: 'Notify on unusual log patterns', defaultOn: false },
          ].map(item => (
            <NotifRow key={item.label} {...item} />
          ))}
        </div>
      )}

      {activeTab === 'security' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.95rem' }}>Authentication</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '20px' }}>Your account uses Google OAuth. No password is stored.</p>
            <div style={{ padding: '12px', background: 'var(--green-dim)', border: '1px solid rgba(0,255,136,0.2)', borderRadius: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="status-dot online" />
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: 'var(--green)' }}>Google OAuth — Active</span>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontWeight: 700, marginBottom: '4px', fontSize: '0.95rem', color: 'var(--red)' }}>Danger Zone</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>Irreversible account actions.</p>
            <button onClick={logout} className="btn-danger" style={{ fontSize: '0.875rem', padding: '10px 20px' }}>
              Sign Out of All Sessions
            </button>
          </div>
        </div>
      )}

      {activeTab === 'system' && (
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontWeight: 700, marginBottom: '20px', fontSize: '0.95rem' }}>System Information</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {[
              { label: 'App Version', value: 'v1.0.0' },
              { label: 'Node Environment', value: import.meta.env.MODE || 'development' },
              { label: 'API Endpoint', value: import.meta.env.VITE_API_URL || 'http://localhost:3000/api' },
              { label: 'WebSocket URL', value: import.meta.env.VITE_WS_URL || 'ws://localhost:3000' },
              { label: 'Build Date', value: new Date().toLocaleDateString() },
              { label: 'User Agent', value: navigator.userAgent.slice(0, 40) + '...' },
            ].map(({ label, value }) => (
              <div key={label} style={{ padding: '12px', background: 'var(--bg-surface)', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.6rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-secondary)', wordBreak: 'break-all' }}>{value}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({ label, desc, defaultOn }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-dim)' }}>
      <div>
        <div style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{desc}</div>
      </div>
      <button onClick={() => setOn(p => !p)} style={{
        width: '40px', height: '22px',
        background: on ? 'var(--accent)' : 'var(--bg-surface)',
        border: `1px solid ${on ? 'var(--accent)' : 'var(--border-medium)'}`,
        borderRadius: '11px', cursor: 'pointer', position: 'relative', transition: 'all 0.2s ease', flexShrink: 0,
      }}>
        <div style={{
          width: '16px', height: '16px', borderRadius: '50%',
          background: on ? 'var(--bg-void)' : 'var(--text-tertiary)',
          position: 'absolute', top: '2px',
          left: on ? '20px' : '2px', transition: 'left 0.2s ease',
        }} />
      </button>
    </div>
  );
}
