import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function DocumentDetailPage() {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [resubmitFile, setResubmitFile] = useState(null);
  const [resubmitting, setResubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await API.get(`/submitter/documents/${id}`);
      setDoc(res.data.data);
    } catch (err) {
      console.error('Failed to fetch document:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async () => {
    if (!resubmitFile) {
      setError('Please select a file');
      return;
    }
    setResubmitting(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('file', resubmitFile);
      await API.post(`/submitter/documents/${id}/resubmit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setSuccess('Document re-submitted successfully!');
      setResubmitFile(null);
      fetchDocument();
    } catch (err) {
      setError(err.response?.data?.message || 'Re-submission failed');
    } finally {
      setResubmitting(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '-';
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  if (!doc) {
    return <div className="empty-state"><h5>Document not found</h5></div>;
  }

  const latestVersion = doc.versions?.[0];

  return (
    <div className="fade-in">
      <div className="page-header">
        <Link to="/submitter" className="text-decoration-none text-muted d-block mb-2" style={{ fontSize: '0.85rem' }}>
          ← Back to Dashboard
        </Link>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h1>{doc.title}</h1>
            <p>{doc.documentType} · Submitted {formatDate(doc.createdAt)}</p>
          </div>
          <StatusBadge status={doc.status} />
        </div>
      </div>

      {error && <div className="alert alert-danger alert-custom">{error}</div>}
      {success && <div className="alert alert-success alert-custom">{success}</div>}

      <div className="row">
        {/* Main Info */}
        <div className="col-lg-8">
          {/* Workflow Progress */}
          {doc.currentStepInfo && (
            <div className="data-card mb-4">
              <div className="data-card-header">
                <h5>Current Status</h5>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  Currently at <strong>Step {doc.currentStepInfo.stepOrder}</strong>: {doc.currentStepInfo.stepName}
                  <span className="ms-2"><StatusBadge status={doc.currentStepInfo.status} /></span>
                </p>
              </div>
            </div>
          )}

          {/* Certificate / Document In-Page Preview */}
          {latestVersion && (
            <div className="data-card mb-4">
              <div className="data-card-header d-flex justify-content-between align-items-center">
                <h5>Document Preview (Version {latestVersion.versionNumber})</h5>
                <a
                  href={`/api/documents/download/${latestVersion.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-custom btn-sm"
                >
                  ⬇ Download / View Original
                </a>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div className="doc-preview mb-3">
                  <div className="doc-icon">
                    {latestVersion.contentType === 'application/pdf' ? '📄' : '🖼️'}
                  </div>
                  <div>
                    <div className="doc-name">{latestVersion.originalFileName}</div>
                    <div className="doc-meta">
                      {formatFileSize(latestVersion.fileSize)} · Uploaded {formatDate(latestVersion.uploadedAt)}
                    </div>
                  </div>
                </div>

                {latestVersion.contentType?.startsWith('image/') && (
                  <div className="text-center p-3" style={{ background: '#0F172A', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-color)' }}>
                    <img
                      src={`/api/documents/download/${latestVersion.id}`}
                      alt="Certificate preview"
                      style={{ maxWidth: '100%', maxHeight: '520px', borderRadius: 'var(--radius-sm)', objectFit: 'contain', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </div>
                )}

                {latestVersion.contentType === 'application/pdf' && (
                  <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                    <iframe
                      src={`/api/documents/download/${latestVersion.id}`}
                      width="100%"
                      height="520px"
                      title="PDF Preview"
                      style={{ border: 'none' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Re-submit section (if correction requested or rejected) */}
          {(doc.status === 'CORRECTION_REQUESTED' || doc.status === 'REJECTED') && (
            <div
              className="data-card mb-4"
              style={{
                border: doc.status === 'REJECTED' ? '2px solid var(--danger)' : '2px solid var(--warning)',
                borderRadius: 'var(--radius-lg)'
              }}
            >
              <div
                className="data-card-header"
                style={{
                  background: doc.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.12)' : 'var(--warning-light)',
                  borderBottom: '1px solid var(--border-color)'
                }}
              >
                <h5 className="mb-0">
                  {doc.status === 'REJECTED'
                    ? '❌ Document Rejected — Upload Updated File'
                    : '⚠️ Correction Requested — Re-upload Required'}
                </h5>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <p style={{ fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--text-secondary)' }}>
                  {doc.status === 'REJECTED'
                    ? 'This document was rejected during review. You can upload an updated/corrected file to restart the verification workflow.'
                    : 'A reviewer has requested corrections. Please re-upload the corrected document below.'}
                </p>

                {doc.auditTrail && doc.auditTrail.length > 0 && doc.auditTrail[doc.auditTrail.length - 1]?.reason && (
                  <div
                    className="alert mb-3 py-2 px-3"
                    style={{
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--border-color)',
                      fontSize: '0.88rem'
                    }}
                  >
                    <strong>Reviewer Feedback:</strong>{' '}
                    <em>"{doc.auditTrail[doc.auditTrail.length - 1].reason}"</em>
                  </div>
                )}

                <div
                  className={`file-upload-area ${resubmitFile ? 'has-file' : ''}`}
                  onClick={() => fileRef.current?.click()}
                  style={{ marginBottom: '1rem' }}
                >
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setResubmitFile(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                  {resubmitFile ? (
                    <div>
                      <div className="upload-icon">📎</div>
                      <div className="upload-text fw-semibold">{resubmitFile.name}</div>
                      <div className="upload-hint">{formatFileSize(resubmitFile.size)} · Click to change file</div>
                    </div>
                  ) : (
                    <div>
                      <div className="upload-icon">📤</div>
                      <div className="upload-text">
                        <strong>Click to select new file</strong> (PDF, PNG, JPG)
                      </div>
                      <div className="upload-hint">Max 5MB</div>
                    </div>
                  )}
                </div>
                <button
                  className="btn btn-primary"
                  onClick={handleResubmit}
                  disabled={!resubmitFile || resubmitting}
                >
                  {resubmitting ? (
                    <span><span className="spinner-border spinner-border-sm me-2"></span>Re-submitting...</span>
                  ) : 'Re-submit Document for Verification'}
                </button>
              </div>
            </div>
          )}

          {/* Audit Trail */}
          {doc.auditTrail && doc.auditTrail.length > 0 && (
            <div className="data-card mb-4">
              <div className="data-card-header">
                <h5>Review History</h5>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div className="timeline">
                  {doc.auditTrail.map((entry) => (
                    <div
                      key={entry.id}
                      className={`timeline-item ${
                        entry.decision === 'APPROVED' ? 'approved' :
                        entry.decision === 'REJECTED' ? 'rejected' : 'correction'
                      }`}
                    >
                      <div className="timeline-content">
                        <div className="timeline-date">{formatDate(entry.createdAt)}</div>
                        <div className="timeline-title">
                          {entry.reviewer} — {entry.stepName}
                        </div>
                        <div className="d-flex align-items-center gap-2 mb-1">
                          <StatusBadge status={entry.decision} />
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Version {entry.versionNumber}
                          </span>
                        </div>
                        {entry.reason && (
                          <div className="timeline-body mt-1">
                            <em>"{entry.reason}"</em>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="col-lg-4">
          {/* Document Versions */}
          <div className="data-card mb-4">
            <div className="data-card-header">
              <h5>Document Versions</h5>
            </div>
            <div style={{ padding: '1.25rem' }}>
              {(doc.versions || []).map((v) => (
                <div key={v.id} className="doc-preview mb-3">
                  <div className="doc-icon">
                    {v.contentType === 'application/pdf' ? '📄' : '🖼️'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="doc-name text-truncate">v{v.versionNumber} — {v.originalFileName}</div>
                    <div className="doc-meta">{formatFileSize(v.fileSize)} · {formatDate(v.uploadedAt)}</div>
                  </div>
                  <a
                    href={`/api/documents/download/${v.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline-custom btn-sm"
                    title="Download"
                  >
                    ⬇
                  </a>
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div className="data-card">
            <div className="data-card-header">
              <h5>Details</h5>
            </div>
            <div style={{ padding: '1.25rem', fontSize: '0.88rem' }}>
              {doc.description && (
                <div className="mb-3">
                  <strong>Description</strong>
                  <p className="text-muted mt-1 mb-0">{doc.description}</p>
                </div>
              )}
              <div className="mb-2">
                <strong>Document Type:</strong> <span className="text-muted">{doc.documentType}</span>
              </div>
              <div className="mb-2">
                <strong>Submitted:</strong> <span className="text-muted">{formatDate(doc.createdAt)}</span>
              </div>
              <div className="mb-2">
                <strong>Last Updated:</strong> <span className="text-muted">{formatDate(doc.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
