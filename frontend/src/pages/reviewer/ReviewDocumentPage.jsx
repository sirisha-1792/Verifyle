import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function ReviewDocumentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [decision, setDecision] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchDocument();
  }, [id]);

  const fetchDocument = async () => {
    try {
      const res = await API.get(`/reviewer/documents/${id}`);
      setDoc(res.data.data);
    } catch (err) {
      console.error('Failed to fetch document:', err);
    } finally {
      setLoading(false);
    }
  };

  const openReviewModal = (dec) => {
    setDecision(dec);
    setReason('');
    setError('');
    setShowModal(true);
  };

  const handleSubmitReview = async () => {
    if ((decision === 'REJECTED' || decision === 'CORRECTION_REQUESTED') && !reason.trim()) {
      setError('Reason is required for rejection or correction request');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      await API.post(`/reviewer/documents/${id}/review`, {
        decision,
        reason: reason.trim() || null,
      });
      setShowModal(false);
      setSuccess(`Document ${decision === 'APPROVED' ? 'approved' : decision === 'REJECTED' ? 'rejected' : 'sent back for correction'} successfully!`);
      setTimeout(() => navigate('/reviewer'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
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
        <Link to="/reviewer" className="text-decoration-none text-muted d-block mb-2" style={{ fontSize: '0.85rem' }}>
          ← Back to Queue
        </Link>
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <h1>{doc.title}</h1>
            <p>{doc.documentType} · Submitted by {doc.submitterName}</p>
          </div>
          <StatusBadge status={doc.status} />
        </div>
      </div>

      {error && !showModal && <div className="alert alert-danger alert-custom">{error}</div>}
      {success && <div className="alert alert-success alert-custom">{success}</div>}

      <div className="row">
        <div className="col-lg-8">
          {/* Workflow Progress */}
          {doc.workflowSteps && (
            <div className="data-card mb-4">
              <div className="data-card-header">
                <h5>Workflow Progress</h5>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div className="workflow-steps">
                  {doc.workflowSteps.map((step, idx) => (
                    <div className="workflow-step" key={idx}>
                      <div className={`step-circle ${
                        step.status === 'APPROVED' ? 'completed' :
                        step.status === 'IN_PROGRESS' ? 'active' :
                        step.status === 'REJECTED' || step.status === 'CORRECTION_REQUESTED' ? 'rejected' : ''
                      }`}>
                        {step.status === 'APPROVED' ? '✓' : step.stepOrder}
                      </div>
                      <div className="step-info">
                        <div className="step-name">{step.stepName}</div>
                        <div className="step-status">{step.status.replace('_', ' ')}</div>
                      </div>
                      {idx < doc.workflowSteps.length - 1 && (
                        <div className={`step-connector ${step.status === 'APPROVED' ? 'completed' : ''}`}></div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Document Preview */}
          {latestVersion && (
            <div className="data-card mb-4">
              <div className="data-card-header">
                <h5>Document (Version {latestVersion.versionNumber})</h5>
                <a
                  href={`/api/documents/download/${latestVersion.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline-custom btn-sm"
                >
                  ⬇ Download
                </a>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div className="doc-preview">
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
                  <div className="mt-3 text-center p-3" style={{ background: '#F8FAFC', borderRadius: 'var(--radius-md)' }}>
                    <img
                      src={`/api/documents/download/${latestVersion.id}`}
                      alt="Document preview"
                      style={{ maxWidth: '100%', maxHeight: '500px', borderRadius: 'var(--radius-sm)' }}
                    />
                  </div>
                )}

                {latestVersion.contentType === 'application/pdf' && (
                  <div className="mt-3" style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
                    <iframe
                      src={`/api/documents/download/${latestVersion.id}`}
                      width="100%"
                      height="500px"
                      title="PDF Preview"
                      style={{ border: 'none' }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Review Actions */}
          {!success && (
            <div className="data-card mb-4">
              <div className="data-card-header">
                <h5>Review Actions</h5>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <p className="text-muted mb-3" style={{ fontSize: '0.9rem' }}>
                  Review the document carefully and take an action below.
                </p>
                <div className="d-flex gap-3 flex-wrap">
                  <button className="btn btn-success-custom" onClick={() => openReviewModal('APPROVED')}>
                    ✓ Approve
                  </button>
                  <button className="btn btn-danger-custom" onClick={() => openReviewModal('REJECTED')}>
                    ✕ Reject
                  </button>
                  <button className="btn btn-warning-custom" onClick={() => openReviewModal('CORRECTION_REQUESTED')}>
                    ↩ Request Correction
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Audit Trail */}
          {doc.auditTrail && doc.auditTrail.length > 0 && (
            <div className="data-card mb-4">
              <div className="data-card-header"><h5>Previous Reviews</h5></div>
              <div style={{ padding: '1.25rem' }}>
                <div className="timeline">
                  {doc.auditTrail.map((entry) => (
                    <div key={entry.id} className={`timeline-item ${
                      entry.decision === 'APPROVED' ? 'approved' :
                      entry.decision === 'REJECTED' ? 'rejected' : 'correction'
                    }`}>
                      <div className="timeline-content">
                        <div className="timeline-date">{formatDate(entry.createdAt)}</div>
                        <div className="timeline-title">{entry.reviewer} — {entry.stepName}</div>
                        <StatusBadge status={entry.decision} />
                        {entry.reason && <div className="timeline-body mt-1"><em>"{entry.reason}"</em></div>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="col-lg-4">
          <div className="data-card mb-4">
            <div className="data-card-header"><h5>Submission Details</h5></div>
            <div style={{ padding: '1.25rem', fontSize: '0.88rem' }}>
              <div className="mb-2"><strong>Submitter:</strong> <span className="text-muted">{doc.submitterName}</span></div>
              <div className="mb-2"><strong>Email:</strong> <span className="text-muted">{doc.submitterEmail}</span></div>
              <div className="mb-2"><strong>Type:</strong> <span className="text-muted">{doc.documentType}</span></div>
              <div className="mb-2"><strong>Submitted:</strong> <span className="text-muted">{formatDate(doc.createdAt)}</span></div>
              <div className="mb-2"><strong>Versions:</strong> <span className="text-muted">{doc.versions?.length || 0}</span></div>
            </div>
          </div>

          {doc.versions && doc.versions.length > 1 && (
            <div className="data-card">
              <div className="data-card-header"><h5>All Versions</h5></div>
              <div style={{ padding: '1.25rem' }}>
                {doc.versions.map((v) => (
                  <div key={v.id} className="doc-preview mb-2">
                    <div className="doc-icon" style={{ width: 36, height: 36, fontSize: '1rem' }}>
                      {v.contentType === 'application/pdf' ? '📄' : '🖼️'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="doc-name text-truncate" style={{ fontSize: '0.8rem' }}>
                        v{v.versionNumber}
                      </div>
                      <div className="doc-meta">{formatFileSize(v.fileSize)}</div>
                    </div>
                    <a href={`/api/documents/download/${v.id}`} target="_blank" rel="noopener noreferrer"
                       className="btn btn-outline-custom" style={{ padding: '0.2rem 0.5rem', fontSize: '0.75rem' }}>⬇</a>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Review Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">
                  {decision === 'APPROVED' ? '✓ Approve Document' :
                   decision === 'REJECTED' ? '✕ Reject Document' : '↩ Request Correction'}
                </h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger alert-custom mb-3">{error}</div>}

                {decision === 'APPROVED' ? (
                  <p>Are you sure you want to approve this document? The workflow will advance to the next step.</p>
                ) : (
                  <>
                    <p className="mb-3">
                      {decision === 'REJECTED'
                        ? 'Please provide a reason for rejecting this document.'
                        : 'Please describe the corrections needed.'}
                    </p>
                    <textarea
                      className="form-control"
                      rows={4}
                      placeholder={decision === 'REJECTED' ? 'Reason for rejection...' : 'Describe corrections needed...'}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      style={{ borderRadius: 'var(--radius-md)' }}
                      id="review-reason"
                    />
                  </>
                )}
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-custom" onClick={() => setShowModal(false)}>Cancel</button>
                <button
                  className={`btn ${decision === 'APPROVED' ? 'btn-success-custom' : decision === 'REJECTED' ? 'btn-danger-custom' : 'btn-warning-custom'}`}
                  onClick={handleSubmitReview}
                  disabled={submitting}
                  id="review-confirm"
                >
                  {submitting ? 'Submitting...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
