import React, { useState, useMemo } from 'react';
import { Download, ChevronDown, ChevronUp, Filter, FileText, Rows3, AlignJustify, X, Edit2, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { useAppContext } from '../context/AppContext';

const ROWS_PER_PAGE = 20;

export default function ReportsPage() {
  const { state, dispatch, auth } = useAppContext();

  const [selectedSubRepoId, setSelectedSubRepoId] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedFilters, setExpandedFilters] = useState({});
  const [viewMode, setViewMode] = useState('compact'); // 'compact' | 'full'
  const [selectedRow, setSelectedRow] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingValue, setEditingValue] = useState('');
  const [hoveredField, setHoveredField] = useState(null);

  // ── Selected sub-repo object ──
  const selectedSubRepo = useMemo(() => state.subRepositories.find(sr => sr.id === selectedSubRepoId) || null, [state.subRepositories, selectedSubRepoId]);
  const headers = useMemo(() => selectedSubRepo?.headers || [], [selectedSubRepo]);

  // ── Build flat data from uploads ──
  const allData = useMemo(() => {
    if (!selectedSubRepoId) return [];
    const uploads = state.uploads.filter(u => u.subRepositoryId === selectedSubRepoId);
    const rows = [];
    uploads.forEach(u => {
      if (u.lineItems && u.lineItems.rows) {
        u.lineItems.rows.forEach((row, rowIndex) => {
          const obj = {
            _uploadId: u.id,
            _rowIndex: rowIndex,
          };
          u.lineItems.headers.forEach((h, idx) => {
            obj[h] = row[idx] ?? '';
          });
          rows.push(obj);
        });
      }
    });
    return rows;
  }, [state.uploads, selectedSubRepoId]);

  // ── Build dynamic filter options per header ──
  const filterOptions = useMemo(() => {
    const opts = {};
    headers.forEach(header => {
      if (header.type === 'date' || header.type === 'number') return;
      if (header.type === 'dropdown' && header.values && header.values.length > 0) {
        opts[header.name] = [...header.values].sort();
      } else {
        const unique = [...new Set(allData.map(item => item[header.name]).filter(Boolean))].sort();
        opts[header.name] = unique;
      }
    });
    return opts;
  }, [headers, allData]);

  // ── Apply filters ──
  const filteredData = useMemo(() => {
    let data = [...allData];
    for (const [key, selected] of Object.entries(activeFilters)) {
      if (selected && selected.length > 0) {
        data = data.filter(item => selected.includes(item[key]));
      }
    }
    return data;
  }, [allData, activeFilters]);

  // ── Apply sorting with type awareness ──
  const filteredSortedData = useMemo(() => {
    if (!sortColumn) return filteredData;
    const headerDef = headers.find(h => h.name === sortColumn);
    const colType = headerDef?.type || 'text';

    return [...filteredData].sort((a, b) => {
      const aRaw = a[sortColumn] ?? '';
      const bRaw = b[sortColumn] ?? '';

      let cmp = 0;
      if (colType === 'number') {
        cmp = (parseFloat(aRaw) || 0) - (parseFloat(bRaw) || 0);
      } else if (colType === 'date') {
        cmp = new Date(aRaw).getTime() - new Date(bRaw).getTime();
        if (isNaN(cmp)) cmp = 0;
      } else {
        const aVal = aRaw.toString().toLowerCase();
        const bVal = bRaw.toString().toLowerCase();
        if (aVal < bVal) cmp = -1;
        else if (aVal > bVal) cmp = 1;
      }
      return sortDirection === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortColumn, sortDirection, headers]);

  // ── Pagination ──
  const totalPages = Math.max(1, Math.ceil(filteredSortedData.length / ROWS_PER_PAGE));
  const paginatedData = filteredSortedData.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

  // ── Handlers ──
  const handleSort = (col) => {
    if (sortColumn === col) {
      setSortDirection(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
    setCurrentPage(1);
  };

  const toggleFilter = (filterKey, value) => {
    setActiveFilters(prev => {
      const current = prev[filterKey] || [];
      const updated = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...prev, [filterKey]: updated };
    });
    setCurrentPage(1);
  };

  const clearAllFilters = () => {
    setActiveFilters({});
    setCurrentPage(1);
  };

  const toggleExpandFilter = (key) => {
    setExpandedFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const getSelectedCount = (key) => (activeFilters[key] || []).length;

  const handleExport = () => {
    if (!selectedSubRepo) return;
    const exportData = filteredSortedData.map(item => {
      const row = {};
      selectedSubRepo.headers.forEach(h => { row[h.name] = item[h.name] || ''; });
      return row;
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report');
    XLSX.writeFile(wb, `CRMS_Report_${selectedSubRepo.name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    dispatch({ type: 'ADD_NOTIFICATION', payload: { message: 'Report exported successfully', variant: 'success' } });
  };

  const handleSubRepoChange = (e) => {
    setSelectedSubRepoId(e.target.value);
    setActiveFilters({});
    setCurrentPage(1);
    setSortColumn(null);
    setSortDirection('asc');
    setExpandedFilters({});
    setSelectedRow(null);
    setEditingField(null);
  };

  const handleClosePanel = () => {
    setSelectedRow(null);
    setEditingField(null);
  };

  const handleSaveField = (fieldName) => {
    if (!selectedRow) return;
    const { _uploadId, _rowIndex } = selectedRow;
    if (!_uploadId) {
      console.error("No upload ID associated with this row.");
      return;
    }

    const upload = state.uploads.find(u => u.id === _uploadId);
    if (!upload) return;

    const headerIndex = upload.lineItems.headers.indexOf(fieldName);
    if (headerIndex === -1) return;

    const newRows = [...upload.lineItems.rows];
    const targetRow = [...newRows[_rowIndex]];
    const oldValue = targetRow[headerIndex];
    targetRow[headerIndex] = editingValue;
    newRows[_rowIndex] = targetRow;

    dispatch({
      type: 'UPDATE_UPLOAD',
      payload: {
        id: _uploadId,
        lineItems: {
          headers: upload.lineItems.headers,
          rows: newRows,
        }
      }
    });

    setSelectedRow(prev => ({
      ...prev,
      [fieldName]: editingValue
    }));

    dispatch({
      type: 'ADD_AUDIT_LOG',
      payload: {
        id: crypto.randomUUID(),
        userId: auth.userProfile?.id || 'system',
        userEmail: auth.userProfile?.email || 'system',
        action: 'LIVE_EDIT',
        details: `Updated field [${fieldName}] from "${oldValue || ''}" to "${editingValue}" in sub-repository [${selectedSubRepo?.name || ''}]`,
        timestamp: new Date().toISOString(),
      }
    });

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: `Saved change to "${fieldName}"`,
        variant: 'success'
      }
    });

    setEditingField(null);
  };

  // ── Filterable header names (skip date & number) ──
  const filterableHeaders = headers.filter(h => h.type !== 'date' && h.type !== 'number');

  // ── Empty state ──
  if (state.uploads.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <FileText size={48} style={{ color: '#f9fafb', opacity: 0.4 }} />
        <p style={{ color: '#6b7280', fontSize: 15, margin: 0, textAlign: 'center' }}>
          No data to report. Ingest files into a sub-repository first.
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ── Top bar ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <select
          value={selectedSubRepoId}
          onChange={handleSubRepoChange}
          style={{
            minWidth: 280, padding: '10px 12px', background: '#111827', border: '1px solid #1f2937',
            borderRadius: 8, color: '#f9fafb', fontSize: 14, outline: 'none',
          }}
        >
          <option value="">— Select a sub-repository —</option>
          {state.subRepositories.map(sr => (
            <option key={sr.id} value={sr.id}>{sr.name}</option>
          ))}
        </select>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* View mode toggle */}
          <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', border: '1px solid #1f2937' }}>
            <button
              onClick={() => setViewMode('compact')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 12, fontWeight: 500,
                border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                background: viewMode === 'compact' ? '#10b981' : '#111827',
                color: viewMode === 'compact' ? '#fff' : '#6b7280',
                transition: 'all 200ms ease',
              }}
            >
              <Rows3 size={13} /> Compact
            </button>
            <button
              onClick={() => setViewMode('full')}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', fontSize: 12, fontWeight: 500,
                border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif',
                background: viewMode === 'full' ? '#10b981' : '#111827',
                color: viewMode === 'full' ? '#fff' : '#6b7280',
                transition: 'all 200ms ease',
              }}
            >
              <AlignJustify size={13} /> Full
            </button>
          </div>

          <button
            className="btn-primary"
            onClick={handleExport}
            disabled={filteredSortedData.length === 0}
            style={{ display: 'flex', alignItems: 'center', gap: 6, opacity: filteredSortedData.length > 0 ? 1 : 0.5 }}
          >
            <Download size={15} /> Export to Excel
          </button>
        </div>
      </div>

      {/* ── No sub-repo selected placeholder ── */}
      {!selectedSubRepoId && (
        <div style={{ textAlign: 'center', color: '#6b7280', marginTop: 64, fontSize: 15 }}>
          Select a sub-repository to build a report.
        </div>
      )}

      {/* ── Main content: filter panel + results ── */}
      {selectedSubRepoId && selectedSubRepo && (
        <div style={{ display: 'flex', gap: 20 }}>
          {/* ── Filter Panel ── */}
          {filterableHeaders.length > 0 && (
            <div className="glass-card" style={{ width: 260, flexShrink: 0, padding: 16, overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#f9fafb', fontSize: 14, fontWeight: 600 }}>
                  <Filter size={14} /> Filters
                </div>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 11, padding: '3px 8px' }}
                  onClick={clearAllFilters}
                >
                  Clear All
                </button>
              </div>

              {filterableHeaders.map(header => {
                const options = filterOptions[header.name] || [];
                const isExpanded = expandedFilters[header.name];
                const selectedCount = getSelectedCount(header.name);
                return (
                  <div key={header.name} style={{ marginBottom: 8, borderBottom: '1px solid #1f2937', paddingBottom: 8 }}>
                    <button
                      onClick={() => toggleExpandFilter(header.name)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        background: 'none', border: 'none', color: '#f9fafb', fontSize: 12, fontWeight: 500,
                        cursor: 'pointer', padding: '6px 0', textAlign: 'left',
                      }}
                    >
                      <span>{header.name} {selectedCount > 0 && <span style={{ color: '#10b981', marginLeft: 4 }}>({selectedCount})</span>}</span>
                      {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                    </button>
                    {isExpanded && (
                      <div style={{ maxHeight: 160, overflowY: 'auto', paddingLeft: 4, paddingTop: 4 }}>
                        {options.length === 0 ? (
                          <p style={{ color: '#6b7280', fontSize: 11, margin: '4px 0' }}>No options available</p>
                        ) : (
                          options.map(opt => (
                            <label
                              key={opt}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#9ca3af',
                                padding: '3px 0', cursor: 'pointer',
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={(activeFilters[header.name] || []).includes(opt)}
                                onChange={() => toggleFilter(header.name, opt)}
                                style={{ accentColor: '#10b981' }}
                              />
                              {opt}
                            </label>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Results ── */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>
                Showing <span style={{ color: '#f9fafb', fontWeight: 600 }}>{filteredSortedData.length}</span> of{' '}
                <span style={{ color: '#f9fafb', fontWeight: 600 }}>{allData.length}</span> records
              </p>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {headers.map(h => (
                      <th
                        key={h.name}
                        onClick={() => handleSort(h.name)}
                        style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {h.name}
                          {sortColumn === h.name && (
                            sortDirection === 'asc'
                              ? <ChevronUp size={12} />
                              : <ChevronDown size={12} />
                          )}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {paginatedData.length === 0 ? (
                    <tr>
                      <td colSpan={headers.length} style={{ textAlign: 'center', color: '#6b7280', padding: 32 }}>
                        No data available
                      </td>
                    </tr>
                  ) : (
                    paginatedData.map((item, idx) => (
                      <tr
                        key={idx}
                        onClick={() => setSelectedRow(item)}
                        style={{ cursor: 'pointer', transition: 'background 150ms ease' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.04)'}
                        onMouseLeave={e => e.currentTarget.style.background = ''}
                      >
                        {headers.map(h => (
                          <td
                            key={h.name}
                            style={
                              viewMode === 'compact'
                                ? { maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }
                                : { whiteSpace: 'pre-wrap', wordBreak: 'break-word', maxWidth: 400, lineHeight: 1.5 }
                            }
                          >
                            {item[h.name] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* ── Pagination ── */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                >
                  Prev
                </button>
                {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                  let page;
                  if (totalPages <= 7) {
                    page = i + 1;
                  } else if (currentPage <= 4) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 3) {
                    page = totalPages - 6 + i;
                  } else {
                    page = currentPage - 3 + i;
                  }
                  return (
                    <button
                      key={page}
                      className={currentPage === page ? 'btn-primary' : 'btn-secondary'}
                      style={{ fontSize: 12, padding: '4px 10px', minWidth: 32 }}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  );
                })}
                <button
                  className="btn-secondary"
                  style={{ fontSize: 12, padding: '4px 10px' }}
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Row Detail Panel ── */}
      {selectedRow && (
        <div
          className="modal-overlay"
          onClick={handleClosePanel}
          style={{ alignItems: 'flex-start', justifyContent: 'flex-end' }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: 520, height: '100vh', background: '#111827', borderLeft: '1px solid #1f2937',
              overflowY: 'auto', padding: 0, animation: 'slideInRight 250ms ease',
            }}
          >
            {/* Panel header */}
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', borderBottom: '1px solid #1f2937', position: 'sticky', top: 0,
              background: '#111827', zIndex: 1,
            }}>
              <h3 style={{ color: '#f9fafb', margin: 0, fontSize: 16, fontWeight: 600 }}>Record Detail</h3>
              <button
                onClick={handleClosePanel}
                style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Admin Live Edit Banner */}
            {auth.isAdmin && (
              <div style={{
                padding: '10px 24px',
                background: 'rgba(16, 185, 129, 0.08)',
                borderBottom: '1px solid rgba(16, 185, 129, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
                  Admin Live Edit Enabled
                </span>
                <span style={{ fontSize: 11, color: '#9ca3af' }}>Click any field to edit</span>
              </div>
            )}

            {/* Field list */}
            <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 0 }}>
              {headers.map(h => {
                const value = selectedRow[h.name];
                const hasContent = value !== undefined && value !== null && value !== '';
                const isEditing = editingField === h.name;
                const isAdmin = auth.isAdmin;

                if (isEditing) {
                  return (
                    <div
                      key={h.name}
                      style={{
                        padding: '14px 12px',
                        margin: '6px -12px',
                        background: 'rgba(16, 185, 129, 0.03)',
                        borderRadius: '8px',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 600, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 8 }}>
                        Editing {h.name}
                      </div>
                      <textarea
                        value={editingValue}
                        onChange={e => setEditingValue(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          background: '#0d1117',
                          border: '1px solid #1f2937',
                          borderRadius: '6px',
                          color: '#f9fafb',
                          fontSize: '14px',
                          fontFamily: 'inherit',
                          lineHeight: '1.6',
                          outline: 'none',
                          resize: 'vertical',
                          boxSizing: 'border-box',
                        }}
                        rows={4}
                        autoFocus
                      />
                      <div style={{ display: 'flex', gap: 8, marginTop: 8, justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          onClick={() => setEditingField(null)}
                          style={{
                            padding: '5px 12px',
                            fontSize: 12,
                            background: 'transparent',
                            border: '1px solid #1f2937',
                            borderRadius: '6px',
                            color: '#9ca3af',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={e => e.currentTarget.style.color = '#f9fafb'}
                          onMouseLeave={e => e.currentTarget.style.color = '#9ca3af'}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveField(h.name)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 12px',
                            fontSize: 12,
                            background: '#10b981',
                            border: 'none',
                            borderRadius: '6px',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 500,
                          }}
                        >
                          <Check size={12} /> Save
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={h.name}
                    onClick={() => {
                      if (isAdmin) {
                        setEditingField(h.name);
                        setEditingValue(hasContent ? String(value) : '');
                      }
                    }}
                    onMouseEnter={() => { if (isAdmin) setHoveredField(h.name); }}
                    onMouseLeave={() => { if (isAdmin) setHoveredField(null); }}
                    style={{
                      padding: '14px 12px',
                      margin: '0 -12px',
                      borderRadius: '6px',
                      borderBottom: '1px solid #1f2937',
                      cursor: isAdmin ? 'pointer' : 'default',
                      transition: 'all 200ms ease',
                      background: hoveredField === h.name ? 'rgba(255, 255, 255, 0.02)' : 'transparent',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        {h.name}
                      </span>
                      {isAdmin && (
                        <span
                          style={{
                            fontSize: 10,
                            color: '#10b981',
                            opacity: hoveredField === h.name ? 1 : 0,
                            transition: 'opacity 200ms ease',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4
                          }}
                        >
                          <Edit2 size={10} /> Edit
                        </span>
                      )}
                    </div>
                    <div style={{
                      fontSize: 14, color: hasContent ? '#f9fafb' : '#374151',
                      lineHeight: 1.6, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    }}>
                      {hasContent ? String(value) : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
