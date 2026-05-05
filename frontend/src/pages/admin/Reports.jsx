import React, { useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const REPORTS = [
  {
    id: 'students',
    title: 'All Students',
    desc: 'Name, email, phone, bio, join date for every student',
    icon: '🎓',
    endpoint: '/reports/students',
    filename: 'students.csv',
  },
  {
    id: 'payments',
    title: 'Payment Transactions',
    desc: 'All transactions with student, course, amount, status, date',
    icon: '💰',
    endpoint: '/reports/payments',
    filename: 'payments.csv',
  },
  {
    id: 'enrollments',
    title: 'Enrollments',
    desc: 'All student-course enrollments with status and dates',
    icon: '📋',
    endpoint: '/reports/enrollments',
    filename: 'enrollments.csv',
  },
  {
    id: 'performance',
    title: 'Student Performance Summary',
    desc: 'Attendance %, avg score, submission rate for every student',
    icon: '📊',
    endpoint: '/reports/student-performance',
    filename: 'student-performance.csv',
  },
];

export default function AdminReports() {
  const [loading, setLoading] = useState({});
  const [toast, setToast]     = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const downloadCSV = async (report) => {
    setLoading(prev => ({ ...prev, [report.id]: true }));
    try {
      const res = await api.get(report.endpoint, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = report.filename;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`${report.title} downloaded!`);
    } catch (err) {
      showToast('Download failed. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, [report.id]: false }));
    }
  };

  return (
    <Layout>
      {toast && (
        <div className="alert alert-success"
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 280 }}>
          ✅ {toast}
        </div>
      )}

      <div className="page-header">
        <h1>📥 Reports & Export</h1>
        <p>Download system data as CSV files for offline analysis</p>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 24 }}>
        ℹ️ All reports are exported as <strong>CSV files</strong> that can be opened in Excel, Google Sheets, or any spreadsheet app.
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {REPORTS.map(r => (
          <div key={r.id} className="report-card">
            <div className="report-card-info">
              <div className="report-card-icon">{r.icon}</div>
              <div>
                <h4>{r.title}</h4>
                <p>{r.desc}</p>
              </div>
            </div>
            <button
              className="export-btn"
              onClick={() => downloadCSV(r)}
              disabled={loading[r.id]}
            >
              {loading[r.id] ? '⏳ Generating...' : '⬇️ Download CSV'}
            </button>
          </div>
        ))}
      </div>

      {/* Attendance report — needs course selection */}
      <AttendanceReport showToast={showToast} />
    </Layout>
  );
}

function AttendanceReport({ showToast }) {
  const [courses, setCourses]   = useState([]);
  const [selected, setSelected] = useState('');
  const [loading, setLoading]   = useState(false);
  const [loaded, setLoaded]     = useState(false);

  const loadCourses = async () => {
    if (loaded) return;
    try {
      const res = await api.get('/courses');
      setCourses(res.data.courses || []);
      setLoaded(true);
    } catch { /* silent */ }
  };

  const download = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      const res = await api.get(`/reports/attendance/${selected}`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }));
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `attendance-${selected}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Attendance report downloaded!');
    } catch {
      showToast('Download failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="report-card" style={{ marginTop: 16, flexDirection: 'column', alignItems: 'stretch', gap: 16 }}>
      <div className="report-card-info">
        <div className="report-card-icon">✅</div>
        <div>
          <h4>Attendance by Course</h4>
          <p>All attendance records for a specific course</p>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <select
          className="form-control"
          style={{ flex: 1, minWidth: 200 }}
          value={selected}
          onChange={e => setSelected(e.target.value)}
          onFocus={loadCourses}
        >
          <option value="">— Select a course —</option>
          {courses.map(c => (
            <option key={c.id} value={c.id}>{c.title} ({c.subject})</option>
          ))}
        </select>
        <button
          className="export-btn"
          onClick={download}
          disabled={!selected || loading}
        >
          {loading ? '⏳ Generating...' : '⬇️ Download CSV'}
        </button>
      </div>
    </div>
  );
}
