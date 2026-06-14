import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';

export default function LoginPage() {
  const { dispatch } = useAppContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }

    dispatch({
      type: 'SET_SESSION',
      payload: {
        user: {
          email: email.trim(),
          id: 'dev-user-1',
          displayName: email.trim().split('@')[0] || 'User',
        },
        role: 'admin',
      },
    });
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        background: 'var(--color-bg)',
        padding: 16,
      }}
    >
      <div
        className="glass-card fade-in"
        style={{ width: '100%', maxWidth: 400 }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1
            style={{
              color: '#10b981',
              fontSize: 28,
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            CRMS
          </h1>
          <p style={{ fontSize: 14, color: 'var(--color-text-secondary)' }}>
            Compliance Repository Management System
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="login-email">Email</label>
            <input
              id="login-email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div style={{ marginBottom: 24 }}>
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: 13,
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
