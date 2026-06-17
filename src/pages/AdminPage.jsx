import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import {
  Trash2, ShieldCheck, Shield, Plus, X, Pencil, Eye,
  ChevronDown, ChevronUp,
} from 'lucide-react';

const TABS = ['Users', 'Repositories', 'Sub-Repositories', 'Audit Log'];

export default function AdminPage() {
  const { state, dispatch, auth } = useAppContext();
  const [activeTab, setActiveTab] = useState(0);

  // --- User modals ---
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserRole, setNewUserRole] = useState('user');
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [expandedUserId, setExpandedUserId] = useState(null);

  // --- Repo edit modal ---
  const [showEditRepoModal, setShowEditRepoModal] = useState(false);
  const [editRepo, setEditRepo] = useState(null);
  const [editRepoName, setEditRepoName] = useState('');
  const [editRepoDesc, setEditRepoDesc] = useState('');

  // --- Sub-repo edit modal ---
  const [showEditSubRepoModal, setShowEditSubRepoModal] = useState(false);
  const [editSubRepo, setEditSubRepo] = useState(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubDesc, setEditSubDesc] = useState('');
  const [editSubHeaders, setEditSubHeaders] = useState([]);

  // --- Helpers ---
  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const formatTimestamp = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) +
      ' ' + d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
  };

  const getRepoName = (repoId) => {
    const repo = state.repositories.find(r => r.id === repoId);
    return repo ? repo.name : '—';
  };

  const getUserUploads = (userId) => {
    return state.uploads.filter(u => u.uploadedBy === userId);
  };

  const addAuditEntry = (action, target) => {
    dispatch({
      type: 'ADD_AUDIT_LOG',
      payload: {
        id: crypto.randomUUID(),
        userId: auth.userProfile?.id || 'system',
        userEmail: auth.userProfile?.email || 'system',
        actor: auth.userProfile?.email || 'system',
        action,
        target,
        details: `${action}: ${target}`,
        timestamp: new Date().toISOString(),
      },
    });
  };

  // ==========================================
  // TAB 1 — USERS
  // ==========================================
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) return;
    if (newUserPassword.trim().length < 6) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Password must be at least 6 characters', variant: 'error' } });
      return;
    }
    if (state.users.some(u => u.email.toLowerCase() === newUserEmail.trim().toLowerCase())) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'A user with this email already exists', variant: 'error' } });
      return;
    }
    setIsCreatingUser(true);
    try {
      // 1. Create Supabase Auth account
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: newUserEmail.trim().toLowerCase(),
        password: newUserPassword.trim(),
      });
      if (authErr) throw authErr;

      // 2. Create user profile in our users table
      const newUser = {
        id: crypto.randomUUID(),
        authId: authData.user?.id || null,
        displayName: newUserName.trim(),
        email: newUserEmail.trim().toLowerCase(),
        role: newUserRole,
        createdAt: new Date().toISOString(),
      };
      dispatch({ type: 'ADD_USER', payload: newUser });
      addAuditEntry('Created user', `${newUser.displayName} (${newUser.email}) as ${newUserRole}`);
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `User "${newUser.displayName}" created successfully`, variant: 'success' } });
      setNewUserName('');
      setNewUserEmail('');
      setNewUserPassword('');
      setNewUserRole('user');
      setShowAddUserModal(false);
    } catch (err) {
      dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Failed to create user: ${err.message}`, variant: 'error' } });
    } finally {
      setIsCreatingUser(false);
    }
  };

  const cycleUserRole = (user) => {
    if (user.id === auth.userProfile?.id) return;
    if (user.role === 'super_admin') return; // Can't change super admin
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    dispatch({ type: 'UPDATE_USER', payload: { id: user.id, displayName: user.displayName, role: newRole } });
    addAuditEntry('Changed user role', `${user.displayName} → ${newRole}`);
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `${user.displayName} is now ${newRole}`, variant: 'success' } });
  };

  const deleteUser = (user) => {
    if (user.id === auth.userProfile?.id) return; // can't delete yourself
    if (user.role === 'super_admin') return; // can't delete super admin
    if (!window.confirm('Are you sure you want to delete this? This action cannot be undone.')) return;
    dispatch({ type: 'DELETE_USER', payload: user.id });
    addAuditEntry('Deleted user', `${user.displayName} (${user.email})`);
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `User "${user.displayName}" deleted`, variant: 'success' } });
  };

  // ==========================================
  // TAB 2 — REPOSITORIES
  // ==========================================
  const openEditRepo = (repo) => {
    setEditRepo(repo);
    setEditRepoName(repo.name);
    setEditRepoDesc(repo.description || '');
    setShowEditRepoModal(true);
  };

  const handleUpdateRepo = (e) => {
    e.preventDefault();
    if (!editRepoName.trim()) return;
    dispatch({ type: 'UPDATE_REPOSITORY', payload: { id: editRepo.id, name: editRepoName.trim(), description: editRepoDesc.trim() } });
    addAuditEntry('Updated repository', editRepoName.trim());
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Repository "${editRepoName.trim()}" updated`, variant: 'success' } });
    setShowEditRepoModal(false);
    setEditRepo(null);
  };

  const deleteRepo = (repo) => {
    if (!window.confirm('Are you sure you want to delete this? This action cannot be undone.')) return;
    dispatch({ type: 'DELETE_REPOSITORY', payload: repo.id });
    addAuditEntry('Deleted repository', repo.name);
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Repository "${repo.name}" and all its sub-repositories deleted`, variant: 'success' } });
  };

  // ==========================================
  // TAB 3 — SUB-REPOSITORIES
  // ==========================================
  const openEditSubRepo = (sr) => {
    setEditSubRepo(sr);
    setEditSubName(sr.name);
    setEditSubDesc(sr.description || '');
    setEditSubHeaders(sr.headers ? sr.headers.map(h => ({
      name: h.name,
      type: h.type,
      values: h.type === 'dropdown' ? (h.values || []).join(', ') : '',
    })) : []);
    setShowEditSubRepoModal(true);
  };

  const handleUpdateSubRepo = (e) => {
    e.preventDefault();
    if (!editSubName.trim()) return;
    const processedHeaders = editSubHeaders
      .filter(h => h.name.trim())
      .map(h => ({
        name: h.name.trim(),
        type: h.type,
        values: h.type === 'dropdown' ? h.values.split(',').map(v => v.trim()).filter(Boolean) : [],
      }));
    dispatch({
      type: 'UPDATE_SUB_REPOSITORY',
      payload: { id: editSubRepo.id, name: editSubName.trim(), description: editSubDesc.trim(), headers: processedHeaders },
    });
    addAuditEntry('Updated sub-repository', editSubName.trim());
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Sub-repository "${editSubName.trim()}" updated`, variant: 'success' } });
    setShowEditSubRepoModal(false);
    setEditSubRepo(null);
  };

  const deleteSubRepo = (sr) => {
    if (!window.confirm('Are you sure you want to delete this? This action cannot be undone.')) return;
    dispatch({ type: 'DELETE_SUB_REPOSITORY', payload: sr.id });
    addAuditEntry('Deleted sub-repository', sr.name);
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: `Sub-repository "${sr.name}" deleted`, variant: 'success' } });
  };

  const addEditHeader = () => {
    setEditSubHeaders(prev => [...prev, { name: '', type: 'text', values: '' }]);
  };

  const updateEditHeader = (index, field, value) => {
    setEditSubHeaders(prev => prev.map((h, i) => i === index ? { ...h, [field]: value } : h));
  };

  const removeEditHeader = (index) => {
    setEditSubHeaders(prev => prev.filter((_, i) => i !== index));
  };

  // --- Shared input style ---
  const inputStyle = {
    width: '100%', padding: '8px 12px', background: '#0a0f1a', border: '1px solid #1f2937',
    borderRadius: 8, color: '#f9fafb', fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'Inter, sans-serif',
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Manage users, repositories, sub-repositories, and view audit trail</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        {TABS.map((tab, i) => (
          <button key={tab} className={`tab-item ${activeTab === i ? 'active' : ''}`} onClick={() => setActiveTab(i)}>
            {tab}
          </button>
        ))}
      </div>

      {/* ===== TAB 1: USERS ===== */}
      {activeTab === 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
            <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }} onClick={() => setShowAddUserModal(true)}>
              <Plus size={14} /> New User
            </button>
          </div>

          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {state.users.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}><p>No users yet.</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created</th>
                    <th>Uploads</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.users.map(user => {
                    const userUploads = getUserUploads(user.id);
                    const isExpanded = expandedUserId === user.id;
                    return (
                      <React.Fragment key={user.id}>
                        <tr>
                          <td style={{ fontWeight: 500 }}>{user.displayName}</td>
                          <td>{user.email}</td>
                          <td><span className={`badge ${user.role === 'admin' ? 'badge-success' : ''}`}>{user.role}</span></td>
                          <td>{formatDate(user.createdAt)}</td>
                          <td>
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              onClick={() => setExpandedUserId(isExpanded ? null : user.id)}
                            >
                              <Eye size={12} /> {userUploads.length} upload{userUploads.length !== 1 ? 's' : ''}
                              {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                            </button>
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: 6 }}>
                              {user.id !== auth.userProfile?.id && user.role !== 'super_admin' && (
                              <button
                                className="btn-secondary"
                                style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                onClick={() => cycleUserRole(user)}
                              >
                                {user.role === 'admin' ? <><Shield size={12} /> Demote</> : <><ShieldCheck size={12} /> Promote</>}
                              </button>
                              )}
                              {user.id !== auth.userProfile?.id && user.role !== 'super_admin' && (
                                <button
                                  className="btn-danger"
                                  style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                                  onClick={() => deleteUser(user)}
                                >
                                  <Trash2 size={12} /> Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr>
                            <td colSpan={6} style={{ background: '#0a0f1a', padding: 16 }}>
                              {userUploads.length === 0 ? (
                                <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>No uploads by this user.</p>
                              ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                  <p style={{ color: '#6b7280', fontSize: 12, margin: 0, fontWeight: 500 }}>Upload History</p>
                                  {userUploads.map(u => {
                                    const subRepo = state.subRepositories.find(sr => sr.id === u.subRepositoryId);
                                    return (
                                      <div key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, padding: '6px 0', borderBottom: '1px solid #1f2937' }}>
                                        <span style={{ color: '#f9fafb', fontWeight: 500, minWidth: 200 }}>{u.documentName}</span>
                                        <span style={{ color: '#6b7280' }}>→ {subRepo?.name || '—'}</span>
                                        <span style={{ color: '#6b7280' }}>{u.rowCount} rows</span>
                                        <span style={{ color: '#6b7280' }}>{formatDate(u.uploadDate)}</span>
                                        <span className={`badge ${u.committed ? 'badge-success' : 'badge-warning'}`}>
                                          {u.committed ? 'Committed' : 'Pending'}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB 2: REPOSITORIES ===== */}
      {activeTab === 1 && (
        <div>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {state.repositories.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}><p>No repositories yet.</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Description</th>
                    <th>Sub-Repositories</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.repositories.map(repo => {
                    const subCount = state.subRepositories.filter(sr => sr.repositoryId === repo.id).length;
                    const totalUploads = state.subRepositories
                      .filter(sr => sr.repositoryId === repo.id)
                      .reduce((sum, sr) => sum + (sr.uploadCount || 0), 0);
                    return (
                      <tr key={repo.id}>
                        <td style={{ fontWeight: 500 }}>{repo.name}</td>
                        <td style={{ color: '#6b7280', maxWidth: 300 }}>{repo.description || '—'}</td>
                        <td>
                          <span className="badge">{subCount} sub-repo{subCount !== 1 ? 's' : ''}</span>
                          <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 8 }}>{totalUploads} upload{totalUploads !== 1 ? 's' : ''}</span>
                        </td>
                        <td>{formatDate(repo.createdAt)}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              className="btn-secondary"
                              style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              onClick={() => openEditRepo(repo)}
                            >
                              <Pencil size={12} /> Edit
                            </button>
                            <button
                              className="btn-danger"
                              style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                              onClick={() => deleteRepo(repo)}
                            >
                              <Trash2 size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB 3: SUB-REPOSITORIES ===== */}
      {activeTab === 2 && (
        <div>
          <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
            {state.subRepositories.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}><p>No sub-repositories yet.</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Parent Repository</th>
                    <th>Headers</th>
                    <th>Uploads</th>
                    <th>Last Upload</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.subRepositories.map(sr => (
                    <tr key={sr.id}>
                      <td style={{ fontWeight: 500 }}>{sr.name}</td>
                      <td>{getRepoName(sr.repositoryId)}</td>
                      <td><span className="badge badge-success">{sr.headers ? sr.headers.length : 0} headers</span></td>
                      <td>{sr.uploadCount || 0}</td>
                      <td>{formatDate(sr.lastUpload)}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="btn-secondary"
                            style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => openEditSubRepo(sr)}
                          >
                            <Pencil size={12} /> Edit
                          </button>
                          <button
                            className="btn-danger"
                            style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                            onClick={() => deleteSubRepo(sr)}
                          >
                            <Trash2 size={12} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ===== TAB 4: AUDIT LOG ===== */}
      {activeTab === 3 && (
        <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
          {state.auditLog.length === 0 ? (
            <div className="empty-state" style={{ padding: 48 }}><p>No activity logged yet. Actions will appear here as you use the system.</p></div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {state.auditLog.map(entry => (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: 500 }}>{entry.actor}</td>
                    <td>{entry.action}</td>
                    <td style={{ color: '#6b7280' }}>{entry.target}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatTimestamp(entry.timestamp)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ===== MODAL: NEW USER ===== */}
      {showAddUserModal && (
        <div className="modal-overlay" onClick={() => setShowAddUserModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: '#f9fafb', margin: 0, fontSize: 16, fontWeight: 600 }}>Create New User</h3>
              <button onClick={() => setShowAddUserModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label>Display Name</label>
                <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} placeholder="Full name" required style={inputStyle} />
              </div>
              <div>
                <label>Email</label>
                <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} placeholder="user@company.com" required style={inputStyle} />
              </div>
              <div>
                <label>Temporary Password</label>
                <input type="password" value={newUserPassword} onChange={e => setNewUserPassword(e.target.value)} placeholder="Min 6 characters" required style={inputStyle} />
              </div>
              <div>
                <label>Role</label>
                <select value={newUserRole} onChange={e => setNewUserRole(e.target.value)} style={inputStyle}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowAddUserModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={isCreatingUser}>{isCreatingUser ? 'Creating...' : 'Create User'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT REPOSITORY ===== */}
      {showEditRepoModal && editRepo && (
        <div className="modal-overlay" onClick={() => setShowEditRepoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: '#f9fafb', margin: 0, fontSize: 16, fontWeight: 600 }}>Edit Repository</h3>
              <button onClick={() => setShowEditRepoModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateRepo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label>Name</label>
                <input type="text" value={editRepoName} onChange={e => setEditRepoName(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label>Description</label>
                <textarea value={editRepoDesc} onChange={e => setEditRepoDesc(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditRepoModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===== MODAL: EDIT SUB-REPOSITORY ===== */}
      {showEditSubRepoModal && editSubRepo && (
        <div className="modal-overlay" onClick={() => setShowEditSubRepoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 600, maxHeight: '85vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: '#f9fafb', margin: 0, fontSize: 16, fontWeight: 600 }}>Edit Sub-Repository</h3>
              <button onClick={() => setShowEditSubRepoModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={handleUpdateSubRepo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label>Name</label>
                <input type="text" value={editSubName} onChange={e => setEditSubName(e.target.value)} required style={inputStyle} />
              </div>
              <div>
                <label>Description</label>
                <textarea value={editSubDesc} onChange={e => setEditSubDesc(e.target.value)} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
              </div>

              {/* Header Editor */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                  <label style={{ margin: 0 }}>Headers ({editSubHeaders.length})</label>
                  <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: 11, display: 'inline-flex', alignItems: 'center', gap: 4 }} onClick={addEditHeader}>
                    <Plus size={12} /> Add Header
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 300, overflowY: 'auto' }}>
                  {editSubHeaders.map((h, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <input
                        type="text"
                        value={h.name}
                        onChange={e => updateEditHeader(idx, 'name', e.target.value)}
                        placeholder="Header name"
                        style={{ ...inputStyle, flex: 2 }}
                      />
                      <select
                        value={h.type}
                        onChange={e => updateEditHeader(idx, 'type', e.target.value)}
                        style={{ ...inputStyle, flex: 1 }}
                      >
                        <option value="text">Text</option>
                        <option value="dropdown">Dropdown</option>
                        <option value="date">Date</option>
                        <option value="number">Number</option>
                      </select>
                      {h.type === 'dropdown' && (
                        <input
                          type="text"
                          value={h.values}
                          onChange={e => updateEditHeader(idx, 'values', e.target.value)}
                          placeholder="Comma-separated values"
                          style={{ ...inputStyle, flex: 2 }}
                        />
                      )}
                      <button
                        type="button"
                        onClick={() => removeEditHeader(idx)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 4, flexShrink: 0, marginTop: 4 }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {editSubHeaders.length === 0 && (
                    <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', padding: 16 }}>No headers defined. Click "+ Add Header" above.</p>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowEditSubRepoModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
