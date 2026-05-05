import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

import Landing from './pages/Landing';

// Auth
import Login    from './pages/Login';
import Register from './pages/Register';
import Profile  from './pages/Profile';

// Shared
import Courses      from './pages/Courses';
import CourseDetail from './pages/CourseDetail';
import NotFound     from './pages/NotFound';

// Student
import StudentDashboard from './pages/student/Dashboard';
import Assignments      from './pages/student/Assignments';
import Attendance       from './pages/student/Attendance';
import Payments         from './pages/student/Payments';
import Analytics        from './pages/student/Analytics';

// Tutor
import TutorDashboard   from './pages/tutor/Dashboard';
import TutorCourses     from './pages/tutor/Courses';
import TutorAttendance  from './pages/tutor/Attendance';
import TutorAssignments from './pages/tutor/Assignments';

// Admin
import AdminDashboard   from './pages/admin/Dashboard';
import AdminUsers       from './pages/admin/Users';
import AdminCourses     from './pages/admin/Courses';
import AdminEnrollments from './pages/admin/Enrollments';
import AdminPayments    from './pages/admin/Payments';
import AdminReports     from './pages/admin/Reports';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" style={{ width: 40, height: 40, margin: 'auto', marginTop: '45vh' }}></div></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" replace />;
  return children;
}

function RoleRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" style={{ width: 40, height: 40, margin: 'auto', marginTop: '45vh' }}></div></div>;
  if (!user)   return <Navigate to="/login" replace />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'tutor')   return <Navigate to="/tutor/dashboard"   replace />;
  if (user.role === 'admin')   return <Navigate to="/admin/dashboard"   replace />;
  return <Navigate to="/login" replace />;
}

// "/" → Landing for guests, dashboard redirect for logged-in users
function LandingOrRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="loading-screen"><div className="spinner" style={{ width: 40, height: 40, margin: 'auto', marginTop: '45vh' }}></div></div>;
  if (!user)   return <Landing />;
  if (user.role === 'student') return <Navigate to="/student/dashboard" replace />;
  if (user.role === 'tutor')   return <Navigate to="/tutor/dashboard"   replace />;
  if (user.role === 'admin')   return <Navigate to="/admin/dashboard"   replace />;
  return <Landing />;
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/"         element={<LandingOrRedirect />} />
            <Route path="/login"    element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Shared */}
            <Route path="/profile"     element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/courses"     element={<ProtectedRoute><Courses /></ProtectedRoute>} />
            <Route path="/courses/:id" element={<ProtectedRoute><CourseDetail /></ProtectedRoute>} />

            {/* Student */}
            <Route path="/student/dashboard"   element={<ProtectedRoute roles={['student']}><StudentDashboard /></ProtectedRoute>} />
            <Route path="/student/assignments" element={<ProtectedRoute roles={['student']}><Assignments /></ProtectedRoute>} />
            <Route path="/student/attendance"  element={<ProtectedRoute roles={['student']}><Attendance /></ProtectedRoute>} />
            <Route path="/student/payments"    element={<ProtectedRoute roles={['student']}><Payments /></ProtectedRoute>} />
            <Route path="/student/analytics"   element={<ProtectedRoute roles={['student']}><Analytics /></ProtectedRoute>} />

            {/* Tutor */}
            <Route path="/tutor/dashboard"   element={<ProtectedRoute roles={['tutor']}><TutorDashboard /></ProtectedRoute>} />
            <Route path="/tutor/courses"     element={<ProtectedRoute roles={['tutor']}><TutorCourses /></ProtectedRoute>} />
            <Route path="/tutor/attendance"  element={<ProtectedRoute roles={['tutor']}><TutorAttendance /></ProtectedRoute>} />
            <Route path="/tutor/assignments" element={<ProtectedRoute roles={['tutor']}><TutorAssignments /></ProtectedRoute>} />

            {/* Admin */}
            <Route path="/admin/dashboard"   element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users"       element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/courses"     element={<ProtectedRoute roles={['admin']}><AdminCourses /></ProtectedRoute>} />
            <Route path="/admin/enrollments" element={<ProtectedRoute roles={['admin']}><AdminEnrollments /></ProtectedRoute>} />
            <Route path="/admin/payments"    element={<ProtectedRoute roles={['admin']}><AdminPayments /></ProtectedRoute>} />
            <Route path="/admin/reports"     element={<ProtectedRoute roles={['admin']}><AdminReports /></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
