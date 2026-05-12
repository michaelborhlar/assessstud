import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function LearnPage() {
  const { logout } = useAuth()
  const [content, setContent] = useState([])

  useEffect(() => {
    api.get('/content/').then(r => setContent(r.data))
  }, [])

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4ff' }}>
      <header style={{ background:'#fff', padding:'14px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.08)' }}>
        <span style={{ fontSize:20, fontWeight:700, color:'#667eea' }}>AssessStud</span>
        <nav style={{ display:'flex', gap:20 }}>
          <Link to="/dashboard" style={{ color:'#555', textDecoration:'none', fontSize:14 }}>Dashboard</Link>
          <Link to="/learn" style={{ color:'#667eea', textDecoration:'none', fontSize:14, fontWeight:600 }}>Learn</Link>
          <button onClick={() => { logout(); window.location='/login' }} style={{ background:'none', border:'1.5px solid #e0e0e0', padding:'5px 12px', borderRadius:8, cursor:'pointer', color:'#e74c3c', fontSize:13 }}>Logout</button>
        </nav>
      </header>
      <main style={{ maxWidth:900, margin:'2rem auto', padding:'0 1rem' }}>
        <h2 style={{ fontSize:22, fontWeight:700, marginBottom:20 }}>Learning Materials</h2>
        {content.length === 0 && <p style={{ color:'#888' }}>No content available yet.</p>}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:16 }}>
          {content.map(c => (
            <div key={c.id} style={{ background:'#fff', borderRadius:12, overflow:'hidden', boxShadow:'0 2px 12px rgba(0,0,0,0.07)' }}>
              <div style={{ background:'linear-gradient(135deg,#667eea,#764ba2)', padding:'1.2rem', color:'#fff' }}>
                <p style={{ fontSize:12, opacity:.8 }}>{c.subject}</p>
                <h3 style={{ fontSize:16, fontWeight:600 }}>{c.title}</h3>
              </div>
              <div style={{ padding:'1rem' }}>
                <p style={{ fontSize:13, color:'#666', marginBottom:12 }}>{c.description}</p>
                {c.video_url && (
                  <a href={c.video_url} target="_blank" rel="noreferrer"
                    style={{ display:'inline-block', padding:'8px 16px', background:'#667eea', color:'#fff', borderRadius:8, textDecoration:'none', fontSize:13, fontWeight:600 }}>
                    ▶ Watch Video
                  </a>
                )}
                {c.video_file && (
                  <video controls style={{ width:'100%', borderRadius:8, marginTop:8 }}>
                    <source src={c.video_file} />
                  </video>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
