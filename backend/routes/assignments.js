const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');
const { createNotification } = require('./notifications');

// POST /api/assignments — Tutor creates assignment
router.post('/', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { course_id, title, description, due_date, max_marks } = req.body;
    if (!course_id || !title || !due_date) {
      return res.status(400).json({ error: 'course_id, title, and due_date are required' });
    }

    const { data, error } = await supabase
      .from('assignments')
      .insert([{ course_id, title, description, due_date, max_marks: max_marks || 100 }])
      .select()
      .single();
    if (error) throw error;

    // Notify all enrolled students
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('students(user_id)')
      .eq('course_id', course_id)
      .eq('status', 'active');

    const { data: course } = await supabase
      .from('courses').select('title').eq('id', course_id).single();

    for (const e of (enrollments || [])) {
      if (e.students?.user_id) {
        await createNotification({
          user_id: e.students.user_id,
          title: 'New Assignment Posted',
          message: `"${title}" has been posted in ${course?.title || 'your course'}. Due: ${new Date(due_date).toLocaleDateString()}`,
          type: 'info',
          link: '/student/assignments'
        });
      }
    }

    res.status(201).json({ message: 'Assignment created', assignment: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assignments/course/:courseId
router.get('/course/:courseId', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', req.params.courseId)
      .order('due_date', { ascending: true });
    if (error) throw error;
    res.json({ assignments: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assignments/my — Student's assignments
router.get('/my', authenticate, authorize('student'), async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students').select('id').eq('user_id', req.user.id).single();

    const { data: enrollments } = await supabase
      .from('enrollments').select('course_id').eq('student_id', student.id);

    const courseIds = (enrollments || []).map(e => e.course_id);
    if (courseIds.length === 0) return res.json({ assignments: [] });

    const { data, error } = await supabase
      .from('assignments')
      .select('*, courses(title, subject)')
      .in('course_id', courseIds)
      .order('due_date', { ascending: true });
    if (error) throw error;

    const { data: submissions } = await supabase
      .from('submissions').select('assignment_id, status, marks_obtained, feedback')
      .eq('student_id', student.id);

    const subMap = {};
    (submissions || []).forEach(s => { subMap[s.assignment_id] = s; });

    res.json({ assignments: data.map(a => ({ ...a, submission: subMap[a.id] || null })) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/assignments/:id/submit — Student submits
router.post('/:id/submit', authenticate, authorize('student'), async (req, res) => {
  try {
    const { content, file_url, file_name } = req.body;
    const { data: student } = await supabase
      .from('students').select('id, name').eq('user_id', req.user.id).single();

    const { data: existing } = await supabase
      .from('submissions').select('id')
      .eq('assignment_id', req.params.id).eq('student_id', student.id).single();

    let submission;
    if (existing) {
      const { data, error } = await supabase
        .from('submissions')
        .update({ content, file_url, file_name, status: 'submitted', submitted_at: new Date().toISOString() })
        .eq('id', existing.id).select().single();
      if (error) throw error;
      submission = data;
    } else {
      const { data, error } = await supabase
        .from('submissions')
        .insert([{ assignment_id: req.params.id, student_id: student.id, content, file_url, file_name, status: 'submitted', submitted_at: new Date().toISOString() }])
        .select().single();
      if (error) throw error;
      submission = data;
    }

    // Notify tutor
    const { data: assignment } = await supabase
      .from('assignments').select('title, courses(tutor_id, tutors(user_id))').eq('id', req.params.id).single();
    const tutorUserId = assignment?.courses?.tutors?.user_id;
    if (tutorUserId) {
      await createNotification({
        user_id: tutorUserId,
        title: 'Assignment Submitted',
        message: `${student.name} submitted "${assignment.title}"`,
        type: 'info',
        link: '/tutor/assignments'
      });
    }

    res.status(201).json({ message: existing ? 'Submission updated' : 'Assignment submitted', submission });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/assignments/:id/submissions — Tutor views submissions
router.get('/:id/submissions', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('submissions')
      .select('*, students(name, email)')
      .eq('assignment_id', req.params.id);
    if (error) throw error;
    res.json({ submissions: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/assignments/submissions/:submissionId/grade — Tutor grades
router.put('/submissions/:submissionId/grade', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { marks_obtained, feedback } = req.body;
    const { data, error } = await supabase
      .from('submissions')
      .update({ marks_obtained, feedback, status: 'graded' })
      .eq('id', req.params.submissionId)
      .select('*, students(user_id, name), assignments(title, max_marks)')
      .single();
    if (error) throw error;

    // Notify student
    const studentUserId = data.students?.user_id;
    if (studentUserId) {
      const pct = Math.round((marks_obtained / (data.assignments?.max_marks || 100)) * 100);
      await createNotification({
        user_id: studentUserId,
        title: 'Assignment Graded',
        message: `Your submission for "${data.assignments?.title}" was graded: ${marks_obtained}/${data.assignments?.max_marks} (${pct}%)${feedback ? '. Feedback: ' + feedback : ''}`,
        type: pct >= 60 ? 'success' : 'warning',
        link: '/student/assignments'
      });
    }

    res.json({ message: 'Submission graded', submission: data });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
