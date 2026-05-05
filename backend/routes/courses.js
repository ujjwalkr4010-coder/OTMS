const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/courses/my/enrolled — Student enrolled courses (before /:id)
router.get('/my/enrolled', authenticate, authorize('student'), async (req, res) => {
  try {
    const { data: student } = await supabase.from('students').select('id').eq('user_id', req.user.id).single();
    const { data, error } = await supabase
      .from('enrollments')
      .select('*, courses(id, title, subject, schedule, fee, meet_link, tutors(name))')
      .eq('student_id', student.id);
    if (error) throw error;
    res.json({ enrollments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/my/teaching — Tutor courses (before /:id)
router.get('/my/teaching', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { data: tutor } = await supabase.from('tutors').select('id').eq('user_id', req.user.id).single();
    const { data, error } = await supabase
      .from('courses')
      .select('id, title, subject, schedule, fee, meet_link, created_at, enrollments(count)')
      .eq('tutor_id', tutor.id);
    if (error) throw error;
    res.json({ courses: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses — All courses
router.get('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, tutors(name, subject)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json({ courses: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id — Course detail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, tutors(name, subject, bio)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Course not found' });
    res.json({ course: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses — Tutor or Admin creates course
router.post('/', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { title, description, subject, schedule, fee, meet_link, tutor_id } = req.body;
    if (!title || !subject) return res.status(400).json({ error: 'Title and subject are required' });

    let resolvedTutorId = tutor_id || null;
    if (req.user.role === 'tutor' && !resolvedTutorId) {
      const { data: tutor } = await supabase.from('tutors').select('id').eq('user_id', req.user.id).single();
      resolvedTutorId = tutor?.id || null;
    }

    const { data, error } = await supabase
      .from('courses')
      .insert([{ title, description, subject, schedule, fee: fee || 0, meet_link, tutor_id: resolvedTutorId }])
      .select('*, tutors(name)')
      .single();
    if (error) throw error;
    res.status(201).json({ message: 'Course created', course: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/courses/:id — Update course
router.put('/:id', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { title, description, subject, schedule, fee, meet_link, tutor_id } = req.body;
    const updates = { title, description, subject, schedule, fee, meet_link };
    if (tutor_id !== undefined) updates.tutor_id = tutor_id;

    const { data, error } = await supabase
      .from('courses').update(updates).eq('id', req.params.id)
      .select('*, tutors(name)').single();
    if (error) throw error;
    res.json({ message: 'Course updated', course: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/courses/:id — Admin deletes course
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { error } = await supabase.from('courses').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Course deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/courses/:id/enroll — Student self-enrolls
router.post('/:id/enroll', authenticate, authorize('student'), async (req, res) => {
  try {
    const { data: student } = await supabase.from('students').select('id').eq('user_id', req.user.id).single();
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    const { data: existing } = await supabase
      .from('enrollments').select('id').eq('student_id', student.id).eq('course_id', req.params.id).single();
    if (existing) return res.status(409).json({ error: 'Already enrolled in this course' });

    const { data, error } = await supabase
      .from('enrollments')
      .insert([{ student_id: student.id, course_id: req.params.id, status: 'active' }])
      .select().single();
    if (error) throw error;
    res.status(201).json({ message: 'Enrolled successfully', enrollment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/courses/:id/students — Get enrolled students for a course
router.get('/:id/students', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('id, status, enrolled_at, students(id, name, email, phone)')
      .eq('course_id', req.params.id)
      .eq('status', 'active');
    if (error) throw error;
    res.json({ students: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
