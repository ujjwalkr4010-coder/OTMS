import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Courses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [enrolling, setEnrolling] = useState(null);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    api.get('/courses')
      .then(res => setCourses(res.data.courses || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleEnroll = async (courseId) => {
    setEnrolling(courseId);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setMsg({ text: 'Enrolled successfully! 🎉', type: 'success' });
    } catch (err) {
      setMsg({ text: err.response?.data?.error || 'Enrollment failed', type: 'error' });
    } finally {
      setEnrolling(null);
    }
  };

  const filtered = courses.filter(c =>
    c.title?.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <Layout><div className="loading-inline"><div className="spinner"></div></div></Layout>;

  return (
    <Layout>
      <div className="page-header">
        <h1>📚 All Courses</h1>
        <p>Browse and enroll in available courses</p>
      </div>

      {msg.text && (
        <div className={`alert alert-${msg.type === 'success' ? 'success' : 'error'}`}>
          {msg.text}
          <button onClick={() => setMsg({ text: '', type: '' })} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer' }}>✕</button>
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <input
          type="text"
          className="form-control"
          placeholder="🔍 Search courses by title or subject..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="icon">📚</div>
            <h3>No courses found</h3>
            <p>{search ? 'Try a different search term.' : 'No courses available yet.'}</p>
          </div>
        </div>
      ) : (
        <div className="courses-grid">
          {filtered.map(course => (
            <div key={course.id} className="course-card">
              <div className="course-card-header">
                <h3>{course.title}</h3>
                <p>{course.subject}</p>
              </div>
              <div className="course-card-body">
                {course.description && (
                  <p style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 12 }}>
                    {course.description.slice(0, 100)}{course.description.length > 100 ? '...' : ''}
                  </p>
                )}
                <div className="course-meta">
                  <div className="course-meta-item">
                    👨‍🏫 <span>{course.tutors?.name || 'TBD'}</span>
                  </div>
                  {course.schedule && (
                    <div className="course-meta-item">
                      🕐 <span>{course.schedule}</span>
                    </div>
                  )}
                  <div className="course-meta-item">
                    💰 <span>₹{course.fee?.toLocaleString() || 'Free'}</span>
                  </div>
                  {course.meet_link && (
                    <div className="course-meta-item">
                      🎥 <a href={course.meet_link} target="_blank" rel="noreferrer" style={{ color: '#4f46e5' }}>Join Class</a>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 8 }}>
                  <Link to={`/courses/${course.id}`} className="btn btn-secondary btn-sm">View Details</Link>
                  {user?.role === 'student' && (
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => handleEnroll(course.id)}
                      disabled={enrolling === course.id}
                    >
                      {enrolling === course.id ? 'Enrolling...' : 'Enroll Now'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
