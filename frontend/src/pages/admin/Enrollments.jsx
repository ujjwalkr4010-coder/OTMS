import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [students, setStudents]       = useState([]);
  const [courses, setCourses]         = useState([]);
  const [loading, setLoading]         = useState(true);
  const [showModal, setShowModal]     = useState(false);
  const [form, setForm]               = useState({ student_id: '', course_id: '' });
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [toast, setToast]             = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/enrollments'),
      api.get('/users/students'),
      api.get('/courses')
    ]).then(([eRes, sRes, cRes]) => {
      setEnrollments(eRes.data.enrollments || []);
      setStudents(sRes.data.students || []);
      setCourses(cRes.data.courses || []);
    }).catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleEnroll = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/enrollments', form);
      showToast('Student enrolled successfully');
      setShowModal(false);
      setForm({ student_id: '', course_id: '' });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Enrollment failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/enrollments/${id}`, { status });
      showToast('Status updated');
      fetchAll();
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const handleRemove = async (id) => {
    if (!window.confirm('Remove this enrollment?')) return;
    try {
      await api.delete(`/enrollments/${id}`);
      showToast('Enrollment removed');
      fetchAll();
    } catch (err) {
      showToast('Remove failed', 'error');
    }
  };

  const filtered = enrollments.filter(e => {
    const matchStatus = filterStatus === 'all' || e.status === filterStatus;
    const matchSearch = e.students?.name?.toLowerCase().includes(search.toLowerCase()) ||
                        e.courses?.title?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <Layout>
      {toast.msg && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 280 }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1>📋 Enrollment Management</h1>
        <p>Enroll students in courses and manage enrollment status</p>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Total Enrollments', value: enrollments.length,                                    color: 'blue',   icon: '📋' },
          { label: 'Active',            value: enrollments.filter(e => e.status === 'active').length,  color: 'green',  icon: '✅' },
          { label: 'Dropped',           value: enrollments.filter(e => e.status === 'dropped').length, color: 'red',    icon: '❌' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info">
              <div className="value">{s.value}</div>
              <div className="label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <h3 className="card-title">Enrollments ({filtered.length})</h3>
            <input type="text" className="form-control" placeholder="🔍 Search student or course..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ width: 240 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'active', 'completed', 'dropped'].map(s => (
                <button key={s} className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilterStatus(s)}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>+ Enroll Student</button>
        </div>

        {loading ? (
          <div className="loading-inline"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📋</div>
            <h3>No enrollments found</h3>
            <p>Enroll a student in a course to get started.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Student</th><th>Course</th><th>Subject</th><th>Enrolled On</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((e, i) => (
                  <tr key={e.id}>
                    <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                    <td style={{ fontWeight: 600 }}>{e.students?.name || '—'}</td>
                    <td>{e.courses?.title || '—'}</td>
                    <td>{e.courses?.subject || '—'}</td>
                    <td>{new Date(e.enrolled_at).toLocaleDateString()}</td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                        value={e.status}
                        onChange={ev => handleStatusChange(e.id, ev.target.value)}
                      >
                        <option value="active">Active</option>
                        <option value="completed">Completed</option>
                        <option value="dropped">Dropped</option>
                      </select>
                    </td>
                    <td>
                      <button className="btn btn-sm btn-danger" onClick={() => handleRemove(e.id)}>🗑️ Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Enroll Student in Course</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleEnroll}>
              <div className="form-group">
                <label className="form-label">Select Student *</label>
                <select className="form-control" value={form.student_id}
                  onChange={e => setForm({ ...form, student_id: e.target.value })} required>
                  <option value="">— Choose a student —</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.email})</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Select Course *</label>
                <select className="form-control" value={form.course_id}
                  onChange={e => setForm({ ...form, course_id: e.target.value })} required>
                  <option value="">— Choose a course —</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.title} — {c.subject}</option>
                  ))}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Enrolling...' : 'Enroll Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
