import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import OtpVerifyPage from './pages/auth/OtpVerifyPage';

// Submitter pages
import SubmitterDashboard from './pages/submitter/SubmitterDashboard';
import SubmitDocumentPage from './pages/submitter/SubmitDocumentPage';
import DocumentDetailPage from './pages/submitter/DocumentDetailPage';

// Reviewer pages
import ReviewerDashboard from './pages/reviewer/ReviewerDashboard';
import ReviewDocumentPage from './pages/reviewer/ReviewDocumentPage';

// Admin pages
import AdminDashboard from './pages/admin/AdminDashboard';
import UserManagement from './pages/admin/UserManagement';
import DocumentTypes from './pages/admin/DocumentTypes';
import WorkflowBuilder from './pages/admin/WorkflowBuilder';
import SubmissionsMonitor from './pages/admin/SubmissionsMonitor';
import AuditLogViewer from './pages/admin/AuditLogViewer';

function AppLayout({ children }) {
  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content fade-in">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { user, loading, isAuthenticated } = useAuth();

  if (loading) {
    return (
      <div className="loading-spinner" style={{ minHeight: '100vh' }}>
        <div className="spinner"></div>
      </div>
    );
  }

  const getDefaultRoute = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'ROLE_ADMIN': return '/admin';
      case 'ROLE_VERIFIER': return '/reviewer';
      case 'ROLE_SUBMITTER': return '/submitter';
      default: return '/login';
    }
  };

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={
        isAuthenticated() ? <Navigate to={getDefaultRoute()} replace /> : <LoginPage />
      } />
      <Route path="/register" element={
        isAuthenticated() ? <Navigate to={getDefaultRoute()} replace /> : <RegisterPage />
      } />
      <Route path="/verify-otp" element={<OtpVerifyPage />} />

      {/* Submitter Routes */}
      <Route path="/submitter" element={
        <ProtectedRoute allowedRoles={['ROLE_SUBMITTER']}>
          <AppLayout><SubmitterDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/submitter/upload" element={
        <ProtectedRoute allowedRoles={['ROLE_SUBMITTER']}>
          <AppLayout><SubmitDocumentPage /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/submitter/documents/:id" element={
        <ProtectedRoute allowedRoles={['ROLE_SUBMITTER']}>
          <AppLayout><DocumentDetailPage /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Reviewer Routes */}
      <Route path="/reviewer" element={
        <ProtectedRoute allowedRoles={['ROLE_VERIFIER']}>
          <AppLayout><ReviewerDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/reviewer/documents/:id" element={
        <ProtectedRoute allowedRoles={['ROLE_VERIFIER']}>
          <AppLayout><ReviewDocumentPage /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
          <AppLayout><AdminDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/users" element={
        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
          <AppLayout><UserManagement /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/document-types" element={
        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
          <AppLayout><DocumentTypes /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/workflows" element={
        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
          <AppLayout><WorkflowBuilder /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/submissions" element={
        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
          <AppLayout><SubmissionsMonitor /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin/audit-log" element={
        <ProtectedRoute allowedRoles={['ROLE_ADMIN']}>
          <AppLayout><AuditLogViewer /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="/" element={<Navigate to={getDefaultRoute()} replace />} />
      <Route path="*" element={<Navigate to={getDefaultRoute()} replace />} />
    </Routes>
  );
}
