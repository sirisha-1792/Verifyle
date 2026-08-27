import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await API.post('/auth/login', { email, password });
      const { token, ...userData } = res.data.data;
      login(userData, token);

      // Redirect based on role
      const routes = {
        ROLE_ADMIN: '/admin',
        ROLE_VERIFIER: '/reviewer',
        ROLE_SUBMITTER: '/submitter',
      };
      navigate(routes[userData.role] || '/');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Verifyle</h1>
          <p>Document Verification Platform</p>
        </div>

        {error && (
          <div className="alert alert-danger alert-custom" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Email Address</label>
            <input
              type="email"
              className="form-control"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="login-email"
            />
          </div>

          <div className="mb-4">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="login-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={loading}
            id="login-submit"
          >
            {loading ? (
              <span><span className="spinner-border spinner-border-sm me-2"></span>Signing in...</span>
            ) : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-muted mb-0" style={{ fontSize: '0.82rem' }}>
          Secure organization login · Powered by Verifyle
        </p>
      </div>
    </div>
  );
}
