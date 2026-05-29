import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function StudentDashboard() {
  const { user, logout } = useAuth()
  const [items, setItems]     = useState([])
  const [overall, setOverall] = useState(null)
  const nav = useNavigate()

  useEffect(() => {
    api.get('/assessments/my/').then(r => setItems(r.data))
    api.get('/assessments/my/overall/').then(r => setOverall(r.data)).catch(() => {})
  }, [])

  function doLogout() { logout(); nav('/login') }

  const typeColors = { test:'#534AB7', assignment:'#BA7517', assessment:'#1D9E75' }
  const typeBg     = { test:'#EEEDFE', assignment:'#FFF3E0', assessment:'#E1F5EE' }
  const typeLabels = { test:'Test', assignment:'Assignment', assessment:'Assessment' }

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

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'ST'

  const today = new Date().toLocaleDateString('en-GB', {
    weekday:'long', day:'numeric', month:'long'
  })

  const pending   = items.filter(i => !i.is_submitted)
  const submitted = items.filter(i => i.is_submitted)
  const missed    = overall ? overall.missed : 0
  const total     = overall ? overall.total_assessments : 0
  const overallScore = overall ? overall.overall_score : 0

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-background-tertiary, #f0f4ff)', fontFamily:'var(--font-sans)' }}>

      {/* Top bar */}
      <header style={{ background:'#fff', borderBottom:'0.5px solid #e5e7eb', padding:'0 1.5rem', height:52, display:'flex', alignItems:'center', gap:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:'auto' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#534AB7' }} />
          <span style={{ fontSize:17, fontWeight:500, color:'#111' }}>AssessStud</span>
        </div>
        <nav style={{ display:'flex', height:52 }}>
          {[['Dashboard','/dashboard'],['Learn','/learn']].map(([label, path]) => (
            <Link key={path} to={path} style={{
              fontSize:13, color: path === '/dashboard' ? '#111' : '#666',
              textDecoration:'none', padding:'0 14px', height:52,
              display:'inline-flex', alignItems:'center',
              borderBottom: path === '/dashboard' ? '2px solid #534AB7' : '2px solid transparent',
              fontWeight: path === '/dashboard' ? 500 : 400,
            }}>
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={doLogout} style={{ marginLeft:12, fontSize:12, color:'#E24B4A', background:'none', border:'0.5px solid #e0e0e0', padding:'5px 12px', borderRadius:8, cursor:'pointer' }}>
          Logout
        </button>
      </header>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'1.5rem 1rem' }}>

        {/* Hero */}
        <div style={card}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <div style={{ width:48, height:48, borderRadius:'50%', background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, fontWeight:500, color:'#534AB7', flexShrink:0 }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize:17, fontWeight:500, color:'#111' }}>
                Good day, {user?.first_name}
              </div>
              <div style={{ fontSize:13, color:'#888', marginTop:2 }}>
                {pending.length > 0 ? `You have ${pending.length} pending task${pending.length > 1 ? 's' : ''}` : 'All caught up!'}
              </div>
            </div>
            <div style={{ marginLeft:'auto', textAlign:'right' }}>
              <div style={{ fontSize:12, color:'#aaa' }}>{today}</div>
              <div style={{ display:'inline-flex', alignItems:'center', gap:4, fontSize:12, fontWeight:500, background:'#f4f4f4', color:'#555', padding:'3px 10px', borderRadius:99, marginTop:4 }}>
                {user?.student_class_name}
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, margin:'10px 0' }}>
          {[
            { label:'Overall score', val:`${overallScore}%`, sub:'All assessments', color:'#534AB7', pct: overallScore },
            { label:'Submitted', val: submitted.length, sub:`Out of ${total} total`, color:'#1D9E75', pct: total ? submitted.length/total*100 : 0 },
            { label:'Missed', val: missed, sub:'Counted as 0%', color:'#E24B4A', pct: total ? missed/total*100 : 0 },
            { label:'Pending', val: pending.length, sub:'To complete', color:'#BA7517', pct: total ? pending.length/total*100 : 0 },
          ].map((s, i) => (
            <div key={i} style={card}>
              <div style={{ fontSize:12, color:'#888', marginBottom:6 }}>{s.label}</div>
              <div style={{ fontSize:24, fontWeight:500, color:s.color }}>{s.val}</div>
              <div style={{ fontSize:11, color:'#aaa', marginTop:3 }}>{s.sub}</div>
              <div style={{ height:4, background:'#f0f0f0', borderRadius:99, marginTop:8, overflow:'hidden' }}>
                <div style={{ height:4, borderRadius:99, background:s.color, width:`${Math.min(100, s.pct)}%`, transition:'width 1s ease' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Two columns */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>

          {/* Pending tasks */}
          <div style={{ ...card, padding:0, overflow:'hidden' }}>
            <div style={panelHead}>
              <span style={panelTitle}>Pending tasks</span>
              {pending.length > 0 && (
                <span style={{ fontSize:11, fontWeight:500, background:'#FAEEDA', color:'#633806', padding:'2px 8px', borderRadius:99 }}>
                  {pending.length} due
                </span>
              )}
            </div>
            {pending.length === 0 ? (
              <div style={{ padding:'2rem', textAlign:'center', color:'#aaa', fontSize:13 }}>
                No pending tasks
              </div>
            ) : (
              pending.map(({ assessment: a }) => (
                <div key={a.id} style={assessRow} onClick={() => nav(`/assessment/${a.id}`)}>
                  <div style={{ ...assessIcon, background: typeBg[a.type] }}>
                    <span style={{ fontSize:15, color: typeColors[a.type] }}>
                      {a.type === 'test' ? '✏' : a.type === 'assignment' ? '📝' : '📋'}
                    </span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:500, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
                    <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>{typeLabels[a.type]} · {a.subject}</div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    <div style={{ fontSize:12, fontWeight:500, background:'#EEEDFE', color:'#3C3489', padding:'3px 10px', borderRadius:99, cursor:'pointer' }}>
                      Start
                    </div>
                    {a.end_datetime && (
                      <div style={{ fontSize:11, color:'#BA7517', marginTop:3 }}>
                        {new Date(a.end_datetime).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Score by type */}
          <div style={{ ...card, padding:0, overflow:'hidden' }}>
            <div style={panelHead}>
              <span style={panelTitle}>Score by type</span>
            </div>
            {overall && overall.type_summary && overall.type_summary.length > 0 ? (
              <>
                {overall.type_summary.map(t => (
                  <div key={t.type} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderBottom:'0.5px solid #f0f0f0' }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:typeColors[t.type], flexShrink:0 }} />
                    <div style={{ fontSize:13, color:'#333', width:90 }}>{typeLabels[t.type]}s</div>
                    <div style={{ flex:1, height:4, background:'#f0f0f0', borderRadius:99, overflow:'hidden' }}>
                      <div style={{ height:4, borderRadius:99, background:typeColors[t.type], width:`${t.average}%`, transition:'width 1s ease' }} />
                    </div>
                    <div style={{ fontSize:12, fontWeight:500, color:typeColors[t.type], minWidth:32, textAlign:'right' }}>{t.average}%</div>
                  </div>
                ))}
                <div style={{ padding:'12px 16px', borderTop:'0.5px solid #f0f0f0' }}>
                  <div style={{ fontSize:12, color:'#888', marginBottom:8, fontWeight:500 }}>Recent results</div>
                  {submitted.slice(0, 4).map(({ assessment: a, score }) => (
                    <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:6 }}>
                      <span style={{ fontSize:12, color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1, marginRight:8 }}>{a.title}</span>
                      <span style={{ fontSize:11, fontWeight:500, background: score !== null ? scoreBg(score) : '#f4f4f4', color: score !== null ? scoreColor(score) : '#aaa', padding:'2px 8px', borderRadius:99, flexShrink:0 }}>
                        {score !== null ? `${score}%` : 'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ padding:'2rem', textAlign:'center', color:'#aaa', fontSize:13 }}>No scores yet</div>
            )}
          </div>
        </div>

        {/* All assessments */}
        <div style={{ ...card, padding:0, overflow:'hidden' }}>
          <div style={panelHead}>
            <span style={panelTitle}>All assessments</span>
            <span style={{ fontSize:12, color:'#aaa' }}>From week 1 · missed = 0%</span>
          </div>
          {items.length === 0 ? (
            <div style={{ padding:'2rem', textAlign:'center', color:'#aaa', fontSize:13 }}>No assessments assigned yet</div>
          ) : (
            overall?.breakdown?.map((item, i) => (
              <div key={item.id} style={assessRow}>
                <div style={{ ...assessIcon, background: item.status === 'submitted' ? scoreBg(item.score) : '#FCEBEB' }}>
                  <span style={{ fontSize:14, color: item.status === 'submitted' ? scoreColor(item.score) : '#E24B4A' }}>
                    {item.status === 'submitted' ? '✓' : '✗'}
                  </span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.title}</div>
                  <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>
                    {typeLabels[item.type]} · {item.subject}
                    {item.submitted_at && ` · ${new Date(item.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}`}
                    {item.status !== 'submitted' && ' · not submitted'}
                  </div>
                </div>
                <div style={{ flexShrink:0 }}>
                  <span style={{ fontSize:12, fontWeight:500, background: item.status === 'submitted' ? scoreBg(item.score) : '#FCEBEB', color: item.status === 'submitted' ? scoreColor(item.score) : '#E24B4A', padding:'2px 10px', borderRadius:99 }}>
                    {item.status === 'submitted' ? `${item.score}%` : '0%'}
                  </span>
                </div>
              </div>
            )) || items.map(({ assessment: a, is_submitted, score }) => (
              <div key={a.id} style={assessRow}>
                <div style={{ ...assessIcon, background: is_submitted ? scoreBg(score || 0) : '#FCEBEB' }}>
                  <span style={{ fontSize:14, color: is_submitted ? scoreColor(score || 0) : '#E24B4A' }}>
                    {is_submitted ? '✓' : '✗'}
                  </span>
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13, fontWeight:500, color:'#111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</div>
                  <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>{typeLabels[a.type]} · {a.subject}</div>
                </div>
                <div style={{ flexShrink:0 }}>
                  {is_submitted ? (
                    <span style={{ fontSize:12, fontWeight:500, background: scoreBg(score || 0), color: scoreColor(score || 0), padding:'2px 10px', borderRadius:99 }}>
                      {score !== null ? `${score}%` : 'pending'}
                    </span>
                  ) : (
                    <button style={{ fontSize:12, fontWeight:500, background:'#EEEDFE', color:'#3C3489', border:'none', padding:'4px 12px', borderRadius:99, cursor:'pointer' }}
                      onClick={() => nav(`/assessment/${a.id}`)}>
                      Start
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
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
  marginBottom:0,
}
const panelHead = {
  padding:'10px 16px',
  borderBottom:'0.5px solid #f0f0f0',
  display:'flex', alignItems:'center', justifyContent:'space-between',
}
const panelTitle = {
  fontSize:13, fontWeight:500, color:'#111',
}
const assessRow = {
  display:'flex', alignItems:'center', gap:10,
  padding:'9px 16px',
  borderBottom:'0.5px solid #f5f5f5',
  cursor:'pointer',
  transition:'background 0.1s',
}
const assessIcon = {
  width:32, height:32,
  borderRadius:8,
  display:'flex', alignItems:'center', justifyContent:'center',
  flexShrink:0,
}