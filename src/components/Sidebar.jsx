import React from 'react';
import { useAppContext } from '../context/AppContext';
import {
  LayoutDashboard,
  Database,
  Upload,
  FileText,
  Settings,
  LogOut,
} from 'lucide-react';

const navItems = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'repository', label: 'Repository', icon: Database },
  { key: 'ingest', label: 'Ingest', icon: Upload },
  { key: 'reports', label: 'Reports', icon: FileText },
];

const adminItem = { key: 'admin', label: 'Admin', icon: Settings };

export default function Sidebar() {
  const { state, dispatch } = useAppContext();
  const activePanel = state.activePanel;
  const session = state.session;

  const items = session?.role === 'admin'
    ? [...navItems, adminItem]
    : navItems;

  return (
    <aside
      style={{
        width: 240,
        minWidth: 240,
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '1px solid var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      {/* Brand */}
      <div
        style={{
          padding: '24px 20px 20px',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <span
          style={{
            fontSize: 20,
            fontWeight: 700,
            color: '#10b981',
            letterSpacing: '-0.5px',
          }}
        >
          CRMS
        </span>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 0', overflowY: 'auto' }}>
        {items.map(({ key, label, icon: Icon }) => {
          const isActive = activePanel === key;
          return (
            <button
              key={key}
              onClick={() =>
                dispatch({ type: 'SET_ACTIVE_PANEL', payload: key })
              }
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                width: '100%',
                padding: '10px 20px',
                border: 'none',
                borderLeft: isActive
                  ? '3px solid #10b981'
                  : '3px solid transparent',
                background: isActive
                  ? 'rgba(16, 185, 129, 0.06)'
                  : 'transparent',
                color: isActive
                  ? 'var(--color-text-primary)'
                  : 'var(--color-text-secondary)',
                fontFamily: 'var(--font-family)',
                fontSize: 14,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'background 200ms ease, color 200ms ease',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = isActive
                  ? 'rgba(16, 185, 129, 0.06)'
                  : 'transparent';
              }}
            >
              <Icon size={18} />
              {label}
            </button>
          );
        })}
      </nav>

      {/* User info */}
      {session && (
        <div
          style={{
            padding: '16px 20px',
            borderTop: '1px solid var(--color-border)',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 13,
                color: 'var(--color-text-primary)',
                marginBottom: 4,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {session.user?.email}
            </div>
            <span className={`badge ${session.role === 'admin' ? 'badge-success' : ''}`}>
              {session.role}
            </span>
          </div>
          <button
            onClick={() => dispatch({ type: 'CLEAR_SESSION' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 0',
              border: 'none',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontFamily: 'var(--font-family)',
              fontSize: 13,
              cursor: 'pointer',
              transition: 'color 200ms ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = 'var(--color-danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = 'var(--color-text-secondary)';
            }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      )}
    </aside>
  );
}
