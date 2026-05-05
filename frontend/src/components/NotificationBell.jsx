import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

const TYPE_ICON = {
  success: '✅',
  warning: '⚠️',
  danger:  '🚨',
  info:    'ℹ️',
};

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen]                 = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread]             = useState(0);
  const [loading, setLoading]           = useState(false);
  const dropdownRef                     = useRef(null);
  const navigate                        = useNavigate();

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
      setUnread(res.data.unread || 0);
    } catch { /* silent */ }
  };

  // Poll every 30 seconds
  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleOpen = () => {
    setOpen(o => !o);
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnread(0);
    } catch { /* silent */ }
  };

  const handleClick = async (n) => {
    if (!n.read) {
      try {
        await api.put(`/notifications/${n.id}/read`);
        setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
        setUnread(prev => Math.max(0, prev - 1));
      } catch { /* silent */ }
    }
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications(prev => prev.filter(n => n.id !== id));
      setUnread(prev => {
        const n = notifications.find(x => x.id === id);
        return n && !n.read ? Math.max(0, prev - 1) : prev;
      });
    } catch { /* silent */ }
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button className="notification-bell" onClick={handleOpen} title="Notifications">
        🔔
        {unread > 0 && (
          <span className="badge-dot" style={{
            position: 'absolute', top: 6, right: 6,
            width: 8, height: 8, borderRadius: '50%',
            background: '#ef4444', border: '2px solid var(--card-bg)'
          }} />
        )}
      </button>

      {open && (
        <div className="notification-dropdown">
          <div className="notification-dropdown-header">
            <h4>
              Notifications
              {unread > 0 && (
                <span style={{
                  marginLeft: 8, background: '#ef4444', color: '#fff',
                  borderRadius: 10, padding: '1px 7px', fontSize: '0.7rem', fontWeight: 700
                }}>
                  {unread}
                </span>
              )}
            </h4>
            {unread > 0 && (
              <button onClick={handleMarkAllRead}>Mark all read</button>
            )}
          </div>

          <div className="notification-list">
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                <div style={{ fontSize: '2rem', marginBottom: 8 }}>🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`notification-item ${!n.read ? 'unread' : ''}`}
                  onClick={() => handleClick(n)}
                >
                  <div className="notification-icon">
                    {TYPE_ICON[n.type] || 'ℹ️'}
                  </div>
                  <div className="notification-content">
                    <p style={{ fontWeight: !n.read ? 700 : 400 }}>{n.title}</p>
                    <p style={{ color: 'var(--text-muted)', marginTop: 2 }}>{n.message}</p>
                    <span className="notification-time">{timeAgo(n.created_at)}</span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(e, n.id)}
                    style={{
                      background: 'none', border: 'none', color: 'var(--text-muted)',
                      cursor: 'pointer', fontSize: '0.8rem', padding: '2px 4px',
                      borderRadius: 4, flexShrink: 0, opacity: 0.6
                    }}
                    title="Delete"
                  >
                    ✕
                  </button>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-dropdown-footer">
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
