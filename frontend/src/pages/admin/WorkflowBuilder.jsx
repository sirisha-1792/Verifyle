import { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function WorkflowBuilder() {
  const [templates, setTemplates] = useState([]);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', documentTypeId: '', steps: [] });
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([fetchTemplates(), fetchDocTypes(), fetchUsers()])
      .finally(() => setLoading(false));
  }, []);

  const fetchTemplates = async () => {
    try {
      const res = await API.get('/admin/workflow-templates');
      setTemplates(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchDocTypes = async () => {
    try {
      const res = await API.get('/admin/document-types');
      setDocumentTypes(res.data.data || []);
    } catch (err) { console.error(err); }
  };

  const fetchUsers = async () => {
    try {
      const res = await API.get('/admin/users');
      setUsers((res.data.data || []).filter(u => u.role === 'ROLE_VERIFIER'));
    } catch (err) { console.error(err); }
  };

  const addStep = () => {
    setForm({
      ...form,
      steps: [...form.steps, { stepName: '', reviewerRole: 'ROLE_VERIFIER', assignedUserId: '' }]
    });
  };

  const removeStep = (index) => {
    setForm({ ...form, steps: form.steps.filter((_, i) => i !== index) });
  };

  const updateStep = (index, field, value) => {
    const steps = [...form.steps];
    steps[index] = { ...steps[index], [field]: value };
    setForm({ ...form, steps });
  };

  const handleCreate = async () => {
    setError('');
    if (!form.name || !form.documentTypeId) { setError('Name and document type are required'); return; }
    if (form.steps.length === 0) { setError('At least one step is required'); return; }
    for (const step of form.steps) {
      if (!step.stepName) { setError('All steps must have a name'); return; }
    }

    setCreating(true);
    try {
      const payload = {
        name: form.name,
        documentTypeId: parseInt(form.documentTypeId),
        steps: form.steps.map(s => ({
          stepName: s.stepName,
          reviewerRole: s.reviewerRole,
          assignedUserId: s.assignedUserId ? parseInt(s.assignedUserId) : null,
        })),
      };
      await API.post('/admin/workflow-templates', payload);
      setShowModal(false);
      setForm({ name: '', documentTypeId: '', steps: [] });
      fetchTemplates();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create workflow');
    } finally {
      setCreating(false);
    }
  };

  const getRoleLabel = (role) => {
    const map = { ROLE_ADMIN: 'Admin', ROLE_VERIFIER: 'Reviewer', ROLE_SUBMITTER: 'Submitter' };
    return map[role] || role;
  };

  if (loading) return <div className="loading-spinner"><div className="spinner"></div></div>;

  return (
    <div className="fade-in">
      <div className="page-header">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1>Workflow Templates</h1>
            <p>Define approval workflows per document type</p>
          </div>
          <button className="btn btn-primary" onClick={() => { setForm({ name: '', documentTypeId: '', steps: [] }); setShowModal(true); }}>
            + Create Workflow
          </button>
        </div>
      </div>

      {templates.length === 0 ? (
        <div className="data-card">
          <div className="empty-state">
            <div className="empty-icon">🔄</div>
            <h5>No workflow templates yet</h5>
            <p>Create a workflow template to define approval steps</p>
          </div>
        </div>
      ) : (
        <div className="row">
          {templates.map(t => (
            <div className="col-md-6 mb-4" key={t.id}>
              <div className="data-card">
                <div className="data-card-header">
                  <div>
                    <h5 className="mb-0">{t.name}</h5>
                    <small className="text-muted">{t.documentType}</small>
                  </div>
                  <span className="status-badge in_review">{t.steps?.length || 0} steps</span>
                </div>
                <div style={{ padding: '1.25rem' }}>
                  <div className="workflow-steps">
                    {(t.steps || []).map((step, idx) => (
                      <div className="workflow-step" key={idx}>
                        <div className="step-circle">{step.stepOrder}</div>
                        <div className="step-info">
                          <div className="step-name">{step.stepName}</div>
                          <div className="step-status">
                            {getRoleLabel(step.reviewerRole)}
                            {step.assignedUser && ` · ${step.assignedUser}`}
                          </div>
                        </div>
                        {idx < (t.steps || []).length - 1 && <div className="step-connector"></div>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Workflow Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Create Workflow Template</h5>
                <button type="button" className="btn-close" onClick={() => setShowModal(false)}></button>
              </div>
              <div className="modal-body">
                {error && <div className="alert alert-danger alert-custom mb-3">{error}</div>}

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Workflow Name</label>
                    <input type="text" className="form-control" placeholder="e.g., Intern Certificate Workflow"
                      value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                      style={{ borderRadius: 'var(--radius-md)' }} />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Document Type</label>
                    <select className="form-select" value={form.documentTypeId}
                      onChange={e => setForm({...form, documentTypeId: e.target.value})}
                      style={{ borderRadius: 'var(--radius-md)' }}>
                      <option value="">Select type...</option>
                      {documentTypes.map(dt => <option key={dt.id} value={dt.id}>{dt.name}</option>)}
                    </select>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fw-semibold mb-0">Approval Steps</label>
                    <button className="btn btn-outline-custom btn-sm" onClick={addStep}>+ Add Step</button>
                  </div>

                  {form.steps.length === 0 && (
                    <p className="text-muted text-center py-3" style={{ fontSize: '0.88rem' }}>
                      No steps yet. Click "Add Step" to define the approval chain.
                    </p>
                  )}

                  {form.steps.map((step, idx) => (
                    <div className="step-builder-item" key={idx}>
                      <div className="step-number">{idx + 1}</div>
                      <div className="flex-grow-1">
                        <div className="row g-2">
                          <div className="col-md-4">
                            <input type="text" className="form-control form-control-sm" placeholder="Step name"
                              value={step.stepName} onChange={e => updateStep(idx, 'stepName', e.target.value)}
                              style={{ borderRadius: 'var(--radius-sm)' }} />
                          </div>
                          <div className="col-md-3">
                            <select className="form-select form-select-sm" value={step.reviewerRole}
                              onChange={e => updateStep(idx, 'reviewerRole', e.target.value)}
                              style={{ borderRadius: 'var(--radius-sm)' }}>
                              <option value="ROLE_VERIFIER">Reviewer</option>
                              <option value="ROLE_ADMIN">Admin</option>
                            </select>
                          </div>
                          <div className="col-md-4">
                            <select className="form-select form-select-sm" value={step.assignedUserId}
                              onChange={e => updateStep(idx, 'assignedUserId', e.target.value)}
                              style={{ borderRadius: 'var(--radius-sm)' }}>
                              <option value="">Any {getRoleLabel(step.reviewerRole)}</option>
                              {users.map(u => <option key={u.id} value={u.id}>{u.fullName}</option>)}
                            </select>
                          </div>
                          <div className="col-md-1">
                            <button className="btn btn-sm" onClick={() => removeStep(idx)}
                              style={{ color: 'var(--danger)' }}>✕</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-custom" onClick={() => setShowModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={handleCreate} disabled={creating}>
                  {creating ? 'Creating...' : 'Create Workflow'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
