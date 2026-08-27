import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import API from '../../api/axios';

export default function OtpVerifyPage() {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef([]);
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || '';

  useEffect(() => {
    if (!email) {
      navigate('/register');
    }
  }, [email, navigate]);

  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const otpCode = otp.join('');
    if (otpCode.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      await API.post('/auth/verify-otp', { email, otpCode });
      setSuccess('Email verified successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setError('');

    try {
      await API.post('/auth/resend-otp', { email });
      setSuccess('New OTP sent! Check your email (or console in dev mode).');
      setCooldown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend OTP');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <h1>Verifyle</h1>
          <p>Verify your email</p>
        </div>

        <p className="text-center text-muted mb-1" style={{ fontSize: '0.9rem' }}>
          We sent a 6-digit code to
        </p>
        <p className="text-center mb-3" style={{ fontWeight: 600, fontSize: '0.95rem' }}>
          {email}
        </p>

        {error && <div className="alert alert-danger alert-custom">{error}</div>}
        {success && <div className="alert alert-success alert-custom">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="otp-container" onPaste={handlePaste}>
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="text"
                className="otp-input"
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                maxLength={1}
                autoFocus={index === 0}
                id={`otp-${index}`}
              />
            ))}
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100 mb-3"
            disabled={loading}
            id="otp-submit"
          >
            {loading ? (
              <span><span className="spinner-border spinner-border-sm me-2"></span>Verifying...</span>
            ) : 'Verify Email'}
          </button>
        </form>

        <p className="text-center mb-0" style={{ fontSize: '0.85rem' }}>
          <span className="text-muted">Didn't receive the code? </span>
          {cooldown > 0 ? (
            <span className="text-muted">Resend in {cooldown}s</span>
          ) : (
            <button
              onClick={handleResend}
              className="btn btn-link p-0 text-decoration-none"
              style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '0.85rem' }}
              id="otp-resend"
            >
              Resend OTP
            </button>
          )}
        </p>

        <p className="text-center mt-3 mb-0">
          <Link to="/login" className="text-decoration-none text-muted" style={{ fontSize: '0.85rem' }}>
            ← Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}
