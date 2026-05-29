import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const [items, setItems] = useState([])
  const [overall, setOverall] = useState(null)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    api.get('/assessments/my/').then(r => setItems(r.data))
    api.get('/assessments/my/overall/').then(r => setOverall(r.data)).catch(() => {})
  }, [])

  const badges  = { test:'#e74c3c', assignment:'#f39c12', assessment:'#27ae60' }
  const labels  = { test:'Test', assignment:'Weekly Assignment', assessment:'Weekly Assessment' }
  const typeColors = { test:'#e74c3c', assignment:'#f39c12', assessment:'#27ae60' }
  const typeLabels = { test:'Tests', assignment:'Assignments', assessment:'Assessments' }

  function doLogout() { logout(); nav('/login') }

  function scoreColor(score) {
    if (score >= 70) return '#27ae60'
    if (score >= 50) return '#f39c12'
    return '#e74c3c'
  }

  function scoreEmoji(score) {
    if (score >= 70) return '🎉'
    if (score >= 50) return '👍'
    return '📚'
  }

  // circular progress helper
  function CircleProgress({ score, size = 90 }) {
    const r = (size / 2) - 8
    const circ = 2 * Math.PI * r
    const offset = circ - (score / 100) * circ
    const color = scoreColor(score)
    return (
      <svg width={size} height={size}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0f0f0" strokeWidth={7} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transform:'rotate(-90deg)', transformOrigin:'50% 50%', transition:'stroke-dashoffset 1s ease' }} />
        <text x="50%" y="50%" textAnchor="middle" dy="0.35em"
          style={{ fontSize: size * 0.2, fontWeight:700, fill: color, fontFamily:'sans-serif' }}>
          {score}%
        </text>
      </svg>
    )
  }

  return (
    <div style={s.page}>
      <header style={s.header}>
        <span style={s.logo}>AssessStud</span>
        <nav style={{ display:'flex', gap:20 }}>
          <Link to="/dashboard" style={s.navLink}>Dashboard</Link>
          <Link to="/learn" style={s.navLink}>Learn</Link>
          <button onClick={doLogout} style={s.logoutBtn}>Logout</button>
        </nav>
      </header>

      <main style={s.main}>
        {/* Welcome banner — unchanged */}
        <div style={s.welcome}>
          <h1 style={{ fontSize:24, fontWeight:700 }}>Welcome, {user.first_name}! 👋</h1>
          <p style={{ color:'rgba(255,255,255,0.8)', marginTop:4 }}>Class: {user.student_class_name}</p>
        </div>

        {/* ── OVERALL SCORE SECTION ── */}
        {overall && overall.total_assessments > 0 && (
          <div style={scoreSection}>

            {/* Top row */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
              <div>
                <h2 style={{ fontSize:17, fontWeight:700, color:'#1a1a2e', marginBottom:2 }}>
                  {scoreEmoji(overall.overall_score)} Overall Performance
                </h2>
                <p style={{ fontSize:13, color:'#888' }}>
                  All assessments from week 1 · {user.student_class_name}
                </p>
              </div>
              <button onClick={() => setShowBreakdown(!showBreakdown)}
                style={{ fontSize:12, color:'#667eea', background:'#f0f4ff', border:'none', padding:'6px 14px', borderRadius:99, cursor:'pointer', fontWeight:600 }}>
                {showBreakdown ? 'Hide details ↑' : 'View details ↓'}
              </button>
            </div>

            {/* Main stats row */}
            <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', gap:24, alignItems:'center', marginBottom:20 }}>

              {/* Circle */}
              <div style={{ textAlign:'center' }}>
                <CircleProgress score={overall.overall_score} size={100} />
                <p style={{ fontSize:11, color:'#888', marginTop:4 }}>Overall Score</p>
              </div>

              {/* Stats */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                <div style={statBox('#EAF3DE','#3B6D11')}>
                  <div style={{ fontSize:22, fontWeight:700 }}>{overall.submitted}</div>
                  <div style={{ fontSize:11, marginTop:2 }}>Submitted</div>
                </div>
                <div style={statBox('#FAEEDA','#854F0B')}>
                  <div style={{ fontSize:22, fontWeight:700 }}>{overall.missed}</div>
                  <div style={{ fontSize:11, marginTop:2 }}>Missed (0%)</div>
                </div>
                <div style={statBox('#f0f4ff','#667eea')}>
                  <div style={{ fontSize:22, fontWeight:700 }}>{overall.total_assessments}</div>
                  <div style={{ fontSize:11, marginTop:2 }}>Total Posted</div>
                </div>
              </div>
            </div>

            {/* Progress bar */}
            <div style={{ marginBottom: showBreakdown ? 20 : 0 }}>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:12, color:'#888', marginBottom:6 }}>
                <span>Your progress</span>
                <span>{overall.overall_score}% / 100%</span>
              </div>
              <div style={{ height:10, background:'#f0f0f0', borderRadius:99, overflow:'hidden' }}>
                <div style={{
                  height:'100%', borderRadius:99,
                  width:`${overall.overall_score}%`,
                  background:`linear-gradient(90deg, ${scoreColor(overall.overall_score)}, ${scoreColor(overall.overall_score)}cc)`,
                  transition:'width 1s ease'
                }} />
              </div>
            </div>

            {/* Type summary pills */}
            {overall.type_summary && overall.type_summary.length > 0 && (
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom: showBreakdown ? 20 : 0 }}>
                {overall.type_summary.map(t => (
                  <div key={t.type} style={{
                    background:'#f9f9f9', borderRadius:10, padding:'8px 14px',
                    border:`1.5px solid ${typeColors[t.type]}22`,
                    display:'flex', alignItems:'center', gap:8
                  }}>
                    <div style={{ width:8, height:8, borderRadius:99, background:typeColors[t.type] }} />
                    <div>
                      <p style={{ fontSize:12, fontWeight:600, color:'#333' }}>{typeLabels[t.type]}</p>
                      <p style={{ fontSize:11, color:'#888' }}>{t.average}% avg · {t.missed} missed</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Detailed breakdown */}
            {showBreakdown && (
              <div style={{ borderTop:'1px solid #f0f0f0', paddingTop:16 }}>
                <p style={{ fontSize:13, fontWeight:600, color:'#555', marginBottom:10 }}>
                  All Assessments Breakdown
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:300, overflowY:'auto' }}>
                  {overall.breakdown.map((item, i) => (
                    <div key={item.id} style={{
                      display:'flex', alignItems:'center', gap:12,
                      padding:'10px 12px', borderRadius:8,
                      background: item.status === 'submitted' ? '#fafafa' : '#fff8f8',
                      border:`1px solid ${item.status === 'submitted' ? '#eee' : '#fdecea'}`
                    }}>
                      <div style={{
                        width:36, height:36, borderRadius:99,
                        background: item.status === 'submitted' ? scoreColor(item.score) + '18' : '#fdecea',
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:12, fontWeight:700,
                        color: item.status === 'submitted' ? scoreColor(item.score) : '#e74c3c',
                        flexShrink:0
                      }}>
                        {item.status === 'submitted' ? `${item.score}%` : '0%'}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <p style={{ fontSize:13, fontWeight:500, color:'#333',
                          overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                          {item.title}
                        </p>
                        <p style={{ fontSize:11, color:'#888' }}>
                          {typeLabels[item.type]} · {item.subject}
                        </p>
                      </div>
                      <div style={{ flexShrink:0, textAlign:'right' }}>
                        {item.status === 'submitted' ? (
                          <span style={{ fontSize:11, color:'#27ae60', fontWeight:600,
                            background:'#EAF3DE', padding:'2px 8px', borderRadius:99 }}>
                            ✓ Done
                          </span>
                        ) : item.status === 'missed' ? (
                          <span style={{ fontSize:11, color:'#e74c3c', fontWeight:600,
                            background:'#fdecea', padding:'2px 8px', borderRadius:99 }}>
                            Missed
                          </span>
                        ) : (
                          <span style={{ fontSize:11, color:'#f39c12', fontWeight:600,
                            background:'#FAEEDA', padding:'2px 8px', borderRadius:99 }}>
                            Pending
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── PENDING TASKS — unchanged ── */}
        <h2 style={s.sectionTitle}>Your Pending Tasks</h2>
        {items.length === 0 && <p style={{ color:'#888' }}>No assessments assigned yet.</p>}
        <div style={s.grid}>
          {items.map(({ assessment: a, is_submitted, score }) => (
            <div key={a.id} style={s.card}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ ...s.badge, background: badges[a.type] }}>{labels[a.type]}</span>
                {is_submitted && <span style={{ ...s.badge, background:'#27ae60' }}>✓ Submitted</span>}
              </div>
              <h3 style={s.cardTitle}>{a.title}</h3>
              <p style={s.cardSub}>{a.subject}</p>
              {a.end_datetime && (
                <p style={s.deadline}>⏰ Deadline: {new Date(a.end_datetime).toLocaleString()}</p>
              )}
              {a.start_datetime && (
                <p style={s.deadline}>📅 Opens: {new Date(a.start_datetime).toLocaleString()}</p>
              )}
              {score !== null && is_submitted && (
                <p style={{ color:'#27ae60', fontWeight:600, marginTop:6 }}>Score: {score}%</p>
              )}
              {!is_submitted && (
                <button style={s.startBtn} onClick={() => nav(`/assessment/${a.id}`)}>
                  Start →
                </button>
              )}
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

// ── helper styles ──
function statBox(bg, color) {
  return {
    background: bg, borderRadius:10, padding:'10px 14px',
    textAlign:'center', color
  }
}

const scoreSection = {
  background:'#fff',
  borderRadius:16,
  padding:'1.5rem',
  margin:'1.5rem 0',
  boxShadow:'0 4px 20px rgba(102,126,234,0.1)',
  border:'1px solid #e8ecff'
}

const s = {
  page:        { minHeight:'100vh', background:'#f0f4ff' },
  header:      { background:'#fff', padding:'14px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },
  logo:        { fontSize:20, fontWeight:700, color:'#667eea' },
  navLink:     { color:'#555', textDecoration:'none', fontSize:14, fontWeight:500 },
  logoutBtn:   { background:'none', border:'1.5px solid #e0e0e0', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13, color:'#e74c3c' },
  main:        { maxWidth:1000, margin:'0 auto', padding:'2rem 1rem' },
  welcome:     { background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', borderRadius:12, padding:'1.5rem 2rem', marginBottom:2 },
  sectionTitle:{ fontSize:17, fontWeight:600, margin:'1.5rem 0 1rem' },
  grid:        { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 },
  card:        { background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' },
  badge:       { fontSize:11, fontWeight:600, color:'#fff', padding:'3px 10px', borderRadius:99 },
  cardTitle:   { fontSize:16, fontWeight:600, margin:'4px 0' },
  cardSub:     { fontSize:13, color:'#888' },
  deadline:    { fontSize:12, color:'#e67e22', marginTop:6 },
  startBtn:    { marginTop:12, width:'100%', padding:'9px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 },
}