const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// POST /api/attendance — Tutor marks attendance
router.post('/', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { course_id, date, records } = req.body;
    if (!course_id || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'course_id, date, and records array are required' });
    }
    const rows = records.map(r => ({
      course_id,
      student_id: r.student_id,
      date,
      status: r.status || 'absent'
    }));
    const { data, error } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'course_id,student_id,date' })
      .select();
    if (error) throw error;
    res.status(201).json({ message: 'Attendance recorded', attendance: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/course/:courseId — Attendance records for a course
router.get('/course/:courseId', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, students(name, email)')
      .eq('course_id', req.params.courseId)
      .order('date', { ascending: false });
    if (error) throw error;
    res.json({ attendance: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/course/:courseId/enrolled — ONLY enrolled students for a course
router.get('/course/:courseId/enrolled', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('students(id, name, email)')
      .eq('course_id', req.params.courseId)
      .eq('status', 'active');
    if (error) throw error;
    const students = data.map(e => e.students).filter(Boolean);
    res.json({ students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/student/me — Student's own attendance
router.get('/student/me', authenticate, authorize('student'), async (req, res) => {
  try {
    const { data: student } = await supabase.from('students').select('id').eq('user_id', req.user.id).single();
    const { data, error } = await supabase
      .from('attendance')
      .select('*, courses(title, subject)')
      .eq('student_id', student.id)
      .order('date', { ascending: false });
    if (error) throw error;
    const total   = data.length;
    const present = data.filter(a => a.status === 'present').length;
    const percentage = total > 0 ? Math.round((present / total) * 100) : 0;
    res.json({ attendance: data, summary: { total, present, absent: total - present, percentage } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/course/:courseId/date/:date — Attendance by date
router.get('/course/:courseId/date/:date', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('attendance')
      .select('*, students(name, email)')
      .eq('course_id', req.params.courseId)
      .eq('date', req.params.date);
    if (error) throw error;
    res.json({ attendance: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
