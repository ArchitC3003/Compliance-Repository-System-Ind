import React from 'react';
import { useAppContext } from '../context/AppContext';
import {
  Database,
  FolderOpen,
  Upload,
  FileCheck,
} from 'lucide-react';

export default function DashboardPage() {
  const { state, dispatch } = useAppContext();

  const totalRepos = state.repositories.length;
  const totalSubRepos = state.subRepositories.length;
  const totalUploads = state.uploads.length;
  const totalLineItems = state.uploads.reduce(
    (sum, u) => sum + (u.rowCount || 0),
    0
  );

  // --- Empty State ---
  if (totalRepos === 0) {
    return (
      <div className="fade-in" style={{ padding: 32 }}>
        <div className="empty-state" style={{ minHeight: '60vh' }}>
          <Database size={48} />
          <h2 style={{ marginBottom: 8 }}>Welcome to CRMS</h2>
          <p style={{ marginBottom: 24 }}>
            Start by creating your first Repository.
          </p>
          <button
            className="btn-primary"
            onClick={() =>
              dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'repository' })
            }
          >
            Go to Repositories
          </button>
        </div>
      </div>
    );
  }

  // --- Recent uploads (last 5, sorted desc) ---
  const recentUploads = [...state.uploads]
    .sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))
    .slice(0, 5);

  const getSubRepoName = (subRepoId) => {
    const sr = state.subRepositories.find((s) => s.id === subRepoId);
    return sr ? sr.name : '—';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const stats = [
    { label: 'Repositories', value: totalRepos, icon: Database },
    { label: 'Sub-Repositories', value: totalSubRepos, icon: FolderOpen },
    { label: 'Uploads', value: totalUploads, icon: Upload },
    { label: 'Line Items', value: totalLineItems, icon: FileCheck },
  ];

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Compliance overview and recent activity</p>
      </div>

      {/* Stat Grid */}
      <div className="stat-grid">
        {stats.map(({ label, value, icon: Icon }) => (
          <div className="stat-card" key={label}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 12,
              }}
            >
              <Icon size={20} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
            <div className="stat-value">{value}</div>
            <div className="stat-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="glass-card">
        <h3 style={{ marginBottom: 16 }}>Recent Activity</h3>

        {recentUploads.length === 0 ? (
          <p style={{ fontSize: 13 }}>No activity yet.</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Document</th>
                <th>Sub-Repository</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentUploads.map((u) => (
                <tr key={u.id}>
                  <td>{u.documentName}</td>
                  <td>{getSubRepoName(u.subRepositoryId)}</td>
                  <td>{formatDate(u.uploadDate)}</td>
                  <td>
                    <span
                      className={`badge ${
                        u.committed ? 'badge-success' : 'badge-warning'
                      }`}
                    >
                      {u.committed ? 'Committed' : 'Pending'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
