import React, { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import api from '../../utils/api';

// ── Mini bar chart (pure CSS/SVG, no library needed) ──────────────────────────
function BarChart({ data, color = '#4f46e5', height = 80 }) {
  if (!data || data.length === 0) return <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No data yet</p>;
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height, paddingTop: 8 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <div style={{ fontSize: '0.65rem', color: '#64748b', fontWeight: 600 }}>{d.value}%</div>
          <div style={{
            width: '100%',
            height: `${Math.max((d.value / max) * (height - 24), 4)}px`,
            background: d.value >= 75 ? '#10b981' : d.value >= 60 ? '#f59e0b' : '#ef4444',
            borderRadius: '4px 4px 0 0',
            transition: 'height 0.5s ease',
            minHeight: 4
          }} title={`${d.label}: ${d.value}%`} />
          <div style={{ fontSize: '0.6rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.2 }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

// ── Radial progress ring ───────────────────────────────────────────────────────
function ScoreRing({ score, grade, gradeLabel, color }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto' }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle cx="70" cy="70" r={r} fill="none" stroke={color || '#4f46e5'} strokeWidth="12"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center'
      }}>
        <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{score}</div>
        <div style={{ fontSize: '1rem', fontWeight: 700, color: color || '#4f46e5' }}>{grade}</div>
        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: 2 }}>{gradeLabel}</div>
      </div>
    </div>
  );
}

// ── Trend badge ────────────────────────────────────────────────────────────────
function TrendBadge({ trend }) {
  if (trend === 'improving') return <span style={{ color: '#10b981', fontSize: '0.8rem', fontWeight: 600 }}>📈 Improving</span>;
  if (trend === 'declining') return <span style={{ color: '#ef4444', fontSize: '0.8rem', fontWeight: 600 }}>📉 Declining</span>;
  return <span style={{ color: '#64748b', fontSize: '0.8rem', fontWeight: 600 }}>➡️ Stable</span>;
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function Analytics() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState('overview');

  useEffect(() => {
    api.get('/analytics/student/me')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="loading-inline"><div className="spinner"></div> Analysing your performance...</div></Layout>;
  if (!data)   return <Layout><div className="alert alert-error">Failed to load analytics. Please try again.</div></Layout>;

  const { performance: p, course_attendance, course_grades, att_trend, recent_grades, insights, strengths, weaknesses, recommendations } = data;

  const tabs = [
    { id: 'overview',    label: '📊 Overview'    },
    { id: 'attendance',  label: '✅ Attendance'  },
    { id: 'grades',      label: '🏆 Grades'      },
    { id: 'insights',    label: '🤖 AI Insights' },
  ];

  return (
    <Layout>
      <div className="page-header">
        <h1>📊 Performance Analytics</h1>
        <p>AI-powered deep analysis of your academic performance — {data.student}</p>
      </div>

      {/* Top KPI row */}
      <div className="stats-grid" style={{ gridTemplateColumns: 'repeat(5, 1fr)', marginBottom: 24 }}>
        {[
          { label: 'Performance Score', value: p.score,              suffix: '/100', color: p.gradeColor },
          { label: 'Attendance',        value: p.attendance_percent, suffix: '%',    color: p.attendance_percent >= 75 ? '#10b981' : '#ef4444' },
          { label: 'Avg Score',         value: p.avg_score,          suffix: '%',    color: p.avg_score >= 60 ? '#3b82f6' : '#f59e0b' },
          { label: 'Submitted',         value: p.submitted,          suffix: `/${p.total_assignments}`, color: '#6366f1' },
          { label: 'Overdue',           value: p.overdue,            suffix: '',     color: p.overdue > 0 ? '#ef4444' : '#10b981' },
        ].map(k => (
          <div key={k.label} className="stat-card">
            <div className="stat-info" style={{ width: '100%' }}>
              <div className="value" style={{ color: k.color }}>{k.value}<span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>{k.suffix}</span></div>
              <div className="label">{k.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: '2px solid #e2e8f0', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{
              padding: '10px 18px', border: 'none', background: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '0.875rem',
              color: tab === t.id ? '#4f46e5' : '#64748b',
              borderBottom: tab === t.id ? '2px solid #4f46e5' : '2px solid transparent',
              marginBottom: -2, transition: 'all 0.2s'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: 20 }}>
          {/* Score ring */}
          <div className="card" style={{ textAlign: 'center' }}>
            <h3 className="card-title" style={{ marginBottom: 20 }}>Overall Score</h3>
            <ScoreRing score={p.score} grade={p.grade} gradeLabel={p.gradeLabel} color={p.gradeColor} />
            <div style={{ marginTop: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { label: 'Attendance', value: `${p.attendance_percent}%`, color: '#4f46e5' },
                { label: 'Avg Score',  value: `${p.avg_score}%`,          color: '#10b981' },
                { label: 'Submitted',  value: `${p.submission_rate}%`,    color: '#f59e0b' },
                { label: 'Score Trend', value: <TrendBadge trend={p.score_trend} />, color: '#64748b' },
              ].map(s => (
                <div key={s.label} style={{ padding: '10px 8px', background: '#f8fafc', borderRadius: 8 }}>
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, padding: '10px 14px', background: p.gradeColor + '18', borderRadius: 8, border: `1px solid ${p.gradeColor}40` }}>
              <div style={{ fontWeight: 700, color: p.gradeColor, fontSize: '0.9rem' }}>Grade {p.grade} — {p.gradeLabel}</div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                Weighted: 35% attendance + 50% scores + 15% submission rate
              </div>
            </div>
          </div>

          {/* Right column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Strengths & Weaknesses */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="card">
                <h4 style={{ fontWeight: 700, color: '#10b981', marginBottom: 12, fontSize: '0.95rem' }}>💪 Strengths</h4>
                {strengths.length === 0
                  ? <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Keep working — strengths will appear here.</p>
                  : strengths.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.875rem' }}>
                      <span style={{ color: '#10b981' }}>✓</span> {s}
                    </div>
                  ))}
              </div>
              <div className="card">
                <h4 style={{ fontWeight: 700, color: '#ef4444', marginBottom: 12, fontSize: '0.95rem' }}>⚠️ Areas to Improve</h4>
                {weaknesses.length === 0
                  ? <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>No major weaknesses detected. 🎉</p>
                  : weaknesses.map((w, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '0.875rem' }}>
                      <span style={{ color: '#ef4444' }}>✗</span> {w}
                    </div>
                  ))}
              </div>
            </div>

            {/* Recent grades */}
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Recent Grades</h3>
              {recent_grades.length === 0 ? (
                <div className="empty-state" style={{ padding: '20px 0' }}>
                  <div className="icon">📝</div>
                  <h3>No graded assignments yet</h3>
                </div>
              ) : (
                <div>
                  {recent_grades.map((g, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{g.title}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{g.course}</div>
                        {g.feedback && <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 2, fontStyle: 'italic' }}>"{g.feedback}"</div>}
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 700, fontSize: '1rem', color: g.pct >= 75 ? '#10b981' : g.pct >= 50 ? '#f59e0b' : '#ef4444' }}>
                          {g.score}/{g.max}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{g.pct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE TAB ── */}
      {tab === 'attendance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Total Classes', value: p.total_classes,   color: '#4f46e5', bg: '#e0e7ff' },
              { label: 'Present',       value: p.present_classes, color: '#10b981', bg: '#d1fae5' },
              { label: 'Late',          value: p.late_classes,    color: '#f59e0b', bg: '#fef3c7' },
              { label: 'Absent',        value: p.absent_classes,  color: '#ef4444', bg: '#fee2e2' },
            ].map(s => (
              <div key={s.label} style={{ padding: 20, borderRadius: 12, background: s.bg, textAlign: 'center' }}>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Overall progress bar */}
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
              <span style={{ fontWeight: 600 }}>Overall Attendance</span>
              <span style={{ fontWeight: 800, color: p.attendance_percent >= 75 ? '#10b981' : '#ef4444', fontSize: '1.1rem' }}>
                {p.attendance_percent}%
              </span>
            </div>
            <div style={{ height: 14, background: '#e2e8f0', borderRadius: 7, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 7, transition: 'width 1s ease',
                width: `${p.attendance_percent}%`,
                background: p.attendance_percent >= 75 ? '#10b981' : p.attendance_percent >= 60 ? '#f59e0b' : '#ef4444'
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: '0.75rem', color: '#94a3b8' }}>
              <span>0%</span>
              <span style={{ color: '#f59e0b' }}>60% (Warning)</span>
              <span style={{ color: '#10b981' }}>75% (Required)</span>
              <span>100%</span>
            </div>
            {p.attendance_percent < 75 && p.total_classes > 0 && (
              <div className="alert alert-warning" style={{ marginTop: 12, marginBottom: 0 }}>
                ⚠️ You need to attend <strong>{Math.ceil((0.75 * p.total_classes - p.present_classes) / 0.25)}</strong> more consecutive classes to reach 75%.
              </div>
            )}
          </div>

          {/* Monthly trend */}
          {att_trend.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Monthly Attendance Trend</h3>
              <BarChart
                data={att_trend.map(t => ({ label: t.month.slice(5), value: t.pct }))}
                height={100}
              />
            </div>
          )}

          {/* Per-course breakdown */}
          {course_attendance.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Per-Course Attendance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {course_attendance.map((c, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                      <div>
                        <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>{c.title}</span>
                        <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 8 }}>{c.subject}</span>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: '0.8rem', color: '#64748b' }}>
                        <span>✅ {c.present}</span>
                        <span>⏰ {c.late}</span>
                        <span>❌ {c.total - c.present - c.late}</span>
                        <span style={{ fontWeight: 700, color: c.pct >= 75 ? '#10b981' : '#ef4444' }}>{c.pct}%</span>
                      </div>
                    </div>
                    <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 4, width: `${c.pct}%`,
                        background: c.pct >= 75 ? '#10b981' : c.pct >= 60 ? '#f59e0b' : '#ef4444',
                        transition: 'width 0.8s ease'
                      }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── GRADES TAB ── */}
      {tab === 'grades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Score summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { label: 'Average Score', value: `${p.avg_score}%`,  color: '#4f46e5', bg: '#e0e7ff' },
              { label: 'Highest Score', value: `${p.high_score}%`, color: '#10b981', bg: '#d1fae5' },
              { label: 'Lowest Score',  value: `${p.low_score}%`,  color: '#ef4444', bg: '#fee2e2' },
              { label: 'Score Trend',   value: <TrendBadge trend={p.score_trend} />, color: '#64748b', bg: '#f1f5f9' },
            ].map(s => (
              <div key={s.label} style={{ padding: 20, borderRadius: 12, background: s.bg, textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Per-course grades */}
          {course_grades.length > 0 && (
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>Per-Course Performance</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {course_grades.map((c, i) => {
                  const { grade, color } = gradeFromScoreClient(c.avg);
                  return (
                    <div key={i} style={{ padding: '14px 16px', background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div>
                          <span style={{ fontWeight: 600 }}>{c.title}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 8 }}>{c.subject}</span>
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', marginLeft: 8 }}>({c.count} graded)</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <TrendBadge trend={c.trend} />
                          <span style={{ fontWeight: 800, fontSize: '1.1rem', color }}>{c.avg}%</span>
                          <span style={{ fontWeight: 700, color, background: color + '20', padding: '2px 8px', borderRadius: 6, fontSize: '0.85rem' }}>{grade}</span>
                        </div>
                      </div>
                      <div style={{ height: 8, background: '#e2e8f0', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', borderRadius: 4, width: `${c.avg}%`, background: color, transition: 'width 0.8s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* All recent grades */}
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>Recent Assignment Grades</h3>
            {recent_grades.length === 0 ? (
              <div className="empty-state"><div className="icon">📝</div><h3>No graded assignments yet</h3></div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr><th>Assignment</th><th>Course</th><th>Score</th><th>Percentage</th><th>Feedback</th></tr>
                  </thead>
                  <tbody>
                    {recent_grades.map((g, i) => {
                      const { color } = gradeFromScoreClient(g.pct);
                      return (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{g.title}</td>
                          <td style={{ color: '#64748b' }}>{g.course}</td>
                          <td style={{ fontWeight: 700 }}>{g.score}/{g.max}</td>
                          <td>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ flex: 1, height: 6, background: '#e2e8f0', borderRadius: 3, overflow: 'hidden', minWidth: 60 }}>
                                <div style={{ height: '100%', width: `${g.pct}%`, background: color, borderRadius: 3 }} />
                              </div>
                              <span style={{ fontWeight: 700, color, minWidth: 36 }}>{g.pct}%</span>
                            </div>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic' }}>
                            {g.feedback || '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── AI INSIGHTS TAB ── */}
      {tab === 'insights' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>🤖 AI Analysis</h3>
            <p style={{ color: '#64748b', fontSize: '0.875rem', marginBottom: 20 }}>
              Based on your attendance ({p.attendance_percent}%), academic scores ({p.avg_score}%), and submission rate ({p.submission_rate}%), here's what the AI found:
            </p>
            {insights.map((ins, i) => (
              <div key={i} className={`insight-card ${ins.type}`} style={{ marginBottom: 10 }}>
                <span style={{ fontSize: '1.1rem' }}>{ins.icon}</span>
                <span>{ins.text}</span>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>💪 Your Strengths</h3>
              {strengths.length === 0 ? (
                <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>Keep working — your strengths will appear here as you progress.</p>
              ) : (
                strengths.map((s, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                    <span style={{ color: '#10b981', fontWeight: 700, fontSize: '1rem' }}>✓</span>
                    <span>{s}</span>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3 className="card-title" style={{ marginBottom: 16 }}>⚠️ Areas to Improve</h3>
              {weaknesses.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0' }}>
                  <div style={{ fontSize: '2rem' }}>🎉</div>
                  <p style={{ color: '#10b981', fontWeight: 600, marginTop: 8 }}>No major weaknesses!</p>
                </div>
              ) : (
                weaknesses.map((w, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #f1f5f9', fontSize: '0.875rem' }}>
                    <span style={{ color: '#ef4444', fontWeight: 700, fontSize: '1rem' }}>✗</span>
                    <span>{w}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card">
            <h3 className="card-title" style={{ marginBottom: 16 }}>💡 Personalised Recommendations</h3>
            {recommendations.length === 0 ? (
              <p style={{ color: '#64748b' }}>No specific recommendations. You're doing great!</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {recommendations.map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 16px', background: '#f8fafc', borderRadius: 8, borderLeft: '4px solid #4f46e5' }}>
                    <span style={{ color: '#4f46e5', fontWeight: 700, fontSize: '1rem', flexShrink: 0 }}>{i + 1}.</span>
                    <span style={{ fontSize: '0.9rem', color: '#1e293b', lineHeight: 1.6 }}>{r}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}

// Client-side grade helper (mirrors backend)
function gradeFromScoreClient(score) {
  if (score >= 90) return { grade: 'A+', color: '#10b981' };
  if (score >= 80) return { grade: 'A',  color: '#3b82f6' };
  if (score >= 70) return { grade: 'B',  color: '#6366f1' };
  if (score >= 60) return { grade: 'C',  color: '#f59e0b' };
  if (score >= 50) return { grade: 'D',  color: '#f97316' };
  return             { grade: 'F',  color: '#ef4444' };
}
