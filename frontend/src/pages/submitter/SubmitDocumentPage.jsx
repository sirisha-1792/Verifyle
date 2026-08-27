import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../../api/axios';

export default function SubmitDocumentPage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [documentTypeId, setDocumentTypeId] = useState('');
  const [file, setFile] = useState(null);
  const [documentTypes, setDocumentTypes] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  const fetchDocumentTypes = async () => {
    try {
      const res = await API.get('/shared/document-types');
      setDocumentTypes(res.data.data || []);
    } catch (err) {
      // Submitter might not have access to admin endpoint
      // Try fetching from a public or shared endpoint if available
      console.error('Failed to fetch document types:', err);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError('Only PDF, JPG, JPEG, and PNG files are allowed');
      return;
    }

    // Validate file size (5MB)
    if (selectedFile.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError('');
    setFile(selectedFile);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      const fakeEvent = { target: { files: [droppedFile] } };
      handleFileChange(fakeEvent);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Please select a file to upload');
      return;
    }

    if (!documentTypeId) {
      setError('Please select a document type');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('description', description);
      formData.append('documentTypeId', documentTypeId);
      formData.append('file', file);

      await API.post('/submitter/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      navigate('/submitter');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Upload Document</h1>
        <p>Submit a new document for verification</p>
      </div>

      <div className="row">
        <div className="col-lg-8">
          <div className="data-card">
            <div className="data-card-header">
              <h5>Document Details</h5>
            </div>
            <div style={{ padding: '1.5rem' }}>
              {error && <div className="alert alert-danger alert-custom">{error}</div>}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label fw-semibold">Document Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g., Internship Completion Certificate"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    id="doc-title"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Document Type</label>
                  <select
                    className="form-select"
                    value={documentTypeId}
                    onChange={(e) => setDocumentTypeId(e.target.value)}
                    required
                    id="doc-type"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  >
                    <option value="">Select document type...</option>
                    {documentTypes.map((dt) => (
                      <option key={dt.id} value={dt.id}>{dt.name}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Description (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    placeholder="Add any additional notes..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    id="doc-description"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label fw-semibold">Upload File</label>
                  <div
                    className={`file-upload-area ${file ? 'has-file' : ''}`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="doc-file"
                    />
                    {file ? (
                      <div>
                        <div className="upload-icon">📎</div>
                        <div className="upload-text fw-semibold">{file.name}</div>
                        <div className="upload-hint">{formatFileSize(file.size)} · Click to change</div>
                      </div>
                    ) : (
                      <div>
                        <div className="upload-icon">📤</div>
                        <div className="upload-text">
                          <strong>Click to upload</strong> or drag and drop
                        </div>
                        <div className="upload-hint">PDF, JPG, JPEG, or PNG (max 5MB)</div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="d-flex gap-3">
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={loading}
                    id="doc-submit"
                  >
                    {loading ? (
                      <span><span className="spinner-border spinner-border-sm me-2"></span>Submitting...</span>
                    ) : 'Submit Document'}
                  </button>
                  <button
                    type="button"
                    className="btn btn-outline-custom"
                    onClick={() => navigate('/submitter')}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="col-lg-4">
          <div className="data-card">
            <div className="data-card-header">
              <h5>Guidelines</h5>
            </div>
            <div style={{ padding: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
              <ul style={{ paddingLeft: '1.25rem' }}>
                <li className="mb-2">Accepted formats: <strong>PDF, JPG, JPEG, PNG</strong></li>
                <li className="mb-2">Maximum file size: <strong>5 MB</strong></li>
                <li className="mb-2">Ensure the document is <strong>clear and legible</strong></li>
                <li className="mb-2">Your document will go through a <strong>multi-step review</strong> process</li>
                <li className="mb-2">You'll be notified if any <strong>corrections</strong> are needed</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
