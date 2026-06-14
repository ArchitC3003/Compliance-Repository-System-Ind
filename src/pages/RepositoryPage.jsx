import React, { useState } from 'react';
import { Database, Plus, FolderOpen, X, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { ERM_HEADER_PRESET } from '../data/ermHeaders';

export default function RepositoryPage() {
  const { state, dispatch } = useAppContext();

  // Local UI state
  const [selectedRepoId, setSelectedRepoId] = useState(null);
  const [showNewRepoModal, setShowNewRepoModal] = useState(false);
  const [showNewSubRepoModal, setShowNewSubRepoModal] = useState(false);
  const [expandedSubRepos, setExpandedSubRepos] = useState({});

  // New repo form
  const [newRepoName, setNewRepoName] = useState('');
  const [newRepoDesc, setNewRepoDesc] = useState('');

  // New sub-repo form
  const [newSubName, setNewSubName] = useState('');
  const [newSubDesc, setNewSubDesc] = useState('');
  const [headers, setHeaders] = useState([{ id: crypto.randomUUID(), name: '', type: 'text', values: '' }]);

  const selectedRepo = state.repositories.find(r => r.id === selectedRepoId);
  const filteredSubRepos = state.subRepositories.filter(sr => sr.repositoryId === selectedRepoId);

  const getSubRepoCount = (repoId) => state.subRepositories.filter(sr => sr.repositoryId === repoId).length;

  const toggleExpand = (subId) => {
    setExpandedSubRepos(prev => ({ ...prev, [subId]: !prev[subId] }));
  };

  // --- Handlers ---

  const handleCreateRepo = (e) => {
    e.preventDefault();
    if (!newRepoName.trim()) return;
    dispatch({
      type: 'ADD_REPOSITORY',
      payload: {
        id: crypto.randomUUID(),
        name: newRepoName.trim(),
        description: newRepoDesc.trim(),
        createdAt: new Date().toISOString(),
      },
    });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { message: 'Repository created successfully', variant: 'success' },
    });
    setNewRepoName('');
    setNewRepoDesc('');
    setShowNewRepoModal(false);
  };

  const handleCreateSubRepo = (e) => {
    e.preventDefault();
    if (!newSubName.trim() || !selectedRepoId) return;
    const validHeaders = headers.filter(h => h.name.trim());
    if (validHeaders.length === 0) return;

    dispatch({
      type: 'ADD_SUB_REPOSITORY',
      payload: {
        id: crypto.randomUUID(),
        repositoryId: selectedRepoId,
        name: newSubName.trim(),
        description: newSubDesc.trim(),
        headers: validHeaders.map(h => ({
          name: h.name.trim(),
          type: h.type,
          values: h.type === 'dropdown' ? h.values.split(',').map(v => v.trim()).filter(Boolean) : [],
        })),
        uploadCount: 0,
        lastUpload: null,
        createdAt: new Date().toISOString(),
      },
    });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: { message: `Sub-repository "${newSubName.trim()}" created successfully`, variant: 'success' },
    });
    setNewSubName('');
    setNewSubDesc('');
    setHeaders([{ id: crypto.randomUUID(), name: '', type: 'text', values: '' }]);
    setShowNewSubRepoModal(false);
  };

  const openSubRepoModal = () => {
    setNewSubName('');
    setNewSubDesc('');
    setHeaders([{ id: crypto.randomUUID(), name: '', type: 'text', values: '' }]);
    setShowNewSubRepoModal(true);
  };

  const loadErmPreset = () => {
    if (headers.some(h => h.name.trim())) return; // only works if empty
    setHeaders(
      ERM_HEADER_PRESET.map(h => ({
        id: crypto.randomUUID(),
        name: h.name,
        type: h.type,
        values: (h.values || []).join(', '),
      }))
    );
  };

  const addHeaderRow = () => {
    setHeaders(prev => [...prev, { id: crypto.randomUUID(), name: '', type: 'text', values: '' }]);
  };

  const removeHeaderRow = (idx) => {
    setHeaders(prev => prev.filter((_, i) => i !== idx));
  };

  const updateHeader = (index, field, value) => {
    setHeaders(prev => prev.map((h, i) => {
      if (i !== index) return h;
      if (field === 'type' && value !== 'dropdown') {
        return { ...h, [field]: value, values: '' };
      }
      return { ...h, [field]: value };
    }));
  };

  // --- Shared styles ---

  const inputStyle = {
    width: '100%',
    padding: '8px 12px',
    background: '#0a0f1a',
    border: '1px solid #1f2937',
    borderRadius: 8,
    color: '#f9fafb',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box',
  };

  const textareaStyle = {
    ...inputStyle,
    resize: 'vertical',
    fontFamily: 'Inter, sans-serif',
  };

  const selectStyle = {
    ...inputStyle,
    cursor: 'pointer',
  };

  const labelStyle = {
    display: 'block',
    color: '#f9fafb',
    fontSize: 13,
    marginBottom: 6,
    fontWeight: 500,
  };

  // Check if sub-repo form can be submitted
  const canSubmitSubRepo = newSubName.trim() && headers.some(h => h.name.trim());

  return (
    <div style={{ display: 'flex', gap: 24, height: 'calc(100vh - 96px)' }}>
      {/* ====== Left Panel ====== */}
      <div style={{ width: 320, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 16, overflowY: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ color: '#f9fafb', margin: 0, fontSize: 18, fontWeight: 600 }}>Repositories</h2>
          <button
            className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 14px' }}
            onClick={() => { setNewRepoName(''); setNewRepoDesc(''); setShowNewRepoModal(true); }}
          >
            <Plus size={14} /> New Repository
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state.repositories.length === 0 ? (
            <p style={{ color: '#6b7280', fontSize: 13, textAlign: 'center', marginTop: 32, lineHeight: 1.5 }}>
              No repositories yet. Click + New Repository to begin.
            </p>
          ) : (
            state.repositories.map(repo => (
              <div
                key={repo.id}
                className="glass-card"
                onClick={() => setSelectedRepoId(repo.id)}
                style={{
                  cursor: 'pointer',
                  padding: 16,
                  borderColor: selectedRepoId === repo.id ? 'var(--color-accent)' : undefined,
                  borderWidth: selectedRepoId === repo.id ? 1 : undefined,
                  borderStyle: selectedRepoId === repo.id ? 'solid' : undefined,
                  transition: 'border-color 200ms ease',
                }}
              >
                <h3 style={{ color: '#f9fafb', margin: '0 0 4px 0', fontSize: 15, fontWeight: 600 }}>{repo.name}</h3>
                <p style={{ color: '#6b7280', margin: '0 0 8px 0', fontSize: 13, lineHeight: 1.4 }}>
                  {repo.description || 'No description'}
                </p>
                <span className="badge" style={{ fontSize: 11 }}>
                  <FolderOpen size={12} style={{ marginRight: 4 }} />
                  {getSubRepoCount(repo.id)} sub-repo{getSubRepoCount(repo.id) !== 1 ? 's' : ''}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ====== Right Panel ====== */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {!selectedRepo ? (
          <div className="empty-state" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
            <Database size={48} style={{ color: '#6b7280' }} />
            <p style={{ color: '#6b7280', fontSize: 15 }}>Select a repository to view sub-repositories</p>
          </div>
        ) : (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ color: '#f9fafb', margin: 0, fontSize: 20, fontWeight: 600 }}>{selectedRepo.name}</h2>
              <button
                className="btn-primary"
                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, padding: '6px 14px' }}
                onClick={openSubRepoModal}
              >
                <Plus size={14} /> New Sub-Repository
              </button>
            </div>

            {filteredSubRepos.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 48, fontSize: 14 }}>
                No sub-repositories in this repository yet.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {filteredSubRepos.map(sub => {
                  const isExpanded = expandedSubRepos[sub.id];
                  return (
                    <div key={sub.id} className="glass-card" style={{ padding: 20 }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 8 }}>
                        <h3 style={{ color: '#f9fafb', margin: 0, fontSize: 15, fontWeight: 600 }}>{sub.name}</h3>
                        <button
                          onClick={() => toggleExpand(sub.id)}
                          style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 2 }}
                          title={isExpanded ? 'Collapse' : 'Expand headers'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                        <span className="badge badge-success" style={{ fontSize: 11 }}>
                          <Layers size={11} style={{ marginRight: 4 }} />
                          {sub.headers ? sub.headers.length : 0} header{(sub.headers?.length || 0) !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 14, fontSize: 13, color: '#6b7280' }}>
                        <span>{sub.uploadCount || 0} upload{(sub.uploadCount || 0) !== 1 ? 's' : ''}</span>
                        <span>Last upload: {sub.lastUpload ? new Date(sub.lastUpload).toLocaleDateString() : '—'}</span>
                      </div>

                      {isExpanded && sub.headers && sub.headers.length > 0 && (
                        <div
                          style={{
                            borderTop: '1px solid #1f2937',
                            paddingTop: 12,
                            marginTop: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 4,
                            animation: 'fadeIn 200ms ease',
                          }}
                        >
                          <span style={{ fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 4 }}>
                            Headers
                          </span>
                          {sub.headers.map((hdr, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#f9fafb' }}>
                              <span style={{ color: '#6b7280', minWidth: 18, textAlign: 'right' }}>{i + 1}.</span>
                              <span>{hdr.name}</span>
                              <span className="badge" style={{ fontSize: 10, padding: '1px 6px' }}>{hdr.type}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ====== New Repository Modal ====== */}
      {showNewRepoModal && (
        <div className="modal-overlay" onClick={() => setShowNewRepoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 440 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: '#f9fafb', margin: 0, fontSize: 16, fontWeight: 600 }}>New Repository</h3>
              <button onClick={() => setShowNewRepoModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleCreateRepo} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  value={newRepoName}
                  onChange={e => setNewRepoName(e.target.value)}
                  placeholder="Repository name"
                  required
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={newRepoDesc}
                  onChange={e => setNewRepoDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={3}
                  style={textareaStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowNewRepoModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create Repository</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ====== New Sub-Repository Modal (Header Builder) ====== */}
      {showNewSubRepoModal && (
        <div className="modal-overlay" onClick={() => setShowNewSubRepoModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: 640 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ color: '#f9fafb', margin: 0, fontSize: 16, fontWeight: 600 }}>New Sub-Repository</h3>
              <button onClick={() => setShowNewSubRepoModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubRepo} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Name */}
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  type="text"
                  value={newSubName}
                  onChange={e => setNewSubName(e.target.value)}
                  placeholder="Sub-repository name"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Description */}
              <div>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={newSubDesc}
                  onChange={e => setNewSubDesc(e.target.value)}
                  placeholder="Optional description"
                  rows={2}
                  style={textareaStyle}
                />
              </div>

              {/* Header Builder Section */}
              <div style={{ borderTop: '1px solid #1f2937', paddingTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h4 style={{ color: '#f9fafb', margin: 0, fontSize: 14, fontWeight: 600 }}>Define Headers</h4>
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ fontSize: 12, padding: '4px 12px' }}
                    onClick={loadErmPreset}
                    disabled={headers.some(h => h.name.trim())}
                    title={headers.some(h => h.name.trim()) ? 'Clear all headers first to load preset' : 'Load ERM header preset'}
                  >
                    Load ERM Preset
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 320, overflowY: 'auto', paddingRight: 4 }}>
                  {headers.map((header, idx) => (
                    <div
                      key={header.id}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 8,
                        padding: 10,
                        background: '#0a0f1a',
                        borderRadius: 8,
                        border: '1px solid #1f2937',
                      }}
                    >
                      {/* Header Name */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <input
                          type="text"
                          value={header.name}
                          onChange={e => updateHeader(idx, 'name', e.target.value)}  
                          placeholder="Header name"
                          style={{ ...inputStyle, background: '#111827', fontSize: 13, padding: '6px 10px' }}
                        />
                      </div>

                      {/* Header Type */}
                      <div style={{ width: 120, flexShrink: 0 }}>
                        <select
                          value={header.type}
                          onChange={e => updateHeader(idx, 'type', e.target.value)}
                          style={{ ...selectStyle, background: '#111827', fontSize: 13, padding: '6px 10px' }}
                        >
                          <option value="text">Text</option>
                          <option value="dropdown">Dropdown</option>
                          <option value="date">Date</option>
                          <option value="number">Number</option>
                        </select>
                      </div>

                      {/* Values (only for dropdown) */}
                      <div style={{ flex: 1, minWidth: 0, opacity: header.type === 'dropdown' ? 1 : 0.3 }}>
                        <input
                          type="text"
                          value={header.values}
                          onChange={e => updateHeader(idx, 'values', e.target.value)}
                          placeholder="value1, value2, ..."
                          disabled={header.type !== 'dropdown'}
                          style={{ ...inputStyle, background: '#111827', fontSize: 13, padding: '6px 10px' }}
                        />
                      </div>

                      {/* Remove button */}
                      <button
                        type="button"
                        className="btn-danger"
                        onClick={() => removeHeaderRow(idx)}
                        style={{ padding: '6px 8px', fontSize: 12, flexShrink: 0 }}
                        title="Remove header"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  className="btn-secondary"
                  onClick={addHeaderRow}
                  style={{ marginTop: 8, fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 4 }}
                >
                  <Plus size={13} /> Add Header
                </button>

                {headers.length > 0 && !headers.some(h => h.name.trim()) && (
                  <p style={{ color: '#ef4444', fontSize: 12, marginTop: 8 }}>At least 1 header with a name is required.</p>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
                <button type="button" className="btn-secondary" onClick={() => setShowNewSubRepoModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={!canSubmitSubRepo}>Create Sub-Repository</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
