import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';

/* ── Scroll reveal hook ────────────────────────────────────────────────────── */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.12 }
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/* ── 3D tilt hook ──────────────────────────────────────────────────────────── */
function useTilt(ref) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width  - 0.5;
      const y = (e.clientY - r.top)  / r.height - 0.5;
      el.style.transform = `perspective(800px) rotateY(${x * 14}deg) rotateX(${-y * 14}deg) scale(1.02)`;
    };
    const onLeave = () => { el.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)'; };
    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => { el.removeEventListener('mousemove', onMove); el.removeEventListener('mouseleave', onLeave); };
  }, []);
}

/* ── Animated counter ──────────────────────────────────────────────────────── */
function Counter({ target, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const num = parseInt(target.replace(/[^0-9]/g, ''));
      const dur = 1600;
      const step = 16;
      const inc = num / (dur / step);
      let cur = 0;
      const t = setInterval(() => {
        cur = Math.min(cur + inc, num);
        setVal(Math.floor(cur));
        if (cur >= num) clearInterval(t);
      }, step);
    }, { threshold: 0.5 });
    if (ref.current) io.observe(ref.current);
    return () => io.disconnect();
  }, [target]);
  const prefix = target.match(/^[^0-9]*/)?.[0] || '';
  const suf    = target.match(/[^0-9]*$/)?.[0] || '';
  return <span ref={ref}>{prefix}{val.toLocaleString()}{suf}{suffix}</span>;
}

/* ── Design tokens ─────────────────────────────────────────────────────────── */
const C = {
  primary:     '#4f46e5',
  secondary:   '#7c3aed',
  accent:      '#06b6d4',
  dark:        '#0f172a',
  text:        '#1e293b',
  muted:       '#64748b',
  light:       '#f8fafc',
  border:      '#e2e8f0',
  grad:        'linear-gradient(135deg,#4f46e5 0%,#7c3aed 55%,#06b6d4 100%)',
  gradLight:   'linear-gradient(135deg,#ede9fe 0%,#dbeafe 100%)',
};

/* ── Shared button ─────────────────────────────────────────────────────────── */
function Btn({ children, to, href, variant = 'primary', onClick, style = {} }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 8,
    padding: '11px 26px', borderRadius: 50, fontWeight: 700,
    fontSize: '0.9rem', cursor: 'pointer', border: 'none',
    textDecoration: 'none', transition: 'all 0.22s', whiteSpace: 'nowrap',
    fontFamily: 'inherit',
  };
  const v = {
    primary: { background: C.grad, color: '#fff', boxShadow: '0 4px 18px rgba(79,70,229,0.38)' },
    outline: { background: 'transparent', color: C.primary, border: `2px solid ${C.primary}` },
    white:   { background: '#fff', color: C.primary, boxShadow: '0 4px 18px rgba(0,0,0,0.13)' },
    ghost:   { background: 'rgba(255,255,255,0.15)', color: '#fff', border: '2px solid rgba(255,255,255,0.45)', backdropFilter: 'blur(8px)' },
  };
  const merged = { ...base, ...v[variant], ...style };
  if (to)   return <Link to={to} style={merged}>{children}</Link>;
  if (href) return <a href={href} style={merged}>{children}</a>;
  return <button style={merged} onClick={onClick}>{children}</button>;
}

/* ── Section header ────────────────────────────────────────────────────────── */
function SectionHead({ badge, title, sub }) {
  return (
    <div style={{ textAlign: 'center', maxWidth: 580, margin: '0 auto' }}>
      <span style={{
        display: 'inline-block', background: '#ede9fe', color: '#5b21b6',
        borderRadius: 50, padding: '4px 14px', fontSize: '0.78rem',
        fontWeight: 700, marginBottom: 14,
      }}>{badge}</span>
      <h2 style={{
        fontSize: 'clamp(1.75rem,3.5vw,2.4rem)', fontWeight: 900,
        color: C.text, marginBottom: 12, lineHeight: 1.2, letterSpacing: '-0.5px',
      }}>{title}</h2>
      <p style={{ fontSize: '1rem', color: C.muted, lineHeight: 1.7 }}>{sub}</p>
    </div>
  );
}

/* ── Navbar ────────────────────────────────────────────────────────────────── */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
      background: scrolled ? 'rgba(255,255,255,0.96)' : 'transparent',
      backdropFilter: scrolled ? 'blur(14px)' : 'none',
      borderBottom: scrolled ? `1px solid ${C.border}` : 'none',
      transition: 'all 0.3s',
    }}>
      <div style={{
        maxWidth: 1200, margin: '0 auto', padding: '0 28px',
        height: 66, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <Link to="/" style={{
          fontSize: '1.5rem', fontWeight: 900, textDecoration: 'none',
          background: C.grad, WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          letterSpacing: '-0.5px',
        }}>OTMS</Link>

        {/* Nav links — hidden on mobile via inline media workaround */}
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {['Features', 'How It Works', 'About', 'Contact'].map(l => (
            <a key={l} href={`#${l.toLowerCase().replace(/ /g, '-')}`} style={{
              color: scrolled ? C.text : '#fff', fontWeight: 500,
              fontSize: '0.875rem', textDecoration: 'none',
              padding: '6px 12px', borderRadius: 8, transition: 'all 0.2s',
            }}>{l}</a>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <Btn to="/login" variant="outline" style={{
            padding: '8px 20px', fontSize: '0.85rem',
            color: scrolled ? C.primary : '#fff',
            borderColor: scrolled ? C.primary : 'rgba(255,255,255,0.6)',
          }}>Sign In</Btn>
          <Btn to="/register" variant="primary" style={{ padding: '8px 20px', fontSize: '0.85rem' }}>
            Get Started
          </Btn>
        </div>
      </div>
    </nav>
  );
}

/* ── Hero ──────────────────────────────────────────────────────────────────── */
function Hero() {
  const tiltRef = useRef(null);
  useTilt(tiltRef);

  return (
    <section className="hero-bg" style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', position: 'relative', overflow: 'hidden', paddingTop: 66,
    }}>
      {/* Animated blobs */}
      {[
        { top: '8%',  left: '4%',  size: '420px' },
        { top: '55%', left: '68%', size: '320px' },
        { top: '75%', left: '18%', size: '260px' },
      ].map((b, i) => (
        <div key={i} className="blob" style={{
          position: 'absolute', top: b.top, left: b.left,
          width: b.size, height: b.size, borderRadius: '50%',
          background: 'rgba(255,255,255,0.07)', filter: 'blur(50px)', pointerEvents: 'none',
        }} />
      ))}

      {/* Spinning ring decoration */}
      <div style={{
        position: 'absolute', top: '15%', right: '8%',
        width: 120, height: 120, borderRadius: '50%',
        border: '2px dashed rgba(255,255,255,0.15)',
        animation: 'spinSlow 20s linear infinite', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', left: '5%',
        width: 80, height: 80, borderRadius: '50%',
        border: '2px dashed rgba(255,255,255,0.12)',
        animation: 'spinSlow 15s linear infinite reverse', pointerEvents: 'none',
      }} />

      <div className="lp-hero-cols" style={{
        maxWidth: 1200, margin: '0 auto', padding: '80px 28px',
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center',
        width: '100%',
      }}>
        {/* Left — text content */}
        <div>
          <div className="anim-fade-up d-100" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.16)', backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.28)', borderRadius: 50,
            padding: '6px 16px', fontSize: '0.8rem', color: '#fff',
            fontWeight: 600, marginBottom: 24,
          }}>
            <span style={{ animation: 'pulseGlow 2s ease-in-out infinite', display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#4ade80' }} />
            Trusted by 10,000+ students
          </div>

          <h1 className="anim-fade-up d-200" style={{
            fontSize: 'clamp(2.4rem,5vw,3.8rem)', fontWeight: 900,
            color: '#fff', lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1.5px',
          }}>
            Smart Learning,<br />
            <span style={{
              background: 'linear-gradient(90deg,#fff,rgba(255,255,255,0.7),#fff)',
              backgroundSize: '400px 100%',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', animation: 'shimmer 3s linear infinite',
            }}>Simplified.</span>
          </h1>

          <p className="anim-fade-up d-300" style={{
            fontSize: '1.1rem', color: 'rgba(255,255,255,0.84)',
            lineHeight: 1.75, marginBottom: 36, maxWidth: 460,
          }}>
            The all-in-one platform for tutors and students. Manage courses,
            track attendance, submit assignments, and analyse performance — all in one place.
          </p>

          <div className="anim-fade-up d-400" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 44 }}>
            <Link to="/register" className="lp-btn-primary" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 50, fontWeight: 700,
              fontSize: '0.95rem', background: '#fff', color: C.primary,
              textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              transition: 'all 0.22s', fontFamily: 'inherit',
            }}>🚀 Get Started Free</Link>
            <Link to="/login" className="lp-btn-ghost" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '13px 28px', borderRadius: 50, fontWeight: 700,
              fontSize: '0.95rem', background: 'rgba(255,255,255,0.15)',
              color: '#fff', border: '2px solid rgba(255,255,255,0.45)',
              textDecoration: 'none', backdropFilter: 'blur(8px)',
              transition: 'all 0.22s', fontFamily: 'inherit',
            }}>Sign In →</Link>
          </div>

          <div className="anim-fade-up d-500" style={{ display: 'flex', gap: 32 }}>
            {[['10,000+','Students'],['500+','Tutors'],['98%','Satisfaction']].map(([n,l], i) => (
              <div key={l} className={`anim-count d-${600 + i * 100}`}>
                <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', lineHeight: 1 }}>
                  <Counter target={n} />
                </div>
                <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.65)', marginTop: 4 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — 3D tilt dashboard preview */}
        <div className="lp-hero-right anim-slide-left d-300" style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 380, width: '100%' }}>

          {/* Main dashboard card with 3D tilt */}
          <div ref={tiltRef} className="tilt-card anim-border-glow" style={{
            background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.24)', borderRadius: 20,
            padding: '22px 24px', color: '#fff',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: '0.68rem', opacity: 0.6, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student Dashboard</div>
                <div style={{ fontSize: '1rem', fontWeight: 700, marginTop: 3 }}>Welcome back, Jane! 👋</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(255,255,255,0.2)', display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1rem',
                animation: 'float 4s ease-in-out infinite',
              }}>🎓</div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 16 }}>
              {[['📚','3','Courses'],['✅','87%','Attendance'],['📝','2','Pending']].map(([ic,v,l], i) => (
                <div key={l} style={{
                  background: 'rgba(255,255,255,0.12)', borderRadius: 12,
                  padding: '12px 8px', textAlign: 'center',
                  transition: 'background 0.2s',
                  animation: `fadeUp 0.5s ease ${0.8 + i * 0.15}s both`,
                }}>
                  <div style={{ fontSize: '1rem' }}>{ic}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, marginTop: 4 }}>{v}</div>
                  <div style={{ fontSize: '0.66rem', opacity: 0.7, marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>

            <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 600, fontSize: '0.8rem' }}>📊 Performance Score</span>
                <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>78/100</span>
              </div>
              <div style={{ background: 'rgba(255,255,255,0.18)', borderRadius: 50, height: 7, overflow: 'hidden' }}>
                <div className="progress-animated" style={{
                  height: '100%', background: 'linear-gradient(90deg,rgba(255,255,255,0.9),rgba(255,255,255,0.6))',
                  borderRadius: 50,
                }} />
              </div>
            </div>
          </div>

          {/* Notification cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { icon: '🏆', title: 'Assignment Graded', sub: 'Score: 92/100', cls: 'notif-1' },
              { icon: '💳', title: 'Payment Confirmed', sub: '₹2,500 received ✅', cls: 'notif-2' },
            ].map(n => (
              <div key={n.title} className={n.cls} style={{
                background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.22)', borderRadius: 14,
                padding: '12px 14px', color: '#fff',
                transition: 'transform 0.2s, background 0.2s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.transform = 'scale(1.03)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ fontSize: '1rem', marginBottom: 4 }}>{n.icon}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, lineHeight: 1.4 }}>{n.title}</div>
                <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 2 }}>{n.sub}</div>
              </div>
            ))}
          </div>

          <div className="notif-3" style={{
            background: 'rgba(255,255,255,0.14)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.22)', borderRadius: 14,
            padding: '12px 18px', color: '#fff',
            display: 'flex', alignItems: 'center', gap: 12,
            transition: 'transform 0.2s, background 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.22)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.14)'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            <div style={{ fontSize: '1.2rem', animation: 'float 3s ease-in-out infinite' }}>📅</div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700 }}>Next Class in 30 minutes</div>
              <div style={{ fontSize: '0.72rem', opacity: 0.7, marginTop: 1 }}>Advanced Mathematics — Zoom</div>
            </div>
            <div style={{
              marginLeft: 'auto', background: 'rgba(255,255,255,0.2)',
              borderRadius: 8, padding: '4px 10px', fontSize: '0.72rem', fontWeight: 700,
              cursor: 'pointer', transition: 'background 0.2s',
            }}>Join →</div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Features ──────────────────────────────────────────────────────────────── */
function Features() {
  const items = [
    { icon: '📚', title: 'Course Management',      desc: 'Create courses with schedules, fees, and Zoom/Meet links. Students browse and enroll instantly.',          color: '#4f46e5' },
    { icon: '✅', title: 'Attendance Tracking',     desc: 'Tutors mark attendance per class. Students see live percentage with alerts when below 75%.',              color: '#7c3aed' },
    { icon: '📝', title: 'Assignment System',       desc: 'Post assignments with due dates. Students submit text or files. Tutors grade with detailed feedback.',    color: '#06b6d4' },
    { icon: '🤖', title: 'AI Performance Analysis', desc: 'Smart scoring from attendance, grades, and submission rate. Personalised insights and recommendations.', color: '#10b981' },
    { icon: '🎥', title: 'Live Classes',            desc: 'Integrated Zoom and Google Meet links on every course page. Join with a single click.',                  color: '#f59e0b' },
    { icon: '💰', title: 'Fee Management',          desc: 'Online card payments, manual cash recording, full transaction history, and CSV export.',                 color: '#ef4444' },
  ];

  return (
    <section id="features" style={{ padding: '100px 0', background: C.light }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div className="reveal">
          <SectionHead
            badge="✨ Features"
            title="Everything you need to teach and learn"
            sub="A complete platform built for modern online education — from course creation to AI-powered performance tracking."
          />
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))',
          gap: 22, marginTop: 56,
        }}>
          {items.map((f, i) => (
            <div key={f.title} className={`feature-card reveal`}
              style={{
                background: '#fff', borderRadius: 20, padding: 30,
                border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                transitionDelay: `${i * 0.08}s`,
              }}>
              <div className="feature-icon" style={{
                width: 54, height: 54, borderRadius: 14, marginBottom: 18,
                background: `${f.color}18`, display: 'flex',
                alignItems: 'center', justifyContent: 'center', fontSize: '1.55rem',
              }}>{f.icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: C.text, marginBottom: 9 }}>{f.title}</h3>
              <p style={{ fontSize: '0.875rem', color: C.muted, lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── How It Works ──────────────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { n: '01', icon: '📝', title: 'Create Account',       desc: 'Register as Student, Tutor, or Admin in under 60 seconds.' },
    { n: '02', icon: '📚', title: 'Join a Course',        desc: 'Browse available courses and enroll with one click.' },
    { n: '03', icon: '🎥', title: 'Attend Live Classes',  desc: 'Join Zoom or Google Meet sessions directly from the platform.' },
    { n: '04', icon: '📊', title: 'Track Your Progress',  desc: 'AI analyses your attendance and grades to give personalised insights.' },
  ];

  return (
    <section id="how-it-works" style={{ padding: '100px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div className="reveal">
          <SectionHead badge="🔄 Process" title="How OTMS works" sub="Get started in minutes. No setup required." />
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))',
          gap: 28, marginTop: 60,
        }}>
          {steps.map((s, i) => (
            <div key={s.n} className="step-card reveal" style={{
              textAlign: 'center', padding: '32px 22px', borderRadius: 20,
              background: C.light, border: '1px solid #f1f5f9', position: 'relative',
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
              transitionDelay: `${i * 0.1}s`,
            }}>
              <div style={{
                width: 50, height: 50, borderRadius: '50%', background: C.grad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.82rem', fontWeight: 800, color: '#fff', margin: '0 auto 14px',
                boxShadow: '0 4px 16px rgba(79,70,229,0.35)',
              }}>{s.n}</div>
              <div style={{ fontSize: '1.9rem', marginBottom: 12, animation: `float ${4 + i}s ease-in-out infinite` }}>{s.icon}</div>
              <h3 style={{ fontSize: '0.975rem', fontWeight: 700, color: C.text, marginBottom: 8 }}>{s.title}</h3>
              <p style={{ fontSize: '0.84rem', color: C.muted, lineHeight: 1.6 }}>{s.desc}</p>
              {i < steps.length - 1 && (
                <div style={{
                  position: 'absolute', top: 46, right: -14,
                  fontSize: '1.1rem', color: C.muted, zIndex: 1,
                  animation: 'fadeIn 1s ease infinite alternate',
                }}>→</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Stats banner ──────────────────────────────────────────────────────────── */
function Stats() {
  return (
    <section className="hero-bg" style={{ padding: '72px 0', position: 'relative', overflow: 'hidden' }}>
      {/* Subtle grid overlay */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.06,
        backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)',
        backgroundSize: '40px 40px', pointerEvents: 'none',
      }} />
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px', position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 28 }}>
          {[
            ['10,000+','Active Students','🎓'],
            ['500+','Expert Tutors','👨‍🏫'],
            ['1,200+','Courses Available','📚'],
            ['98%','Satisfaction Rate','⭐'],
          ].map(([n,l,ic], i) => (
            <div key={l} className="reveal" style={{ textAlign: 'center', transitionDelay: `${i * 0.1}s` }}>
              <div style={{ fontSize: '1.8rem', marginBottom: 8, animation: `float ${5 + i}s ease-in-out infinite` }}>{ic}</div>
              <div className="stat-num" style={{ fontSize: '2.6rem', fontWeight: 900, lineHeight: 1 }}>
                <Counter target={n} />
              </div>
              <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.72)', marginTop: 8, fontWeight: 500 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Testimonials ──────────────────────────────────────────────────────────── */
function Testimonials() {
  const items = [
    { name: 'Priya Sharma', role: 'BCA Student',       av: 'PS', color: '#4f46e5', text: 'OTMS completely changed how I study. The AI performance tracker helped me identify weak areas and improve my grades by 30%!' },
    { name: 'Rahul Verma',  role: 'Mathematics Tutor', av: 'RV', color: '#7c3aed', text: 'Managing 5 courses used to be a nightmare. Now I handle attendance, assignments, and payments all from one dashboard.' },
    { name: 'Anita Patel',  role: 'Institute Admin',   av: 'AP', color: '#06b6d4', text: 'The reports and analytics give us real-time insights into student performance. The CSV export saves us hours every month.' },
  ];

  return (
    <section id="about" style={{ padding: '100px 0', background: C.light }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div className="reveal">
          <SectionHead badge="💬 Testimonials" title="Loved by students and tutors" sub="Join thousands of learners who have transformed their education with OTMS." />
        </div>
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(290px,1fr))',
          gap: 22, marginTop: 56,
        }}>
          {items.map((t, i) => (
            <div key={t.name} className="testimonial-card reveal" style={{
              background: '#fff', borderRadius: 20, padding: 30,
              border: '1px solid #f1f5f9', boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
              transitionDelay: `${i * 0.12}s`,
            }}>
              <div style={{ color: '#fbbf24', fontSize: '0.95rem', marginBottom: 14, letterSpacing: 2 }}>★★★★★</div>
              <p style={{ fontSize: '0.9rem', color: C.muted, lineHeight: 1.72, marginBottom: 20, fontStyle: 'italic' }}>"{t.text}"</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{
                  width: 42, height: 42, borderRadius: '50%', background: t.color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.82rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                  boxShadow: `0 4px 12px ${t.color}55`,
                }}>{t.av}</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: C.text }}>{t.name}</div>
                  <div style={{ fontSize: '0.76rem', color: C.muted }}>{t.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── CTA ───────────────────────────────────────────────────────────────────── */
function CTA() {
  return (
    <section id="contact" style={{ padding: '100px 0', background: '#fff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div className="cta-card reveal" style={{
          maxWidth: 780, margin: '0 auto', padding: '64px 40px', textAlign: 'center',
          background: C.grad, borderRadius: 28, boxShadow: '0 24px 64px rgba(79,70,229,0.28)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* Animated grid overlay */}
          <div style={{
            position: 'absolute', inset: 0, opacity: 0.06,
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.8) 1px,transparent 1px)',
            backgroundSize: '32px 32px', pointerEvents: 'none',
          }} />
          {/* Spinning ring */}
          <div style={{
            position: 'absolute', top: -40, right: -40, width: 160, height: 160,
            borderRadius: '50%', border: '2px dashed rgba(255,255,255,0.2)',
            animation: 'spinSlow 18s linear infinite',
          }} />
          <div style={{ position: 'relative' }}>
            <div style={{ fontSize: '2.4rem', marginBottom: 14, animation: 'float 3s ease-in-out infinite' }}>🚀</div>
            <h2 style={{ fontSize: 'clamp(1.8rem,3.5vw,2.3rem)', fontWeight: 900, color: '#fff', marginBottom: 14, letterSpacing: '-0.5px' }}>
              Ready to transform your learning?
            </h2>
            <p style={{ fontSize: '1rem', color: 'rgba(255,255,255,0.82)', marginBottom: 36, lineHeight: 1.65 }}>
              Join 10,000+ students and 500+ tutors already using OTMS. Free to get started.
            </p>
            <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/register" className="lp-btn-white" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 28px', borderRadius: 50, fontWeight: 700,
                fontSize: '0.95rem', background: '#fff', color: C.primary,
                textDecoration: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
                transition: 'all 0.22s', fontFamily: 'inherit',
              }}>🎓 Start as Student</Link>
              <Link to="/register" className="lp-btn-ghost" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '13px 28px', borderRadius: 50, fontWeight: 700,
                fontSize: '0.95rem', background: 'rgba(255,255,255,0.15)',
                color: '#fff', border: '2px solid rgba(255,255,255,0.45)',
                textDecoration: 'none', backdropFilter: 'blur(8px)',
                transition: 'all 0.22s', fontFamily: 'inherit',
              }}>Join as Tutor →</Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Footer ────────────────────────────────────────────────────────────────── */
function Footer() {
  const col = { color: '#fff', fontWeight: 700, fontSize: '0.875rem', marginBottom: 14 };
  const lnk = { display: 'block', color: 'rgba(255,255,255,0.52)', fontSize: '0.84rem', marginBottom: 9, textDecoration: 'none' };

  return (
    <footer style={{ background: C.dark, padding: '60px 0 28px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 28px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 48 }}>
          <div>
            <div style={{
              fontSize: '1.5rem', fontWeight: 900, background: C.grad,
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', marginBottom: 12,
            }}>OTMS</div>
            <p style={{ fontSize: '0.84rem', color: 'rgba(255,255,255,0.52)', lineHeight: 1.7, maxWidth: 250 }}>
              The modern platform for online tuition management. Built for students, tutors, and institutions.
            </p>
          </div>
          {[
            ['Platform', ['Features','How It Works','Pricing','Security']],
            ['Company',  ['About Us','Blog','Careers','Contact']],
            ['Legal',    ['Privacy Policy','Terms of Service','Cookie Policy']],
          ].map(([title, links]) => (
            <div key={title}>
              <div style={col}>{title}</div>
              {links.map(l => <a key={l} href="#" style={lnk}>{l}</a>)}
            </div>
          ))}
        </div>
        <div style={{
          borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
        }}>
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>© 2026 OTMS. All rights reserved.</span>
          <div style={{ display: 'flex', gap: 10 }}>
            {['𝕏','in','f','📸'].map((ic, i) => (
              <a key={i} href="#" style={{
                width: 34, height: 34, borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '0.82rem', textDecoration: 'none', color: 'rgba(255,255,255,0.6)',
              }}>{ic}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ── All CSS animations injected as a style tag ────────────────────────────── */
const css = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  body { font-family: 'Inter', system-ui, sans-serif; margin: 0; }
  * { box-sizing: border-box; }

  /* ── Keyframes ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(32px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes slideLeft {
    from { opacity: 0; transform: translateX(48px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes float {
    0%,100% { transform: translateY(0px) rotate(0deg); }
    33%     { transform: translateY(-14px) rotate(1deg); }
    66%     { transform: translateY(-7px) rotate(-1deg); }
  }
  @keyframes floatSlow {
    0%,100% { transform: translateY(0px); }
    50%     { transform: translateY(-20px); }
  }
  @keyframes blobPulse {
    0%,100% { transform: scale(1) translate(0,0); opacity: 0.07; }
    33%     { transform: scale(1.15) translate(20px,-15px); opacity: 0.1; }
    66%     { transform: scale(0.9) translate(-10px,20px); opacity: 0.06; }
  }
  @keyframes shimmer {
    0%   { background-position: -400px 0; }
    100% { background-position: 400px 0; }
  }
  @keyframes gradientShift {
    0%   { background-position: 0% 50%; }
    50%  { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  @keyframes countUp {
    from { opacity: 0; transform: scale(0.5); }
    to   { opacity: 1; transform: scale(1); }
  }
  @keyframes spinSlow {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes pulseGlow {
    0%,100% { box-shadow: 0 0 0 0 rgba(79,70,229,0.4); }
    50%     { box-shadow: 0 0 0 16px rgba(79,70,229,0); }
  }
  @keyframes progressFill {
    from { width: 0%; }
    to   { width: 78%; }
  }
  @keyframes notifSlide {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes borderGlow {
    0%,100% { border-color: rgba(255,255,255,0.2); }
    50%     { border-color: rgba(255,255,255,0.5); }
  }
  @keyframes typewriter {
    from { width: 0; }
    to   { width: 100%; }
  }

  /* ── Animation utility classes ── */
  .anim-fade-up   { animation: fadeUp 0.7s cubic-bezier(0.22,1,0.36,1) both; }
  .anim-fade-in   { animation: fadeIn 0.6s ease both; }
  .anim-slide-left { animation: slideLeft 0.7s cubic-bezier(0.22,1,0.36,1) both; }
  .anim-float     { animation: float 6s ease-in-out infinite; }
  .anim-float-slow { animation: floatSlow 8s ease-in-out infinite; }
  .anim-count     { animation: countUp 0.6s cubic-bezier(0.34,1.56,0.64,1) both; }
  .anim-pulse-glow { animation: pulseGlow 2.5s ease-in-out infinite; }
  .anim-border-glow { animation: borderGlow 3s ease-in-out infinite; }

  /* ── Delay helpers ── */
  .d-100 { animation-delay: 0.1s; }
  .d-200 { animation-delay: 0.2s; }
  .d-300 { animation-delay: 0.3s; }
  .d-400 { animation-delay: 0.4s; }
  .d-500 { animation-delay: 0.5s; }
  .d-600 { animation-delay: 0.6s; }
  .d-700 { animation-delay: 0.7s; }
  .d-800 { animation-delay: 0.8s; }
  .d-900 { animation-delay: 0.9s; }
  .d-1000 { animation-delay: 1.0s; }
  .d-1100 { animation-delay: 1.1s; }
  .d-1200 { animation-delay: 1.2s; }

  /* ── Animated gradient hero background ── */
  .hero-bg {
    background: linear-gradient(135deg, #4f46e5, #7c3aed, #06b6d4, #4f46e5);
    background-size: 300% 300%;
    animation: gradientShift 8s ease infinite;
  }

  /* ── Animated blobs ── */
  .blob { animation: blobPulse 10s ease-in-out infinite; }
  .blob:nth-child(2) { animation-delay: -3s; animation-duration: 13s; }
  .blob:nth-child(3) { animation-delay: -6s; animation-duration: 11s; }

  /* ── 3D tilt card ── */
  .tilt-card {
    transition: transform 0.15s ease, box-shadow 0.15s ease;
    transform-style: preserve-3d;
    will-change: transform;
  }

  /* ── Feature card hover ── */
  .feature-card {
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease, border-color 0.3s ease;
    cursor: default;
  }
  .feature-card:hover {
    transform: translateY(-8px) scale(1.02);
    box-shadow: 0 24px 48px rgba(0,0,0,0.12) !important;
  }
  .feature-card:hover .feature-icon {
    transform: scale(1.15) rotate(-5deg);
  }
  .feature-icon {
    transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1);
  }

  /* ── Step card hover ── */
  .step-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .step-card:hover {
    transform: translateY(-6px);
    box-shadow: 0 16px 40px rgba(0,0,0,0.1) !important;
  }

  /* ── Testimonial card hover ── */
  .testimonial-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .testimonial-card:hover {
    transform: translateY(-5px) rotate(0.5deg);
    box-shadow: 0 20px 44px rgba(0,0,0,0.1) !important;
  }

  /* ── Stat number shimmer ── */
  .stat-num {
    background: linear-gradient(90deg, #fff 0%, rgba(255,255,255,0.6) 50%, #fff 100%);
    background-size: 400px 100%;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 3s linear infinite;
  }

  /* ── Progress bar animation ── */
  .progress-animated {
    animation: progressFill 1.8s cubic-bezier(0.22,1,0.36,1) 1.2s both;
  }

  /* ── Notification slide-in ── */
  .notif-1 { animation: notifSlide 0.5s ease 1.4s both; }
  .notif-2 { animation: notifSlide 0.5s ease 1.7s both; }
  .notif-3 { animation: notifSlide 0.5s ease 2.0s both; }

  /* ── CTA section ── */
  .cta-card {
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .cta-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 32px 80px rgba(79,70,229,0.4) !important;
  }

  /* ── Btn hover effects ── */
  .lp-btn-primary:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 8px 28px rgba(79,70,229,0.5) !important;
  }
  .lp-btn-white:hover {
    transform: translateY(-2px) scale(1.03);
    box-shadow: 0 8px 28px rgba(0,0,0,0.18) !important;
  }
  .lp-btn-ghost:hover {
    background: rgba(255,255,255,0.28) !important;
    transform: translateY(-2px);
  }

  /* ── Scroll reveal (IntersectionObserver driven) ── */
  .reveal {
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .reveal.visible {
    opacity: 1;
    transform: translateY(0);
  }
  .reveal-left {
    opacity: 0;
    transform: translateX(-28px);
    transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .reveal-left.visible {
    opacity: 1;
    transform: translateX(0);
  }
  .reveal-right {
    opacity: 0;
    transform: translateX(28px);
    transition: opacity 0.7s cubic-bezier(0.22,1,0.36,1), transform 0.7s cubic-bezier(0.22,1,0.36,1);
  }
  .reveal-right.visible {
    opacity: 1;
    transform: translateX(0);
  }

  /* ── Responsive ── */
  @media (max-width: 900px) {
    .lp-hero-cols { grid-template-columns: 1fr !important; }
    .lp-hero-right { display: none !important; }
    .lp-footer-cols { grid-template-columns: 1fr 1fr !important; }
  }
  @media (max-width: 560px) {
    .lp-footer-cols { grid-template-columns: 1fr !important; }
  }
`;

/* ── Main export ───────────────────────────────────────────────────────────── */
export default function Landing() {
  useReveal(); // activate scroll-triggered animations
  return (
    <>
      <style>{css}</style>
      <Navbar />
      <Hero />
      <Features />
      <HowItWorks />
      <Stats />
      <Testimonials />
      <CTA />
      <Footer />
    </>
  );
}