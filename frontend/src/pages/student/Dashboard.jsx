import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const [items, setItems] = useState([])
  const nav = useNavigate()

  useEffect(() => {
    api.get('/assessments/my/').then(r => setItems(r.data))
  }, [])

  const badges = { test:'#e74c3c', assignment:'#f39c12', assessment:'#27ae60' }
  const labels = { test:'Test', assignment:'Weekly Assignment', assessment:'Weekly Assessment' }

  function doLogout() { logout(); nav('/login') }

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
        <div style={s.welcome}>
          <h1 style={{ fontSize:24, fontWeight:700 }}>Welcome, {user.first_name}! 👋</h1>
          <p style={{ color:'#666', marginTop:4 }}>Class: {user.student_class_name}</p>
        </div>

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

const s = {
  page:       { minHeight:'100vh', background:'#f0f4ff' },
  header:     { background:'#fff', padding:'14px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' },
  logo:       { fontSize:20, fontWeight:700, color:'#667eea' },
  navLink:    { color:'#555', textDecoration:'none', fontSize:14, fontWeight:500 },
  logoutBtn:  { background:'none', border:'1.5px solid #e0e0e0', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontSize:13, color:'#e74c3c' },
  main:       { maxWidth:1000, margin:'0 auto', padding:'2rem 1rem' },
  welcome:    { background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', borderRadius:12, padding:'1.5rem 2rem', marginBottom:2 },
  sectionTitle:{ fontSize:17, fontWeight:600, margin:'1.5rem 0 1rem' },
  grid:       { display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 },
  card:       { background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' },
  badge:      { fontSize:11, fontWeight:600, color:'#fff', padding:'3px 10px', borderRadius:99 },
  cardTitle:  { fontSize:16, fontWeight:600, margin:'4px 0' },
  cardSub:    { fontSize:13, color:'#888' },
  deadline:   { fontSize:12, color:'#e67e22', marginTop:6 },
  startBtn:   { marginTop:12, width:'100%', padding:'9px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer', fontSize:13 },
}