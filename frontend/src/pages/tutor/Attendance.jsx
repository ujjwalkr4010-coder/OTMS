import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function TutorAttendance() {
  const [courses, setCourses]         = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [students, setStudents]       = useState([]);
  const [date, setDate]               = useState(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance]   = useState({});
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [saving, setSaving]           = useState(false);
  const [toast, setToast]             = useState({ msg: '', type: '' });
  const [history, setHistory]         = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  useEffect(() => {
    api.get('/courses/my/teaching')
      .then(r => setCourses(r.data.courses || []))
      .catch(console.error);
  }, []);

  const loadEnrolledStudents = async (courseId) => {
    if (!courseId) return;
    setLoadingStudents(true);
    setStudents([]);
    setAttendance({});
    try {
      // Load only enrolled students for this specific course
      const res = await api.get(`/attendance/course/${courseId}/enrolled`);
      const list = res.data.students || [];
      setStudents(list);
      const init = {};
      list.forEach(s => { init[s.id] = 'present'; });
      setAttendance(init);
    } catch (err) {
      showToast('Failed to load students', 'error');
    } finally {
      setLoadingStudents(false);
    }
  };

  const loadHistory = async (courseId) => {
    if (!courseId) return;
    try {
      const res = await api.get(`/attendance/course/${courseId}`);
      setHistory(res.data.attendance || []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCourseChange = (e) => {
    const id = e.target.value;
    setSelectedCourse(id);
    setShowHistory(false);
    loadEnrolledStudents(id);
  };

  const handleSave = async () => {
    if (!selectedCourse || students.length === 0) return;
    setSaving(true);
    try {
      const records = students.map(s => ({ student_id: s.id, status: attendance[s.id] || 'absent' }));
      await api.post('/attendance', { course_id: selectedCourse, date, records });
      showToast(`Attendance saved for ${date}`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const presentCount = Object.values(attendance).filter(v => v === 'present').length;
  const absentCount  = Object.values(attendance).filter(v => v === 'absent').length;
  const lateCount    = Object.values(attendance).filter(v => v === 'late').length;

  return (
    <Layout>
      {toast.msg && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 280 }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1>✅ Mark Attendance</h1>
        <p>Only enrolled students are shown for each course</p>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Select Course</label>
            <select className="form-control" value={selectedCourse} onChange={handleCourseChange}>
              <option value="">— Select a course —</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Date</label>
            <input type="date" className="form-control" value={date}
              onChange={e => setDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]} />
          </div>
          {selectedCourse && (
            <button className="btn btn-secondary" onClick={() => { setShowHistory(!showHistory); loadHistory(selectedCourse); }}>
              {showHistory ? 'Mark Attendance' : '📋 View History'}
            </button>
          )}
        </div>
      </div>

      {/* History View */}
      {showHistory && (
        <div className="card">
          <h3 className="card-title" style={{ marginBottom: 16 }}>Attendance History</h3>
          {history.length === 0 ? (
            <div className="empty-state"><div className="icon">📋</div><h3>No records yet</h3></div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead><tr><th>Date</th><th>Student</th><th>Status</th></tr></thead>
                <tbody>
                  {history.map((h, i) => (
                    <tr key={i}>
                      <td>{new Date(h.date).toLocaleDateString()}</td>
                      <td style={{ fontWeight: 600 }}>{h.students?.name}</td>
                      <td>
                        <span className={`badge ${h.status === 'present' ? 'badge-success' : h.status === 'late' ? 'badge-warning' : 'badge-danger'}`}>
                          {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mark Attendance View */}
      {!showHistory && (
        <>
          {loadingStudents && <div className="loading-inline"><div className="spinner"></div> Loading enrolled students...</div>}

          {!loadingStudents && selectedCourse && students.length === 0 && (
            <div className="card">
              <div className="empty-state">
                <div className="icon">👥</div>
                <h3>No enrolled students</h3>
                <p>No students are enrolled in this course yet. Ask admin to enroll students.</p>
              </div>
            </div>
          )}

          {!loadingStudents && students.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div>
                  <h3 className="card-title">Students ({students.length}) — {date}</h3>
                  <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: '0.85rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Present: {presentCount}</span>
                    <span style={{ color: '#ef4444', fontWeight: 600 }}>✗ Absent: {absentCount}</span>
                    <span style={{ color: '#f59e0b', fontWeight: 600 }}>⏰ Late: {lateCount}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-sm btn-secondary" onClick={() => {
                    const all = {}; students.forEach(s => { all[s.id] = 'present'; }); setAttendance(all);
                  }}>All Present</button>
                  <button className="btn btn-sm btn-secondary" onClick={() => {
                    const all = {}; students.forEach(s => { all[s.id] = 'absent'; }); setAttendance(all);
                  }}>All Absent</button>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>#</th><th>Student Name</th><th>Email</th><th>Mark Status</th></tr>
                  </thead>
                  <tbody>
                    {students.map((s, i) => (
                      <tr key={s.id}>
                        <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td style={{ color: '#64748b' }}>{s.email}</td>
                        <td>
                          <div style={{ display: 'flex', gap: 16 }}>
                            {['present', 'absent', 'late'].map(status => (
                              <label key={status} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                                <input type="radio" name={`att-${s.id}`} value={status}
                                  checked={attendance[s.id] === status}
                                  onChange={() => setAttendance(prev => ({ ...prev, [s.id]: status }))} />
                                <span style={{
                                  fontWeight: 500, fontSize: '0.875rem',
                                  color: status === 'present' ? '#10b981' : status === 'absent' ? '#ef4444' : '#f59e0b'
                                }}>
                                  {status === 'present' ? '✓ Present' : status === 'absent' ? '✗ Absent' : '⏰ Late'}
                                </span>
                              </label>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
                <button className="btn btn-primary btn-lg" onClick={handleSave} disabled={saving}>
                  {saving ? 'Saving...' : '✅ Save Attendance'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </Layout>
  );
}
