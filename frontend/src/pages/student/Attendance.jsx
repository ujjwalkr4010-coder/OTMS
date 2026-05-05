import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function Attendance() {
  const [data, setData] = useState({ attendance: [], summary: {} });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/attendance/student/me')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all'
    ? data.attendance
    : data.attendance.filter(a => a.status === filter);

  const { total = 0, present = 0, absent = 0, percentage = 0 } = data.summary;

  if (loading) return <Layout><div className="loading-inline"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>✅ My Attendance</h1>
        <p>Track your class attendance across all courses</p>
      </div>

      {/* Summary */}
      <div className="attendance-summary">
        <div className="att-stat present">
          <div className="value">{present}</div>
          <div className="label">Present</div>
        </div>
        <div className="att-stat absent">
          <div className="value">{absent}</div>
          <div className="label">Absent</div>
        </div>
        <div className="att-stat percent">
          <div className="value">{percentage}%</div>
          <div className="label">Attendance</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontWeight: 600 }}>Overall Attendance</span>
          <span style={{ fontWeight: 700, color: percentage >= 75 ? '#10b981' : '#ef4444' }}>{percentage}%</span>
        </div>
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{
              width: `${percentage}%`,
              background: percentage >= 75 ? '#10b981' : percentage >= 60 ? '#f59e0b' : '#ef4444'
            }}
          />
        </div>
        {percentage < 75 && (
          <div className="alert alert-warning" style={{ marginTop: 12, marginBottom: 0 }}>
            ⚠️ Your attendance is below 75%. Minimum 75% is required.
          </div>
        )}
      </div>

      {/* Filter */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Attendance Records</h3>
          <div style={{ display: 'flex', gap: 8 }}>
            {['all', 'present', 'absent', 'late'].map(f => (
              <button
                key={f}
                className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}
              >
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No records found</h3>
            <p>No attendance records for the selected filter.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Course</th>
                  <th>Subject</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={i}>
                    <td>{new Date(a.date).toLocaleDateString('en-IN', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}</td>
                    <td>{a.courses?.title || '—'}</td>
                    <td>{a.courses?.subject || '—'}</td>
                    <td>
                      <span className={`badge ${
                        a.status === 'present' ? 'badge-success' :
                        a.status === 'late' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {a.status === 'present' ? '✓ Present' :
                         a.status === 'late' ? '⏰ Late' : '✗ Absent'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
