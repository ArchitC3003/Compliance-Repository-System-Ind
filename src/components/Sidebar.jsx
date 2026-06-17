import React from 'react';
import { LayoutDashboard, Database, Upload, FileText, Settings, LogOut, Shield } from 'lucide-react';
import { useAppContext } from '../context/AppContext';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'admin', 'user'] },
  { id: 'repository', label: 'Repository', icon: Database, roles: ['super_admin', 'admin', 'user'] },
  { id: 'ingest', label: 'Ingest', icon: Upload, roles: ['super_admin', 'admin', 'user'] },
  { id: 'reports', label: 'Reports', icon: FileText, roles: ['super_admin', 'admin', 'user'] },
  { id: 'admin', label: 'Admin Panel', icon: Settings, roles: ['super_admin', 'admin'] },
];

export default function Sidebar() {
  const { state, dispatch, auth } = useAppContext();
  const userRole = auth.userProfile?.role || 'user';

  const handleNav = (panelId) => {
    dispatch({ type: 'SET_ACTIVE_PANEL', payload: panelId });
  };

  const handleSignOut = async () => {
    await auth.logout();
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'super_admin': return { label: 'Super Admin', color: '#f59e0b' };
      case 'admin': return { label: 'Admin', color: '#10b981' };
      default: return { label: 'User', color: '#6b7280' };
    }
  };

  const badge = getRoleBadge(userRole);

  return (
    <aside style={styles.sidebar}>
      {/* Brand */}
      <div style={styles.brand}>
        <div style={styles.brandIcon}>
          <Shield size={22} color="#10b981" />
        </div>
        <div>
          <div style={styles.brandTitle}>CRMS</div>
          <div style={styles.brandSub}>Compliance Repository</div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={styles.nav}>
        {navItems
          .filter(item => item.roles.includes(userRole))
          .map(item => {
            const Icon = item.icon;
            const isActive = state.activePanel === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                style={{
                  ...styles.navItem,
                  ...(isActive ? styles.navItemActive : {}),
                }}
              >
                <Icon size={18} color={isActive ? '#10b981' : '#9ca3af'} />
                <span style={{ color: isActive ? '#f9fafb' : '#9ca3af' }}>{item.label}</span>
              </button>
            );
          })}
      </nav>

      {/* User Info */}
      <div style={styles.userSection}>
        <div style={styles.userInfo}>
          <div style={styles.avatar}>
            {(auth.userProfile?.displayName || auth.userProfile?.email || '?')[0].toUpperCase()}
          </div>
          <div style={styles.userDetails}>
            <div style={styles.userName}>{auth.userProfile?.displayName || 'User'}</div>
            <div style={styles.userEmail}>{auth.userProfile?.email}</div>
            <span style={{ ...styles.roleBadge, borderColor: badge.color, color: badge.color }}>
              {badge.label}
            </span>
          </div>
        </div>
        <button onClick={handleSignOut} style={styles.signOutBtn} title="Sign Out">
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
}

const styles = {
  sidebar: {
    width: '240px',
    minWidth: '240px',
    height: '100vh',
    background: '#111827',
    borderRight: '1px solid rgba(75, 85, 99, 0.3)',
    display: 'flex',
    flexDirection: 'column',
    fontFamily: "'Inter', sans-serif",
    position: 'sticky',
    top: 0,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '20px 16px',
    borderBottom: '1px solid rgba(75, 85, 99, 0.2)',
  },
  brandIcon: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  brandTitle: {
    fontSize: '17px',
    fontWeight: '700',
    color: '#f9fafb',
    letterSpacing: '1.5px',
  },
  brandSub: {
    fontSize: '10px',
    color: '#6b7280',
    letterSpacing: '0.5px',
  },
  nav: {
    flex: 1,
    padding: '12px 8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  },
  navItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 12px',
    border: 'none',
    background: 'transparent',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    fontFamily: "'Inter', sans-serif",
    transition: 'background 0.15s',
    width: '100%',
    textAlign: 'left',
  },
  navItemActive: {
    background: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.15)',
  },
  userSection: {
    padding: '12px',
    borderTop: '1px solid rgba(75, 85, 99, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '8px',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flex: 1,
    minWidth: 0,
  },
  avatar: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    background: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '13px',
    fontWeight: '600',
    flexShrink: 0,
  },
  userDetails: {
    minWidth: 0,
  },
  userName: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#e5e7eb',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  userEmail: {
    fontSize: '10px',
    color: '#6b7280',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  roleBadge: {
    display: 'inline-block',
    fontSize: '9px',
    fontWeight: '600',
    padding: '1px 6px',
    border: '1px solid',
    borderRadius: '4px',
    letterSpacing: '0.3px',
    marginTop: '2px',
    textTransform: 'uppercase',
  },
  signOutBtn: {
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(75, 85, 99, 0.3)',
    borderRadius: '8px',
    background: 'transparent',
    color: '#9ca3af',
    cursor: 'pointer',
    transition: 'background 0.15s, color 0.15s',
    flexShrink: 0,
  },
};
