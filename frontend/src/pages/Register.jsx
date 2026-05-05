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
};

function InputField({ icon, label, type = 'text', name, value, onChange, placeholder, required }) {
  const [focused, setFocused] = useState(false);
  const [showPw, setShowPw]   = useState(false);
  const isPassword = type === 'password';
  const actualType = isPassword && showPw ? 'text' : type;

  return (
    <div style={{ marginBottom: 16 }}>
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
          type={actualType} name={name} value={value} onChange={onChange}
          placeholder={placeholder} required={required}
          onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
          style={{
            flex: 1, border: 'none', outline: 'none', padding: '11px 0',
            fontSize: '0.9rem', color: C.text, background: 'transparent', fontFamily: 'inherit',
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
      </div>
    </div>
  );
}

const ROLES = [
  { value: 'student', icon: '🎓', label: 'Student',       desc: 'Learn & grow'     },
  { value: 'tutor',   icon: '👨‍🏫', label: 'Tutor',         desc: 'Teach & earn'     },
  { value: 'admin',   icon: '⚙️',  label: 'Administrator', desc: 'Manage platform'  },
];

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'student' });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) return setError('Password must be at least 6 characters.');
    setLoading(true);
    try {
      const user = await register(form.name, form.email, form.password, form.role);
      if (user.role === 'student')    navigate('/student/dashboard');
      else if (user.role === 'tutor') navigate('/tutor/dashboard');
      else                            navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const strength = form.password.length === 0 ? 0 : form.password.length < 6 ? 1 : form.password.length < 10 ? 2 : 3;
  const strengthColor = ['#e2e8f0','#ef4444','#f59e0b','#10b981'][strength];
  const strengthLabel = ['','Weak','Fair','Strong'][strength];

  return (
    <div style={{ minHeight: '100vh', display: 'flex', fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* ── Left decorative panel ── */}
      <div style={{
        flex: '0 0 42%', background: C.grad, display: 'flex',
        flexDirection: 'column', justifyContent: 'center', alignItems: 'center',
        padding: '60px 44px', position: 'relative', overflow: 'hidden',
      }}>
        {[['8%','6%','320px'],['58%','52%','240px'],['78%','4%','190px']].map(([t,l,s],i) => (
          <div key={i} style={{
            position: 'absolute', top: t, left: l, width: s, height: s,
            borderRadius: '50%', background: 'rgba(255,255,255,0.08)', filter: 'blur(44px)',
          }} />
        ))}

        <div style={{ position: 'relative', textAlign: 'center', maxWidth: 340 }}>
          <Link to="/" style={{
            fontSize: '2rem', fontWeight: 900, color: '#fff',
            textDecoration: 'none', letterSpacing: '-0.5px', display: 'block', marginBottom: 36,
          }}>OTMS</Link>

          <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: 14, lineHeight: 1.2 }}>
            Start your learning journey today
          </h2>
          <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.75)', lineHeight: 1.7, marginBottom: 36 }}>
            Join 10,000+ students and 500+ tutors on the most complete online tuition platform.
          </p>

          {/* Feature list */}
          {[
            '✅ AI-powered performance analysis',
            '📚 100+ courses across all subjects',
            '🎥 Live Zoom & Google Meet classes',
            '📊 Real-time attendance tracking',
            '💳 Secure online fee payments',
          ].map(f => (
            <div key={f} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              marginBottom: 12, fontSize: '0.875rem', color: 'rgba(255,255,255,0.88)',
            }}>{f}</div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: C.light, padding: '40px 28px', overflowY: 'auto',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <Link to="/" style={{
              fontSize: '1.6rem', fontWeight: 900, textDecoration: 'none',
              background: C.grad, WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>OTMS</Link>
          </div>

          <div style={{
            background: '#fff', borderRadius: 20, padding: '32px 30px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.07)', border: `1px solid ${C.border}`,
          }}>
            <h1 style={{ fontSize: '1.45rem', fontWeight: 800, color: C.text, marginBottom: 4 }}>Create your account</h1>
            <p style={{ fontSize: '0.875rem', color: C.muted, marginBottom: 24 }}>Join OTMS — it's free to get started</p>

            {error && (
              <div style={{
                background: '#fee2e2', color: '#991b1b', border: '1px solid #fecaca',
                borderRadius: 10, padding: '10px 14px', fontSize: '0.85rem',
                marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8,
              }}>⚠️ {error}</div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Role selector */}
              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: C.text, marginBottom: 8 }}>
                  I am a…
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
                  {ROLES.map(r => (
                    <div key={r.value} onClick={() => setForm({ ...form, role: r.value })} style={{
                      border: `2px solid ${form.role === r.value ? C.primary : C.border}`,
                      borderRadius: 12, padding: '12px 8px', textAlign: 'center',
                      cursor: 'pointer', transition: 'all 0.2s',
                      background: form.role === r.value ? '#ede9fe' : '#fff',
                    }}>
                      <div style={{ fontSize: '1.4rem', marginBottom: 4 }}>{r.icon}</div>
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: form.role === r.value ? C.primary : C.text }}>
                        {r.label}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: C.muted, marginTop: 2 }}>{r.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              <InputField icon="👤" label="Full Name"      type="text"     name="name"     value={form.name}     onChange={handleChange} placeholder="John Doe"          required />
              <InputField icon="✉️" label="Email Address"  type="email"    name="email"    value={form.email}    onChange={handleChange} placeholder="you@example.com"   required />
              <InputField icon="🔒" label="Password"       type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 characters" required />

              {/* Password strength */}
              {form.password.length > 0 && (
                <div style={{ marginTop: -8, marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 4, marginBottom: 4 }}>
                    {[1,2,3].map(i => (
                      <div key={i} style={{
                        flex: 1, height: 4, borderRadius: 2,
                        background: i <= strength ? strengthColor : C.border,
                        transition: 'background 0.3s',
                      }} />
                    ))}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: strengthColor, fontWeight: 600 }}>
                    {strengthLabel}
                  </div>
                </div>
              )}

              <button type="submit" disabled={loading} style={{
                width: '100%', padding: '13px', borderRadius: 12, border: 'none',
                background: loading ? '#a5b4fc' : C.grad, color: '#fff',
                fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 16px rgba(79,70,229,0.35)', transition: 'all 0.2s',
                fontFamily: 'inherit', marginTop: 4,
              }}>
                {loading ? 'Creating account…' : 'Create Account →'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.875rem', color: C.muted }}>
              Already have an account?{' '}
              <Link to="/login" style={{ color: C.primary, fontWeight: 700, textDecoration: 'none' }}>
                Sign in
              </Link>
            </p>
          </div>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: '0.76rem', color: C.muted }}>
            By creating an account you agree to our{' '}
            <a href="#" style={{ color: C.primary }}>Terms of Service</a> and{' '}
            <a href="#" style={{ color: C.primary }}>Privacy Policy</a>.
          </p>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        @media (max-width: 768px) { .reg-left { display: none !important; } }
      `}</style>
    </div>
  );
}
