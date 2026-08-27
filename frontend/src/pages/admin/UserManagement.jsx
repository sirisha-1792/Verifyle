import { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'ROLE_SUBMITTER' });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    setError('');
    if (!form.fullName || !form.email || !form.password) {
      setError('All fields are required');
      return;
    }
    setCreating(true);
    try {
      await API.post('/admin/users', form);
      setShowModal(false);
      setForm({ fullName: '', email: '', password: '', role: 'ROLE_SUBMITTER' });
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await API.delete(`/admin/users/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete user');
    } finally {
      setDeleting(false);
    }
  };

  const getRoleLabel = (role) => {
    const map = { ROLE_ADMIN: 'Admin', ROLE_VERIFIER: 'Reviewer', ROLE_SUBMITTER: 'Submitter' };
    return map[role] || role;
  };

  const getRoleBadgeClass = (role) => {
    const map = { ROLE_ADMIN: 'approved', ROLE_VERIFIER: 'in_review', ROLE_SUBMITTER: 'submitted' };
    return map[role] || 'pending';
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1>User Management</h1>
            <p>Create, manage, and remove platform users</p>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)} id="create-user-btn">
            + Create User
          </button>
        </div>
      </div>

      <div className="data-card">
        <table className="data-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Email Verified</th>
              <th>Status</th>
              <th>Created</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td style={{ fontWeight: 600 }}>{user.fullName}</td>
                <td className="text-muted">{user.email}</td>
                <td><span className={`status-badge ${getRoleBadgeClass(user.role)}`}>{getRoleLabel(user.role)}</span></td>
                <td>{user.emailVerified ? <span style={{ color: 'var(--success)' }}>✓ Verified</span> : <span className="text-muted">Pending</span>}</td>
                <td>{user.enabled ? <span style={{ color: 'var(--success)' }}>Active</span> : <span className="text-danger">Disabled</span>}</td>
                <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{formatDate(user.createdAt)}</td>
                <td>
                  <button
                    className="btn btn-outline-danger btn-sm"
                    onClick={() => setDeleteTarget(user)}
                    id={`delete-user-${user.id}`}
                    style={{ padding: '0.2rem 0.6rem', fontSize: '0.8rem' }}
                  >
                    🗑️ Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create User Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create New User</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger alert-custom mb-3">{error}</div>}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Full Name</label>
                  <input type="text" className="form-control" value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    style={{ borderRadius: 'var(--radius-md)' }} id="user-name" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Email</label>
                  <input type="email" className="form-control" value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    style={{ borderRadius: 'var(--radius-md)' }} id="user-email" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Password</label>
                  <input type="password" className="form-control" value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    style={{ borderRadius: 'var(--radius-md)' }} id="user-password" />
                </div>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Role</label>
                  <select className="form-select" value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    style={{ borderRadius: 'var(--radius-md)' }} id="user-role">
                    <option value="ROLE_SUBMITTER">Submitter</option>
                    <option value="ROLE_VERIFIER">Reviewer / Verifier</option>
                    <option value="ROLE_ADMIN">Admin</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-custom" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating} id="user-create-confirm">
                  {creating ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Delete User</h5>
                <button type="button" className="btn-close" onClick={() => setDeleteTarget(null)}></button>
              </div>
              <div className="modal-body">
                <p>Are you sure you want to delete user <strong>{deleteTarget.fullName}</strong> (<code>{deleteTarget.email}</code>)?</p>
                <p className="text-danger small mb-0">This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-custom" onClick={() => setDeleteTarget(null)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleDelete} disabled={deleting} id="user-delete-confirm">
                  {deleting ? 'Deleting...' : 'Delete User'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
