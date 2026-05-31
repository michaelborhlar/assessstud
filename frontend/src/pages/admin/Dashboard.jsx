import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [assessments, setAssessments] = useState([])
  const [stats, setStats]             = useState(null)
  const [classes, setClasses]         = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [rankings, setRankings]       = useState(null)
  const [rankLoading, setRankLoading] = useState(false)
  const nav = useNavigate()

  useEffect(() => {
    api.get('/assessments/').then(r => setAssessments(r.data))
    api.get('/auth/stats/').then(r => setStats(r.data)).catch(() => {})
    api.get('/classes/').then(r => setClasses(r.data)).catch(() => {})
  }, [])

  async function loadRankings(classId) {
    if (!classId) { setRankings(null); return }
    setRankLoading(true)
    try {
      const r = await api.get(`/assessments/class-rankings/${classId}/`)
      setRankings(r.data)
    } catch (e) {
      console.error(e)
    }
    setRankLoading(false)
  }

  function handleClassChange(e) {
    setSelectedClass(e.target.value)
    loadRankings(e.target.value)
  }

  function scoreColor(s) {
    if (s >= 70) return '#1D9E75'
    if (s >= 50) return '#BA7517'
    return '#E24B4A'
  }
  function scoreBg(s) {
    if (s >= 70) return '#EAF3DE'
    if (s >= 50) return '#FAEEDA'
    return '#FCEBEB'
  }
  function rankBadge(rank) {
    if (rank === 1) return { bg:'#FFD700', color:'#7A5C00', label:'🥇' }
    if (rank === 2) return { bg:'#E8E8E8', color:'#555',    label:'🥈' }
    if (rank === 3) return { bg:'#F4A460', color:'#6B3A1F', label:'🥉' }
    return { bg:'#f5f5f5', color:'#888', label:`#${rank}` }
  }

  const typeColors = { test:'#534AB7', assignment:'#BA7517', assessment:'#1D9E75' }
  const typeBg     = { test:'#EEEDFE', assignment:'#FFF3E0', assessment:'#E1F5EE' }
  const typeLabels = { test:'Test', assignment:'Assignment', assessment:'Assessment' }

  const navLinks = [
    ['Dashboard',     '/admin/dashboard'],
    ['Add Question',  '/admin/questions'],
    ['New Assessment','/admin/create'],
    ['Content',       '/admin/content'],
    ['Users',         '/admin/users'],
    ['Visitors',      '/admin/visitors'],
  ]

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-background-tertiary, #f0f4ff)', fontFamily:'var(--font-sans)' }}>

      {/* Header — unchanged */}
      <header style={{ background:'#fff', borderBottom:'0.5px solid #e5e7eb', padding:'0 1.5rem', height:52, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:'auto' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#534AB7' }} />
          <span style={{ fontSize:17, fontWeight:500, color:'#111' }}>AssessStud</span>
          <span style={{ fontSize:11, fontWeight:500, background:'#EEEDFE', color:'#3C3489', padding:'2px 8px', borderRadius:99, marginLeft:4 }}>Admin</span>
        </div>
        <nav style={{ display:'flex', height:52 }}>
          {navLinks.map(([label, path]) => (
            <Link key={path} to={path} style={{
              fontSize:13,
              color: path === '/admin/dashboard' ? '#111' : '#666',
              textDecoration:'none',
              padding:'0 13px',
              height:52,
              display:'inline-flex',
              alignItems:'center',
              borderBottom: path === '/admin/dashboard' ? '2px solid #534AB7' : '2px solid transparent',
              fontWeight: path === '/admin/dashboard' ? 500 : 400,
            }}>
              {label}
            </Link>
          ))}
        </nav>
        <button
          onClick={() => { logout(); nav('/admin/login') }}
          style={{ marginLeft:12, fontSize:12, color:'#E24B4A', background:'none', border:'0.5px solid #e0e0e0', padding:'5px 12px', borderRadius:8, cursor:'pointer' }}>
          Logout
        </button>
      </header>

      <div style={{ maxWidth:1100, margin:'0 auto', padding:'1.5rem 1rem' }}>

        {/* Hero — unchanged */}
        <div style={card}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:46, height:46, borderRadius:'50%', background:'#EEEDFE', border:'1.5px solid #CECBF6', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, fontWeight:500, color:'#534AB7', flexShrink:0 }}>
                {`${user?.first_name?.[0]||''}${user?.last_name?.[0]||''}`.toUpperCase()||'AD'}
              </div>
              <div>
                <div style={{ fontSize:16, fontWeight:500, color:'#111' }}>Welcome, {user?.first_name}</div>
                <div style={{ fontSize:13, color:'#888', marginTop:2 }}>Manage your assessments and content</div>
              </div>
            </div>
            <Link to="/admin/create" style={{ fontSize:13, fontWeight:500, background:'#534AB7', color:'#fff', textDecoration:'none', padding:'8px 18px', borderRadius:8, whiteSpace:'nowrap' }}>
              + New Assessment
            </Link>
          </div>
        </div>

        {/* Stats — unchanged */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10, margin:'10px 0' }}>
            <div style={statCard}>
              <div style={{ ...statVal, color:'#534AB7' }}>{stats.total_students}</div>
              <div style={statLbl}>Total students</div>
              <div style={{ height:3, background:'#f0f0f0', borderRadius:99, marginTop:8, overflow:'hidden' }}>
                <div style={{ height:3, borderRadius:99, background:'#534AB7', width:'100%' }} />
              </div>
            </div>
            <div style={statCard}>
              <div style={{ ...statVal, color:'#1D9E75' }}>{stats.total_admins}</div>
              <div style={statLbl}>Total admins</div>
              <div style={{ height:3, background:'#f0f0f0', borderRadius:99, marginTop:8, overflow:'hidden' }}>
                <div style={{ height:3, borderRadius:99, background:'#1D9E75', width:'100%' }} />
              </div>
            </div>
            {stats.per_class?.map(c => (
              <div key={c.class} style={statCard}>
                <div style={{ ...statVal, color:'#BA7517' }}>{c.count}</div>
                <div style={statLbl}>{c.class}</div>
                <div style={{ height:3, background:'#f0f0f0', borderRadius:99, marginTop:8, overflow:'hidden' }}>
                  <div style={{ height:3, borderRadius:99, background:'#BA7517', width:`${Math.min(100,(c.count/stats.total_students)*100)}%` }} />
                </div>
              </div>
            ))}
            <Link to="/admin/users" style={{ ...statCard, textDecoration:'none', display:'block', background:'#534AB7', border:'none', cursor:'pointer' }}>
              <div style={{ ...statVal, color:'#fff', fontSize:20 }}>→</div>
              <div style={{ ...statLbl, color:'rgba(255,255,255,0.75)', marginTop:4 }}>Manage users</div>
            </Link>
          </div>
        )}

        {/* ── CLASS RANKINGS TABLE ── */}
        <div style={{ ...card, padding:0, overflow:'hidden', marginBottom:16 }}>
          <div style={{ padding:'12px 16px', borderBottom:'0.5px solid #f0f0f5', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, background:'#fafafe' }}>
            <div>
              <div style={{ fontSize:14, fontWeight:500, color:'#111' }}>Class Rankings</div>
              <div style={{ fontSize:12, color:'#aaa', marginTop:1 }}>
                Overall scores from highest to lowest · missed = 0%
              </div>
            </div>
            <select
              value={selectedClass}
              onChange={handleClassChange}
              style={{ fontSize:13, padding:'7px 12px', border:'0.5px solid #e0e0e0', borderRadius:8, color:'#111', background:'#fff', cursor:'pointer', minWidth:130 }}>
              <option value="">Select a class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* No class selected */}
          {!selectedClass && (
            <div style={{ padding:'2.5rem', textAlign:'center', color:'#bbb', fontSize:13 }}>
              <div style={{ fontSize:32, marginBottom:8 }}>📊</div>
              Select a class above to see the rankings
            </div>
          )}

          {/* Loading */}
          {selectedClass && rankLoading && (
            <div style={{ padding:'2rem', textAlign:'center', color:'#aaa', fontSize:13 }}>
              Loading rankings…
            </div>
          )}

          {/* Rankings table */}
          {selectedClass && !rankLoading && rankings && (
            <>
              {/* Summary row */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:0, borderBottom:'0.5px solid #f0f0f5' }}>
                {[
                  { label:'Students', val:rankings.total_students, color:'#534AB7' },
                  { label:'Assessments', val:rankings.total_assessments, color:'#1D9E75' },
                  { label:'Class', val:rankings.class_name, color:'#BA7517' },
                ].map((s, i) => (
                  <div key={i} style={{ padding:'10px 16px', borderRight: i<2?'0.5px solid #f0f0f5':'none', textAlign:'center' }}>
                    <div style={{ fontSize:18, fontWeight:500, color:s.color }}>{s.val}</div>
                    <div style={{ fontSize:11, color:'#aaa', marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* No students */}
              {rankings.rankings.length === 0 && (
                <div style={{ padding:'2rem', textAlign:'center', color:'#bbb', fontSize:13 }}>
                  No students in this class yet.
                </div>
              )}

              {/* Table */}
              {rankings.rankings.length > 0 && (
                <div style={{ overflowX:'auto' }}>
                  <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                    <thead>
                      <tr style={{ background:'#f8f9ff' }}>
                        {['Rank','Student','Overall Score','Submitted','Missed','Pending','Progress'].map(h => (
                          <th key={h} style={{ padding:'10px 14px', textAlign: h==='Rank'||h==='Overall Score'?'center':'left', fontSize:11, fontWeight:500, color:'#888', borderBottom:'0.5px solid #f0f0f5', whiteSpace:'nowrap' }}>
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.rankings.map((r, i) => {
                        const badge = rankBadge(r.rank)
                        return (
                          <tr key={r.student_id}
                            style={{ borderBottom:'0.5px solid #f5f5f8', background: i%2===0?'#fff':'#fafbff' }}
                            onMouseEnter={e => e.currentTarget.style.background='#f0f4ff'}
                            onMouseLeave={e => e.currentTarget.style.background=i%2===0?'#fff':'#fafbff'}>

                            {/* Rank */}
                            <td style={{ padding:'12px 14px', textAlign:'center' }}>
                              <span style={{ fontSize:14, fontWeight:500, background:badge.bg, color:badge.color, padding:'3px 10px', borderRadius:99, display:'inline-block', minWidth:36, textAlign:'center' }}>
                                {badge.label}
                              </span>
                            </td>

                            {/* Student name */}
                            <td style={{ padding:'12px 14px' }}>
                              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                                <div style={{ width:32, height:32, borderRadius:'50%', background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:500, color:'#534AB7', flexShrink:0 }}>
                                  {r.name.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                                </div>
                                <div>
                                  <div style={{ fontWeight:500, color:'#111' }}>{r.name}</div>
                                  <div style={{ fontSize:11, color:'#aaa' }}>{r.username}</div>
                                </div>
                              </div>
                            </td>

                            {/* Overall score */}
                            <td style={{ padding:'12px 14px', textAlign:'center' }}>
                              <span style={{ fontSize:15, fontWeight:500, background:scoreBg(r.overall_score), color:scoreColor(r.overall_score), padding:'4px 14px', borderRadius:99 }}>
                                {r.overall_score}%
                              </span>
                            </td>

                            {/* Submitted */}
                            <td style={{ padding:'12px 14px' }}>
                              <span style={{ fontSize:12, fontWeight:500, color:'#1D9E75' }}>{r.submitted}</span>
                              <span style={{ fontSize:11, color:'#aaa' }}> / {r.total}</span>
                            </td>

                            {/* Missed */}
                            <td style={{ padding:'12px 14px' }}>
                              <span style={{ fontSize:12, fontWeight:500, color: r.missed>0?'#E24B4A':'#aaa' }}>
                                {r.missed}
                              </span>
                            </td>

                            {/* Pending */}
                            <td style={{ padding:'12px 14px' }}>
                              <span style={{ fontSize:12, fontWeight:500, color: r.pending>0?'#BA7517':'#aaa' }}>
                                {r.pending}
                              </span>
                            </td>

                            {/* Progress bar */}
                            <td style={{ padding:'12px 14px', minWidth:100 }}>
                              <div style={{ height:6, background:'#f0f0f0', borderRadius:99, overflow:'hidden' }}>
                                <div style={{ height:6, borderRadius:99, background:scoreColor(r.overall_score), width:`${r.overall_score}%`, transition:'width 1s ease' }} />
                              </div>
                              <div style={{ fontSize:10, color:'#bbb', marginTop:3 }}>{r.overall_score}%</div>
                            </td>

                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>

        {/* Assessments section — unchanged */}
        <div style={{ fontSize:14, fontWeight:500, color:'#111', margin:'16px 0 10px' }}>
          All assessments
          <span style={{ fontSize:12, fontWeight:400, color:'#aaa', marginLeft:8 }}>{assessments.length} total</span>
        </div>

        {assessments.length === 0 && (
          <div style={{ ...card, textAlign:'center', color:'#aaa', fontSize:13, padding:'2.5rem' }}>
            No assessments yet. Create one!
          </div>
        )}

        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:12 }}>
          {assessments.map(a => (
            <div key={a.id} style={{ ...card, padding:0, overflow:'hidden' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', borderBottom:'0.5px solid #f0f0f0' }}>
                <span style={{ fontSize:11, fontWeight:500, background:typeBg[a.type], color:typeColors[a.type], padding:'3px 10px', borderRadius:99 }}>
                  {typeLabels[a.type]}
                </span>
                <span style={{ fontSize:11, fontWeight:500, color:a.is_active?'#1D9E75':'#E24B4A', background:a.is_active?'#E1F5EE':'#FCEBEB', padding:'3px 10px', borderRadius:99 }}>
                  {a.is_active?'Active':'Inactive'}
                </span>
              </div>
              <div style={{ padding:'12px 14px' }}>
                <div style={{ fontSize:14, fontWeight:500, color:'#111', marginBottom:3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {a.title}
                </div>
                <div style={{ fontSize:12, color:'#888', marginBottom:a.end_datetime?8:0 }}>
                  {a.subject} · Class {a.target_class_name}
                </div>
                {a.end_datetime && (
                  <div style={{ display:'flex', alignItems:'center', gap:5, fontSize:12, color:'#BA7517', background:'#FFF3E0', padding:'4px 10px', borderRadius:6, width:'fit-content' }}>
                    ⏰ Closes {new Date(a.end_datetime).toLocaleDateString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                  </div>
                )}
              </div>
              <div style={{ padding:'10px 14px', borderTop:'0.5px solid #f0f0f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <Link to={`/admin/submissions/${a.id}`}
                  style={{ fontSize:13, color:'#534AB7', fontWeight:500, textDecoration:'none' }}>
                  View submissions →
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

const card = {
  background:'#fff',
  border:'0.5px solid #e5e7eb',
  borderRadius:12,
  padding:'1rem 1.25rem',
  marginBottom:10,
}
const statCard = {
  background:'#fff',
  border:'0.5px solid #e5e7eb',
  borderRadius:12,
  padding:'14px 16px',
}
const statVal = {
  fontSize:26,
  fontWeight:500,
  lineHeight:1,
}
const statLbl = {
  fontSize:11,
  color:'#aaa',
  marginTop:4,
  textTransform:'uppercase',
  letterSpacing:'0.3px',
}