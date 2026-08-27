import { useState, useEffect } from 'react';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function AuditLogViewer() {
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchAuditLog();
  }, []);

  const fetchAuditLog = async () => {
    try {
      const res = await API.get('/admin/audit-log');
      setAuditLog(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch audit log:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
  };

  const filtered = auditLog.filter(entry => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      entry.documentTitle?.toLowerCase().includes(s) ||
      entry.reviewer?.toLowerCase().includes(s) ||
      entry.decision?.toLowerCase().includes(s) ||
      entry.stepName?.toLowerCase().includes(s) ||
      entry.reason?.toLowerCase().includes(s)
    );
  });

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Audit Log</h1>
        <p>Complete history of all review decisions — immutable</p>
      </div>

      <div className="data-card">
        <div className="data-card-header">
          <h5>Review Decisions ({filtered.length})</h5>
          <input
            type="text"
            className="form-control form-control-sm"
            placeholder="Search..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '250px', borderRadius: 'var(--radius-sm)' }}
            id="audit-search"
          />
        </div>
        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📜</div>
            <h5>No audit entries yet</h5>
            <p>Audit entries are created when reviewers make decisions</p>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Document</th>
                <th>Reviewer</th>
                <th>Step</th>
                <th>Decision</th>
                <th>Version</th>
                <th>Reason</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(entry => (
                <tr key={entry.id}>
                  <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {formatDate(entry.createdAt)}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{entry.documentTitle}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>#{entry.documentId}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 500 }}>{entry.reviewer}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{entry.reviewerEmail}</div>
                  </td>
                  <td style={{ fontSize: '0.88rem' }}>{entry.stepName}</td>
                  <td><StatusBadge status={entry.decision} /></td>
                  <td className="text-muted">v{entry.versionNumber}</td>
                  <td style={{ maxWidth: '200px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {entry.reason ? (
                      <span className="text-truncate-2" title={entry.reason}>{entry.reason}</span>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
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
