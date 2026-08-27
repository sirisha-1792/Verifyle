import { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function DocumentTypes() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => { fetchTypes(); }, []);

  const fetchTypes = async () => {
    try {
      const res = await API.get('/admin/document-types');
      setTypes(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch document types:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    if (!form.name.trim()) { setError('Name is required'); return; }
    setCreating(true);
    try {
      await API.post('/admin/document-types', form);
      setShowModal(false);
      setForm({ name: '', description: '' });
      fetchTypes();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create');
    } finally {
      setCreating(false);
    }
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1>Document Types</h1>
            <p>Manage categories of documents</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Add Type</button>
        </div>
      </div>

      <div className="data-card">
        {types.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📁</div>
            <h5>No document types yet</h5>
            <p>Create your first document type to get started</p>
          </div>
        ) : (
          <table className="data-table">
            <thead><tr><th>Name</th><th>Description</th><th>Created</th></tr></thead>
            <tbody>
              {types.map(dt => (
                <tr key={dt.id}>
                  <td style={{ fontWeight: 600 }}>{dt.name}</td>
                  <td className="text-muted">{dt.description || '-'}</td>
                  <td className="text-muted" style={{ fontSize: '0.85rem' }}>
                    {new Date(dt.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Document Type</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger alert-custom mb-3">{error}</div>}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Name</label>
                  <input type="text" className="form-control" placeholder="e.g., Intern Certificate"
                    value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                    style={{ borderRadius: 'var(--radius-md)' }} />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Description</label>
                  <textarea className="form-control" rows={3} placeholder="Optional description..."
                    value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                    style={{ borderRadius: 'var(--radius-md)' }} />
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-custom" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
