import React from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Header() {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();

  return (
    <div className="header-bar">
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Welcome back, <strong style={{ color: 'var(--text)' }}>{user?.name?.split(' ')[0]}</strong>
        </span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Dark mode toggle */}
        <button
          className="dark-toggle"
          onClick={toggle}
          title={dark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {dark ? '☀️' : '🌙'}
        </button>

        {/* Notification bell */}
        <NotificationBell />

        {/* Role badge */}
        <span className={`badge ${
          user?.role === 'admin' ? 'badge-danger' :
          user?.role === 'tutor' ? 'badge-purple' : 'badge-info'
        }`} style={{ fontSize: '0.72rem' }}>
          {user?.role}
        </span>
      </div>
    </div>
  );
}
