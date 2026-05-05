import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const C = {
  grad:    'linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#06b6d4 100%)',
  primary: '#4f46e5',
  text:    '#1e293b',
  muted:   '#64748b',
  border:  '#e2e8f0',
  light:   '#f8fafc',
  danger:  '#ef4444',
};

/* ── Floating label input with icon ─────────────────────────────────────────── */
function InputField({ icon, label, type = 'text', value, onChange, placeholder, required, extra }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const isPassword = type === 'password';
  const actualType = isPassword && showPw ? 'text' : type;

  return (
    <div style={{ marginBottom: 18 }}>
      <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: C.text, marginBottom: 6 }}>
        {label}
      </label>
      <div style={{
        display: 'flex', alignItems: 'center',
        border: `1.5px solid ${focused ? C.primary : C.border}`,
        borderRadius: 10, background: '#fff', overflow: 'hidden',
        boxShadow: focused ? '0 0 0 3px rgba(79,70,229,0.1)' : 'none',
        transition: 'all 0.2s',
      }}>
        <span style={{ padding: '0 12px', fontSize: '1rem', color: focused ? C.primary : C.muted, flexShrink: 0 }}>
          {icon}
        </span>
        <input
          type={actualType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', padding: '11px 0',
            fontSize: '0.9rem', color: C.text, background: 'transparent',
            fontFamily: 'inherit',
          }}
        />
        {isPassword && (
          <button type="button" onClick={() => setShowPw(s => !s)} style={{
            background: 'none', border: 'none', padding: '0 12px',
            cursor: 'pointer', fontSize: '1rem', color: C.muted,
          }}>
            {showPw ? '🙈' : '👁️'}
          </button>
        )}
        {extra}
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const { login }  = useAuth();
  const navigate   = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      if (user.role === 'student')     navigate('/student/dashboard');
      else if (user.role === 'tutor')  navigate('/tutor/dashboard');
      else                             navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Left panel ── */}
      <div style={{
        flex: '0 0 46%', background: C.grad, display: 'flex',
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '60px 48px', position: 'relative', overflow: 'hidden',
      }}>
        {/* Blobs */}
        {[['10%','8%','300px'],['60%','55%','220px'],['80%','5%','180px']].map(([t,l,s],i) => (
          <div key={i} style={{
            position: 'absolute', top: t, left: l, width: s, height: s,
            borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(40px)',
          }} />
        ))}

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 360 }}>
          <Link to="/" style={{
            fontSize: '2rem', fontWeight: 900, color: '#fff',
            textDecoration: 'none', letterSpacing: '-0.5px', display: 'block', marginBottom: 32,
          }}>OTMS</Link>

          {/* Mock card */}
          <div style={{
            background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.22)', borderRadius: 20,
            padding: 28, color: '#fff', marginBottom: 32,
          }}>
            <div style={{ fontSize: '0.72rem', opacity: 0.65, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Your Dashboard</div>
            <div style={{ fontSize: '1rem', fontWeight: 700, marginBottom: 18 }}>Welcome back! 👋</div>
            {[['📚','3 Courses enrolled'],['✅','87% Attendance'],['🏆','Latest grade: 92/100']].map(([ic,t]) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, fontSize: '0.84rem' }}>
                <span>{ic}</span><span style={{ opacity: 0.85 }}>{t}</span>
              </div>
            ))}
          </div>

          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#fff', marginBottom: 10 }}>
            Continue your learning journey
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.65 }}>
            Sign in to access your courses, assignments, and performance analytics.
          </p>
        </div>
      </div>

      {/* ── Right panel ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.light, padding: '40px 28px',
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {/* Logo for mobile */}
          <div style={{ textAlign: 'center', marginBottom: 32 }}>
            <Link to="/" style={{
              fontSize: '1.6rem', fontWeight: 900, textDecoration: 'none',
              background: C.grad, WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>OTMS</Link>
          </div>

          <div style={{
            background: '#fff', borderRadius: 20, padding: '36px 32px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: `1px solid ${C.border}`,
          }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: C.text, marginBottom: 4 }}>Welcome back</h1>
            <p style={{ fontSize: '0.875rem', color: C.muted, marginBottom: 28 }}>Sign in to your OTMS account</p>

            {error && (
              <div style={{
                background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca',
                borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem',
                marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8,
              }}>⚠️ {error}</div>
            )}

            <form onSubmit={handleSubmit}>
              <InputField
                icon="✉️" label="Email Address" type="email"
                value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" required
              />
              <InputField
                icon="🔒" label="Password" type="password"
                value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password" required
              />

              <div style={{ textAlign: 'right', marginTop: -10, marginBottom: 22 }}>
                <a href="#" style={{ fontSize: '0.8rem', color: C.primary, textDecoration: 'none', fontWeight: 600 }}>
                  Forgot password?
                </a>
              </div>

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: loading ? '#a5b4fc' : C.grad, color: '#fff',
                fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(79,70,229,0.35)', transition: 'all 0.2s',
                fontFamily: 'inherit',
              }}>
                {loading ? 'Signing in…' : 'Sign In →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 22, fontSize: '0.875rem', color: C.muted }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>
                Create one free
              </Link>
            </p>
          </div>

          {/* Demo credentials */}
          <div style={{
            marginTop: 20, background: '#fff', borderRadius: 14, padding: '16px 20px',
            border: `1px solid ${C.border}`, fontSize: '0.8rem', color: C.muted,
          }}>
            <div style={{ fontWeight: 700, color: C.text, marginBottom: 8 }}>🔑 Demo Accounts</div>
            {[['Admin','admin@otms.com','admin123'],['Tutor','tutor@otms.com','tutor123'],['Student','student@otms.com','student123']].map(([r,e,p]) => (
              <div key={r} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontWeight: 600 }}>{r}</span>
                <span style={{ cursor: 'pointer' }} onClick={() => { setEmail(e); setPassword(p); }}>
                  {e} / {p} <span style={{ color: C.primary }}>↑ use</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Responsive: hide left panel on small screens */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @media (max-width: 768px) {
          .auth-left-panel { display: none !important; }
        }
      `}</style>
    </div>
  );
}
