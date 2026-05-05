import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

export default function TutorAssignments() {
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [assignments, setAssignments] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [showGrade, setShowGrade] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', due_date: '', max_marks: 100 });
  const [grade, setGrade] = useState({ marks_obtained: '', feedback: '' });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    api.get('/courses/my/teaching')
      .then(res => setCourses(res.data.courses || []))
      .catch(console.error);
  }, []);

  const loadAssignments = (courseId) => {
    if (!courseId) return;
    api.get(`/assignments/course/${courseId}`)
      .then(res => setAssignments(res.data.assignments || []))
      .catch(console.error);
  };

  const handleCourseChange = (e) => {
    setSelectedCourse(e.target.value);
    setSelectedAssignment(null);
    setSubmissions([]);
    loadAssignments(e.target.value);
  };

  const loadSubmissions = (assignmentId) => {
    setSelectedAssignment(assignmentId);
    api.get(`/assignments/${assignmentId}/submissions`)
      .then(res => setSubmissions(res.data.submissions || []))
      .catch(console.error);
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.post('/assignments', { ...form, course_id: selectedCourse });
      setMsg('Assignment created!');
      setShowCreate(false);
      setForm({ title: '', description: '', due_date: '', max_marks: 100 });
      loadAssignments(selectedCourse);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to create assignment');
    } finally {
      setSaving(false);
    }
  };

  const handleGrade = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/assignments/submissions/${showGrade.id}/grade`, grade);
      setMsg('Submission graded!');
      setShowGrade(null);
      setGrade({ marks_obtained: '', feedback: '' });
      loadSubmissions(selectedAssignment);
    } catch (err) {
      setMsg(err.response?.data?.error || 'Failed to grade');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <h1>📝 Assignments</h1>
        <p>Create assignments and grade student submissions</p>
      </div>

      {msg && (
        <div className={`alert ${msg.includes('!') ? 'alert-success' : 'alert-error'}`}>
          {msg}
          <button onClick={() => setMsg('')} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-end' }}>
          <div className="form-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="form-label">Select Course</label>
            <select className="form-control" value={selectedCourse} onChange={handleCourseChange}>
              <option value="">-- Select a course --</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          {selectedCourse && (
            <button className="btn btn-primary" onClick={() => setShowCreate(true)}>+ New Assignment</button>
          )}
        </div>
      </div>

      {selectedCourse && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Assignments List */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Assignments</h3>
            {assignments.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📝</div>
                <h3>No assignments</h3>
                <p>Create an assignment for this course.</p>
              </div>
            ) : (
              <div>
                {assignments.map(a => (
                  <div
                    key={a.id}
                    onClick={() => loadSubmissions(a.id)}
                    style={{
                      padding: '12px 14px',
                      border: `2px solid ${selectedAssignment === a.id ? '#4f46e5' : '#e2e8f0'}`,
                      borderRadius: 8,
                      marginBottom: 10,
                      cursor: 'pointer',
                      background: selectedAssignment === a.id ? '#e0e7ff' : 'white'
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                      Due: {new Date(a.due_date).toLocaleDateString()} | Max: {a.max_marks} marks
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Submissions */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>
              {selectedAssignment ? `Submissions (${submissions.length})` : 'Select an assignment'}
            </h3>
            {!selectedAssignment ? (
              <div className="empty-state">
                <div className="icon">👆</div>
                <h3>Select an assignment</h3>
                <p>Click on an assignment to view submissions.</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="empty-state">
                <div className="icon">📭</div>
                <h3>No submissions yet</h3>
              </div>
            ) : (
              <div>
                {submissions.map(s => (
                  <div key={s.id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{s.students?.name}</div>
                        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{s.content?.slice(0, 60)}...</div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                        <span className={`badge ${s.status === 'graded' ? 'badge-success' : 'badge-info'}`}>
                          {s.status}
                        </span>
                        {s.status !== 'graded' && (
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => { setShowGrade(s); setGrade({ marks_obtained: '', feedback: '' }); }}
                          >
                            Grade
                          </button>
                        )}
                        {s.status === 'graded' && (
                          <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{s.marks_obtained} marks</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Create Assignment Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Create Assignment</h3>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input type="text" className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-control" rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Due Date *</label>
                  <input type="date" className="form-control" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Max Marks</label>
                  <input type="number" className="form-control" value={form.max_marks} onChange={e => setForm({ ...form, max_marks: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Grade Modal */}
      {showGrade && (
        <div className="modal-overlay" onClick={() => setShowGrade(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Grade Submission</h3>
              <button className="modal-close" onClick={() => setShowGrade(null)}>✕</button>
            </div>
            <div style={{ background: '#f8fafc', padding: 12, borderRadius: 8, marginBottom: 16, fontSize: '0.875rem' }}>
              <strong>Student:</strong> {showGrade.students?.name}<br />
              <strong>Submission:</strong> {showGrade.content}
            </div>
            <form onSubmit={handleGrade}>
              <div className="form-group">
                <label className="form-label">Marks Obtained</label>
                <input type="number" className="form-control" value={grade.marks_obtained} onChange={e => setGrade({ ...grade, marks_obtained: e.target.value })} required />
              </div>
              <div className="form-group">
                <label className="form-label">Feedback</label>
                <textarea className="form-control" rows={3} value={grade.feedback} onChange={e => setGrade({ ...grade, feedback: e.target.value })} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowGrade(null)}>Cancel</button>
                <button type="submit" className="btn btn-success" disabled={saving}>{saving ? 'Saving...' : 'Submit Grade'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
}
