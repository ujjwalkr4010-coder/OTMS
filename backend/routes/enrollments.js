const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/enrollments — Admin: all enrollments
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, students(name, email), courses(title, subject)')
      .order('enrolled_at', { ascending: false });
    if (error) throw error;
    res.json({ enrollments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/enrollments — Admin manually enrolls a student
router.post('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { student_id, course_id } = req.body;
    if (!student_id || !course_id) {
      return res.status(400).json({ error: 'student_id and course_id are required' });
    }

    const { data: existing } = await supabase
      .from('enrollments').select('id').eq('student_id', student_id).eq('course_id', course_id).single();
    if (existing) return res.status(409).json({ error: 'Student already enrolled in this course' });

    const { data, error } = await supabase
      .from('enrollments')
      .insert([{ student_id, course_id, status: 'active' }])
      .select('*, students(name, email), courses(title)')
      .single();
    if (error) throw error;
    res.status(201).json({ message: 'Student enrolled successfully', enrollment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/enrollments/:id — Admin updates enrollment status
router.put('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'completed', 'dropped'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const { data, error } = await supabase
      .from('enrollments').update({ status }).eq('id', req.params.id)
      .select('*, students(name), courses(title)').single();
    if (error) throw error;
    res.json({ message: 'Enrollment updated', enrollment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/enrollments/:id — Admin removes enrollment
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { error } = await supabase.from('enrollments').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Enrollment removed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
