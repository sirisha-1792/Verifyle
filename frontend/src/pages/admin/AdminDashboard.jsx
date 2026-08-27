import { useState, useEffect } from 'react';
import API from '../../api/axios';

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await API.get('/admin/stats');
      setStats(res.data.data || {});
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading-spinner"><div className="spinner"></div></div>;
  }

  const cards = [
    { label: 'Total Users', value: stats.totalUsers || 0, type: 'primary', icon: '👥' },
    { label: 'Total Submissions', value: stats.totalSubmissions || 0, type: 'info', icon: '📄' },
    { label: 'Pending Reviews', value: stats.pendingReviews || 0, type: 'warning', icon: '🔍' },
    { label: 'Approved', value: stats.approved || 0, type: 'success', icon: '✅' },
    { label: 'Rejected', value: stats.rejected || 0, type: 'danger', icon: '❌' },
    { label: 'Correction Requested', value: stats.correctionRequested || 0, type: 'warning', icon: '⚠️' },
  ];

  return (
    <div className="fade-in">
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Overview of the verification platform</p>
      </div>

      <div className="row">
        {cards.map((card, i) => (
          <div className="col-md-4 col-lg-2 mb-3" key={i}>
            <div className={`stat-card ${card.type}`}>
              <div className="stat-icon">{card.icon}</div>
              <div className="stat-value">{card.value}</div>
              <div className="stat-label">{card.label}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
