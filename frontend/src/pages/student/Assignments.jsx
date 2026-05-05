import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import FileUpload from '../../components/FileUpload';
import api from '../../utils/api';

export default function Assignments() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [uploadedFile, setUploadedFile]   = useState(null);
  const [submitting, setSubmitting]   = useState(false);
  const [toast, setToast]             = useState({ msg: '', type: '' });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: '' }), 3500);
  };

  const fetchAssignments = () => {
    api.get('/assignments/my')
      .then(res => setAssignments(res.data.assignments || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAssignments(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!submitContent.trim() && !uploadedFile) {
      return showToast('Please write an answer or upload a file.', 'error');
    }
    setSubmitting(true);
    try {
      await api.post(`/assignments/${selected.id}/submit`, {
        content:   submitContent,
        file_url:  uploadedFile?.file_url  || null,
        file_name: uploadedFile?.file_name || null,
      });
      showToast('Assignment submitted successfully!');
      setSelected(null);
      setSubmitContent('');
      setUploadedFile(null);
      fetchAssignments();
    } catch (err) {
      showToast(err.response?.data?.error || 'Submission failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const downloadMyReport = async () => {
    try {
      const res = await api.get('/reports/my-performance');
      const d   = res.data;
      const lines = [
        `OTMS — Student Performance Report`,
        `Generated: ${new Date().toLocaleString()}`,
        `Student: ${d.student.name} (${d.student.email})`,
        ``,
        `=== SUMMARY ===`,
        `Attendance: ${d.summary.attendance_pct}% (${d.summary.classes_attended}/${d.summary.total_classes} classes)`,
        `Average Score: ${d.summary.avg_score}%`,
        `Assignments Submitted: ${d.summary.assignments_submitted}/${d.summary.total_assignments}`,
        `Courses Enrolled: ${d.summary.courses_enrolled}`,
        ``,
        `=== COURSES ===`,
        ...d.courses.map(c => `${c.title} (${c.subject}) — Tutor: ${c.tutor || 'N/A'}`),
        ``,
        `=== GRADES ===`,
        ...d.grades.map(g => `${g.assignment} [${g.course}]: ${g.score}/${g.max} (${g.pct}%)${g.feedback ? ' — ' + g.feedback : ''}`),
        ``,
        `=== RECENT ATTENDANCE ===`,
        ...d.attendance.map(a => `${a.date} | ${a.course} | ${a.status}`),
      ];
      const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `my-performance-report.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Could not generate report', 'error');
    }
  };

  const isOverdue = (due) => new Date(due) < new Date();

  if (loading) return <Layout><div className="loading-inline"><div className="spinner"></div></div></Layout>;

  const pending  = assignments.filter(a => !a.submission).length;
  const submitted = assignments.filter(a => a.submission?.status === 'submitted').length;
  const graded   = assignments.filter(a => a.submission?.status === 'graded').length;

  return (
    <Layout>
      {toast.msg && (
        <div className={`alert alert-${toast.type === 'error' ? 'error' : 'success'}`}
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, minWidth: 280 }}>
          {toast.msg}
        </div>
      )}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1>📝 My Assignments</h1>
          <p>View, submit and track all your assignments</p>
        </div>
        <button className="export-btn secondary" onClick={downloadMyReport}>
          📥 Download My Report
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 20 }}>
        {[
          { label: 'Total',     value: assignments.length, icon: '📋', color: 'blue'   },
          { label: 'Pending',   value: pending,            icon: '⏳', color: 'yellow' },
          { label: 'Submitted', value: submitted,          icon: '📤', color: 'cyan'   },
          { label: 'Graded',    value: graded,             icon: '🏆', color: 'green'  },
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

      {assignments.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">📝</div>
            <h3>No assignments yet</h3>
            <p>Enroll in courses to receive assignments from your tutors.</p>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Assignment</th><th>Course</th><th>Due Date</th>
                  <th>Max Marks</th><th>Status</th><th>Score</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map(a => (
                  <tr key={a.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{a.title}</div>
                      {a.description && (
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {a.description.slice(0, 60)}{a.description.length > 60 ? '…' : ''}
                        </div>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)' }}>{a.courses?.title}</td>
                    <td>
                      <span style={{ color: isOverdue(a.due_date) && !a.submission ? 'var(--danger)' : 'var(--text)', fontWeight: isOverdue(a.due_date) && !a.submission ? 700 : 400 }}>
                        {new Date(a.due_date).toLocaleDateString()}
                        {isOverdue(a.due_date) && !a.submission && ' ⚠️'}
                      </span>
                    </td>
                    <td>{a.max_marks}</td>
                    <td>
                      <span className={`badge ${
                        a.submission?.status === 'graded'    ? 'badge-success' :
                        a.submission?.status === 'submitted' ? 'badge-info'    :
                        isOverdue(a.due_date)                ? 'badge-danger'  : 'badge-warning'
                      }`}>
                        {a.submission?.status === 'graded'    ? '✓ Graded'    :
                         a.submission?.status === 'submitted' ? '📤 Submitted' :
                         isOverdue(a.due_date)                ? '⚠️ Overdue'  : '⏳ Pending'}
                      </span>
                    </td>
                    <td>
                      {a.submission?.marks_obtained != null
                        ? <strong style={{ color: 'var(--success)' }}>{a.submission.marks_obtained}/{a.max_marks}</strong>
                        : '—'}
                    </td>
                    <td>
                      {a.submission?.status !== 'graded' ? (
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setSelected(a);
                            setSubmitContent(a.submission?.content || '');
                            setUploadedFile(null);
                          }}
                          disabled={isOverdue(a.due_date) && !a.submission}
                        >
                          {a.submission ? '🔄 Re-submit' : '📤 Submit'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {a.submission.feedback ? `"${a.submission.feedback.slice(0, 30)}…"` : '✓ Done'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Submit Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div className="modal" style={{ maxWidth: 560 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Submit: {selected.title}</h3>
              <button className="modal-close" onClick={() => setSelected(null)}>✕</button>
            </div>

            {selected.description && (
              <div style={{ padding: '10px 14px', background: 'var(--light-gray)', borderRadius: 8, marginBottom: 16, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                {selected.description}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Your Answer</label>
                <textarea
                  className="form-control"
                  rows={5}
                  placeholder="Write your answer here..."
                  value={submitContent}
                  onChange={e => setSubmitContent(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Or Upload a File (PDF, Word, Image)</label>
                <FileUpload
                  onUpload={(data) => setUploadedFile(data)}
                  accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg"
                  label="Upload Assignment File"
                />
              </div>

              {selected.submission?.file_url && !uploadedFile && (
                <div className="alert alert-info" style={{ marginBottom: 12 }}>
                  Previously uploaded: <a href={selected.submission.file_url} target="_blank" rel="noreferrer">View file</a>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting…' : '📤 Submit Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
