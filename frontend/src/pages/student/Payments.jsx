import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showCardModal, setShowCardModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [card, setCard] = useState({ card_number: '', card_holder: '', expiry: '', cvv: '' });
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get('/payments/my'),
      api.get('/courses/my/enrolled')
    ]).then(([payRes, enrollRes]) => {
      setPayments(payRes.data.payments || []);
      setEnrollments(enrollRes.data.enrollments || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const initiatePayment = async () => {
    if (!selectedCourse) return;
    setProcessing(true);
    try {
      const res = await api.post('/payments/initiate', {
        course_id: selectedCourse.courses.id,
        amount: selectedCourse.courses.fee,
        payment_method: 'card'
      });
      setPendingPayment(res.data.payment);
      setShowPayModal(false);
      setShowCardModal(true);
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Failed to initiate payment', type: 'error' });
    } finally {
      setProcessing(false);
    }
  };

  const confirmPayment = async (e) => {
    e.preventDefault();
    setProcessing(true);
    try {
      const res = await api.post(`/payments/${pendingPayment.id}/confirm`, card);
      setMsg({ text: res.data.message, type: 'success' });
      setShowCardModal(false);
      setPendingPayment(null);
      setCard({ card_number: '', card_holder: '', expiry: '', cvv: '' });
      const payRes = await api.get('/payments/my');
      setPayments(payRes.data.payments || []);
    } catch (err) {
      setMsg({ text: err.response?.data?.message || 'Payment failed', type: 'error' });
      setShowCardModal(false);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <Layout><div className="loading-inline"><div className="spinner"></div></div></Layout>;

  const totalPaid = payments.filter(p => p.status === 'completed').reduce((s, p) => s + p.amount, 0);

  return (
    <Layout>
      <div className="page-header">
        <h1>💳 Payments</h1>
        <p>Manage your course fee payments</p>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>
          {msg.text}
          <button onClick={() => setMsg({ text: '', type: '' })} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card">
          <div className="stat-icon green">✅</div>
          <div className="stat-info">
            <div className="value">₹{totalPaid.toLocaleString()}</div>
            <div className="label">Total Paid</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue">📋</div>
          <div className="stat-info">
            <div className="value">{payments.filter(p => p.status === 'completed').length}</div>
            <div className="label">Successful Payments</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon yellow">⏳</div>
          <div className="stat-info">
            <div className="value">{payments.filter(p => p.status === 'pending').length}</div>
            <div className="label">Pending</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Payment History</h3>
          <button className="btn btn-primary btn-sm" onClick={() => setShowPayModal(true)}>
            + Pay Fee
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="empty-state">
            <div className="icon">💳</div>
            <h3>No payments yet</h3>
            <p>Pay your course fees to keep your enrollment active.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Transaction ID</th>
                  <th>Course</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td><code style={{ fontSize: '0.8rem' }}>{p.transaction_id}</code></td>
                    <td>{p.courses?.title || '—'}</td>
                    <td style={{ fontWeight: 600 }}>₹{p.amount?.toLocaleString()}</td>
                    <td style={{ textTransform: 'capitalize' }}>{p.payment_method}</td>
                    <td>
                      <span className={`badge ${
                        p.status === 'completed' ? 'badge-success' :
                        p.status === 'pending' ? 'badge-warning' : 'badge-danger'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td>{p.paid_at ? new Date(p.paid_at).toLocaleDateString() : new Date(p.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Select Course Modal */}
      {showPayModal && (
        <div className="modal-overlay" onClick={() => setShowPayModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Pay Course Fee</h3>
              <button className="modal-close" onClick={() => setShowPayModal(false)}>✕</button>
            </div>
            <p style={{ color: '#64748b', marginBottom: 16, fontSize: '0.875rem' }}>Select a course to pay for:</p>
            {enrollments.length === 0 ? (
              <p>No enrolled courses found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {enrollments.map(e => (
                  <div
                    key={e.id}
                    onClick={() => setSelectedCourse(e)}
                    style={{
                      padding: 14,
                      border: `2px solid ${selectedCourse?.id === e.id ? '#4f46e5' : '#e2e8f0'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      background: selectedCourse?.id === e.id ? '#e0e7ff' : 'white'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{e.courses?.title}</div>
                    <div style={{ fontSize: '0.85rem', color: '#64748b' }}>Fee: ₹{e.courses?.fee?.toLocaleString()}</div>
                  </div>
                ))}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setShowPayModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={initiatePayment} disabled={!selectedCourse || processing}>
                {processing ? 'Processing...' : 'Proceed to Pay'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Card Payment Modal */}
      {showCardModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h3 className="modal-title">💳 Card Payment</h3>
            </div>
            <div className="alert alert-info" style={{ marginBottom: 16 }}>
              Amount: <strong>₹{pendingPayment?.amount?.toLocaleString()}</strong> | Use any card number (cards ending in 0000 will fail for testing)
            </div>
            <form onSubmit={confirmPayment}>
              <div className="form-group">
                <label className="form-label">Card Number</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="1234 5678 9012 3456"
                  maxLength={16}
                  value={card.card_number}
                  onChange={e => setCard({ ...card, card_number: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Card Holder Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="John Doe"
                  value={card.card_holder}
                  onChange={e => setCard({ ...card, card_holder: e.target.value })}
                  required
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Expiry (MM/YY)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="12/27"
                    maxLength={5}
                    value={card.expiry}
                    onChange={e => setCard({ ...card, expiry: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">CVV</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="123"
                    maxLength={3}
                    value={card.cvv}
                    onChange={e => setCard({ ...card, cvv: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCardModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={processing}>
                  {processing ? 'Processing...' : '🔒 Pay Now'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
