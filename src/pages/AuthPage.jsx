import React, { useState } from 'react';
import { Shield, Mail, Lock, AlertCircle, Loader } from 'lucide-react';

export default function AuthPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.bgGlow} />
      <div style={styles.card}>
        {/* Logo Section */}
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <Shield size={32} color="#10b981" />
          </div>
          <h1 style={styles.title}>CRMS</h1>
          <p style={styles.subtitle}>Compliance Repository Management System</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>Email Address</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} color="#6b7280" style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                style={styles.input}
                disabled={isLoading}
                autoComplete="email"
              />
            </div>
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Password</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="#6b7280" style={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                disabled={isLoading}
                autoComplete="current-password"
              />
            </div>
          </div>

          {error && (
            <div style={styles.errorBox}>
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button type="submit" style={styles.submitBtn} disabled={isLoading}>
            {isLoading ? (
              <><Loader size={16} style={{ animation: 'spin 1s linear infinite' }} /> Signing in...</>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            Don't have an account? Contact your administrator.
          </p>
        </div>
      </div>

      {/* Decorative Elements */}
      <div style={styles.versionBadge}>v2.0 — Cloud Edition</div>

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulseGlow { 0%, 100% { opacity: 0.3; } 50% { opacity: 0.6; } }
      `}</style>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0f1a 0%, #111827 50%, #0d1525 100%)',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: "'Inter', sans-serif",
  },
  bgGlow: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '600px',
    height: '600px',
    background: 'radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%)',
    borderRadius: '50%',
    animation: 'pulseGlow 4s ease-in-out infinite',
    pointerEvents: 'none',
  },
  card: {
    width: '420px',
    maxWidth: '90vw',
    background: 'rgba(17, 24, 39, 0.8)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
    borderRadius: '16px',
    padding: '40px 36px',
    backdropFilter: 'blur(20px)',
    boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5), 0 0 100px rgba(16, 185, 129, 0.05)',
    animation: 'fadeInUp 0.5s ease-out',
    position: 'relative',
    zIndex: 1,
  },
  logoSection: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  logoIcon: {
    width: '64px',
    height: '64px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    borderRadius: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto 16px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#f9fafb',
    margin: '0 0 4px',
    letterSpacing: '2px',
  },
  subtitle: {
    fontSize: '13px',
    color: '#6b7280',
    margin: 0,
    letterSpacing: '0.5px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#9ca3af',
    letterSpacing: '0.3px',
  },
  inputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  inputIcon: {
    position: 'absolute',
    left: '14px',
    pointerEvents: 'none',
  },
  input: {
    width: '100%',
    padding: '12px 14px 12px 40px',
    background: 'rgba(17, 24, 39, 0.6)',
    border: '1px solid rgba(75, 85, 99, 0.4)',
    borderRadius: '10px',
    color: '#f9fafb',
    fontSize: '14px',
    fontFamily: "'Inter', sans-serif",
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    boxSizing: 'border-box',
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 14px',
    background: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '8px',
    color: '#fca5a5',
    fontSize: '13px',
  },
  submitBtn: {
    width: '100%',
    padding: '13px',
    background: 'linear-gradient(135deg, #10b981, #059669)',
    border: 'none',
    borderRadius: '10px',
    color: '#fff',
    fontSize: '15px',
    fontWeight: '600',
    fontFamily: "'Inter', sans-serif",
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'opacity 0.2s, transform 0.1s',
    marginTop: '4px',
  },
  footer: {
    textAlign: 'center',
    marginTop: '24px',
    paddingTop: '20px',
    borderTop: '1px solid rgba(75, 85, 99, 0.2)',
  },
  footerText: {
    fontSize: '12px',
    color: '#6b7280',
    margin: 0,
  },
  versionBadge: {
    position: 'fixed',
    bottom: '16px',
    right: '16px',
    fontSize: '11px',
    color: '#4b5563',
    letterSpacing: '0.5px',
    zIndex: 10,
  },
};
