import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function ReviewerDashboard() {
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQueue();
  }, []);

  const fetchQueue = async () => {
    try {
      const res = await API.get('/reviewer/queue');
      setQueue(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch review queue:', err);
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
        <h1>Review Queue</h1>
        <p>Documents waiting for your review</p>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        <div className="col-md-4 mb-3">
          <div className="stat-card warning">
            <div className="stat-icon">📋</div>
            <div className="stat-value">{queue.length}</div>
            <div className="stat-label">Pending Reviews</div>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="data-card">
        <div className="data-card-header">
          <h5>Documents to Review</h5>
        </div>
        {queue.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">✅</div>
            <h5>All caught up!</h5>
            <p>No documents are currently waiting for your review</p>
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
    </div>
  );
}
