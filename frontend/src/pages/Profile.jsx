import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, login } = useAuth();
  const [profile, setProfile] = useState(null);
  const [form, setForm]       = useState({ name: '', phone: '', subject: '', bio: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving]   = useState(false);
  const [toast, setToast]     = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  useEffect(() => {
    api.get('/users/profile').then(r => {
      const p = r.data.user?.profile || {};
      setProfile(p);
      setForm({
        name: r.data.user?.name || '',
        phone: p.phone || '',
        subject: p.subject || '',
        bio: p.bio || '',
        password: '',
        confirmPassword: ''
      });
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleSave = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirmPassword) {
      return showToast('Passwords do not match', 'error');
    }
    if (form.password && form.password.length < 6) {
      return showToast('Password must be at least 6 characters', 'error');
    }
    setSaving(true);
    try {
      const payload = { name: form.name, phone: form.phone, subject: form.subject, bio: form.bio };
      if (form.password) payload.password = form.password;
      await api.put('/users/profile', payload);
      showToast('Profile updated successfully');
      setForm(f => ({ ...f, password: '', confirmPassword: '' }));
    } catch (err) {
      showToast(err.response?.data?.error || 'Update failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  if (loading) return <Layout><div className="loading-inline"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      {toast.msg && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 280 }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1>👤 My Profile</h1>
        <p>Update your personal information and password</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20 }}>
        {/* Profile Card */}
        <div className="card" style={{ textAlign: 'center', height: 'fit-content' }}>
          <div style={{
            width: 80, height: 80, borderRadius: '50%', background: '#4f46e5',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', fontWeight: 700, color: 'white', margin: '0 auto 16px'
          }}>
            {initials}
          </div>
          <h3 style={{ fontWeight: 700, fontSize: '1.1rem' }}>{user?.name}</h3>
          <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 8 }}>{user?.email}</p>
          <span className={`badge ${user?.role === 'admin' ? 'badge-danger' : user?.role === 'tutor' ? 'badge-purple' : 'badge-info'}`}
            style={{ fontSize: '0.8rem' }}>
            {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
          </span>

          {profile && (
            <div style={{ marginTop: 20, textAlign: 'left' }}>
              <div className="divider" />
              {profile.phone && (
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 8 }}>
                  📞 {profile.phone}
                </div>
              )}
              {profile.subject && (
                <div style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 8 }}>
                  📚 {profile.subject}
                </div>
              )}
              {profile.bio && (
                <div style={{ fontSize: '0.85rem', color: '#64748b', lineHeight: 1.5 }}>
                  {profile.bio}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Edit Form */}
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 className="card-title" style={{ marginBottom: 20 }}>Personal Information</h3>
            <form onSubmit={handleSave}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input type="text" className="form-control" value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email (read-only)</label>
                  <input type="email" className="form-control" value={user?.email} disabled
                    style={{ background: '#f8fafc', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input type="text" className="form-control" value={form.phone}
                    onChange={e => setForm({ ...form, phone: e.target.value })}
                    placeholder="+91 98765 43210" />
                </div>
                {user?.role === 'tutor' && (
                  <div className="form-group">
                    <label className="form-label">Subject / Specialization</label>
                    <input type="text" className="form-control" value={form.subject}
                      onChange={e => setForm({ ...form, subject: e.target.value })}
                      placeholder="e.g. Mathematics, Physics" />
                  </div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">Bio</label>
                <textarea className="form-control" rows={3} value={form.bio}
                  onChange={e => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself..." />
              </div>

              <div className="divider" />
              <h4 style={{ fontWeight: 600, marginBottom: 16, color: '#1e293b' }}>Change Password</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">New Password</label>
                  <input type="password" className="form-control" value={form.password}
                    onChange={e => setForm({ ...form, password: e.target.value })}
                    placeholder="Leave blank to keep current" />
                </div>
                <div className="form-group">
                  <label className="form-label">Confirm New Password</label>
                  <input type="password" className="form-control" value={form.confirmPassword}
                    onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="Repeat new password" />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
                  {saving ? 'Saving...' : '💾 Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
