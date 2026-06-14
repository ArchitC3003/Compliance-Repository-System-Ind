import React, { useState, useRef, useMemo } from 'react';
import { Upload, CheckCircle, AlertTriangle, XCircle, FileSpreadsheet, ArrowRight, RotateCcw } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { parseFile } from '../lib/parseFile';

export default function IngestPage() {
  const { state, dispatch } = useAppContext();

  const [currentStep, setCurrentStep] = useState(1);
  const [selectedSubRepoId, setSelectedSubRepoId] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');
  const [headerMapping, setHeaderMapping] = useState({});

  const fileInputRef = useRef(null);
  const fileRef = useRef(null);

  const isAdmin = state.session?.role === 'admin';

  const selectedSubRepo = useMemo(
    () => state.subRepositories.find(sr => sr.id === selectedSubRepoId) || null,
    [state.subRepositories, selectedSubRepoId]
  );

  const steps = [
    { number: 1, label: 'Select Sub-Repository' },
    { number: 2, label: 'Upload & Map' },
    { number: 3, label: 'Review & Commit' },
  ];

  /* ── Helpers ── */

  const resetAll = () => {
    setCurrentStep(1);
    setSelectedSubRepoId('');
    setParsedData(null);
    setFileName('');
    setIsDragging(false);
    setHeaderMapping({});
    fileRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const mappedCount = useMemo(() => {
    if (!selectedSubRepo) return 0;
    return selectedSubRepo.headers.filter(h => headerMapping[h.name] && headerMapping[h.name] !== '').length;
  }, [headerMapping, selectedSubRepo]);

  const unmappedFileHeaders = useMemo(() => {
    if (!parsedData || !selectedSubRepo) return [];
    const mappedFileHeaders = new Set(Object.values(headerMapping).filter(Boolean));
    return parsedData.headers.filter(fh => !mappedFileHeaders.has(fh));
  }, [parsedData, headerMapping, selectedSubRepo]);

  /* ── File handling ── */

  const initMapping = (fileHeaders, subRepo) => {
    const mapping = {};
    subRepo.headers.forEach(h => {
      const match = fileHeaders.find(
        fh => fh.trim().toLowerCase() === h.name.trim().toLowerCase()
      );
      mapping[h.name] = match || '';
    });
    setHeaderMapping(mapping);
  };

  const handleFileProcess = async (file) => {
    if (!file) return;
    setFileName(file.name);
    fileRef.current = file;
    try {
      const result = await parseFile(file);
      setParsedData(result);
      if (selectedSubRepo) {
        initMapping(result.headers, selectedSubRepo);
      }
    } catch (err) {
      console.error('Parse error:', err);
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: { message: 'Failed to parse file: ' + err.message, variant: 'error' },
      });
    }
  };

  const handleDragEnter = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileProcess(file);
  };
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) handleFileProcess(file);
  };

  const handleMappingChange = (subRepoHeaderName, fileHeaderValue) => {
    setHeaderMapping(prev => ({ ...prev, [subRepoHeaderName]: fileHeaderValue }));
  };

  /* ── Commit ── */

  const handleCommit = () => {
    if (!parsedData || !selectedSubRepo) return;
    if (!parsedData || parsedData.rows.length === 0) return;

    const mappedRows = parsedData.rows.map(row => {
      return selectedSubRepo.headers.map(h => {
        const fileHeader = headerMapping[h.name];
        if (!fileHeader) return '';
        const fileIdx = parsedData.headers.indexOf(fileHeader);
        return fileIdx >= 0 ? (row[fileIdx] ?? '') : '';
      });
    });

    const canonicalHeaders = selectedSubRepo.headers.map(h => h.name);

    const uploadId = crypto.randomUUID();

    const uploadEntry = {
      id: uploadId,
      documentName: fileName,
      subRepositoryId: selectedSubRepo.id,
      uploadedBy: state.session.user.id,
      uploadDate: new Date().toISOString(),
      headers: canonicalHeaders,
      rowCount: mappedRows.length,
      lineItems: {
        headers: canonicalHeaders,
        rows: mappedRows,
      },
      status: 'completed',
      committed: true,
      sourceFilePath: null,
    };

    const docEntry = {
      id: crypto.randomUUID(),
      uploadId: uploadId,
      subRepositoryId: selectedSubRepo.id,
      repositoryId: selectedSubRepo.repositoryId,
      originalFilename: fileName,
      fileSizeBytes: fileRef.current?.size || 0,
      mimeType: fileRef.current?.type || '',
      uploadedAt: new Date().toISOString(),
      storagePath: null,
    };

    dispatch({ type: 'ADD_UPLOAD', payload: uploadEntry });
    dispatch({ type: 'ADD_DOCUMENT', payload: docEntry });

    dispatch({
      type: 'UPDATE_SUB_REPOSITORY',
      payload: {
        id: selectedSubRepo.id,
        uploadCount: (selectedSubRepo.uploadCount || 0) + 1,
        lastUpload: new Date().toISOString(),
      },
    });

    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        message: `Successfully committed ${mappedRows.length} rows from "${fileName}"`,
        variant: 'success',
      },
    });

    dispatch({
      type: 'ADD_AUDIT_LOG',
      payload: {
        id: crypto.randomUUID(),
        actor: state.session.user.email,
        action: 'Committed upload',
        target: `${fileName} → ${selectedSubRepo.name} (${mappedRows.length} rows)`,
        timestamp: new Date().toISOString(),
      },
    });

    resetAll();
  };

  /* ── Preview rows mapped to canonical order ── */

  const previewRows = useMemo(() => {
    if (!parsedData || !selectedSubRepo) return [];
    return parsedData.rows.slice(0, 5).map(row =>
      selectedSubRepo.headers.map(h => {
        const fileHeader = headerMapping[h.name];
        if (!fileHeader) return '';
        const fileIdx = parsedData.headers.indexOf(fileHeader);
        return fileIdx >= 0 ? (row[fileIdx] ?? '') : '';
      })
    );
  }, [parsedData, selectedSubRepo, headerMapping]);

  /* ══════════════════════ Render ══════════════════════ */

  /* ── Empty state ── */
  if (state.subRepositories.length === 0) {
    return (
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="page-header">
          <h1>File Ingestion</h1>
          <p>Upload and map files into sub-repositories</p>
        </div>
        <div className="glass-card" style={{ padding: 48, textAlign: 'center' }}>
          <FileSpreadsheet size={48} style={{ color: '#6b7280', marginBottom: 16, opacity: 0.4 }} />
          {isAdmin ? (
            <>
              <p style={{ color: '#f9fafb', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
                Create a sub-repository first before ingesting files.
              </p>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 24 }}>
                You need at least one sub-repository to upload data into.
              </p>
              <button
                className="btn-primary"
                onClick={() => dispatch({ type: 'SET_ACTIVE_PANEL', payload: 'repository' })}
              >
                <ArrowRight size={16} />
                Go to Repositories
              </button>
            </>
          ) : (
            <>
              <p style={{ color: '#f9fafb', fontSize: 15, fontWeight: 500, marginBottom: 8 }}>
                No sub-repositories available.
              </p>
              <p style={{ color: '#6b7280', fontSize: 13 }}>
                Ask your admin to create one first.
              </p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header">
        <h1>File Ingestion</h1>
        <p>Upload and map files into sub-repositories</p>
      </div>

      {/* ── Step Indicator ── */}
      <div className="step-indicator" style={{ marginBottom: 32 }}>
        {steps.map((step, idx) => (
          <React.Fragment key={step.number}>
            <div className={`step-item${currentStep >= step.number ? ' active' : ''}`}>
              <div className="step-number">{step.number}</div>
              <div className="step-label">{step.label}</div>
            </div>
            {idx < steps.length - 1 && (
              <div className={`step-connector${currentStep > step.number ? ' active' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ═══════ Step 1 — Select Sub-Repository ═══════ */}
      {currentStep === 1 && (
        <div className="glass-card fade-in" style={{ padding: 24 }}>
          <h3 style={{ color: '#f9fafb', margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>
            Select Target Sub-Repository
          </h3>

          <select
            value={selectedSubRepoId}
            onChange={e => setSelectedSubRepoId(e.target.value)}
            style={{
              width: '100%', padding: '10px 12px', background: '#0a0f1a', border: '1px solid #1f2937',
              borderRadius: 8, color: '#f9fafb', fontSize: 14, outline: 'none', boxSizing: 'border-box', marginBottom: 20,
            }}
          >
            <option value="">— Select a sub-repository —</option>
            {state.subRepositories.map(sr => (
              <option key={sr.id} value={sr.id}>{sr.name}</option>
            ))}
          </select>

          {selectedSubRepo && selectedSubRepo.headers && selectedSubRepo.headers.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 10 }}>Sub-repository headers:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {selectedSubRepo.headers.map(h => (
                  <span key={h.name} style={{
                    padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 500,
                    background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)',
                  }}>
                    {h.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn-primary"
              disabled={!selectedSubRepoId}
              onClick={() => setCurrentStep(2)}
              style={{ opacity: selectedSubRepoId ? 1 : 0.5 }}
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════ Step 2 — Upload & Header Mapping ═══════ */}
      {currentStep === 2 && (
        <div className="glass-card fade-in" style={{ padding: 24 }}>
          <h3 style={{ color: '#f9fafb', margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>
            Upload & Map Headers
          </h3>

          {!parsedData ? (
            <div
              className={`drop-zone${isDragging ? ' active' : ''}`}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{ cursor: 'pointer' }}
            >
              <Upload size={40} style={{ color: '#6b7280', marginBottom: 12 }} />
              <p style={{ color: '#f9fafb', fontSize: 15, margin: '0 0 4px 0', fontWeight: 500 }}>
                Drop your Excel or CSV file here
              </p>
              <p style={{ color: '#6b7280', fontSize: 13, margin: 0 }}>or click to browse</p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          ) : (
            <div>
              {/* File info */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <FileSpreadsheet size={20} style={{ color: '#10b981' }} />
                <span style={{ color: '#f9fafb', fontSize: 14, fontWeight: 500 }}>{fileName}</span>
                <span style={{ color: '#6b7280', fontSize: 13 }}>— {parsedData.rowCount} rows detected</span>
              </div>

              {/* Mapping table */}
              {selectedSubRepo && selectedSubRepo.headers.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    Header Mapping
                  </p>
                  <div style={{ border: '1px solid #1f2937', borderRadius: 8, overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr>
                          <th style={{
                            textAlign: 'left', padding: '10px 16px', fontSize: 12, fontWeight: 600,
                            color: '#6b7280', borderBottom: '1px solid #1f2937', background: '#0a0f1a',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                          }}>
                            Sub-Repository Header
                          </th>
                          <th style={{
                            textAlign: 'left', padding: '10px 16px', fontSize: 12, fontWeight: 600,
                            color: '#6b7280', borderBottom: '1px solid #1f2937', background: '#0a0f1a',
                            textTransform: 'uppercase', letterSpacing: '0.5px',
                          }}>
                            Mapped From (File)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedSubRepo.headers.map((h, idx) => (
                          <tr key={h.name} style={{ borderBottom: idx < selectedSubRepo.headers.length - 1 ? '1px solid #1f2937' : 'none' }}>
                            <td style={{ padding: '10px 16px', fontSize: 13, color: '#f9fafb' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                {headerMapping[h.name] ? (
                                  <CheckCircle size={14} style={{ color: '#10b981', flexShrink: 0 }} />
                                ) : (
                                  <XCircle size={14} style={{ color: '#6b7280', flexShrink: 0 }} />
                                )}
                                {h.name}
                              </div>
                            </td>
                            <td style={{ padding: '10px 16px' }}>
                              <select
                                value={headerMapping[h.name] || ''}
                                onChange={e => handleMappingChange(h.name, e.target.value)}
                                style={{
                                  width: '100%', padding: '6px 10px', background: '#0a0f1a',
                                  border: '1px solid #1f2937', borderRadius: 6, color: '#f9fafb',
                                  fontSize: 13, outline: 'none',
                                }}
                              >
                                <option value="">— Skip (leave empty) —</option>
                                {parsedData.headers.filter(fh => {
                                  if (headerMapping[h.name] === fh) return true;
                                  return !Object.values(headerMapping).includes(fh);
                                }).map(fh => (
                                  <option key={fh} value={fh}>{fh}</option>
                                ))}
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Unmapped file headers warning */}
              {unmappedFileHeaders.length > 0 && (
                <div style={{ marginBottom: 16 }}>
                  <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 8, fontWeight: 500 }}>
                    Unmapped File Headers ({unmappedFileHeaders.length})
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {unmappedFileHeaders.map(fh => (
                      <span key={fh} style={{
                        display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                        borderRadius: 12, fontSize: 11, fontWeight: 500,
                        background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b',
                        border: '1px solid rgba(245, 158, 11, 0.25)',
                      }}>
                        <AlertTriangle size={11} /> {fh}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Mapping status */}
              <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 0 }}>
                <span style={{ color: mappedCount > 0 ? '#10b981' : '#6b7280', fontWeight: 500 }}>
                  {mappedCount}
                </span>{' '}
                of {selectedSubRepo?.headers.length || 0} headers mapped
              </p>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 20 }}>
            <button
              className="btn-secondary"
              onClick={() => {
                setParsedData(null);
                setFileName('');
                setHeaderMapping({});
                fileRef.current = null;
                setCurrentStep(1);
              }}
            >
              Back
            </button>
            <button
              className="btn-primary"
              disabled={!parsedData || mappedCount < 1 || parsedData.rowCount === 0}
              onClick={() => setCurrentStep(3)}
              style={{ opacity: parsedData && mappedCount >= 1 ? 1 : 0.5 }}
            >
              Next <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ═══════ Step 3 — Review & Commit ═══════ */}
      {currentStep === 3 && parsedData && selectedSubRepo && (
        <div className="glass-card fade-in" style={{ padding: 24 }}>
          <h3 style={{ color: '#f9fafb', margin: '0 0 16px 0', fontSize: 16, fontWeight: 600 }}>
            Review & Commit
          </h3>

          {/* Summary */}
          <div style={{ display: 'flex', gap: 32, marginBottom: 20 }}>
            <div>
              <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 4px 0' }}>File Name</p>
              <p style={{ color: '#f9fafb', fontSize: 14, margin: 0, fontWeight: 500 }}>{fileName}</p>
            </div>
            <div>
              <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 4px 0' }}>Row Count</p>
              <p style={{ color: '#f9fafb', fontSize: 14, margin: 0, fontWeight: 500 }}>{parsedData.rowCount}</p>
            </div>
            <div>
              <p style={{ color: '#6b7280', fontSize: 12, margin: '0 0 4px 0' }}>Headers Mapped</p>
              <p style={{ color: '#10b981', fontSize: 14, margin: 0, fontWeight: 500 }}>
                {mappedCount} / {selectedSubRepo.headers.length}
              </p>
            </div>
          </div>

          {/* Mapped headers summary */}
          <div style={{ marginBottom: 20 }}>
            <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 8, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Mapped Headers
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {selectedSubRepo.headers.map(h => {
                const mapped = headerMapping[h.name];
                return (
                  <span key={h.name} style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                    borderRadius: 12, fontSize: 11, fontWeight: 500,
                    background: mapped ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                    color: mapped ? '#10b981' : '#6b7280',
                    border: `1px solid ${mapped ? 'rgba(16, 185, 129, 0.25)' : 'rgba(107, 114, 128, 0.25)'}`,
                  }}>
                    {mapped ? <CheckCircle size={11} /> : <XCircle size={11} />}
                    {h.name}{mapped ? ` ← ${mapped}` : ' (skipped)'}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Preview table */}
          <div style={{ overflowX: 'auto', marginBottom: 20 }}>
            <p style={{ color: '#6b7280', fontSize: 12, marginBottom: 8 }}>Preview (first 5 rows)</p>
            <table className="data-table">
              <thead>
                <tr>
                  {selectedSubRepo.headers.map(h => (
                    <th key={h.name}>{h.name}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci}>{cell ?? ''}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <button className="btn-secondary" onClick={resetAll}>
              <RotateCcw size={14} />
              Cancel
            </button>
            <button className="btn-primary" onClick={handleCommit}>
              <CheckCircle size={16} />
              Commit to Repository
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
