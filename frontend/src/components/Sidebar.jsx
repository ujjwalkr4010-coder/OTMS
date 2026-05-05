import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const studentLinks = [
  { to: '/student/dashboard', icon: '🏠', label: 'Dashboard'   },
  { to: '/courses',           icon: '📚', label: 'Courses'     },
  { to: '/student/assignments', icon: '📝', label: 'Assignments' },
  { to: '/student/attendance',  icon: '✅', label: 'Attendance'  },
  { to: '/student/payments',    icon: '💳', label: 'Payments'   },
  { to: '/student/analytics',   icon: '📊', label: 'Performance' },
  { to: '/profile',             icon: '👤', label: 'My Profile'  },
];

const tutorLinks = [
  { to: '/tutor/dashboard',    icon: '🏠', label: 'Dashboard'   },
  { to: '/tutor/courses',      icon: '📚', label: 'My Courses'  },
  { to: '/tutor/assignments',  icon: '📝', label: 'Assignments' },
  { to: '/tutor/attendance',   icon: '✅', label: 'Attendance'  },
  { to: '/profile',            icon: '👤', label: 'My Profile'  },
];

const adminLinks = [
  { to: '/admin/dashboard',    icon: '🏠', label: 'Dashboard'   },
  { to: '/admin/users',        icon: '👥', label: 'Users'       },
  { to: '/admin/courses',      icon: '📚', label: 'Courses'     },
  { to: '/admin/enrollments',  icon: '📋', label: 'Enrollments' },
  { to: '/admin/payments',     icon: '💰', label: 'Payments'    },
  { to: '/admin/reports',      icon: '📥', label: 'Reports'     },
  { to: '/profile',            icon: '👤', label: 'My Profile'  },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const links = user?.role === 'student' ? studentLinks
    : user?.role === 'tutor' ? tutorLinks
    : adminLinks;

  const handleLogout = () => { logout(); navigate('/login'); };

  const initials = user?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';

  return (
    <>
      <button className="mobile-menu-btn" onClick={() => setOpen(!open)}>☰</button>

      {open && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 99 }}
          onClick={() => setOpen(false)} />
      )}

      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-logo">
          <h2>OT<span>MS</span></h2>
          <div style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
            Online Tuition Management
          </div>
        </div>

        <div className="sidebar-user">
          <div className="user-avatar">{initials}</div>
          <div className="user-info">
            <div className="name">{user?.name}</div>
            <div className="role">{user?.role}</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section-title">Navigation</div>
          {links.map(link => (
            <NavLink key={link.to} to={link.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              onClick={() => setOpen(false)}>
              <span className="icon">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>🚪 Logout</button>
        </div>
      </aside>
    </>
  );
}
