import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [assessments, setAssessments] = useState([])
  const [stats, setStats] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    api.get('/assessments/').then(r => setAssessments(r.data))
    api.get('/auth/stats/').then(r => setStats(r.data)).catch(() => {})
  }, [])

  const typeColors = { test:'#e74c3c', assignment:'#f39c12', assessment:'#27ae60' }
  const typeLabels = { test:'Test', assignment:'Assignment', assessment:'Assessment' }

  const navLinks = [
    ['Dashboard','/admin/dashboard'],
    ['Add Question','/admin/questions'],
    ['New Assessment','/admin/create'],
    ['Content','/admin/content'],
    ['Users','/admin/users'],
    ['Visitors',      '/admin/visitors'],
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>
      <header style={{ background:'#1a1a2e', padding:'14px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:20, fontWeight:700, color:'#fff' }}>
          AssessStud <span style={{ fontSize:12, background:'#667eea', padding:'2px 8px', borderRadius:99, marginLeft:8 }}>Admin</span>
        </span>
        <nav style={{ display:'flex', gap:16 }}>
          {navLinks.map(([label,path]) => (
            <Link key={path} to={path} style={{ color:'#ccc', textDecoration:'none', fontSize:13, fontWeight:500 }}>{label}</Link>
          ))}
          <button onClick={() => { logout(); nav('/admin/login') }}
            style={{ background:'none', border:'1px solid #555', color:'#ccc', padding:'5px 12px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            Logout
          </button>
        </nav>
      </header>

      <main style={{ maxWidth:1100, margin:'2rem auto', padding:'0 1rem' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700 }}>Welcome, {user.first_name}</h1>
            <p style={{ color:'#888', fontSize:14 }}>Manage your assessments and content</p>
          </div>
          <Link to="/admin/create" style={{ padding:'10px 20px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', borderRadius:10, textDecoration:'none', fontWeight:600, fontSize:14 }}>
            + New Assessment
          </Link>
        </div>

        {/* Stats */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
            <div style={statCard}>
              <div style={statNum}>{stats.total_students}</div>
              <div style={statLbl}>Total Students</div>
            </div>
            <div style={statCard}>
              <div style={statNum}>{stats.total_admins}</div>
              <div style={statLbl}>Total Admins</div>
            </div>
            {stats.per_class.map(c => (
              <div key={c.class} style={statCard}>
                <div style={statNum}>{c.count}</div>
                <div style={statLbl}>{c.class}</div>
              </div>
            ))}
            <Link to="/admin/users" style={{ ...statCard, textDecoration:'none', display:'block', background:'linear-gradient(135deg,#667eea,#764ba2)', cursor:'pointer' }}>
              <div style={{ ...statNum, color:'#fff' }}>→</div>
              <div style={{ ...statLbl, color:'rgba(255,255,255,0.8)' }}>Manage Users</div>
            </Link>
          </div>
        )}

        <h2 style={{ fontSize:17, fontWeight:600, marginBottom:14 }}>All Assessments</h2>
        {assessments.length === 0 && <p style={{ color:'#888' }}>No assessments yet. Create one!</p>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))', gap:14 }}>
          {assessments.map(a => (
            <div key={a.id} style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
                <span style={{ fontSize:11, fontWeight:600, color:'#fff', background:typeColors[a.type], padding:'3px 10px', borderRadius:99 }}>
                  {typeLabels[a.type]}
                </span>
                <span style={{ fontSize:11, color: a.is_active ? '#27ae60' : '#e74c3c', fontWeight:600 }}>
                  {a.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 style={{ fontSize:15, fontWeight:600, marginBottom:4 }}>{a.title}</h3>
              <p style={{ fontSize:12, color:'#888', marginBottom:8 }}>{a.subject} · Class {a.target_class_name}</p>
              {a.end_datetime && (
                <p style={{ fontSize:12, color:'#e67e22' }}>⏰ Closes: {new Date(a.end_datetime).toLocaleString()}</p>
              )}
              <Link to={`/admin/submissions/${a.id}`}
                style={{ display:'inline-block', marginTop:10, fontSize:12, color:'#667eea', fontWeight:600, textDecoration:'none' }}>
                View Submissions →
              </Link>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}

const statCard = { background:'#fff', borderRadius:12, padding:'1rem', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }
const statNum  = { fontSize:26, fontWeight:700, color:'#667eea' }
const statLbl  = { fontSize:12, color:'#888', marginTop:4 }
