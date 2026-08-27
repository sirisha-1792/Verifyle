import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import API from '../../api/axios';

export default function ProfilePage() {
  const { user, login, logout } = useAuth();
  const navigate = useNavigate();

  // State
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('theme');

  // Edit Name State
  const [fullName, setFullName] = useState('');
  const [updatingName, setUpdatingName] = useState(false);
  const [nameSuccess, setNameSuccess] = useState('');
  const [nameError, setNameError] = useState('');

  // Password State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Theme State
  const [currentTheme, setCurrentTheme] = useState(() => {
    return localStorage.getItem('verifyle_theme') || 'light';
  });
  const [compactTable, setCompactTable] = useState(() => {
    return localStorage.getItem('verifyle_compact') === 'true';
  });

  // Logout Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => {
    fetchProfile();
    // Apply current theme
    applyTheme(currentTheme);
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await API.get('/user/profile');
      setProfile(res.data.data);
      setFullName(res.data.data.fullName || '');
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const applyTheme = (themeName) => {
    setCurrentTheme(themeName);
    localStorage.setItem('verifyle_theme', themeName);
    document.documentElement.setAttribute('data-theme', themeName);
  };

  const handleUpdateName = async (e) => {
    e.preventDefault();
    setNameError('');
    setNameSuccess('');

    if (!fullName.trim()) {
      setNameError('Full name cannot be empty');
      return;
    }

    setUpdatingName(true);
    try {
      const res = await API.put('/user/profile', { fullName: fullName.trim() });
      setNameSuccess('Profile name updated successfully!');
      // Update AuthContext user info
      if (user) {
        const updatedUser = { ...user, fullName: res.data.data.fullName };
        localStorage.setItem('verifyle_user', JSON.stringify(updatedUser));
      }
      fetchProfile();
    } catch (err) {
      setNameError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setUpdatingName(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match');
      return;
    }

    setUpdatingPassword(true);
    try {
      await API.post('/user/change-password', {
        currentPassword,
        newPassword,
      });
      setPasswordSuccess('Password changed successfully! Keep your credentials safe.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setUpdatingPassword(false);
    }
  };

  const handleLogoutConfirm = () => {
    logout();
    navigate('/login');
  };

  const themes = [
    {
      id: 'light',
      name: 'Clean Executive',
      icon: '☀️',
      desc: 'Crisp, high-contrast white & slate light theme',
      previewBg: '#F8FAFC',
      previewCard: '#FFFFFF',
      previewAccent: '#4F46E5',
      textColor: '#0F172A',
    },
    {
      id: 'dark',
      name: 'Dark Obsidian',
      icon: '🌙',
      desc: 'Sleek dark mode with indigo highlights',
      previewBg: '#0B0F19',
      previewCard: '#151E32',
      previewAccent: '#6366F1',
      textColor: '#F8FAFC',
    },
    {
      id: 'midnight',
      name: 'Midnight Ocean',
      icon: '🌌',
      desc: 'Deep navy blue with electric cyan accents',
      previewBg: '#050B17',
      previewCard: '#0F203F',
      previewAccent: '#0EA5E9',
      textColor: '#F0F9FF',
    },
    {
      id: 'emerald',
      name: 'Emerald Forest',
      icon: '🌲',
      desc: 'Deep rich dark green with mint highlights',
      previewBg: '#04140F',
      previewCard: '#0E3529',
      previewAccent: '#10B981',
      textColor: '#ECFDF5',
    },
    {
      id: 'purple',
      name: 'Royal Amethyst',
      icon: '💜',
      desc: 'Luxurious violet & velvet dark theme',
      previewBg: '#0F081D',
      previewCard: '#231644',
      previewAccent: '#8B5CF6',
      textColor: '#FAF5FF',
    },
  ];

  const getRoleBadge = (role) => {
    switch (role) {
      case 'ROLE_ADMIN':
        return <span className="status-badge approved">👑 Administrator</span>;
      case 'ROLE_VERIFIER':
        return <span className="status-badge in_review">🔍 Verifier / Reviewer</span>;
      case 'ROLE_SUBMITTER':
        return <span className="status-badge submitted">📄 Submitter</span>;
      default:
        return <span className="status-badge">{role}</span>;
    }
  };

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  return (
    <div className="fade-in">
      {/* Header Banner */}
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h1>Profile & Account Settings</h1>
            <p>Customize your dashboard appearance, edit personal information, and manage security</p>
          </div>
          <button
            className="btn btn-outline-danger"
            onClick={() => setShowLogoutModal(true)}
            id="profile-logout-btn"
          >
            🚪 Sign Out
          </button>
        </div>
      </div>

      {/* User Quick Info Card */}
      <div className="data-card mb-4" style={{ padding: '1.5rem', background: 'var(--bg-card)' }}>
        <div className="d-flex align-items-center gap-4 flex-wrap">
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%)',
              color: '#FFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.75rem',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
            }}
          >
            {getInitials(profile?.fullName)}
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <div className="d-flex align-items-center gap-2 mb-1">
              <h3 className="mb-0" style={{ fontWeight: 700 }}>{profile?.fullName}</h3>
              {getRoleBadge(profile?.role)}
            </div>
            <p className="mb-1 text-muted" style={{ fontSize: '0.9rem' }}>
              📧 {profile?.email}
            </p>
            <div className="d-flex gap-3 text-secondary" style={{ fontSize: '0.82rem' }}>
              <span>ID: #{profile?.id}</span>
              <span>·</span>
              <span>Status: <strong style={{ color: 'var(--success)' }}>Active & Verified</strong></span>
              {profile?.totalSubmissions !== undefined && (
                <>
                  <span>·</span>
                  <span>Total Uploads: <strong>{profile.totalSubmissions}</strong></span>
                </>
              )}
              {profile?.totalReviews !== undefined && (
                <>
                  <span>·</span>
                  <span>Completed Reviews: <strong>{profile.totalReviews}</strong></span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Settings Navigation Tabs */}
      <ul className="nav nav-pills mb-4" style={{ gap: '0.5rem' }}>
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'theme' ? 'btn-primary' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('theme')}
            id="tab-theme"
          >
            🎨 Theme & Appearance
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'personal' ? 'btn-primary' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('personal')}
            id="tab-personal"
          >
            👤 Personal Details
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`btn ${activeTab === 'security' ? 'btn-primary' : 'btn-outline-custom'}`}
            onClick={() => setActiveTab('security')}
            id="tab-security"
          >
            🔒 Password & Security
          </button>
        </li>
      </ul>

      {/* TAB 1: THEME & APPEARANCE */}
      {activeTab === 'theme' && (
        <div className="row">
          <div className="col-12 mb-4">
            <div className="data-card">
              <div className="data-card-header">
                <h5>Choose Dashboard Theme</h5>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <p className="text-secondary mb-4" style={{ fontSize: '0.9rem' }}>
                  Pick your favorite color palette. Your theme preference applies instantly to the entire dashboard and is saved automatically.
                </p>

                <div className="row g-3">
                  {themes.map((t) => {
                    const isSelected = currentTheme === t.id;
                    return (
                      <div className="col-md-6 col-lg-4" key={t.id}>
                        <div
                          onClick={() => applyTheme(t.id)}
                          style={{
                            cursor: 'pointer',
                            borderRadius: 'var(--radius-lg)',
                            border: isSelected ? `2px solid ${t.previewAccent}` : '1px solid var(--border-color)',
                            background: t.previewBg,
                            padding: '1.25rem',
                            position: 'relative',
                            transition: 'all 0.2s ease',
                            boxShadow: isSelected ? `0 0 0 4px ${t.previewAccent}25, 0 4px 12px rgba(0,0,0,0.15)` : 'none',
                          }}
                          className="theme-card"
                          id={`theme-select-${t.id}`}
                        >
                          {isSelected && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '12px',
                                right: '12px',
                                background: t.previewAccent,
                                color: '#FFF',
                                borderRadius: '50%',
                                width: 22,
                                height: 22,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                              }}
                            >
                              ✓
                            </span>
                          )}

                          <div className="d-flex align-items-center gap-2 mb-2">
                            <span style={{ fontSize: '1.4rem' }}>{t.icon}</span>
                            <h6 className="mb-0" style={{ color: t.textColor, fontWeight: 700 }}>
                              {t.name}
                            </h6>
                          </div>

                          <p style={{ color: t.textColor, opacity: 0.75, fontSize: '0.8rem', minHeight: '36px' }}>
                            {t.desc}
                          </p>

                          {/* Mini Interface Mockup */}
                          <div
                            style={{
                              background: t.previewCard,
                              borderRadius: 'var(--radius-md)',
                              padding: '0.75rem',
                              border: `1px solid ${t.previewAccent}30`,
                            }}
                          >
                            <div className="d-flex align-items-center justify-content-between mb-2">
                              <div style={{ width: '40%', height: 6, background: t.previewAccent, borderRadius: 3 }}></div>
                              <div style={{ width: '20%', height: 6, background: `${t.textColor}30`, borderRadius: 3 }}></div>
                            </div>
                            <div style={{ width: '100%', height: 4, background: `${t.textColor}15`, borderRadius: 2, marginBottom: 4 }}></div>
                            <div style={{ width: '70%', height: 4, background: `${t.textColor}15`, borderRadius: 2 }}></div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PERSONAL DETAILS */}
      {activeTab === 'personal' && (
        <div className="row">
          <div className="col-lg-7">
            <div className="data-card mb-4">
              <div className="data-card-header">
                <h5>Edit Profile Information</h5>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {nameSuccess && <div className="alert alert-success alert-custom mb-3">{nameSuccess}</div>}
                {nameError && <div className="alert alert-danger alert-custom mb-3">{nameError}</div>}

                <form onSubmit={handleUpdateName}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Full Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      id="profile-fullname-input"
                      style={{ borderRadius: 'var(--radius-md)' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">Email Address</label>
                    <input
                      type="email"
                      className="form-control"
                      value={profile?.email || ''}
                      disabled
                      style={{ borderRadius: 'var(--radius-md)', opacity: 0.7 }}
                    />
                    <small className="text-muted">Email is managed by organization admin and cannot be changed directly.</small>
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Assigned Role</label>
                    <input
                      type="text"
                      className="form-control"
                      value={profile?.role || ''}
                      disabled
                      style={{ borderRadius: 'var(--radius-md)', opacity: 0.7 }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updatingName}
                    id="save-profile-btn"
                  >
                    {updatingName ? 'Saving Changes...' : 'Save Profile Changes'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="data-card">
              <div className="data-card-header">
                <h5>Account Information</h5>
              </div>
              <div style={{ padding: '1.25rem', fontSize: '0.88rem' }}>
                <div className="mb-3 pb-2 border-bottom">
                  <strong>User ID:</strong> <span className="text-secondary ms-1">#{profile?.id}</span>
                </div>
                <div className="mb-3 pb-2 border-bottom">
                  <strong>Email Verification:</strong> <span className="ms-1" style={{ color: 'var(--success)' }}>✓ Verified</span>
                </div>
                <div className="mb-3 pb-2 border-bottom">
                  <strong>Member Since:</strong> <span className="text-secondary ms-1">{profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'}</span>
                </div>
                <div>
                  <strong>Session Status:</strong> <span className="ms-1" style={{ color: 'var(--success)' }}>Active (JWT Stateless)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: PASSWORD & SECURITY */}
      {activeTab === 'security' && (
        <div className="row">
          <div className="col-lg-7">
            <div className="data-card mb-4">
              <div className="data-card-header">
                <h5>Change Account Password</h5>
              </div>
              <div style={{ padding: '1.5rem' }}>
                {passwordSuccess && <div className="alert alert-success alert-custom mb-3">{passwordSuccess}</div>}
                {passwordError && <div className="alert alert-danger alert-custom mb-3">{passwordError}</div>}

                <form onSubmit={handleChangePassword}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Current Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Enter current password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      id="current-password-input"
                      style={{ borderRadius: 'var(--radius-md)' }}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-semibold">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Min 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      id="new-password-input"
                      style={{ borderRadius: 'var(--radius-md)' }}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label fw-semibold">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Re-enter new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      id="confirm-password-input"
                      style={{ borderRadius: 'var(--radius-md)' }}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={updatingPassword}
                    id="change-password-btn"
                  >
                    {updatingPassword ? 'Updating Password...' : 'Update Password'}
                  </button>
                </form>
              </div>
            </div>
          </div>

          <div className="col-lg-5">
            <div className="data-card">
              <div className="data-card-header">
                <h5>Security Best Practices</h5>
              </div>
              <div style={{ padding: '1.25rem', fontSize: '0.88rem', color: 'var(--text-secondary)' }}>
                <ul style={{ paddingLeft: '1.25rem' }}>
                  <li className="mb-2">Use at least 8 characters with numbers and letters.</li>
                  <li className="mb-2">Do not reuse passwords across multiple systems.</li>
                  <li className="mb-2">All passwords are salted and hashed with <strong>BCrypt</strong>.</li>
                  <li className="mb-2">Remember to sign out when using shared workstations.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal show d-block" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Sign Out</h5>
                <button type="button" className="btn-close" onClick={() => setShowLogoutModal(false)}></button>
              </div>
              <div className="modal-body">
                <p className="mb-0">Are you sure you want to log out of your <strong>Verifyle</strong> account?</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-outline-custom" onClick={() => setShowLogoutModal(false)}>Cancel</button>
                <button className="btn btn-danger" onClick={handleLogoutConfirm} id="confirm-logout-btn">
                  Yes, Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
