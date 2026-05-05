import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import { Link } from 'react-router-dom';

export default function TutorDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/analytics/tutor/me'),
      api.get('/courses/my/teaching')
    ]).then(([analyticsRes, coursesRes]) => {
      setStats(analyticsRes.data.stats);
      setCourses(coursesRes.data.courses || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading-inline"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>Welcome, {user?.name?.split(' ')[0]}! 👨‍🏫</h1>
        <p>Manage your courses, students, and assignments.</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">📚</div>
          <div className="stat-info">
            <div className="value">{stats?.total_courses || 0}</div>
            <div className="label">My Courses</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green">👥</div>
          <div className="stat-info">
            <div className="value">{stats?.total_students || 0}</div>
            <div className="label">Total Students</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">✅</div>
          <div className="stat-info">
            <div className="value">{stats?.avg_attendance || 0}%</div>
            <div className="label">Avg Attendance</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">My Courses</h3>
          <Link to="/tutor/courses" className="btn btn-primary btn-sm">+ New Course</Link>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📚</div>
            <h3>No courses yet</h3>
            <p>Create your first course to start teaching.</p>
            <Link to="/tutor/courses" className="btn btn-primary mt-3">Create Course</Link>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Subject</th>
                  <th>Schedule</th>
                  <th>Fee</th>
                  <th>Students</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td style={{ fontWeight: 600 }}>{c.title}</td>
                    <td>{c.subject}</td>
                    <td>{c.schedule || '—'}</td>
                    <td>₹{c.fee?.toLocaleString()}</td>
                    <td>{c.enrollments?.[0]?.count || 0}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <Link to="/tutor/attendance" className="btn btn-sm btn-secondary">Attendance</Link>
                        <Link to="/tutor/assignments" className="btn btn-sm btn-secondary">Assignments</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3 className="card-title" style={{ marginBottom: 16 }}>Quick Actions</h3>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Link to="/tutor/courses" className="btn btn-primary">📚 Manage Courses</Link>
          <Link to="/tutor/attendance" className="btn btn-secondary">✅ Mark Attendance</Link>
          <Link to="/tutor/assignments" className="btn btn-secondary">📝 Manage Assignments</Link>
        </div>
      </div>
    </Layout>
  );
}
