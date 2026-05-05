const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate, authorize } = require('../middleware/auth');

// ─── helpers ──────────────────────────────────────────────────────────────────
function gradeFromScore(score) {
  if (score >= 90) return { grade: 'A+', label: 'Outstanding',  color: '#10b981' };
  if (score >= 80) return { grade: 'A',  label: 'Excellent',    color: '#3b82f6' };
  if (score >= 70) return { grade: 'B',  label: 'Good',         color: '#6366f1' };
  if (score >= 60) return { grade: 'C',  label: 'Average',      color: '#f59e0b' };
  if (score >= 50) return { grade: 'D',  label: 'Below Average',color: '#f97316' };
  return             { grade: 'F',  label: 'Failing',       color: '#ef4444' };
}

function trend(values) {
  // simple linear regression slope direction
  if (values.length < 2) return 'stable';
  const n = values.length;
  const sumX = values.reduce((s, _, i) => s + i, 0);
  const sumY = values.reduce((s, v) => s + v, 0);
  const sumXY = values.reduce((s, v, i) => s + i * v, 0);
  const sumX2 = values.reduce((s, _, i) => s + i * i, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  if (slope > 2)  return 'improving';
  if (slope < -2) return 'declining';
  return 'stable';
}

// GET /api/analytics/student/me — Full AI performance analysis
router.get('/student/me', authenticate, authorize('student'), async (req, res) => {
  try {
    const { data: student } = await supabase
      .from('students').select('id, name').eq('user_id', req.user.id).single();
    if (!student) return res.status(404).json({ error: 'Student profile not found' });

    // Fetch all data in parallel
    const [attRes, subRes, enrollRes] = await Promise.all([
      supabase.from('attendance').select('status, date, course_id, courses(title, subject)').eq('student_id', student.id).order('date'),
      supabase.from('submissions').select('marks_obtained, status, submitted_at, feedback, assignments(title, max_marks, due_date, course_id, courses(title, subject))').eq('student_id', student.id),
      supabase.from('enrollments').select('course_id, courses(id, title, subject)').eq('student_id', student.id)
    ]);

    const attendance   = attRes.data  || [];
    const submissions  = subRes.data  || [];
    const enrollments  = enrollRes.data || [];

    // ── Attendance ──────────────────────────────────────────────────────────
    const totalClasses   = attendance.length;
    const presentClasses = attendance.filter(a => a.status === 'present').length;
    const lateClasses    = attendance.filter(a => a.status === 'late').length;
    const absentClasses  = attendance.filter(a => a.status === 'absent').length;
    const attPct = totalClasses > 0 ? Math.round((presentClasses / totalClasses) * 100) : 0;

    // Per-course attendance
    const courseAttMap = {};
    attendance.forEach(a => {
      const key = a.course_id;
      if (!courseAttMap[key]) courseAttMap[key] = { title: a.courses?.title, subject: a.courses?.subject, total: 0, present: 0, late: 0 };
      courseAttMap[key].total++;
      if (a.status === 'present') courseAttMap[key].present++;
      if (a.status === 'late')    courseAttMap[key].late++;
    });
    const courseAttendance = Object.values(courseAttMap).map(c => ({
      ...c,
      pct: c.total > 0 ? Math.round(((c.present + c.late * 0.5) / c.total) * 100) : 0
    }));

    // Monthly attendance trend (last 6 months)
    const monthlyAtt = {};
    attendance.forEach(a => {
      const m = a.date?.slice(0, 7);
      if (!m) return;
      if (!monthlyAtt[m]) monthlyAtt[m] = { total: 0, present: 0 };
      monthlyAtt[m].total++;
      if (a.status === 'present') monthlyAtt[m].present++;
    });
    const attTrend = Object.entries(monthlyAtt).slice(-6).map(([month, v]) => ({
      month,
      pct: v.total > 0 ? Math.round((v.present / v.total) * 100) : 0
    }));

    // ── Grades ──────────────────────────────────────────────────────────────
    const graded = submissions.filter(s => s.status === 'graded' && s.marks_obtained != null);
    const submitted = submissions.filter(s => s.status === 'submitted' || s.status === 'graded');
    const overdue = submissions.filter(s => {
      const due = s.assignments?.due_date;
      return due && new Date(due) < new Date() && s.status !== 'submitted' && s.status !== 'graded';
    });

    const scorePcts = graded.map(s => Math.round((s.marks_obtained / (s.assignments?.max_marks || 100)) * 100));
    const avgScore  = scorePcts.length > 0 ? Math.round(scorePcts.reduce((a, b) => a + b, 0) / scorePcts.length) : 0;
    const highScore = scorePcts.length > 0 ? Math.max(...scorePcts) : 0;
    const lowScore  = scorePcts.length > 0 ? Math.min(...scorePcts) : 0;
    const scoreTrendDir = trend(scorePcts);

    // Per-course grades
    const courseGradeMap = {};
    graded.forEach(s => {
      const key = s.assignments?.course_id;
      if (!key) return;
      if (!courseGradeMap[key]) courseGradeMap[key] = { title: s.assignments?.courses?.title, subject: s.assignments?.courses?.subject, scores: [] };
      courseGradeMap[key].scores.push(Math.round((s.marks_obtained / (s.assignments?.max_marks || 100)) * 100));
    });
    const courseGrades = Object.values(courseGradeMap).map(c => ({
      title: c.title, subject: c.subject,
      avg: c.scores.length > 0 ? Math.round(c.scores.reduce((a, b) => a + b, 0) / c.scores.length) : 0,
      count: c.scores.length,
      trend: trend(c.scores)
    }));

    // Recent graded assignments (last 5)
    const recentGrades = graded.slice(-5).reverse().map(s => ({
      title:    s.assignments?.title,
      course:   s.assignments?.courses?.title,
      score:    s.marks_obtained,
      max:      s.assignments?.max_marks,
      pct:      Math.round((s.marks_obtained / (s.assignments?.max_marks || 100)) * 100),
      feedback: s.feedback,
      date:     s.submitted_at
    }));

    // ── Overall performance score ────────────────────────────────────────────
    const submissionRate = submissions.length > 0 ? Math.round((submitted.length / submissions.length) * 100) : 100;
    const performanceScore = Math.round(
      (attPct * 0.35) + (avgScore * 0.50) + (submissionRate * 0.15)
    );
    const { grade, label: gradeLabel, color: gradeColor } = gradeFromScore(performanceScore);

    // ── AI Insights ──────────────────────────────────────────────────────────
    const insights = [];
    const recommendations = [];
    const strengths = [];
    const weaknesses = [];

    // Attendance insights
    if (totalClasses === 0) {
      insights.push({ type: 'info', icon: '📋', text: 'No attendance records yet. Classes will be tracked once your tutor starts marking attendance.' });
    } else if (attPct >= 90) {
      insights.push({ type: 'success', icon: '🌟', text: `Outstanding attendance at ${attPct}%! You haven't missed a single important class.` });
      strengths.push('Excellent class attendance');
    } else if (attPct >= 75) {
      insights.push({ type: 'success', icon: '✅', text: `Good attendance at ${attPct}%. You're meeting the minimum requirement.` });
      strengths.push('Consistent class attendance');
    } else if (attPct >= 60) {
      insights.push({ type: 'warning', icon: '⚠️', text: `Attendance is ${attPct}% — below the required 75%. You need to attend more classes.` });
      weaknesses.push('Attendance below 75%');
      const needed = Math.ceil((0.75 * totalClasses - presentClasses) / 0.25);
      recommendations.push(`Attend the next ${needed} classes without missing any to reach 75% attendance.`);
    } else {
      insights.push({ type: 'danger', icon: '🚨', text: `Critical attendance: ${attPct}%. You risk being barred from exams. Immediate action required!` });
      weaknesses.push('Critically low attendance');
      recommendations.push('Contact your tutor immediately to discuss your attendance situation.');
      recommendations.push('Attend every single class from now on without exception.');
    }

    // Low attendance courses
    const lowAttCourses = courseAttendance.filter(c => c.pct < 75 && c.total > 0);
    if (lowAttCourses.length > 0) {
      insights.push({ type: 'warning', icon: '📉', text: `Low attendance in: ${lowAttCourses.map(c => `${c.title} (${c.pct}%)`).join(', ')}` });
    }

    // Grade insights
    if (graded.length === 0) {
      insights.push({ type: 'info', icon: '📝', text: 'No graded assignments yet. Submit your assignments to start tracking your academic performance.' });
    } else if (avgScore >= 80) {
      insights.push({ type: 'success', icon: '🏆', text: `Excellent academic performance! Average score: ${avgScore}%. You're in the top tier.` });
      strengths.push(`High average score (${avgScore}%)`);
    } else if (avgScore >= 60) {
      insights.push({ type: 'info', icon: '📊', text: `Good performance with an average of ${avgScore}%. There's room to push higher.` });
      recommendations.push('Review feedback on graded assignments to identify areas for improvement.');
    } else if (avgScore >= 40) {
      insights.push({ type: 'warning', icon: '⚠️', text: `Average score is ${avgScore}%. You need to improve your understanding of the subjects.` });
      weaknesses.push(`Low average score (${avgScore}%)`);
      recommendations.push('Schedule extra study sessions and review course materials thoroughly.');
      recommendations.push('Ask your tutor for additional practice problems.');
    } else {
      insights.push({ type: 'danger', icon: '🚨', text: `Average score is critically low at ${avgScore}%. Seek immediate help from your tutors.` });
      weaknesses.push('Very low academic scores');
      recommendations.push('Request one-on-one sessions with your tutors immediately.');
      recommendations.push('Form a study group with classmates to improve understanding.');
    }

    // Score trend
    if (scorePcts.length >= 3) {
      if (scoreTrendDir === 'improving') {
        insights.push({ type: 'success', icon: '📈', text: `Your scores are trending upward! Great improvement over recent assignments.` });
        strengths.push('Improving score trend');
      } else if (scoreTrendDir === 'declining') {
        insights.push({ type: 'warning', icon: '📉', text: `Your scores have been declining recently. Review recent feedback and adjust your study approach.` });
        weaknesses.push('Declining score trend');
        recommendations.push('Revisit the topics from your last 3 assignments and practice more.');
      }
    }

    // Overdue assignments
    if (overdue.length > 0) {
      insights.push({ type: 'danger', icon: '⏰', text: `You have ${overdue.length} overdue assignment(s). Contact your tutor to check if late submission is allowed.` });
      weaknesses.push(`${overdue.length} overdue assignment(s)`);
    }

    // Submission rate
    if (submissions.length > 0 && submissionRate < 80) {
      insights.push({ type: 'warning', icon: '📤', text: `Submission rate is ${submissionRate}%. Make sure to submit all assignments on time.` });
      recommendations.push('Set reminders for assignment due dates to avoid missing submissions.');
    }

    // Positive reinforcement
    if (strengths.length >= 3) {
      recommendations.push('You are performing well overall. Consider helping peers who are struggling — teaching reinforces your own learning.');
    }
    if (recommendations.length === 0 && performanceScore >= 75) {
      recommendations.push('Maintain your current study habits and keep pushing for excellence!');
      recommendations.push('Explore advanced topics in your subjects to stay ahead.');
    }

    res.json({
      student: student.name,
      performance: {
        score: performanceScore,
        grade, gradeLabel, gradeColor,
        attendance_percent: attPct,
        avg_score: avgScore,
        high_score: highScore,
        low_score: lowScore,
        score_trend: scoreTrendDir,
        submission_rate: submissionRate,
        total_classes: totalClasses,
        present_classes: presentClasses,
        late_classes: lateClasses,
        absent_classes: absentClasses,
        total_assignments: submissions.length,
        submitted: submitted.length,
        graded: graded.length,
        overdue: overdue.length
      },
      course_attendance: courseAttendance,
      course_grades: courseGrades,
      att_trend: attTrend,
      recent_grades: recentGrades,
      insights,
      strengths,
      weaknesses,
      recommendations
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/admin/overview — Admin dashboard stats
router.get('/admin/overview', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [
      { count: totalStudents },
      { count: totalTutors },
      { count: totalCourses },
      { count: totalEnrollments },
      { data: payments }
    ] = await Promise.all([
      supabase.from('students').select('*', { count: 'exact', head: true }),
      supabase.from('tutors').select('*', { count: 'exact', head: true }),
      supabase.from('courses').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('payments').select('amount, status')
    ]);

    const revenue = (payments || [])
      .filter(p => p.status === 'completed')
      .reduce((sum, p) => sum + p.amount, 0);

    res.json({
      stats: {
        total_students: totalStudents || 0,
        total_tutors: totalTutors || 0,
        total_courses: totalCourses || 0,
        total_enrollments: totalEnrollments || 0,
        total_revenue: revenue
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/analytics/tutor/me — Tutor's course analytics
router.get('/tutor/me', authenticate, authorize('tutor'), async (req, res) => {
  try {
    const { data: tutor } = await supabase
      .from('tutors')
      .select('id')
      .eq('user_id', req.user.id)
      .single();

    const { data: courses } = await supabase
      .from('courses')
      .select('id, title, enrollments(count)')
      .eq('tutor_id', tutor.id);

    const { data: attendance } = await supabase
      .from('attendance')
      .select('status, courses!inner(tutor_id)')
      .eq('courses.tutor_id', tutor.id);

    const totalStudents = (courses || []).reduce((sum, c) => sum + (c.enrollments?.[0]?.count || 0), 0);
    const presentCount = (attendance || []).filter(a => a.status === 'present').length;
    const avgAttendance = attendance?.length > 0
      ? Math.round((presentCount / attendance.length) * 100)
      : 0;

    res.json({
      stats: {
        total_courses: courses?.length || 0,
        total_students: totalStudents,
        avg_attendance: avgAttendance
      },
      courses: courses || []
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
