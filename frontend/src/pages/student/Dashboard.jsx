import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Link } from 'react-router-dom';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/courses/my/enrolled'),
      api.get('/assignments/my'),
      api.get('/attendance/student/me'),
      api.get('/payments/my')
    ]).then(([enrollRes, assignRes, attRes, payRes]) => {
      setEnrollments(enrollRes.data.enrollments || []);
      setAssignments((assignRes.data.assignments || []).slice(0, 5));
      const att = attRes.data.summary || {};
      const payments = payRes.data.payments || [];
      setStats({
        courses: enrollRes.data.enrollments?.length || 0,
        attendance: att.percentage || 0,
        assignments: assignRes.data.assignments?.length || 0,
        pending: (assignRes.data.assignments || []).filter(a => !a.submission).length,
        paid: payments.filter(p => p.status === 'completed').length
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <Layout>
      <div className="loading-inline"><div className="spinner"></div> Loading...</div>
    </Layout>
  );

  return (
    <Layout>
      <div className="page-header">
        <h1>Welcome back, {user?.name?.split(' ')[0]}! 👋</h1>
        <p>Here's your learning overview for today.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📚</div>
          <div className="stat-info">
            <div className="value">{stats?.courses}</div>
            <div className="label">Enrolled Courses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <div className="value">{stats?.attendance}%</div>
            <div className="label">Attendance</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">📝</div>
          <div className="stat-info">
            <div className="value">{stats?.pending}</div>
            <div className="label">Pending Assignments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple">💳</div>
          <div className="stat-info">
            <div className="value">{stats?.paid}</div>
            <div className="label">Payments Done</div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Enrolled Courses */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">My Courses</h3>
            <Link to="/courses" className="btn btn-sm btn-secondary">Browse More</Link>
          </div>
          {enrollments.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📚</div>
              <h3>No courses yet</h3>
              <p>Browse and enroll in courses to get started.</p>
              <Link to="/courses" className="btn btn-primary mt-3">Browse Courses</Link>
            </div>
          ) : (
            <div>
              {enrollments.slice(0, 4).map(e => (
                <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{e.courses?.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{e.courses?.subject} • {e.courses?.schedule}</div>
                  </div>
                  <span className="badge badge-success">Active</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Assignments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">Upcoming Assignments</h3>
            <Link to="/student/assignments" className="btn btn-sm btn-secondary">View All</Link>
          </div>
          {assignments.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📝</div>
              <h3>No assignments</h3>
              <p>Assignments from your courses will appear here.</p>
            </div>
          ) : (
            <div>
              {assignments.map(a => (
                <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{a.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{a.courses?.title}</div>
                    </div>
                    <span className={`badge ${a.submission ? 'badge-success' : 'badge-warning'}`}>
                      {a.submission ? 'Submitted' : 'Pending'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 4 }}>
                    Due: {new Date(a.due_date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title" style={{ marginBottom: 16 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/courses" className="btn btn-primary">📚 Browse Courses</Link>
          <Link to="/student/assignments" className="btn btn-secondary">📝 My Assignments</Link>
          <Link to="/student/attendance" className="btn btn-secondary">✅ View Attendance</Link>
          <Link to="/student/payments" className="btn btn-secondary">💳 Payments</Link>
          <Link to="/student/analytics" className="btn btn-secondary">📊 Performance</Link>
        </div>
      </div>
    </Layout>
  );
}
