import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

const EMPTY_FORM = { name: '', email: '', password: '', role: 'student', phone: '', subject: '', bio: '' };

export default function AdminUsers() {
  const [users, setUsers]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('all');
  const [search, setSearch]   = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState(null); // null = create
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(null);
  const [toast, setToast]         = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  const fetchUsers = () => {
    setLoading(true);
    api.get('/users')
      .then(r => setUsers(r.data.users || []))
      .catch(() => showToast('Failed to load users', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  };

  const openEdit = (u) => {
    setEditing(u);
    setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: '', subject: '', bio: '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        const payload = { name: form.name, email: form.email, role: form.role, phone: form.phone, subject: form.subject, bio: form.bio };
        if (form.password) payload.password = form.password;
        await api.put(`/users/${editing.id}`, payload);
        showToast('User updated successfully');
      } else {
        if (!form.password) return showToast('Password is required', 'error');
        await api.post('/users', form);
        showToast('User created successfully');
      }
      setShowModal(false);
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Save failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user? This cannot be undone.')) return;
    setDeleting(id);
    try {
      await api.delete(`/users/${id}`);
      showToast('User deleted');
      fetchUsers();
    } catch (err) {
      showToast(err.response?.data?.error || 'Delete failed', 'error');
    } finally {
      setDeleting(null);
    }
  };

  const filtered = users.filter(u => {
    const matchRole   = filter === 'all' || u.role === filter;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
                        u.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
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
        <h1>👥 User Management</h1>
        <p>Add, edit and manage all users in the system</p>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        {[
          { role: 'all',     label: 'Total Users',  icon: '👤', color: 'blue'   },
          { role: 'student', label: 'Students',      icon: '🎓', color: 'green'  },
          { role: 'tutor',   label: 'Tutors',        icon: '👨‍🏫', color: 'purple' },
          { role: 'admin',   label: 'Admins',        icon: '⚙️', color: 'red'    },
        ].map(s => (
          <div key={s.role} className="stat-card" style={{ cursor: 'pointer' }} onClick={() => setFilter(s.role)}>
            <div className={`stat-icon ${s.color}`}>{s.icon}</div>
            <div className="stat-info">
              <div className="value">{s.role === 'all' ? users.length : users.filter(u => u.role === s.role).length}</div>
              <div className="label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">All Users ({filtered.length})</h3>
          <button className="btn btn-primary" onClick={openCreate}>+ Add User</button>
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
          <input
            type="text" className="form-control" placeholder="🔍 Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 280 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', 'student', 'tutor', 'admin'].map(f => (
              <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setFilter(f)}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="loading-inline"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">🔍</div>
            <h3>No users found</h3>
            <p>Try a different search or filter, or add a new user.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Name</th><th>Email</th><th>Role</th><th>Joined</th><th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => (
                  <tr key={u.id}>
                    <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', background: '#e0e7ff',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontWeight: 700, fontSize: '0.85rem', color: '#4f46e5', flexShrink: 0
                        }}>
                          {u.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                        </div>
                        <span style={{ fontWeight: 600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td>{u.email}</td>
                    <td>
                      <span className={`badge ${u.role === 'admin' ? 'badge-danger' : u.role === 'tutor' ? 'badge-purple' : 'badge-info'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td>{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-sm btn-secondary" onClick={() => openEdit(u)}>✏️ Edit</button>
                        <button className="btn btn-sm btn-danger" onClick={() => handleDelete(u.id)}
                          disabled={deleting === u.id}>
                          {deleting === u.id ? '...' : '🗑️'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h3 className="modal-title">{editing ? `Edit: ${editing.name}` : 'Add New User'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSave}>
              {/* Role selector */}
              <div className="form-group">
                <label className="form-label">Role *</label>
                <div className="role-selector">
                  {['student', 'tutor', 'admin'].map(role => (
                    <React.Fragment key={role}>
                      <input type="radio" name="modal-role" id={`mr-${role}`} value={role}
                        className="role-option" checked={form.role === role}
                        onChange={() => setForm({ ...form, role })} />
                      <label htmlFor={`mr-${role}`} className="role-label">
                        <span className="role-icon">{role === 'student' ? '🎓' : role === 'tutor' ? '👨‍🏫' : '⚙️'}</span>
                        {role.charAt(0).toUpperCase() + role.slice(1)}
                      </label>
                    </React.Fragment>
                  ))}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input type="text" className="form-control" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Email *</label>
                  <input type="email" className="form-control" value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">{editing ? 'New Password (leave blank to keep)' : 'Password *'}</label>
                  <input type="password" className="form-control" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    required={!editing} placeholder="Min. 6 characters" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-control" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="Optional" />
                </div>
              </div>

              {form.role === 'tutor' && (
                <div className="form-group">
                  <label className="form-label">Subject / Specialization</label>
                  <input type="text" className="form-control" value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    placeholder="e.g. Mathematics, Physics" />
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Bio / Notes</label>
                <textarea className="form-control" rows={2} value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })} placeholder="Optional" />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving...' : editing ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
