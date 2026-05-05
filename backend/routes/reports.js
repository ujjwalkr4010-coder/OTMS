const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// ── CSV helper ────────────────────────────────────────────────────────────────
function toCSV(headers, rows) {
  const escape = v => {
    if (v == null) return '';
    const s = String(v);
    return s.includes(',') || s.includes('"') || s.includes('\n')
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [
    headers.join(','),
    ...rows.map(r => headers.map(h => escape(r[h])).join(','))
  ];
  return lines.join('\r\n');
}

function sendCSV(res, filename, csv) {
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csv);
}

// GET /api/reports/students — Admin: all students CSV
router.get('/students', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('name, email, phone, bio, created_at');
    if (error) throw error;

    const rows = (data || []).map(s => ({
      Name: s.name,
      Email: s.email,
      Phone: s.phone || '',
      Bio: s.bio || '',
      'Joined On': new Date(s.created_at).toLocaleDateString()
    }));

    sendCSV(res, 'students.csv', toCSV(['Name', 'Email', 'Phone', 'Bio', 'Joined On'], rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/payments — Admin: payments CSV
router.get('/payments', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('transaction_id, amount, payment_method, status, paid_at, created_at, students(name, email), courses(title)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const rows = (data || []).map(p => ({
      'Transaction ID': p.transaction_id,
      Student: p.students?.name || '',
      Email: p.students?.email || '',
      Course: p.courses?.title || '',
      'Amount (₹)': p.amount,
      Method: p.payment_method,
      Status: p.status,
      'Paid On': p.paid_at ? new Date(p.paid_at).toLocaleDateString() : '',
      'Created On': new Date(p.created_at).toLocaleDateString()
    }));

    sendCSV(res, 'payments.csv',
      toCSV(['Transaction ID', 'Student', 'Email', 'Course', 'Amount (₹)', 'Method', 'Status', 'Paid On', 'Created On'], rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/attendance/:courseId — Tutor/Admin: attendance CSV for a course
router.get('/attendance/:courseId', authenticate, authorize('tutor', 'admin'), async (req, res) => {
  try {
    const { data: course } = await supabase
      .from('courses').select('title').eq('id', req.params.courseId).single();

    const { data, error } = await supabase
      .from('attendance')
      .select('date, status, students(name, email)')
      .eq('course_id', req.params.courseId)
      .order('date', { ascending: false });
    if (error) throw error;

    const rows = (data || []).map(a => ({
      Date: a.date,
      Student: a.students?.name || '',
      Email: a.students?.email || '',
      Status: a.status
    }));

    const filename = `attendance-${(course?.title || 'course').replace(/\s+/g, '-')}.csv`;
    sendCSV(res, filename, toCSV(['Date', 'Student', 'Email', 'Status'], rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/enrollments — Admin: enrollments CSV
router.get('/enrollments', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('enrollments')
      .select('status, enrolled_at, students(name, email), courses(title, subject)')
      .order('enrolled_at', { ascending: false });
    if (error) throw error;

    const rows = (data || []).map(e => ({
      Student: e.students?.name || '',
      Email: e.students?.email || '',
      Course: e.courses?.title || '',
      Subject: e.courses?.subject || '',
      Status: e.status,
      'Enrolled On': new Date(e.enrolled_at).toLocaleDateString()
    }));

    sendCSV(res, 'enrollments.csv',
      toCSV(['Student', 'Email', 'Course', 'Subject', 'Status', 'Enrolled On'], rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/student-performance — Admin: all students performance summary
router.get('/student-performance', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { data: students } = await supabase.from('students').select('id, name, email');
    const rows = [];

    for (const s of (students || [])) {
      const [attRes, subRes] = await Promise.all([
        supabase.from('attendance').select('status').eq('student_id', s.id),
        supabase.from('submissions').select('marks_obtained, status, assignments(max_marks)').eq('student_id', s.id)
      ]);

      const att = attRes.data || [];
      const subs = subRes.data || [];
      const total = att.length;
      const present = att.filter(a => a.status === 'present').length;
      const attPct = total > 0 ? Math.round((present / total) * 100) : 0;

      const graded = subs.filter(s => s.status === 'graded' && s.marks_obtained != null);
      const avgScore = graded.length > 0
        ? Math.round(graded.reduce((sum, g) => sum + (g.marks_obtained / (g.assignments?.max_marks || 100)) * 100, 0) / graded.length)
        : 0;

      rows.push({
        Name: s.name,
        Email: s.email,
        'Attendance %': attPct,
        'Classes Attended': present,
        'Total Classes': total,
        'Avg Score %': avgScore,
        'Assignments Submitted': subs.filter(s => s.status === 'submitted' || s.status === 'graded').length,
        'Total Assignments': subs.length
      });
    }

    sendCSV(res, 'student-performance.csv',
      toCSV(['Name', 'Email', 'Attendance %', 'Classes Attended', 'Total Classes', 'Avg Score %', 'Assignments Submitted', 'Total Assignments'], rows));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/reports/my-performance — Student: own performance PDF-ready JSON
router.get('/my-performance', authenticate, authorize('student'), async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students').select('id, name, email').eq('user_id', req.user.id).single();

    const [attRes, subRes, enrollRes] = await Promise.all([
      supabase.from('attendance').select('date, status, courses(title)').eq('student_id', student.id).order('date'),
      supabase.from('submissions').select('marks_obtained, status, feedback, submitted_at, assignments(title, max_marks, due_date, courses(title))').eq('student_id', student.id),
      supabase.from('enrollments').select('courses(title, subject, tutors(name))').eq('student_id', student.id)
    ]);

    const att = attRes.data || [];
    const subs = subRes.data || [];
    const enrolls = enrollRes.data || [];

    const present = att.filter(a => a.status === 'present').length;
    const attPct = att.length > 0 ? Math.round((present / att.length) * 100) : 0;
    const graded = subs.filter(s => s.status === 'graded' && s.marks_obtained != null);
    const avgScore = graded.length > 0
      ? Math.round(graded.reduce((s, g) => s + (g.marks_obtained / (g.assignments?.max_marks || 100)) * 100, 0) / graded.length)
      : 0;

    res.json({
      student: { name: student.name, email: student.email },
      generated_at: new Date().toISOString(),
      summary: {
        attendance_pct: attPct,
        classes_attended: present,
        total_classes: att.length,
        avg_score: avgScore,
        assignments_submitted: subs.filter(s => s.status === 'submitted' || s.status === 'graded').length,
        total_assignments: subs.length,
        courses_enrolled: enrolls.length
      },
      courses: enrolls.map(e => ({ title: e.courses?.title, subject: e.courses?.subject, tutor: e.courses?.tutors?.name })),
      grades: graded.map(g => ({
        assignment: g.assignments?.title,
        course: g.assignments?.courses?.title,
        score: g.marks_obtained,
        max: g.assignments?.max_marks,
        pct: Math.round((g.marks_obtained / (g.assignments?.max_marks || 100)) * 100),
        feedback: g.feedback,
        date: g.submitted_at
      })),
      attendance: att.slice(-20).map(a => ({ date: a.date, course: a.courses?.title, status: a.status }))
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
