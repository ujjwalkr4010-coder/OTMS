import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [courses, setCourses]   = useState([]);
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [filter, setFilter]     = useState('all');
  const [search, setSearch]     = useState('');
  const [showManual, setShowManual] = useState(false);
  const [manualForm, setManualForm] = useState({ student_id: '', course_id: '', amount: '', payment_method: 'cash' });
  const [saving, setSaving]     = useState(false);
  const [toast, setToast]       = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  const fetchAll = () => {
    setLoading(true);
    Promise.all([
      api.get('/payments/all'),
      api.get('/payments/stats'),
      api.get('/users/students'),
      api.get('/courses')
    ]).then(([pRes, sRes, stuRes, cRes]) => {
      setPayments(pRes.data.payments || []);
      setStats(sRes.data.stats);
      setStudents(stuRes.data.students || []);
      setCourses(cRes.data.courses || []);
    }).catch(() => showToast('Failed to load data', 'error'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAll(); }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await api.put(`/payments/${id}/status`, { status });
      showToast('Payment status updated');
      fetchAll();
    } catch (err) {
      showToast('Update failed', 'error');
    }
  };

  const handleManualPayment = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/payments/manual', manualForm);
      showToast('Manual payment recorded');
      setShowManual(false);
      setManualForm({ student_id: '', course_id: '', amount: '', payment_method: 'cash' });
      fetchAll();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const filtered = payments.filter(p => {
    const matchStatus = filter === 'all' || p.status === filter;
    const matchSearch = p.students?.name?.toLowerCase().includes(search.toLowerCase()) ||
                        p.transaction_id?.toLowerCase().includes(search.toLowerCase()) ||
                        p.courses?.title?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const statusColor = { completed: 'badge-success', pending: 'badge-warning', failed: 'badge-danger', refunded: 'badge-gray' };

  return (
    <Layout>
      {toast.msg && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 280 }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header">
        <h1>💰 Payment Management</h1>
        <p>View all transactions, add manual payments, and update statuses</p>
      </div>

      <div className="stats-grid">
        {[
          { label: 'Total Revenue',   value: `₹${(stats?.revenue || 0).toLocaleString()}`, icon: '💰', color: 'green'  },
          { label: 'Transactions',    value: stats?.total || 0,                             icon: '📋', color: 'blue'   },
          { label: 'Completed',       value: stats?.completed || 0,                         icon: '✅', color: 'green'  },
          { label: 'Pending',         value: stats?.pending || 0,                           icon: '⏳', color: 'yellow' },
          { label: 'Failed',          value: stats?.failed || 0,                            icon: '❌', color: 'red'    },
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
            <h3 className="card-title">Transactions ({filtered.length})</h3>
            <input type="text" className="form-control" placeholder="🔍 Search student, course, TXN ID..."
              value={search} onChange={e => setSearch(e.target.value)} style={{ width: 260 }} />
            <div style={{ display: 'flex', gap: 6 }}>
              {['all', 'completed', 'pending', 'failed', 'refunded'].map(f => (
                <button key={f} className={`btn btn-sm ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setFilter(f)}>
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowManual(true)}>+ Add Manual Payment</button>
        </div>

        {loading ? (
          <div className="loading-inline"><div className="spinner"></div></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💳</div>
            <h3>No transactions found</h3>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Transaction ID</th><th>Student</th><th>Course</th><th>Amount</th><th>Method</th><th>Status</th><th>Date</th><th>Action</th></tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => (
                  <tr key={p.id}>
                    <td style={{ color: '#94a3b8' }}>{i + 1}</td>
                    <td><code style={{ fontSize: '0.78rem', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{p.transaction_id}</code></td>
                    <td style={{ fontWeight: 600 }}>{p.students?.name || '—'}</td>
                    <td>{p.courses?.title || '—'}</td>
                    <td style={{ fontWeight: 700 }}>₹{Number(p.amount).toLocaleString()}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.payment_method}</td>
                    <td>
                      <select
                        className="form-control"
                        style={{ padding: '4px 8px', fontSize: '0.8rem', width: 'auto' }}
                        value={p.status}
                        onChange={e => handleStatusChange(p.id, e.target.value)}
                      >
                        <option value="pending">Pending</option>
                        <option value="completed">Completed</option>
                        <option value="failed">Failed</option>
                        <option value="refunded">Refunded</option>
                      </select>
                    </td>
                    <td>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${statusColor[p.status] || 'badge-gray'}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Payment Modal */}
      {showManual && (
        <div className="modal-overlay" onClick={() => setShowManual(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Add Manual Payment</h3>
              <button className="modal-close" onClick={() => setShowManual(false)}>✕</button>
            </div>
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              Use this for cash, bank transfer, or any offline payment.
            </div>
            <form onSubmit={handleManualPayment}>
              <div className="form-group">
                <label className="form-label">Student *</label>
                <select className="form-control" value={manualForm.student_id}
                  onChange={e => setManualForm({ ...manualForm, student_id: e.target.value })} required>
                  <option value="">— Select student —</option>
                  {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Course (optional)</label>
                <select className="form-control" value={manualForm.course_id}
                  onChange={e => setManualForm({ ...manualForm, course_id: e.target.value })}>
                  <option value="">— Select course —</option>
                  {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input type="number" className="form-control" value={manualForm.amount}
                    onChange={e => setManualForm({ ...manualForm, amount: e.target.value })}
                    placeholder="0" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Payment Method</label>
                  <select className="form-control" value={manualForm.payment_method}
                    onChange={e => setManualForm({ ...manualForm, payment_method: e.target.value })}>
                    <option value="cash">Cash</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="upi">UPI</option>
                    <option value="cheque">Cheque</option>
                    <option value="card">Card</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowManual(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>
                  {saving ? 'Recording...' : '✅ Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
