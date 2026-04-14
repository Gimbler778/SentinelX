import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  {
    group: 'OVERVIEW',
    items: [
      { to: '/dashboard', icon: GridIcon, label: 'Dashboard' },
      { to: '/monitoring', icon: ActivityIcon, label: 'Monitoring' },
    ]
  },
  {
    group: 'SECURITY',
    items: [
      { to: '/alerts', icon: BellIcon, label: 'Alerts', badge: 'live' },
      { to: '/scans', icon: ScanIcon, label: 'Vulnerability Scans' },
    ]
  },
  {
    group: 'DATA',
    items: [
      { to: '/logs', icon: TerminalIcon, label: 'Log Stream' },
    ]
  },
  {
    group: 'SYSTEM',
    items: [
      { to: '/settings', icon: SettingsIcon, label: 'Settings' },
    ]
  },
];

export default function Sidebar() {
  const { sidebarOpen, setSidebarOpen } = useApp();
  const { user, logout, getAvatarUrl } = useAuth();
  const location = useLocation();

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: sidebarOpen ? 'var(--sidebar-width)' : '64px',
      background: 'var(--bg-surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s ease',
      zIndex: 100,
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: sidebarOpen ? '20px 20px 16px' : '20px 0 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        justifyContent: sidebarOpen ? 'space-between' : 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <ShieldLogo />
          {sidebarOpen && (
            <div>
              <div style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: '1rem',
                letterSpacing: '0.08em',
                color: 'var(--text-primary)',
                lineHeight: 1,
              }}>SENTINEL<span style={{ color: 'var(--accent)' }}>X</span></div>
              <div style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.55rem',
                color: 'var(--text-tertiary)',
                letterSpacing: '0.12em',
                marginTop: '3px',
              }}>SECURITY OPS</div>
            </div>
          )}
        </div>
        {sidebarOpen && (
          <button onClick={() => setSidebarOpen(false)} className="btn-ghost"
            style={{ padding: '4px', border: 'none', background: 'transparent', color: 'var(--text-tertiary)' }}>
            <ChevronLeftIcon />
          </button>
        )}
      </div>

      {/* Collapse button when closed */}
      {!sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)}
          style={{
            padding: '12px 0',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-tertiary)',
            display: 'flex',
            justifyContent: 'center',
          }}>
          <ChevronRightIcon />
        </button>
      )}

      {/* Nav groups */}
      <nav style={{ flex: 1, padding: '8px 0', overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map((group) => (
          <div key={group.group} style={{ marginBottom: '4px' }}>
            {sidebarOpen && (
              <div style={{
                padding: '12px 20px 6px',
                fontFamily: 'var(--font-mono)',
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}>{group.group}</div>
            )}
            {group.items.map((item) => (
              <NavLink key={item.to} to={item.to}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: sidebarOpen ? '9px 20px' : '9px 0',
                  margin: sidebarOpen ? '1px 8px' : '1px 4px',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  color: isActive ? 'var(--accent)' : 'var(--text-secondary)',
                  background: isActive ? 'var(--accent-dim)' : 'transparent',
                  border: isActive ? '1px solid rgba(0,229,255,0.15)' : '1px solid transparent',
                  transition: 'all 0.15s ease',
                  fontSize: '0.875rem',
                  fontWeight: isActive ? 600 : 400,
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  position: 'relative',
                })}>
                {({ isActive }) => (
                  <>
                    <span style={{
                      flexShrink: 0,
                      color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
                      filter: isActive ? 'drop-shadow(0 0 6px var(--accent-glow))' : 'none',
                    }}>
                      <item.icon size={16} />
                    </span>
                    {sidebarOpen && (
                      <>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {item.badge === 'live' && (
                          <span style={{
                            width: '6px',
                            height: '6px',
                            borderRadius: '50%',
                            background: 'var(--red)',
                            animation: 'pulse-glow 2s infinite',
                          }} />
                        )}
                        {isActive && (
                          <div style={{
                            position: 'absolute',
                            left: 0,
                            top: '4px',
                            bottom: '4px',
                            width: '2px',
                            background: 'var(--accent)',
                            borderRadius: '0 2px 2px 0',
                            boxShadow: '0 0 8px var(--accent-glow)',
                          }} />
                        )}
                      </>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      {/* User profile */}
      <div style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: sidebarOpen ? '12px 16px' : '12px 0',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        justifyContent: sidebarOpen ? 'flex-start' : 'center',
      }}>
        <img
          src={user?.avatar || getAvatarUrl(user?.email || 'user', 'bottts')}
          alt="avatar"
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '1px solid var(--border-medium)',
            background: 'var(--bg-card)',
            flexShrink: 0,
          }}
          onError={(e) => {
            e.target.src = getAvatarUrl(user?.email || 'user', 'identicon');
          }}
        />
        {sidebarOpen && (
          <>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', truncate: true, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.name || 'Operator'}
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {user?.role || 'admin'}
              </div>
            </div>
            <button onClick={logout} title="Logout"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-tertiary)', padding: '4px', flexShrink: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--red)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}>
              <LogoutIcon size={14} />
            </button>
          </>
        )}
      </div>
    </aside>
  );
}

// --- SVG Icons ---
function ShieldLogo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" style={{ flexShrink: 0 }}>
      <path d="M14 2L4 7V14C4 19.5 8.2 24.7 14 26C19.8 24.7 24 19.5 24 14V7L14 2Z"
        stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent-dim)"
        style={{ filter: 'drop-shadow(0 0 4px var(--accent-glow))' }}
      />
      <path d="M10 14L12.5 16.5L18 11" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GridIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="1" width="6" height="6" rx="1" />
      <rect x="9" y="1" width="6" height="6" rx="1" />
      <rect x="1" y="9" width="6" height="6" rx="1" />
      <rect x="9" y="9" width="6" height="6" rx="1" />
    </svg>
  );
}

function ActivityIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <polyline points="1,8 4,4 7,10 10,6 13,8 15,6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 1a4 4 0 0 1 4 4v3l1.5 2.5H2.5L4 8V5a4 4 0 0 1 4-4z" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" strokeLinecap="round" />
    </svg>
  );
}

function ScanIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="2" y="2" width="5" height="5" rx="0.5" />
      <rect x="9" y="2" width="5" height="5" rx="0.5" />
      <rect x="2" y="9" width="5" height="5" rx="0.5" />
      <path d="M9 11.5h4M11 9.5v4" strokeLinecap="round" />
    </svg>
  );
}

function TerminalIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="2" width="14" height="12" rx="2" />
      <path d="M4 6l3 2-3 2M8 10h4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="8" r="2.5" />
      <path d="M8 1.5V3M8 13v1.5M1.5 8H3M13 8h1.5M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1" strokeLinecap="round" />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M10 4L6 8l4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 4l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function LogoutIcon({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2H3a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M10 11l3-3-3-3M13 8H6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
