import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const getInitials = (name) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const getRoleLabel = (role) => {
    const map = {
      ROLE_ADMIN: 'Administrator',
      ROLE_VERIFIER: 'Reviewer',
      ROLE_SUBMITTER: 'Submitter',
    };
    return map[role] || role;
  };

  const navItems = {
    ROLE_SUBMITTER: [
      { to: '/submitter', icon: '📊', label: 'Dashboard' },
      { to: '/submitter/upload', icon: '📤', label: 'Upload Document' },
    ],
    ROLE_VERIFIER: [
      { to: '/reviewer', icon: '📋', label: 'Review Queue' },
    ],
    ROLE_ADMIN: [
      { to: '/admin', icon: '📊', label: 'Dashboard' },
      { to: '/admin/users', icon: '👥', label: 'User Management' },
      { to: '/admin/document-types', icon: '📁', label: 'Document Types' },
      { to: '/admin/workflows', icon: '🔄', label: 'Workflows' },
      { to: '/admin/submissions', icon: '📄', label: 'All Submissions' },
      { to: '/admin/audit-log', icon: '📜', label: 'Audit Log' },
    ],
  };

  const items = navItems[user.role] || [];

  const handleLogout = () => {
    logout();
    window.location.href = '/login';
  };

  return (
    <div className="sidebar">
      <div className="sidebar-brand">
        <h2>Verifyle</h2>
        <small>Document Verification Platform</small>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => (
          <div className="nav-item" key={item.to}>
            <NavLink
              to={item.to}
              end={item.to === '/submitter' || item.to === '/reviewer' || item.to === '/admin'}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              {item.label}
            </NavLink>
          </div>
        ))}
        
        {/* Settings & Theme link for everyone */}
        <div className="nav-item" style={{ marginTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: '0.5rem' }}>
          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <span className="nav-icon">⚙️</span>
            Settings & Theme
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <NavLink to="/profile" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.75rem', flex: 1, minWidth: 0 }}>
            <div className="user-avatar">{getInitials(user.fullName)}</div>
            <div style={{ minWidth: 0, overflow: 'hidden' }}>
              <div className="user-name text-truncate">{user.fullName}</div>
              <div className="user-role">{getRoleLabel(user.role)}</div>
            </div>
          </NavLink>
          <button className="logout-btn" onClick={handleLogout} title="Logout" id="sidebar-logout-btn">
            🚪
          </button>
        </div>
      </div>
    </div>
  );
}
