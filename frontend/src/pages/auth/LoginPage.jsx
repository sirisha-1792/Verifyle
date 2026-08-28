import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { FaEye, FaEyeSlash, FaArrowLeft, FaCheckCircle, FaLock, FaEnvelope, FaKey } from 'react-icons/fa';
import API from '../../api/axios';

export default function LoginPage() {
  // Mode: 'login' | 'forgot_email' | 'forgot_otp' | 'forgot_success'
  const [mode, setMode] = useState('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [devOtpNotice, setDevOtpNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Cooldown countdown timer
  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => {
        setCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  // Handle standard Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
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
      const msg = err.response?.data?.message || 'Login failed. Please check your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Step 1: Send Password Reset OTP
  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setDevOtpNotice('');

    if (!forgotEmail.trim()) {
      setError('Please enter your registered email address.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await API.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setSuccess(res.data?.message || 'OTP verification code has been dispatched to your email.');
      if (res.data?.data?.devOtp) {
        setDevOtpNotice(`Dev OTP: ${res.data.data.devOtp}`);
      }
      setCooldown(60);
      setMode('forgot_otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code. Please check the email entered.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (cooldown > 0 || forgotLoading) return;
    setError('');
    setSuccess('');
    setDevOtpNotice('');
    setForgotLoading(true);

    try {
      const res = await API.post('/auth/forgot-password', { email: forgotEmail.trim() });
      setSuccess('A fresh OTP verification code has been sent to your email.');
      if (res.data?.data?.devOtp) {
        setDevOtpNotice(`Dev OTP: ${res.data.data.devOtp}`);
      }
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify OTP and Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      setError('Please enter the valid 6-digit OTP code sent to your email.');
      return;
    }

    if (newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match. Please verify.');
      return;
    }

    setForgotLoading(true);
    try {
      const res = await API.post('/auth/reset-password', {
        email: forgotEmail.trim(),
        otpCode: otpCode.trim(),
        newPassword,
      });
      setSuccess(res.data?.message || 'Password has been reset successfully!');
      setMode('forgot_success');
    } catch (err) {
      setError(err.response?.data?.message || 'Password reset failed. Invalid or expired OTP.');
    } finally {
      setForgotLoading(false);
    }
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
    setSuccess('');
    setDevOtpNotice('');
    setOtpCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ maxWidth: '440px' }}>
        <div className="auth-logo mb-4">
          <h1>Verifyle</h1>
          <p>Document Verification Platform</p>
        </div>

        {/* Global Notifications */}
        {error && (
          <div className="alert alert-danger alert-custom mb-3" role="alert">
            {error}
          </div>
        )}

        {success && mode !== 'forgot_success' && (
          <div className="alert alert-success alert-custom mb-3" role="alert">
            {success}
          </div>
        )}

        {devOtpNotice && (
          <div className="alert alert-info alert-custom mb-3" role="alert" style={{ fontSize: '0.85rem' }}>
            ⚡ <strong>Testing Notice:</strong> {devOtpNotice}
          </div>
        )}

        {/* VIEW 1: LOGIN FORM */}
        {mode === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="mb-3">
              <label className="form-label fw-semibold" htmlFor="login-email">
                Email Address
              </label>
              <div className="input-group">
                <input
                  type="email"
                  className="form-control"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  id="login-email"
                  style={{ borderRadius: 'var(--radius-md)' }}
                />
              </div>
            </div>

            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <label className="form-label fw-semibold mb-0" htmlFor="login-password">
                  Password
                </label>
                <button
                  type="button"
                  className="btn btn-link p-0 text-decoration-none"
                  style={{ fontSize: '0.82rem', color: 'var(--primary)' }}
                  onClick={() => {
                    setForgotEmail(email);
                    setError('');
                    setSuccess('');
                    setMode('forgot_email');
                  }}
                  id="link-forgot-password"
                >
                  Forgot password?
                </button>
              </div>

              <div className="position-relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  id="login-password"
                  style={{ borderRadius: 'var(--radius-md)', paddingRight: '42px' }}
                />
                <button
                  type="button"
                  className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ background: 'transparent', padding: '0.375rem 0.75rem', zIndex: 5 }}
                  title={showPassword ? 'Hide password' : 'View password'}
                  id="toggle-login-password-btn"
                >
                  {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 mb-3 mt-2"
              disabled={loading}
              id="login-submit"
              style={{ padding: '0.65rem' }}
            >
              {loading ? (
                <span>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Signing in...
                </span>
              ) : (
                'Sign In'
              )}
            </button>

            <p className="text-center text-muted mb-0" style={{ fontSize: '0.82rem' }}>
              🔒 Enterprise-Grade End-to-End Encryption
            </p>
          </form>
        )}

        {/* VIEW 2: FORGOT PASSWORD - REQUEST OTP */}
        {mode === 'forgot_email' && (
          <div>
            <div className="text-center mb-3">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--primary-50, #EEF2FF)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '0.75rem',
                }}
              >
                <FaKey />
              </div>
              <h5 className="fw-bold mb-1">Reset Your Password</h5>
              <p className="text-muted" style={{ fontSize: '0.86rem' }}>
                Enter your account email to receive a real-time 6-digit OTP code
              </p>
            </div>

            <form onSubmit={handleRequestOtp}>
              <div className="mb-4">
                <label className="form-label fw-semibold">Registered Email</label>
                <div className="input-group">
                  <input
                    type="email"
                    className="form-control"
                    placeholder="name@company.com"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    id="forgot-email-input"
                    style={{ borderRadius: 'var(--radius-md)' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                disabled={forgotLoading}
                id="send-otp-btn"
                style={{ padding: '0.65rem' }}
              >
                {forgotLoading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Sending OTP to Email...
                  </span>
                ) : (
                  'Send Verification Code'
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={switchToLogin}
                id="back-to-login-btn"
                style={{ fontSize: '0.9rem' }}
              >
                <FaArrowLeft className="me-2" /> Back to Sign In
              </button>
            </form>
          </div>
        )}

        {/* VIEW 3: FORGOT PASSWORD - VERIFY OTP & ENTER NEW PASSWORD */}
        {mode === 'forgot_otp' && (
          <div>
            <div className="text-center mb-3">
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: 'var(--primary-50, #EEF2FF)',
                  color: 'var(--primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.25rem',
                  marginBottom: '0.75rem',
                }}
              >
                <FaLock />
              </div>
              <h5 className="fw-bold mb-1">Enter Verification Code</h5>
              <p className="text-muted mb-0" style={{ fontSize: '0.84rem' }}>
                We sent a 6-digit OTP code to:
              </p>
              <p className="fw-semibold text-primary mb-2" style={{ fontSize: '0.9rem' }}>
                {forgotEmail}
              </p>
            </div>

            <form onSubmit={handleResetPassword}>
              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-1">
                  <label className="form-label fw-semibold mb-0">6-Digit OTP Code</label>
                  <button
                    type="button"
                    className="btn btn-link p-0 text-decoration-none"
                    disabled={cooldown > 0 || forgotLoading}
                    onClick={handleResendOtp}
                    style={{
                      fontSize: '0.8rem',
                      color: cooldown > 0 ? 'var(--text-muted)' : 'var(--primary)',
                      cursor: cooldown > 0 ? 'not-allowed' : 'pointer',
                    }}
                    id="resend-otp-btn"
                  >
                    {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Code'}
                  </button>
                </div>
                <input
                  type="text"
                  maxLength={6}
                  className="form-control text-center fw-bold"
                  placeholder="• • • • • •"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  required
                  id="reset-otp-input"
                  style={{
                    letterSpacing: '8px',
                    fontSize: '1.3rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                />
                <small className="text-muted" style={{ fontSize: '0.78rem' }}>
                  Valid for 5 minutes. Check spam folder if not received.
                </small>
              </div>

              {/* New Password */}
              <div className="mb-3">
                <label className="form-label fw-semibold">New Password</label>
                <div className="position-relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Min 6 characters"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    id="reset-new-password"
                    style={{ borderRadius: 'var(--radius-md)', paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ background: 'transparent', padding: '0.375rem 0.75rem', zIndex: 5 }}
                    title={showNewPassword ? 'Hide password' : 'View password'}
                  >
                    {showNewPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="mb-4">
                <label className="form-label fw-semibold">Confirm New Password</label>
                <div className="position-relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="form-control"
                    placeholder="Re-enter new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                    id="reset-confirm-password"
                    style={{ borderRadius: 'var(--radius-md)', paddingRight: '42px' }}
                  />
                  <button
                    type="button"
                    className="btn position-absolute top-50 end-0 translate-middle-y border-0 text-muted"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ background: 'transparent', padding: '0.375rem 0.75rem', zIndex: 5 }}
                    title={showConfirmPassword ? 'Hide password' : 'View password'}
                  >
                    {showConfirmPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary w-100 mb-3"
                disabled={forgotLoading}
                id="submit-reset-password-btn"
                style={{ padding: '0.65rem' }}
              >
                {forgotLoading ? (
                  <span>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Resetting Password...
                  </span>
                ) : (
                  'Confirm & Reset Password'
                )}
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary w-100"
                onClick={switchToLogin}
                style={{ fontSize: '0.9rem' }}
              >
                <FaArrowLeft className="me-2" /> Cancel & Back to Sign In
              </button>
            </form>
          </div>
        )}

        {/* VIEW 4: FORGOT PASSWORD - SUCCESS */}
        {mode === 'forgot_success' && (
          <div className="text-center py-3">
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--success)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '2rem',
                marginBottom: '1rem',
              }}
            >
              <FaCheckCircle />
            </div>
            <h4 className="fw-bold mb-2">Password Updated!</h4>
            <p className="text-muted mb-4" style={{ fontSize: '0.9rem' }}>
              Your account password has been updated securely. You can now sign in using your new credentials.
            </p>

            <button
              type="button"
              className="btn btn-primary w-100"
              onClick={switchToLogin}
              id="return-to-login-btn"
              style={{ padding: '0.65rem' }}
            >
              Proceed to Sign In
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
