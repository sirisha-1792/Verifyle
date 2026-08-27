import { useState, useEffect } from 'react';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function SubmissionsMonitor() {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchSubmissions();
  }, [filter]);

  const fetchSubmissions = async () => {
    try {
      const url = filter ? `/admin/submissions?status=${filter}` : '/admin/submissions';
      const res = await API.get(url);
      setSubmissions(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch submissions:', err);
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

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>All Submissions</h1>
        <p>Monitor all document submissions across the platform</p>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <h5>Submissions ({submissions.length})</h5>
          <select className="form-select form-select-sm" style={{ width: 'auto', borderRadius: 'var(--radius-sm)' }}
            value={filter} onChange={e => { setFilter(e.target.value); setLoading(true); }}>
            <option value="">All Statuses</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="CORRECTION_REQUESTED">Correction Requested</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        {submissions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📄</div>
            <h5>No submissions found</h5>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Type</th>
                <th>Submitter</th>
                <th>Status</th>
                <th>Step</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.map(doc => (
                <tr key={doc.id}>
                  <td className="text-muted">#{doc.id}</td>
                  <td style={{ fontWeight: 600 }}>{doc.title}</td>
                  <td>{doc.documentType}</td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{doc.submitterName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{doc.submitterEmail}</div>
                  </td>
                  <td><StatusBadge status={doc.status} /></td>
                  <td>Step {doc.currentStep}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(doc.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
