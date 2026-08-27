import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function ReviewerDashboard() {
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('queue');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [queueRes, historyRes] = await Promise.all([
        API.get('/reviewer/queue'),
        API.get('/reviewer/history'),
      ]);
      setQueue(queueRes.data.data || []);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      console.error('Failed to fetch reviewer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Verifier Dashboard</h1>
        <p>Review assigned documents and track your past verification decisions</p>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="stat-card warning">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{queue.length}</div>
            <div className="stat-label">Pending My Action</div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="stat-card success">
            <div className="stat-icon">✅</div>
            <div className="stat-value">{history.filter(h => h.decision === 'APPROVED').length}</div>
            <div className="stat-label">Approved by Me</div>
          </div>
        </div>
        <div className="col-md-4 mb-3">
          <div className="stat-card primary">
            <div className="stat-icon">📝</div>
            <div className="stat-value">{history.length}</div>
            <div className="stat-label">Total Decisions Completed</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <ul className="nav nav-pills mb-3" style={{ gap: '0.5rem' }}>
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'queue' ? 'btn-primary' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('queue')}
            id="tab-pending-queue"
          >
            📋 Pending Queue ({queue.length})
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('history')}
            id="tab-history"
          >
            📜 Completed Reviews ({history.length})
          </button>
        </li>
      </ul>

      {activeTab === 'queue' ? (
        <div className="data-card">
          <div className="data-card-header">
            <h5>Documents Waiting for Your Action</h5>
          </div>
          {queue.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">✅</div>
              <h5>All caught up!</h5>
              <p>No documents are currently awaiting your action. Once a document reaches your step, it will appear here.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Document Type</th>
                  <th>Submitted By</th>
                  <th>Current Step</th>
                  <th>Submitted</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {queue.map((doc) => (
                  <tr key={doc.id}>
                    <td style={{ fontWeight: 600 }}>{doc.title}</td>
                    <td>{doc.documentType}</td>
                    <td>
                      <div style={{ fontWeight: 500 }}>{doc.submitterName}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{doc.submitterEmail}</div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem' }}>
                        Step {doc.currentStep}
                        {doc.currentStepName && ` — ${doc.currentStepName}`}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatDate(doc.createdAt)}
                    </td>
                    <td>
                      <Link
                        to={`/reviewer/documents/${doc.id}`}
                        className="btn btn-primary btn-sm"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      ) : (
        <div className="data-card">
          <div className="data-card-header">
            <h5>My Completed Verification History</h5>
          </div>
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📁</div>
              <h5>No review history yet</h5>
              <p>When you approve, reject, or request corrections on documents, they will be archived here.</p>
            </div>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Document Title</th>
                  <th>Type</th>
                  <th>Submitter</th>
                  <th>Step Name</th>
                  <th>Your Decision</th>
                  <th>Notes / Reason</th>
                  <th>Reviewed On</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {history.map((entry) => (
                  <tr key={entry.id}>
                    <td style={{ fontWeight: 600 }}>{entry.documentTitle}</td>
                    <td>{entry.documentType}</td>
                    <td>{entry.submitterName}</td>
                    <td>{entry.stepName} (v{entry.versionNumber})</td>
                    <td><StatusBadge status={entry.decision} /></td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {entry.reason ? `"${entry.reason}"` : '-'}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {formatDate(entry.createdAt)}
                    </td>
                    <td>
                      <Link
                        to={`/reviewer/documents/${entry.documentId}`}
                        className="btn btn-outline-custom btn-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
