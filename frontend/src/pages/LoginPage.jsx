import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { loginWithGoogle } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTimeout(() => setMounted(true), 100);
  }, []);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg-void)',
      display: 'flex',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Animated background grid */}
      <div style={{
        position: 'absolute',
        inset: 0,
        backgroundImage: `
          linear-gradient(rgba(0,229,255,0.03) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,229,255,0.03) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
      }} />

      {/* Glow orbs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '15%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '20%',
        right: '15%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(155,109,255,0.05) 0%, transparent 70%)',
        borderRadius: '50%',
        pointerEvents: 'none',
      }} />

      {/* Left panel - branding */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '60px',
        position: 'relative',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateX(-20px)',
        transition: 'all 0.6s ease 0.1s',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 3L5 10V20C5 29.9 12.5 39 20 41C27.5 39 35 29.9 35 20V10L20 3Z"
              stroke="var(--accent)" strokeWidth="1.5" fill="var(--accent-dim)"
              style={{ filter: 'drop-shadow(0 0 8px var(--accent-glow))' }}
            />
            <path d="M14 20L18 24L26 16" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div>
            <div style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 800,
              fontSize: '1.4rem',
              letterSpacing: '0.1em',
            }}>SENTINEL<span style={{ color: 'var(--accent)' }}>X</span></div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.6rem',
              color: 'var(--text-tertiary)',
              letterSpacing: '0.15em',
            }}>SECURITY OPERATIONS</div>
          </div>
        </div>

        {/* Hero copy */}
        <div style={{ marginTop: 'auto', maxWidth: '460px' }}>
          <h2 style={{
            fontFamily: 'var(--font-display)',
            fontSize: '2.8rem',
            fontWeight: 800,
            lineHeight: 1.1,
            marginBottom: '20px',
          }}>
            Total visibility.<br />
            <span style={{
              color: 'transparent',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              backgroundImage: 'linear-gradient(90deg, var(--accent), var(--purple))',
            }}>Zero blind spots.</span>
          </h2>
          <p style={{
            color: 'var(--text-secondary)',
            lineHeight: 1.7,
            fontSize: '0.95rem',
            marginBottom: '40px',
          }}>
            Real-time threat detection, vulnerability scanning, and system monitoring—
            unified in one command center.
          </p>

          {/* Feature list */}
          {['Real-time log analysis & streaming', 'OpenVAS vulnerability scanning', 'Prometheus metrics & alerting', 'RabbitMQ event processing'].map((feature, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '10px',
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'none' : 'translateX(-10px)',
              transition: `all 0.4s ease ${0.3 + i * 0.1}s`,
            }}>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                background: 'var(--accent-dim)',
                border: '1px solid var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2 2 4-4" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{feature}</span>
            </div>
          ))}
        </div>

        {/* Version tag */}
        <div style={{ marginTop: '40px' }}>
          <span style={{
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            letterSpacing: '0.08em',
          }}>v1.0.0 — PRODUCTION BUILD</span>
        </div>
      </div>

      {/* Right panel - login form */}
      <div style={{
        width: '440px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px',
        background: 'var(--bg-surface)',
        borderLeft: '1px solid var(--border-subtle)',
        position: 'relative',
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateX(20px)',
        transition: 'all 0.6s ease 0.2s',
      }}>
        <div style={{ width: '100%', maxWidth: '340px' }}>
          {/* Decorative corner accents */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            width: '40px',
            height: '40px',
            borderTop: '2px solid var(--accent)',
            borderRight: '2px solid var(--accent)',
            opacity: 0.4,
          }} />
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            width: '40px',
            height: '40px',
            borderBottom: '2px solid var(--accent)',
            borderLeft: '2px solid var(--accent)',
            opacity: 0.4,
          }} />

          <div style={{ marginBottom: '40px' }}>
            <h3 style={{
              fontFamily: 'var(--font-display)',
              fontSize: '1.4rem',
              fontWeight: 700,
              marginBottom: '8px',
            }}>Access Console</h3>
            <p style={{
              color: 'var(--text-secondary)',
              fontSize: '0.85rem',
              fontFamily: 'var(--font-mono)',
            }}>
              // Authenticate to continue
            </p>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={loginWithGoogle}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              padding: '14px 20px',
              background: 'var(--bg-card)',
              border: '1px solid var(--border-medium)',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.9rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'var(--bg-hover)';
              e.currentTarget.style.borderColor = 'var(--accent)';
              e.currentTarget.style.boxShadow = '0 0 16px var(--accent-dim)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'var(--bg-card)';
              e.currentTarget.style.borderColor = 'var(--border-medium)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <GoogleLogo />
            Continue with Google
          </button>

          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '24px 0',
          }}>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.65rem', color: 'var(--text-muted)' }}>OR</span>
            <div className="divider" style={{ flex: 1, margin: 0 }} />
          </div>

          {/* Info note */}
          <div style={{
            padding: '12px 14px',
            background: 'var(--accent-dim)',
            border: '1px solid rgba(0,229,255,0.15)',
            borderRadius: '6px',
            marginBottom: '24px',
          }}>
            <p style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.7rem',
              color: 'var(--accent)',
              lineHeight: 1.6,
            }}>
              // Authorized personnel only.<br />
              // Access is logged and monitored.<br />
              // Unauthorized access is prohibited.
            </p>
          </div>

          <p style={{
            textAlign: 'center',
            fontFamily: 'var(--font-mono)',
            fontSize: '0.65rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}>
            By signing in, you agree to SentinelX<br />
            Terms of Service and Security Policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}
