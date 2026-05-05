import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Link } from 'react-router-dom';

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState({ users: [], payments: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/admin/overview'),
      api.get('/users'),
      api.get('/payments/all')
    ]).then(([aRes, uRes, pRes]) => {
      setStats(aRes.data.stats);
      setRecent({
        users:    (uRes.data.users    || []).slice(0, 5),
        payments: (pRes.data.payments || []).slice(0, 5)
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading-inline"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>⚙️ Admin Dashboard</h1>
        <p>Full system overview and management</p>
      </div>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label: 'Students',    value: stats?.total_students    || 0, icon: '🎓', color: 'blue',   link: '/admin/users'       },
          { label: 'Tutors',      value: stats?.total_tutors      || 0, icon: '👨‍🏫', color: 'purple', link: '/admin/users'       },
          { label: 'Courses',     value: stats?.total_courses     || 0, icon: '📚', color: 'cyan',   link: '/admin/courses'     },
          { label: 'Enrollments', value: stats?.total_enrollments || 0, icon: '📋', color: 'yellow', link: '/admin/enrollments' },
          { label: 'Revenue',     value: `₹${(stats?.total_revenue || 0).toLocaleString()}`, icon: '💰', color: 'green', link: '/admin/payments' },
        ].map(s => (
          <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
            <div className="stat-card" style={{ cursor: 'pointer', transition: 'transform 0.15s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <div className={`stat-icon ${s.color}`}>{s.icon}</div>
              <div className="stat-info">
                <div className="value">{s.value}</div>
                <div className="label">{s.label}</div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent Users */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Users</h3>
            <Link to="/admin/users" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {recent.users.length === 0 ? (
            <div className="empty-state"><div className="icon">👤</div><h3>No users yet</h3></div>
          ) : (
            <div>
              {recent.users.map(u => (
                <div key={u.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.8rem', color: '#4f46e5' }}>
                      {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{u.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                    </div>
                  </div>
                  <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'tutor' ? 'badge-purple' : 'badge-info'}`}>
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Recent Payments</h3>
            <Link to="/admin/payments" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {recent.payments.length === 0 ? (
            <div className="empty-state"><div className="icon">💳</div><h3>No payments yet</h3></div>
          ) : (
            <div>
              {recent.payments.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{p.students?.name || '—'}</div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{p.courses?.title || 'Manual payment'}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>₹{Number(p.amount).toLocaleString()}</div>
                    <span className={`badge ${p.status === 'completed' ? 'badge-success' : p.status === 'pending' ? 'badge-warning' : 'badge-danger'}`} style={{ fontSize: '0.7rem' }}>
                      {p.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title" style={{ marginBottom: 16 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/admin/users"       className="btn btn-primary">👥 Manage Users</Link>
          <Link to="/admin/courses"     className="btn btn-secondary">📚 Manage Courses</Link>
          <Link to="/admin/enrollments" className="btn btn-secondary">📋 Manage Enrollments</Link>
          <Link to="/admin/payments"    className="btn btn-secondary">💰 Manage Payments</Link>
        </div>
      </div>
    </Layout>
  );
}
