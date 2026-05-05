import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function CourseDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    Promise.all([
      api.get(`/courses/${id}`),
      api.get(`/assignments/course/${id}`)
    ]).then(([courseRes, assignRes]) => {
      setCourse(courseRes.data.course);
      setAssignments(assignRes.data.assignments || []);
    }).catch(() => navigate('/courses'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${id}/enroll`);
      setMsg({ text: 'Enrolled successfully! 🎉', type: 'success' });
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Enrollment failed', type: 'error' });
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) return <Layout><div className="loading-inline"><div className="spinner"></div></div></Layout>;
  if (!course) return <Layout><div className="alert alert-error">Course not found.</div></Layout>;

  return (
    <Layout>
      <div style={{ marginBottom: 16 }}>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/courses')}>← Back to Courses</button>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>
          {msg.text}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ background: 'linear-gradient(135deg, #4f46e5, #3730a3)', borderRadius: 8, padding: '24px', color: 'white', marginBottom: 20 }}>
              <h1 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: 8 }}>{course.title}</h1>
              <p style={{ opacity: 0.85 }}>{course.subject}</p>
            </div>

            {course.description && (
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontWeight: 600, marginBottom: 8 }}>About this Course</h3>
                <p style={{ color: '#64748b', lineHeight: 1.7 }}>{course.description}</p>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>TUTOR</div>
                <div style={{ fontWeight: 600 }}>👨‍🏫 {course.tutors?.name || 'TBD'}</div>
              </div>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>SCHEDULE</div>
                <div style={{ fontWeight: 600 }}>🕐 {course.schedule || 'TBD'}</div>
              </div>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>FEE</div>
                <div style={{ fontWeight: 600 }}>💰 ₹{course.fee?.toLocaleString() || 'Free'}</div>
              </div>
              <div style={{ padding: 14, background: '#f8fafc', borderRadius: 8 }}>
                <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: 4 }}>SUBJECT</div>
                <div style={{ fontWeight: 600 }}>📚 {course.subject}</div>
              </div>
            </div>
          </div>

          {/* Assignments */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Assignments ({assignments.length})</h3>
            {assignments.length === 0 ? (
              <p style={{ color: '#64748b' }}>No assignments posted yet.</p>
            ) : (
              <div>
                {assignments.map(a => (
                  <div key={a.id} style={{ padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ fontWeight: 600 }}>{a.title}</div>
                    <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>
                      Due: {new Date(a.due_date).toLocaleDateString()} | Max Marks: {a.max_marks}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div>
          <div className="card">
            <h3 style={{ fontWeight: 700, fontSize: '1.5rem', color: '#4f46e5', marginBottom: 4 }}>
              ₹{course.fee?.toLocaleString() || 'Free'}
            </h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>Course Fee</p>

            {user?.role === 'student' && (
              <button
                className="btn btn-primary w-full btn-lg"
                onClick={handleEnroll}
                disabled={enrolling}
                style={{ marginBottom: 12 }}
              >
                {enrolling ? 'Enrolling...' : '🎓 Enroll Now'}
              </button>
            )}

            {course.meet_link && (
              <a
                href={course.meet_link}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary w-full"
                style={{ justifyContent: 'center' }}
              >
                🎥 Join Video Class
              </a>
            )}

            <div className="divider" />

            <div style={{ fontSize: '0.875rem', color: '#64748b' }}>
              <div style={{ marginBottom: 8 }}>✅ Lifetime access</div>
              <div style={{ marginBottom: 8 }}>📝 Assignments included</div>
              <div style={{ marginBottom: 8 }}>✅ Attendance tracking</div>
              <div>🏆 Certificate on completion</div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
