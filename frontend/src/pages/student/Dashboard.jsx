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
  const typeIcons  = { test:'✏️', assignment:'📝', assessment:'📋' }

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

  const now = new Date()

  // missed = not submitted AND deadline has passed
  function isMissed(item) {
    if (item.is_submitted) return false
    if (!item.assessment.end_datetime) return false
    return new Date(item.assessment.end_datetime) < now
  }

  // pending = not submitted AND (no deadline OR deadline not yet passed)
  function isPending(item) {
    if (item.is_submitted) return false
    if (!item.assessment.end_datetime) return true
    return new Date(item.assessment.end_datetime) >= now
  }

  const pending   = items.filter(i => isPending(i))
  const submitted = items.filter(i => i.is_submitted)
  const missedItems = items.filter(i => isMissed(i))
  const missed    = overall ? overall.missed : missedItems.length
  const total     = overall ? overall.total_assessments : items.length
  const overallScore = overall ? overall.overall_score : 0

  const initials = user
    ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase()
    : 'ST'

  const today = new Date().toLocaleDateString('en-GB', {
    weekday:'long', day:'numeric', month:'long'
  })

  function daysUntil(dt) {
    const diff = Math.ceil((new Date(dt) - now) / (1000*60*60*24))
    if (diff === 0) return 'Due today'
    if (diff === 1) return 'Due tomorrow'
    return `Due in ${diff} days`
  }

  return (
    <div style={s.page}>

      {/* ── Top bar ── */}
      <header style={s.topBar}>
        <div style={s.logoWrap}>
          <div style={s.logoDot} />
          <span style={s.logoText}>AssessStud</span>
        </div>
        <nav style={s.nav}>
          {[['Dashboard','/dashboard'],['Learn','/learn']].map(([label, path]) => (
            <Link key={path} to={path} style={{
              ...s.navLink,
              color: path === '/dashboard' ? '#534AB7' : '#888',
              borderBottom: path === '/dashboard' ? '2px solid #534AB7' : '2px solid transparent',
              fontWeight: path === '/dashboard' ? 500 : 400,
            }}>
              {label}
            </Link>
          ))}
        </nav>
        <button onClick={doLogout} style={s.logoutBtn}>Logout</button>
      </header>

      <div style={s.body}>

        {/* ── Hero banner ── */}
        <div style={s.hero}>
          <div style={{
  position:'absolute',
  width:250,
  height:250,
  borderRadius:'50%',
  background:'rgba(255,255,255,.08)',
  right:-80,
  top:-80,
}} />

<div style={{
  position:'absolute',
  width:150,
  height:150,
  borderRadius:'50%',
  background:'rgba(255,255,255,.05)',
  right:120,
  bottom:-50,
}} />
          <div style={s.heroLeft}>
            <div style={s.avatar}>{initials}</div>
            <div>
              <div style={s.heroName}>Welcome back, {user?.first_name} 👋</div>
              <div style={s.heroSub}>
                {pending.length > 0
                  ? `You have ${pending.length} task${pending.length > 1 ? 's' : ''} pending`
                  : 'You are all caught up!'}
              </div>
            </div>
          </div>
          <div style={s.heroRight}>
            <div style={s.heroDate}>{today}</div>
            <div style={s.classBadge}>{user?.student_class_name}</div>
          </div>
        </div>

        {/* ── Stat cards ── */}
        <div style={s.statGrid}>
          {[
            { label:'Overall score',  val:`${overallScore}%`, sub:'All assessments',    color:'#534AB7', bg:'#EEEDFE', pct:overallScore },
            { label:'Submitted',      val:submitted.length,   sub:`Out of ${total}`,    color:'#1D9E75', bg:'#EAF3DE', pct:total?submitted.length/total*100:0 },
            { label:'Missed',         val:missed,             sub:'Counted as 0%',      color:'#E24B4A', bg:'#FCEBEB', pct:total?missed/total*100:0 },
            { label:'Pending',        val:pending.length,     sub:'To complete',        color:'#BA7517', bg:'#FFF3E0', pct:total?pending.length/total*100:0 },
          ].map((s2, i) => (
            <div key={i} style={{ ...s.statCard, borderTop:`3px solid ${s2.color}` }}>
              <div style={{ ...s.statIcon, background:s2.bg, color:s2.color }}>
                {i===0?'◎':i===1?'✓':i===2?'✗':'⏳'}
              </div>
              <div style={{ fontSize:12, color:'#999', marginBottom:4, marginTop:8 }}>{s2.label}</div>
              <div style={{ fontSize:26, fontWeight:500, color:s2.color, lineHeight:1 }}>{s2.val}</div>
              <div style={{ fontSize:11, color:'#bbb', marginTop:4 }}>{s2.sub}</div>
              <div style={s.progressWrap}>
                <div style={{ ...s.progressFill, background:s2.color, width:`${Math.min(100,s2.pct)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* ── Two column section ── */}
        <div style={s.twoCol}>

          {/* Pending tasks */}
          <div style={s.panel}>
            <div style={s.panelHead}>
              <span style={s.panelTitle}>⏳ Pending tasks</span>
              {pending.length > 0 && (
                <span style={{ ...s.pill, background:'#FFF3E0', color:'#633806' }}>{pending.length} due</span>
              )}
            </div>
            {pending.length === 0 ? (
              <div style={s.emptyState}>
                <div style={{ fontSize:32, marginBottom:8 }}>🎉</div>
                <div>No pending tasks — well done!</div>
              </div>
            ) : (
              pending.map(({ assessment: a }) => (
                <div key={a.id} style={s.assessRow}
                  onMouseEnter={e => e.currentTarget.style.background='#fafbff'}
                  onMouseLeave={e => e.currentTarget.style.background='#fff'}
                  onClick={() => nav(`/assessment/${a.id}`)}>
                  <div style={{ ...s.assessIcon, background:typeBg[a.type] }}>
                    <span style={{ fontSize:15 }}>{typeIcons[a.type]}</span>
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={s.assessTitle}>{a.title}</div>
                    <div style={s.assessMeta}>{typeLabels[a.type]} · {a.subject}</div>
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    <div style={{ ...s.pill, background:'#534AB7', color:'#fff', cursor:'pointer' }}>Start →</div>
                    {a.end_datetime && (
                      <div style={{ fontSize:11, color:'#BA7517', marginTop:4 }}>
                        {daysUntil(a.end_datetime)}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* Missed items shown at bottom of this panel */}
            {missedItems.length > 0 && (
              <>
                <div style={{ padding:'8px 16px 4px', fontSize:11, fontWeight:500, color:'#E24B4A', background:'#fff8f8', borderTop:'0.5px solid #fde' }}>
                  MISSED ({missedItems.length})
                </div>
                {missedItems.map(({ assessment: a }) => (
                  <div key={a.id} style={{ ...s.assessRow, background:'#fff8f8', cursor:'default' }}>
                    <div style={{ ...s.assessIcon, background:'#FCEBEB' }}>
                      <span style={{ fontSize:15 }}>🚫</span>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ ...s.assessTitle, color:'#999' }}>{a.title}</div>
                      <div style={s.assessMeta}>{typeLabels[a.type]} · deadline passed</div>
                    </div>
                    <div style={{ flexShrink:0 }}>
                      <span style={{ ...s.pill, background:'#FCEBEB', color:'#A32D2D' }}>0% missed</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* Score by type */}
          <div style={s.panel}>
            <div style={s.panelHead}>
              <span style={s.panelTitle}>📊 Score by type</span>
            </div>
            {overall && overall.type_summary && overall.type_summary.length > 0 ? (
              <>
                <div style={{ padding:'8px 0' }}>
                  {overall.type_summary.map(t => (
                    <div key={t.type} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderBottom:'0.5px solid #f5f5f5' }}>
                      <div style={{ width:36, height:36, borderRadius:8, background:typeBg[t.type], display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>
                        {typeIcons[t.type]}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
                          <span style={{ fontSize:12, fontWeight:500, color:'#444' }}>{typeLabels[t.type]}s</span>
                          <span style={{ fontSize:12, fontWeight:500, color:typeColors[t.type] }}>{t.average}%</span>
                        </div>
                        <div style={{ height:6, background:'#f0f0f0', borderRadius:99, overflow:'hidden' }}>
                          <div style={{ height:6, borderRadius:99, background:typeColors[t.type], width:`${t.average}%`, transition:'width 1.2s ease' }} />
                        </div>
                        <div style={{ fontSize:11, color:'#bbb', marginTop:3 }}>
                          {t.submitted} submitted · {t.missed} missed
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ padding:'12px 16px', borderTop:'0.5px solid #f0f0f0', background:'#fafafa' }}>
                  <div style={{ fontSize:12, color:'#888', marginBottom:10, fontWeight:500 }}>Recent results</div>
                  {submitted.slice(0, 4).map(({ assessment: a, score }) => (
                    <div key={a.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flex:1, minWidth:0 }}>
                        <span style={{ fontSize:13 }}>{typeIcons[a.type]}</span>
                        <span style={{ fontSize:12, color:'#555', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.title}</span>
                      </div>
                      <span style={{ ...s.pill, background: score!==null?scoreBg(score):'#f4f4f4', color: score!==null?scoreColor(score):'#aaa', flexShrink:0, marginLeft:8 }}>
                        {score!==null?`${score}%`:'pending'}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={s.emptyState}>
                <div style={{ fontSize:32, marginBottom:8 }}>📈</div>
                <div>No scores yet — complete an assessment</div>
              </div>
            )}
          </div>
        </div>

        {/* ── All assessments ── */}
        <div style={s.panel}>
          <div style={s.panelHead}>
            <span style={s.panelTitle}>📚 All assessments</span>
            <span style={{ fontSize:12, color:'#bbb' }}>From week 1 · missed = 0%</span>
          </div>
          {items.length === 0 ? (
            <div style={s.emptyState}>
              <div style={{ fontSize:32, marginBottom:8 }}>📭</div>
              <div>No assessments assigned yet</div>
            </div>
          ) : (
            (overall?.breakdown || items.map(({ assessment:a, is_submitted, score }) => ({
              id:a.id, title:a.title, type:a.type, subject:a.subject,
              score: score||0, status: is_submitted?'submitted':'not_started',
              submitted_at: null
            }))).map((item) => (
              <div key={item.id} style={{
                ...s.assessRow,
                background: item.status!=='submitted' ? '#fff9f9' : '#fff'
              }}
                onMouseEnter={e => e.currentTarget.style.background = item.status!=='submitted'?'#fff4f4':'#fafbff'}
                onMouseLeave={e => e.currentTarget.style.background = item.status!=='submitted'?'#fff9f9':'#fff'}>

                <div style={{ ...s.assessIcon, background: item.status==='submitted' ? scoreBg(item.score) : '#FCEBEB' }}>
                  <span style={{ fontSize:14, color: item.status==='submitted' ? scoreColor(item.score) : '#E24B4A' }}>
                    {item.status==='submitted' ? '✓' : '✗'}
                  </span>
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ ...s.assessTitle, color: item.status!=='submitted'?'#999':'#111' }}>
                    {item.title}
                  </div>
                  <div style={s.assessMeta}>
                    {typeLabels[item.type]} · {item.subject}
                    {item.submitted_at && ` · ${new Date(item.submitted_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}`}
                    {item.status!=='submitted' && ' · not submitted'}
                  </div>
                </div>

                <div style={{ flexShrink:0, display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{
                    ...s.pill,
                    background: item.status==='submitted' ? scoreBg(item.score) : '#FCEBEB',
                    color:       item.status==='submitted' ? scoreColor(item.score) : '#A32D2D',
                    minWidth:44, textAlign:'center'
                  }}>
                    {item.status==='submitted' ? `${item.score}%` : '0%'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  )
}

// ── Styles ──────────────────────────────────────────────────────────────────
const s = {
page: {
minHeight: '100vh',
background:
'linear-gradient(135deg,#eef2ff 0%,#f8faff 40%,#f4f7ff 100%)',
fontFamily: 'Inter, system-ui, sans-serif',
position: 'relative',
},

topBar: {
background: 'rgba(255,255,255,0.85)',
backdropFilter: 'blur(20px)',
borderBottom: '1px solid rgba(255,255,255,0.5)',
padding: '0 2rem',
height: 70,
display: 'flex',
alignItems: 'center',
position: 'sticky',
top: 0,
zIndex: 100,
boxShadow: '0 10px 40px rgba(83,74,183,0.08)',
},

logoWrap: {
display:'flex',
alignItems:'center',
gap:10,
marginRight:'auto',
},

logoDot: {
width:12,
height:12,
borderRadius:'50%',
background:'linear-gradient(135deg,#534AB7,#8A7FFF)',
boxShadow:'0 0 15px rgba(83,74,183,.5)',
},

logoText: {
fontSize:20,
fontWeight:700,
color:'#1a1a2e',
letterSpacing:'-.5px',
},

nav:{
display:'flex',
height:70,
gap:10,
},

navLink:{
fontSize:14,
textDecoration:'none',
padding:'0 18px',
height:70,
display:'inline-flex',
alignItems:'center',
transition:'all .3s ease',
borderRadius:12,
},

logoutBtn:{
marginLeft:20,
fontSize:13,
color:'#fff',
background:'linear-gradient(135deg,#ff6b6b,#e24b4a)',
border:'none',
padding:'10px 18px',
borderRadius:999,
cursor:'pointer',
fontWeight:600,
boxShadow:'0 10px 20px rgba(226,75,74,.25)',
},

body:{
maxWidth:1400,
margin:'0 auto',
padding:'2rem',
},

hero:{
background:
'linear-gradient(135deg,#534AB7 0%,#7268E6 50%,#9A92FF 100%)',
borderRadius:28,
padding:'2rem',
display:'flex',
justifyContent:'space-between',
alignItems:'center',
marginBottom:20,
color:'#fff',
boxShadow:'0 25px 60px rgba(83,74,183,.35)',
position:'relative',
overflow:'hidden',
},

heroLeft:{
display:'flex',
alignItems:'center',
gap:18,
position:'relative',
zIndex:2,
},

heroRight:{
textAlign:'right',
position:'relative',
zIndex:2,
},

heroName:{
fontSize:28,
fontWeight:700,
marginBottom:5,
},

heroSub:{
fontSize:14,
color:'rgba(255,255,255,.85)',
},

heroDate:{
fontSize:13,
color:'rgba(255,255,255,.75)',
},

avatar:{
width:70,
height:70,
borderRadius:'50%',
background:'rgba(255,255,255,.15)',
backdropFilter:'blur(10px)',
display:'flex',
alignItems:'center',
justifyContent:'center',
fontSize:22,
fontWeight:700,
border:'3px solid rgba(255,255,255,.35)',
boxShadow:'0 10px 30px rgba(0,0,0,.15)',
},

classBadge:{
display:'inline-flex',
alignItems:'center',
fontSize:13,
fontWeight:600,
background:'rgba(255,255,255,.18)',
padding:'8px 14px',
borderRadius:999,
marginTop:10,
border:'1px solid rgba(255,255,255,.25)',
backdropFilter:'blur(12px)',
},

statGrid:{
display:'grid',
gridTemplateColumns:'repeat(4,1fr)',
gap:16,
marginBottom:20,
},

statCard:{
background:'rgba(255,255,255,.85)',
backdropFilter:'blur(18px)',
borderRadius:22,
padding:'1.4rem',
border:'1px solid rgba(255,255,255,.7)',
boxShadow:'0 15px 35px rgba(83,74,183,.08)',
transition:'all .35s ease',
},

statIcon:{
width:50,
height:50,
borderRadius:14,
display:'flex',
alignItems:'center',
justifyContent:'center',
fontSize:20,
fontWeight:600,
boxShadow:'0 8px 20px rgba(0,0,0,.06)',
},

progressWrap:{
height:8,
background:'#eef1f7',
borderRadius:999,
overflow:'hidden',
marginTop:14,
},

progressFill:{
height:'100%',
borderRadius:999,
transition:'width 1s ease',
},

twoCol:{
display:'grid',
gridTemplateColumns:'1.2fr .8fr',
gap:16,
marginBottom:20,
},

panel:{
background:'rgba(255,255,255,.88)',
backdropFilter:'blur(18px)',
borderRadius:22,
overflow:'hidden',
border:'1px solid rgba(255,255,255,.7)',
boxShadow:'0 15px 40px rgba(83,74,183,.08)',
},

panelHead:{
padding:'18px 20px',
display:'flex',
justifyContent:'space-between',
alignItems:'center',
background:
'linear-gradient(90deg,#fafaff,#f5f7ff)',
borderBottom:'1px solid #f0f2ff',
},

panelTitle:{
fontSize:15,
fontWeight:700,
color:'#1a1a2e',
},

pill:{
fontSize:11,
fontWeight:700,
padding:'6px 12px',
borderRadius:999,
letterSpacing:'.3px',
},

assessRow:{
display:'flex',
alignItems:'center',
gap:14,
padding:'14px 18px',
borderBottom:'1px solid #f4f6ff',
cursor:'pointer',
transition:'all .25s ease',
background:'#fff',
},

assessIcon:{
width:42,
height:42,
borderRadius:12,
display:'flex',
alignItems:'center',
justifyContent:'center',
flexShrink:0,
boxShadow:'0 8px 20px rgba(0,0,0,.05)',
},

assessTitle:{
fontSize:14,
fontWeight:600,
color:'#111827',
overflow:'hidden',
textOverflow:'ellipsis',
whiteSpace:'nowrap',
},

assessMeta:{
fontSize:12,
color:'#9ca3af',
marginTop:4,
},

emptyState:{
padding:'4rem 2rem',
textAlign:'center',
color:'#9ca3af',
fontSize:14,
},
}
