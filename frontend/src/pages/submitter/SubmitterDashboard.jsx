import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import API from '../../api/axios';
import StatusBadge from '../../components/StatusBadge';

export default function SubmitterDashboard() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await API.get('/submitter/documents');
      setDocuments(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch documents:', err);
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
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1>My Documents</h1>
            <p>Track the status of your submitted documents</p>
          </div>
          <Link to="/submitter/upload" className="btn btn-primary" id="upload-new-btn">
            + Upload Document
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="row mb-4">
        {[
          { label: 'Total Submitted', value: documents.length, type: 'primary', icon: '📄' },
          { label: 'In Review', value: documents.filter(d => d.status === 'IN_REVIEW').length, type: 'warning', icon: '🔍' },
          { label: 'Approved', value: documents.filter(d => d.status === 'APPROVED').length, type: 'success', icon: '✅' },
          { label: 'Needs Correction', value: documents.filter(d => d.status === 'CORRECTION_REQUESTED').length, type: 'danger', icon: '⚠️' },
        ].map((stat, i) => (
          <div className="col-md-3 mb-3" key={i}>
            <div className={`stat-card ${stat.type}`}>
              <div className="stat-icon">{stat.icon}</div>
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Documents Table */}
      <div className="data-card">
        <div className="data-card-header">
          <h5>Submitted Documents</h5>
        </div>
        {documents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h5>No documents yet</h5>
            <p>Upload your first document to get started</p>
            <Link to="/submitter/upload" className="btn btn-primary mt-2">Upload Document</Link>
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Type</th>
                <th>Status</th>
                <th>Current Step</th>
                <th>Submitted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc) => (
                <tr key={doc.id}>
                  <td style={{ fontWeight: 600 }}>{doc.title}</td>
                  <td>{doc.documentType}</td>
                  <td><StatusBadge status={doc.status} /></td>
                  <td>Step {doc.currentStep}</td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    {formatDate(doc.createdAt)}
                  </td>
                  <td>
                    <Link
                      to={`/submitter/documents/${doc.id}`}
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
    </div>
  );
}
