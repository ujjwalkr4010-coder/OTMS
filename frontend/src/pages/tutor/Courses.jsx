import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function TutorCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', subject: '', schedule: '', fee: '', meet_link: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchCourses = () => {
    api.get('/courses/my/teaching')
      .then(res => setCourses(res.data.courses || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCourses(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ title: '', description: '', subject: '', schedule: '', fee: '', meet_link: '' });
    setShowModal(true);
  };

  const openEdit = (course) => {
    setEditing(course);
    setForm({
      title: course.title || '',
      description: course.description || '',
      subject: course.subject || '',
      schedule: course.schedule || '',
      fee: course.fee || '',
      meet_link: course.meet_link || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/courses/${editing.id}`, form);
        setMsg('Course updated successfully!');
      } else {
        await api.post('/courses', form);
        setMsg('Course created successfully!');
      }
      setShowModal(false);
      fetchCourses();
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to save course');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Layout><div className="loading-inline"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>📚 My Courses</h1>
        <p>Create and manage your courses</p>
      </div>

      {msg && (
        <div className={`alert ${msg.includes('success') ? 'alert-success' : 'alert-error'}`}>
          {msg}
          <button onClick={() => setMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Courses ({courses.length})</h3>
          <button className="btn btn-primary" onClick={openCreate}>+ Create Course</button>
        </div>

        {courses.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📚</div>
            <h3>No courses yet</h3>
            <p>Create your first course to start teaching students.</p>
            <button className="btn btn-primary mt-3" onClick={openCreate}>Create Course</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Subject</th>
                  <th>Schedule</th>
                  <th>Fee</th>
                  <th>Meet Link</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{c.description?.slice(0, 50)}</div>
                    </td>
                    <td>{c.subject}</td>
                    <td>{c.schedule || '—'}</td>
                    <td>₹{c.fee?.toLocaleString()}</td>
                    <td>
                      {c.meet_link ? (
                        <a href={c.meet_link} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">
                          🎥 Join
                        </a>
                      ) : '—'}
                    </td>
                    <td>
                      <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>Edit</button>
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
              <h3 className="modal-title">{editing ? 'Edit Course' : 'Create New Course'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="form-group">
                <label className="form-label">Course Title *</label>
                <input type="text" className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <input type="text" className="form-control" placeholder="e.g. Mathematics, Physics" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Schedule</label>
                  <input type="text" className="form-control" placeholder="e.g. Mon/Wed 6PM" value={form.schedule} onChange={e => setForm({ ...form, schedule: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Fee (₹)</label>
                  <input type="number" className="form-control" placeholder="0" value={form.fee} onChange={e => setForm({ ...form, fee: e.target.value })} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Zoom/Meet Link</label>
                <input type="url" className="form-control" placeholder="https://meet.google.com/..." value={form.meet_link} onChange={e => setForm({ ...form, meet_link: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update Course' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
