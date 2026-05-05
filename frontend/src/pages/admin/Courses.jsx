import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const EMPTY = { title: '', description: '', subject: '', schedule: '', fee: '', meet_link: '', tutor_id: '' };

export default function AdminCourses() {
  const [courses, setCourses]   = useState([]);
  const [tutors, setTutors]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null);
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [search, setSearch]       = useState('');
  const [toast, setToast]         = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([api.get('/courses'), api.get('/users/tutors')])
      .then(([cRes, tRes]) => {
        setCourses(cRes.data.courses || []);
        setTutors(tRes.data.tutors || []);
      })
      .catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const openCreate = () => { setEditing(null); setForm(EMPTY); setShowModal(true); };
  const openEdit   = (c) => {
    setEditing(c);
    setForm({
      title: c.title || '', description: c.description || '', subject: c.subject || '',
      schedule: c.schedule || '', fee: c.fee || '', meet_link: c.meet_link || '',
      tutor_id: c.tutor_id || ''
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/courses/${editing.id}`, form);
        showToast('Course updated');
      } else {
        await api.post('/courses', form);
        showToast('Course created');
      }
      setShowModal(false);
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this course? All enrollments and assignments will also be deleted.')) return;
    try {
      await api.delete(`/courses/${id}`);
      showToast('Course deleted');
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Delete failed', 'error');
    }
  };

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      {toast.msg && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 280 }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1>📚 Course Management</h1>
        <p>Create, edit and assign tutors to courses</p>
      </div>

      <div className="card">
        <div className="card-header">
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <h3 className="card-title">All Courses ({filtered.length})</h3>
            <input type="text" className="form-control" placeholder="🔍 Search..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ width: 220 }} />
          </div>
          <button className="btn btn-primary" onClick={openCreate}>+ New Course</button>
        </div>

        {loading ? (
          <div className="loading-inline"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">📚</div>
            <h3>No courses yet</h3>
            <p>Create the first course to get started.</p>
            <button className="btn btn-primary mt-3" onClick={openCreate}>Create Course</button>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Title</th><th>Subject</th><th>Tutor</th><th>Schedule</th><th>Fee</th><th>Meet Link</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id}>
                    <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{c.title}</div>
                      <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>{c.description?.slice(0, 50)}</div>
                    </td>
                    <td><span className="badge badge-info">{c.subject}</span></td>
                    <td>{c.tutors?.name || <span style={{ color: '#94a3b8' }}>Unassigned</span>}</td>
                    <td>{c.schedule || '—'}</td>
                    <td style={{ fontWeight: 600 }}>₹{Number(c.fee || 0).toLocaleString()}</td>
                    <td>
                      {c.meet_link
                        ? <a href={c.meet_link} target="_blank" rel="noreferrer" className="btn btn-sm btn-secondary">🎥 Link</a>
                        : '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(c)}>✏️ Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c.id)}>🗑️</button>
                      </div>
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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? 'Edit Course' : 'Create New Course'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Course Title *</label>
                  <input type="text" className="form-control" value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input type="text" className="form-control" value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Mathematics" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={2} value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Assign Tutor</label>
                  <select className="form-control" value={form.tutor_id}
                    onChange={e => setForm({ ...form, tutor_id: e.target.value })}>
                    <option value="">— No tutor assigned —</option>
                    {tutors.map(t => (
                      <option key={t.id} value={t.id}>{t.name} {t.subject ? `(${t.subject})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Fee (₹)</label>
                  <input type="number" className="form-control" value={form.fee}
                    onChange={e => setForm({ ...form, fee: e.target.value })} placeholder="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Schedule</label>
                  <input type="text" className="form-control" value={form.schedule}
                    onChange={e => setForm({ ...form, schedule: e.target.value })}
                    placeholder="e.g. Mon/Wed 6PM" />
                </div>
                <div className="form-group">
                  <label className="form-label">Zoom / Meet Link</label>
                  <input type="url" className="form-control" value={form.meet_link}
                    onChange={e => setForm({ ...form, meet_link: e.target.value })}
                    placeholder="https://meet.google.com/..." />
                </div>
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
