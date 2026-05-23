import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function Visitors() {
  const { logout } = useAuth()
  const nav = useNavigate()
  const [data, setData] = useState(null)
  const [days, setDays] = useState(7)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [days])

  async function fetchData() {
    setLoading(true)
    try {
      const r = await api.get(`/auth/visitors/?days=${days}`)
      setData(r.data)
    } catch(e) {
      console.error(e)
    }
    setLoading(false)
  }

  const navLinks = [
    ['Dashboard',     '/admin/dashboard'],
    ['Add Question',  '/admin/questions'],
    ['New Assessment','/admin/create'],
    ['Content',       '/admin/content'],
    ['Users',         '/admin/users'],
    ['Visitors',      '/admin/visitors'],
  ]

  function formatDate(dt) {
    return new Date(dt).toLocaleString('en-GB', {
      day:'2-digit', month:'short', year:'numeric',
      hour:'2-digit', minute:'2-digit'
    })
  }

  function friendlyPath(path) {
    const map = {
      '/api/classes/':             'Registration page (loaded classes)',
      '/api/assessments/my/':      'Student dashboard',
      '/api/content/':             'Learn page',
      '/api/assessments/':         'Admin dashboard',
      '/api/auth/stats/':          'Admin dashboard (stats)',
    }
    return map[path] || path
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>

      {/* Header */}
      <header style={{ background:'#1a1a2e', padding:'14px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:20, fontWeight:700, color:'#fff' }}>
          AssessStud
          <span style={{ fontSize:12, background:'#667eea', padding:'2px 8px', borderRadius:99, marginLeft:8 }}>Admin</span>
        </span>
        <nav style={{ display:'flex', gap:16, alignItems:'center' }}>
          {navLinks.map(([label, path]) => (
            <Link key={path} to={path} style={{
              color: path === '/admin/visitors' ? '#fff' : '#ccc',
              textDecoration:'none', fontSize:13,
              fontWeight: path === '/admin/visitors' ? 700 : 500
            }}>
              {label}
            </Link>
          ))}
          <button onClick={() => { logout(); nav('/admin/login') }}
            style={{ background:'none', border:'1px solid #555', color:'#ccc', padding:'5px 12px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            Logout
          </button>
        </nav>
      </header>

      <main style={{ maxWidth:1100, margin:'2rem auto', padding:'0 1rem' }}>

        {/* Title + filter */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div>
            <h1 style={{ fontSize:22, fontWeight:700 }}>Visitor Analytics</h1>
            <p style={{ color:'#888', fontSize:14 }}>Who visited your site and when</p>
          </div>
          <select value={days} onChange={e => setDays(Number(e.target.value))}
            style={{ padding:'8px 14px', borderRadius:8, border:'1.5px solid #e0e0e0', fontSize:13, background:'#fff' }}>
            <option value={1}>Last 24 hours</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>

        {loading && <p style={{ color:'#888' }}>Loading...</p>}

        {!loading && data && (
          <>
            {/* Stat cards */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:24 }}>
              <div style={card}>
                <div style={bigNum}>{data.total_visits}</div>
                <div style={cardLbl}>Total Visits</div>
              </div>
              <div style={card}>
                <div style={bigNum}>{data.unique_visitors}</div>
                <div style={cardLbl}>Unique Visitors</div>
              </div>
              <div style={card}>
                <div style={bigNum}>{data.per_day.length}</div>
                <div style={cardLbl}>Active Days</div>
              </div>
            </div>

            {/* Visits per day */}
            {data.per_day.length > 0 && (
              <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize:15, fontWeight:600, marginBottom:14 }}>Visits Per Day</h3>
                <div style={{ display:'flex', gap:8, alignItems:'flex-end', height:80, overflowX:'auto' }}>
                  {data.per_day.map((d, i) => {
                    const max = Math.max(...data.per_day.map(x => x.count))
                    const height = Math.max(8, (d.count / max) * 70)
                    return (
                      <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, minWidth:40 }}>
                        <span style={{ fontSize:10, color:'#667eea', fontWeight:600 }}>{d.count}</span>
                        <div style={{ width:28, height, background:'linear-gradient(180deg,#667eea,#764ba2)', borderRadius:'4px 4px 0 0' }} />
                        <span style={{ fontSize:10, color:'#888', transform:'rotate(-45deg)', transformOrigin:'top left', whiteSpace:'nowrap', marginTop:8 }}>
                          {new Date(d.date).toLocaleDateString('en-GB', { day:'2-digit', month:'short' })}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Top pages */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
              <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize:15, fontWeight:600, marginBottom:12 }}>Top Pages</h3>
                {data.top_pages.map((p, i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid #f5f5f5', fontSize:13 }}>
                    <span style={{ color:'#555', flex:1, marginRight:8 }}>{friendlyPath(p.path)}</span>
                    <span style={{ fontWeight:600, color:'#667eea', minWidth:30, textAlign:'right' }}>{p.count}</span>
                  </div>
                ))}
              </div>

              {/* Recent visits */}
              <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize:15, fontWeight:600, marginBottom:12 }}>Recent Visits</h3>
                <div style={{ maxHeight:300, overflowY:'auto' }}>
                  {data.recent.map((v, i) => (
                    <div key={i} style={{ padding:'8px 0', borderBottom:'1px solid #f5f5f5', fontSize:12 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontWeight:600, color:'#333' }}>
                          {v.user__username
                            ? `${v.user__first_name} ${v.user__last_name} (${v.user__username})`
                            : v.ip_address}
                        </span>
                        <span style={{ color:'#888', fontSize:11 }}>
                          {formatDate(v.visited_at)}
                        </span>
                      </div>
                      <span style={{ color:'#aaa', fontSize:11 }}>{friendlyPath(v.path)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {!loading && data && data.total_visits === 0 && (
          <div style={{ background:'#fff', borderRadius:12, padding:'3rem', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize:48, marginBottom:12 }}>👁️</div>
            <p style={{ color:'#888' }}>No visits recorded in this period yet.</p>
          </div>
        )}
      </main>
    </div>
  )
}

const card    = { background:'#fff', borderRadius:12, padding:'1.25rem', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }
const bigNum  = { fontSize:32, fontWeight:700, color:'#667eea' }
const cardLbl = { fontSize:13, color:'#888', marginTop:4 }
