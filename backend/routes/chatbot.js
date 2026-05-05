const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { authenticate } = require('../middleware/auth');

// ─── Context loader ────────────────────────────────────────────────────────────
async function loadUserContext(user) {
  const ctx = { role: user.role, name: user.name };

  try {
    if (user.role === 'student') {
      const { data: student } = await supabase
        .from('students').select('id').eq('user_id', user.id).single();

      if (student) {
        const [attRes, subRes, payRes, enrollRes] = await Promise.all([
          supabase.from('attendance').select('status, date, courses(title)').eq('student_id', student.id),
          supabase.from('submissions').select('status, marks_obtained, assignments(title, max_marks, due_date, courses(title))').eq('student_id', student.id),
          supabase.from('payments').select('status, amount, courses(title), created_at').eq('student_id', student.id),
          supabase.from('enrollments').select('status, courses(title, subject, schedule, fee, meet_link, tutors(name))').eq('student_id', student.id)
        ]);

        const att = attRes.data || [];
        const subs = subRes.data || [];
        const pays = payRes.data || [];
        const enrolls = enrollRes.data || [];

        const totalAtt = att.length;
        const presentAtt = att.filter(a => a.status === 'present').length;
        const attPct = totalAtt > 0 ? Math.round((presentAtt / totalAtt) * 100) : null;

        const graded = subs.filter(s => s.status === 'graded' && s.marks_obtained != null);
        const avgScore = graded.length > 0
          ? Math.round(graded.reduce((s, g) => s + (g.marks_obtained / (g.assignments?.max_marks || 100)) * 100, 0) / graded.length)
          : null;

        const pending = subs.filter(s => !s.status || s.status === 'pending');
        const overdue = subs.filter(s => {
          const due = s.assignments?.due_date;
          return due && new Date(due) < new Date() && s.status !== 'submitted' && s.status !== 'graded';
        });

        const pendingPayments = pays.filter(p => p.status === 'pending');
        const totalPaid = pays.filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);

        ctx.student = {
          attPct, totalAtt, presentAtt,
          avgScore, gradedCount: graded.length,
          totalAssignments: subs.length,
          pendingCount: pending.length,
          overdueCount: overdue.length,
          overdueList: overdue.map(o => o.assignments?.title).filter(Boolean),
          enrolledCourses: enrolls.map(e => ({
            title: e.courses?.title,
            subject: e.courses?.subject,
            schedule: e.courses?.schedule,
            fee: e.courses?.fee,
            meet_link: e.courses?.meet_link,
            tutor: e.courses?.tutors?.name
          })),
          pendingPayments: pendingPayments.length,
          totalPaid,
          recentGrades: graded.slice(-3).map(g => ({
            title: g.assignments?.title,
            score: g.marks_obtained,
            max: g.assignments?.max_marks
          }))
        };
      }
    }

    if (user.role === 'tutor') {
      const { data: tutor } = await supabase
        .from('tutors').select('id, subject').eq('user_id', user.id).single();

      if (tutor) {
        const { data: courses } = await supabase
          .from('courses')
          .select('id, title, subject, schedule, enrollments(count)')
          .eq('tutor_id', tutor.id);

        const totalStudents = (courses || []).reduce((s, c) => s + (c.enrollments?.[0]?.count || 0), 0);
        ctx.tutor = {
          subject: tutor.subject,
          courses: (courses || []).map(c => ({ title: c.title, subject: c.subject, schedule: c.schedule, students: c.enrollments?.[0]?.count || 0 })),
          totalCourses: courses?.length || 0,
          totalStudents
        };
      }
    }

    if (user.role === 'admin') {
      const [{ count: students }, { count: tutors }, { count: courses }, { data: pays }] = await Promise.all([
        supabase.from('students').select('*', { count: 'exact', head: true }),
        supabase.from('tutors').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('payments').select('status, amount')
      ]);
      const revenue = (pays || []).filter(p => p.status === 'completed').reduce((s, p) => s + Number(p.amount), 0);
      ctx.admin = { students, tutors, courses, revenue };
    }
  } catch (e) {
    // context load failure is non-fatal
  }

  return ctx;
}

// ─── Smart response engine ─────────────────────────────────────────────────────
function buildResponse(message, ctx) {
  const msg = message.toLowerCase().trim();
  const { role, name, student, tutor, admin } = ctx;
  const firstName = name?.split(' ')[0] || 'there';

  // ── Greetings ──
  if (/^(hi|hello|hey|good\s*(morning|evening|afternoon)|howdy|sup)\b/.test(msg)) {
    const greetings = [
      `Hey ${firstName}! 👋 I'm your OTMS AI assistant. What can I help you with today?`,
      `Hello ${firstName}! 😊 Ready to help. Ask me anything about your ${role} account.`,
      `Hi ${firstName}! 🎓 What would you like to know?`
    ];
    return greetings[Math.floor(Math.random() * greetings.length)];
  }

  if (/how are you|how r u|you ok/.test(msg)) {
    return `I'm running at full capacity and ready to help you, ${firstName}! 🚀 What's on your mind?`;
  }

  // ── STUDENT-SPECIFIC ──────────────────────────────────────────────────────
  if (role === 'student' && student) {

    // Attendance queries
    if (/attendance|present|absent|class(es)?|bunk/.test(msg)) {
      if (student.attPct === null) {
        return `📋 No attendance records found yet, ${firstName}. Your tutor will start marking attendance once classes begin.`;
      }
      const status = student.attPct >= 75 ? '✅ Good standing' : student.attPct >= 60 ? '⚠️ At risk' : '🚨 Critical';
      const needed = student.attPct < 75
        ? `\n\n💡 You need to attend the next **${Math.ceil((0.75 * student.totalAtt - student.presentAtt) / 0.25)}** classes without missing any to reach 75%.`
        : '';
      return `📊 **Your Attendance Summary**\n\n• Attendance: **${student.attPct}%** (${status})\n• Classes attended: ${student.presentAtt} out of ${student.totalAtt}${needed}\n\nView full details in the **Attendance** section.`;
    }

    // Assignment queries
    if (/assignment|homework|submit|due|deadline|task/.test(msg)) {
      let resp = `📝 **Your Assignment Status**\n\n• Total assignments: ${student.totalAssignments}\n• Pending: ${student.pendingCount}\n• Graded: ${student.gradedCount}`;
      if (student.overdueCount > 0) {
        resp += `\n\n🚨 **Overdue (${student.overdueCount}):** ${student.overdueList.slice(0, 3).join(', ')}`;
      }
      if (student.pendingCount === 0 && student.overdueCount === 0) {
        resp += `\n\n✅ You're all caught up! No pending assignments.`;
      }
      resp += `\n\nGo to **Assignments** in the sidebar to submit.`;
      return resp;
    }

    // Grade / marks queries
    if (/grade|mark|score|result|how.*doing|performance/.test(msg)) {
      if (student.avgScore === null) {
        return `📊 No graded assignments yet, ${firstName}. Once your tutor grades your submissions, your scores will appear here and in the **Performance** section.`;
      }
      const level = student.avgScore >= 80 ? 'Excellent 🌟' : student.avgScore >= 60 ? 'Good 👍' : student.avgScore >= 40 ? 'Needs improvement ⚠️' : 'Critical — seek help 🚨';
      let resp = `🏆 **Your Academic Performance**\n\n• Average score: **${student.avgScore}%** — ${level}\n• Graded assignments: ${student.gradedCount}`;
      if (student.recentGrades.length > 0) {
        resp += `\n\n📋 **Recent grades:**`;
        student.recentGrades.forEach(g => {
          resp += `\n  • ${g.title}: ${g.score}/${g.max} (${Math.round((g.score / g.max) * 100)}%)`;
        });
      }
      resp += `\n\nSee full analysis in **Performance** → AI Analytics.`;
      return resp;
    }

    // Payment queries
    if (/pay|fee|fees|money|cost|due|pending payment|receipt/.test(msg)) {
      let resp = `💳 **Your Payment Summary**\n\n• Total paid: ₹${student.totalPaid.toLocaleString()}\n• Pending payments: ${student.pendingPayments}`;
      if (student.pendingPayments > 0) {
        resp += `\n\n⚠️ You have **${student.pendingPayments}** pending payment(s). Go to **Payments** to complete them.`;
      } else {
        resp += `\n\n✅ All fees are up to date!`;
      }
      return resp;
    }

    // Course queries
    if (/course|subject|enroll|class|study|learn/.test(msg)) {
      if (student.enrolledCourses.length === 0) {
        return `📚 You're not enrolled in any courses yet, ${firstName}. Go to **Courses** in the sidebar to browse and enroll!`;
      }
      let resp = `📚 **Your Enrolled Courses (${student.enrolledCourses.length})**\n`;
      student.enrolledCourses.forEach(c => {
        resp += `\n• **${c.title}** (${c.subject})`;
        if (c.schedule) resp += ` — ${c.schedule}`;
        if (c.tutor)    resp += ` | Tutor: ${c.tutor}`;
      });
      return resp;
    }

    // Video class / meet link
    if (/zoom|meet|video|link|join|live|online class/.test(msg)) {
      const withLinks = student.enrolledCourses.filter(c => c.meet_link);
      if (withLinks.length === 0) {
        return `🎥 No video class links found yet. Your tutor will add Zoom/Meet links to the course page before each session. Check **Courses** for updates.`;
      }
      let resp = `🎥 **Video Class Links**\n`;
      withLinks.forEach(c => { resp += `\n• **${c.title}**: ${c.meet_link}`; });
      return resp;
    }

    // Schedule / timetable
    if (/schedule|timetable|time|when|timing/.test(msg)) {
      if (student.enrolledCourses.length === 0) {
        return `📅 Enroll in courses first to see your schedule. Go to **Courses** to browse available classes.`;
      }
      let resp = `📅 **Your Class Schedule**\n`;
      student.enrolledCourses.forEach(c => {
        resp += `\n• **${c.title}**: ${c.schedule || 'Schedule not set'}`;
      });
      return resp;
    }

    // Overall summary / what should I do
    if (/summary|overview|status|what.*do|help me|suggest/.test(msg)) {
      const issues = [];
      if (student.attPct !== null && student.attPct < 75) issues.push(`📉 Attendance is ${student.attPct}% (below 75%)`);
      if (student.overdueCount > 0) issues.push(`⏰ ${student.overdueCount} overdue assignment(s)`);
      if (student.pendingPayments > 0) issues.push(`💳 ${student.pendingPayments} pending payment(s)`);
      if (student.avgScore !== null && student.avgScore < 50) issues.push(`📊 Average score is low (${student.avgScore}%)`);

      if (issues.length === 0) {
        return `✅ **Everything looks great, ${firstName}!**\n\nAttendance: ${student.attPct ?? 'N/A'}% | Avg Score: ${student.avgScore ?? 'N/A'}%\n\nKeep up the excellent work! 🌟`;
      }
      return `📋 **Action Items for ${firstName}**\n\n${issues.join('\n')}\n\nFocus on these to improve your performance. Type any topic for details.`;
    }
  }

  // ── TUTOR-SPECIFIC ────────────────────────────────────────────────────────
  if (role === 'tutor' && tutor) {

    if (/student|how many|enrolled|class size/.test(msg)) {
      return `👥 You have **${tutor.totalStudents}** students across **${tutor.totalCourses}** course(s).\n\n${tutor.courses.map(c => `• **${c.title}**: ${c.students} students`).join('\n')}`;
    }

    if (/course|subject|teach|class/.test(msg)) {
      if (tutor.courses.length === 0) {
        return `📚 You haven't created any courses yet. Go to **My Courses** to create your first course!`;
      }
      let resp = `📚 **Your Courses (${tutor.totalCourses})**\n`;
      tutor.courses.forEach(c => {
        resp += `\n• **${c.title}** (${c.subject}) — ${c.schedule || 'No schedule'} | ${c.students} students`;
      });
      return resp;
    }

    if (/attendance|mark|present/.test(msg)) {
      return `✅ To mark attendance:\n1. Go to **Attendance** in the sidebar\n2. Select your course\n3. Choose the date\n4. Mark each student as Present / Absent / Late\n5. Click **Save Attendance**\n\nOnly enrolled students are shown for each course.`;
    }

    if (/assignment|grade|mark|submission/.test(msg)) {
      return `📝 To manage assignments:\n1. Go to **Assignments** in the sidebar\n2. Select a course\n3. Click **+ New Assignment** to create one\n4. Click on an assignment to view submissions\n5. Click **Grade** to score each submission and add feedback`;
    }

    if (/summary|overview|status/.test(msg)) {
      return `📊 **Your Teaching Summary**\n\n• Courses: ${tutor.totalCourses}\n• Total students: ${tutor.totalStudents}\n• Subject: ${tutor.subject || 'Not set'}\n\nUse the sidebar to manage courses, attendance, and assignments.`;
    }
  }

  // ── ADMIN-SPECIFIC ────────────────────────────────────────────────────────
  if (role === 'admin' && admin) {

    if (/student|how many student/.test(msg)) {
      return `🎓 There are currently **${admin.students}** students registered in the system.\n\nManage them at **Users** → filter by Student.`;
    }

    if (/tutor|teacher|instructor/.test(msg)) {
      return `👨‍🏫 There are **${admin.tutors}** tutors registered.\n\nManage them at **Users** → filter by Tutor.`;
    }

    if (/revenue|money|payment|earning/.test(msg)) {
      return `💰 Total revenue collected: **₹${admin.revenue.toLocaleString()}**\n\nView all transactions and add manual payments at **Payments**.`;
    }

    if (/course|subject/.test(msg)) {
      return `📚 There are **${admin.courses}** courses in the system.\n\nManage courses (create, edit, assign tutors) at **Courses**.`;
    }

    if (/summary|overview|status/.test(msg)) {
      return `📊 **System Overview**\n\n• Students: ${admin.students}\n• Tutors: ${admin.tutors}\n• Courses: ${admin.courses}\n• Revenue: ₹${admin.revenue.toLocaleString()}\n\nAll management tools are in the sidebar.`;
    }

    if (/enroll|enrollment/.test(msg)) {
      return `📋 To enroll a student in a course:\n1. Go to **Enrollments** in the sidebar\n2. Click **+ Enroll Student**\n3. Select the student and course\n4. Click **Enroll Student**\n\nYou can also change enrollment status or remove enrollments from the same page.`;
    }

    if (/add.*user|create.*user|new.*student|new.*tutor/.test(msg)) {
      return `👥 To add a new user:\n1. Go to **Users** in the sidebar\n2. Click **+ Add User**\n3. Select role (Student / Tutor / Admin)\n4. Fill in name, email, password and other details\n5. Click **Create User**`;
    }
  }

  // ── UNIVERSAL TOPICS ──────────────────────────────────────────────────────

  if (/password|change.*pass|reset.*pass|forgot/.test(msg)) {
    return `🔐 To change your password:\n1. Click **My Profile** in the sidebar\n2. Scroll to **Change Password**\n3. Enter your new password (min. 6 characters)\n4. Confirm and click **Save Changes**`;
  }

  if (/profile|account|edit.*info|update.*info/.test(msg)) {
    return `👤 To update your profile:\n1. Click **My Profile** in the sidebar\n2. Edit your name, phone, bio${role === 'tutor' ? ', subject' : ''}\n3. Click **Save Changes**`;
  }

  if (/logout|sign out|log out/.test(msg)) {
    return `👋 To logout, click the **🚪 Logout** button at the bottom of the sidebar.`;
  }

  if (/(thank|thanks|thank you|thx|ty)\b/.test(msg)) {
    return `You're welcome, ${firstName}! 😊 Feel free to ask anything else.`;
  }

  if (/bye|goodbye|see you|cya/.test(msg)) {
    return `Goodbye, ${firstName}! 👋 Have a great learning session. Come back anytime!`;
  }

  if (/who are you|what are you|what can you do|help/.test(msg)) {
    const caps = role === 'student'
      ? 'attendance %, assignment status, grades, payments, course schedule, and video links'
      : role === 'tutor'
      ? 'your courses, student counts, attendance marking, and assignment grading'
      : 'system stats, user management, enrollments, and payments';
    return `🤖 I'm your **OTMS AI Assistant**!\n\nI have access to your real account data and can answer questions about:\n📌 ${caps}\n\nJust ask naturally — like "What's my attendance?" or "Do I have pending assignments?"`;
  }

  // ── Fallback with suggestions ─────────────────────────────────────────────
  const suggestions = role === 'student'
    ? ['What is my attendance?', 'Do I have pending assignments?', 'Show my grades', 'What courses am I enrolled in?', 'Any pending payments?']
    : role === 'tutor'
    ? ['How many students do I have?', 'Show my courses', 'How to mark attendance?', 'How to grade assignments?']
    : ['System overview', 'How many students?', 'Total revenue?', 'How to enroll a student?'];

  return `🤔 I didn't quite understand that. Here are some things you can ask me:\n\n${suggestions.map(s => `• "${s}"`).join('\n')}`;
}

// ─── Route ─────────────────────────────────────────────────────────────────────
router.post('/message', authenticate, async (req, res) => {
  const { message } = req.body;
  if (!message?.trim()) return res.status(400).json({ error: 'Message is required' });

  try {
    const ctx = await loadUserContext(req.user);
    const response = buildResponse(message, ctx);
    res.json({ message: response, timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ error: 'Assistant error', message: err.message });
  }
});

module.exports = router;
