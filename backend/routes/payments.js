const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');
const { createNotification } = require('./notifications');

// POST /api/payments/initiate — Student initiates payment
router.post('/initiate', authenticate, authorize('student'), async (req, res) => {
  try {
    const { course_id, amount, payment_method } = req.body;
    if (!course_id || !amount) return res.status(400).json({ error: 'course_id and amount are required' });

    const { data: student } = await supabase.from('students').select('id').eq('user_id', req.user.id).single();
    const transaction_id = 'TXN-' + uuidv4().split('-')[0].toUpperCase();

    const { data, error } = await supabase
      .from('payments')
      .insert([{ student_id: student.id, course_id, amount, payment_method: payment_method || 'card', transaction_id, status: 'pending' }])
      .select().single();
    if (error) throw error;
    res.status(201).json({ message: 'Payment initiated', payment: data, transaction_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/:id/confirm — Student confirms card payment
router.post('/:id/confirm', authenticate, authorize('student'), async (req, res) => {
  try {
    const { card_number, card_holder, expiry, cvv } = req.body;
    if (!card_number || !card_holder || !expiry || !cvv) {
      return res.status(400).json({ error: 'All card details are required' });
    }
    const isSuccess = !card_number.endsWith('0000');
    const status = isSuccess ? 'completed' : 'failed';

    const { data, error } = await supabase
      .from('payments')
      .update({ status, paid_at: isSuccess ? new Date().toISOString() : null })
      .eq('id', req.params.id)
      .select('*, courses(title)').single();
    if (error) throw error;

    // Notify student
    if (isSuccess) {
      await createNotification({
        user_id: req.user.id,
        title: 'Payment Successful ✅',
        message: `Payment of ₹${data.amount} for "${data.courses?.title || 'course'}" was successful. Transaction ID: ${data.transaction_id}`,
        type: 'success',
        link: '/student/payments'
      });
      return res.json({ message: 'Payment successful', payment: data });
    }

    await createNotification({
      user_id: req.user.id,
      title: 'Payment Failed ❌',
      message: `Payment of ₹${data.amount} failed. Please try again with a different card.`,
      type: 'danger',
      link: '/student/payments'
    });
    res.status(400).json({ message: 'Payment failed. Card declined.', payment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/my — Student payment history
router.get('/my', authenticate, authorize('student'), async (req, res) => {
  try {
    const { data: student } = await supabase.from('students').select('id').eq('user_id', req.user.id).single();
    const { data, error } = await supabase
      .from('payments')
      .select('*, courses(title, subject)')
      .eq('student_id', student.id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ payments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/all — Admin: all payments
router.get('/all', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*, students(name, email), courses(title)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    const total = data.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
    res.json({ payments: data, total_revenue: total });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/payments/manual — Admin adds manual payment
router.post('/manual', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { student_id, course_id, amount, payment_method } = req.body;
    if (!student_id || !amount) return res.status(400).json({ error: 'student_id and amount are required' });

    const transaction_id = 'MANUAL-' + uuidv4().split('-')[0].toUpperCase();
    const { data, error } = await supabase
      .from('payments')
      .insert([{ student_id, course_id: course_id || null, amount, payment_method: payment_method || 'cash', transaction_id, status: 'completed', paid_at: new Date().toISOString() }])
      .select('*, students(name, user_id), courses(title)').single();
    if (error) throw error;

    // Notify student
    if (data.students?.user_id) {
      await createNotification({
        user_id: data.students.user_id,
        title: 'Payment Recorded ✅',
        message: `A payment of ₹${amount} has been recorded for you${data.courses?.title ? ' for ' + data.courses.title : ''}. Method: ${payment_method || 'cash'}`,
        type: 'success',
        link: '/student/payments'
      });
    }

    res.status(201).json({ message: 'Manual payment recorded', payment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/payments/:id/status — Admin updates payment status
router.put('/:id/status', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const updates = { status };
    if (status === 'completed') updates.paid_at = new Date().toISOString();
    if (status === 'refunded')  updates.paid_at = null;

    const { data, error } = await supabase
      .from('payments').update(updates).eq('id', req.params.id)
      .select('*, students(name, user_id), courses(title)').single();
    if (error) throw error;

    // Notify student of status change
    if (data.students?.user_id && (status === 'completed' || status === 'refunded')) {
      await createNotification({
        user_id: data.students.user_id,
        title: status === 'completed' ? 'Payment Confirmed ✅' : 'Payment Refunded',
        message: `Your payment of ₹${data.amount}${data.courses?.title ? ' for ' + data.courses.title : ''} has been marked as ${status}.`,
        type: status === 'completed' ? 'success' : 'info',
        link: '/student/payments'
      });
    }

    res.json({ message: 'Payment status updated', payment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payments/stats — Admin stats
router.get('/stats', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase.from('payments').select('status, amount');
    if (error) throw error;
    const stats = {
      total:     data.length,
      completed: data.filter(p => p.status === 'completed').length,
      pending:   data.filter(p => p.status === 'pending').length,
      failed:    data.filter(p => p.status === 'failed').length,
      refunded:  data.filter(p => p.status === 'refunded').length,
      revenue:   data.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0)
    };
    res.json({ stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
