import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api'

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

export default function Submissions() {
  const { id } = useParams()
  const [data, setData]               = useState([])
  const [loading, setLoading]         = useState(true)
  const [extendOpen, setExtendOpen]   = useState(false)
  const [newDeadline, setNewDeadline] = useState('')
  const [extendMsg, setExtendMsg]     = useState('')
  const [redoMsg, setRedoMsg]         = useState({})
  const [confirmRedo, setConfirmRedo] = useState(null)
  const [expanded, setExpanded]       = useState({})

  function load() {
    api.get(`/assessments/${id}/submissions/`)
      .then(r => { setData(r.data); setLoading(false) })
  }
  useEffect(load, [id])

  function toggleExpand(sessionId) {
    setExpanded(prev => ({ ...prev, [sessionId]: !prev[sessionId] }))
  }

  async function handleReview(answerId, payload) {
    await api.patch(`/assessments/answers/${answerId}/review/`, payload)
    load()
  }

  async function handleRedo(sessionId) {
    try {
      const r = await api.post(`/assessments/session/${sessionId}/redo/`)
      setRedoMsg(prev => ({ ...prev, [sessionId]: r.data.message }))
      setConfirmRedo(null)
      load()
    } catch (e) {
      setRedoMsg(prev => ({ ...prev, [sessionId]: 'Failed to reset. Try again.' }))
    }
  }

  async function handleExtend(e) {
    e.preventDefault()
    try {
      const r = await api.patch(`/assessments/${id}/extend-deadline/`, { end_datetime: newDeadline })
      setExtendMsg(r.data.message || 'Deadline extended successfully!')
      setNewDeadline('')
      setTimeout(() => { setExtendMsg(''); setExtendOpen(false) }, 3000)
    } catch (err) {
      setExtendMsg(err.response?.data?.error || 'Failed to extend deadline.')
    }
  }

  const navLinks = [
    ['Dashboard',     '/admin/dashboard'],
    ['Add Question',  '/admin/questions'],
    ['New Assessment','/admin/create'],
    ['Content',       '/admin/content'],
    ['Users',         '/admin/users'],
    ['Visitors',      '/admin/visitors'],
  ]

  return (
    <div style={{ minHeight:'100vh', background:'#F3F4F9', fontFamily:'var(--font-sans,system-ui)' }}>

      {/* Header */}
      <header style={{ background:'#1a1a2e', padding:'0 1.5rem', height:52, display:'flex', alignItems:'center', gap:0, position:'sticky', top:0, zIndex:100 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:'auto' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#534AB7' }} />
          <span style={{ fontSize:17, fontWeight:500, color:'#fff' }}>AssessStud</span>
          <span style={{ fontSize:11, fontWeight:500, background:'#534AB7', color:'#fff', padding:'2px 8px', borderRadius:99, marginLeft:4 }}>Admin</span>
        </div>
        <nav style={{ display:'flex', height:52 }}>
          {navLinks.map(([label, path]) => (
            <Link key={path} to={path} style={{ fontSize:13, color:'#ccc', textDecoration:'none', padding:'0 12px', height:52, display:'inline-flex', alignItems:'center' }}>
              {label}
            </Link>
          ))}
        </nav>
      </header>

      <div style={{ maxWidth:960, margin:'0 auto', padding:'1.5rem 1rem' }}>

        {/* Page title */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontSize:20, fontWeight:500, color:'#111' }}>Submissions</div>
            <div style={{ fontSize:13, color:'#888', marginTop:2 }}>
              {data.length} student{data.length !== 1 ? 's' : ''} submitted
            </div>
          </div>
          <button
            onClick={() => setExtendOpen(o => !o)}
            style={{ fontSize:13, fontWeight:500, background: extendOpen?'#EEEDFE':'#fff', color: extendOpen?'#3C3489':'#534AB7', border:'0.5px solid #CECBF6', padding:'8px 16px', borderRadius:8, cursor:'pointer' }}>
            ⏰ Extend deadline
          </button>
        </div>

        {/* Extend deadline panel */}
        {extendOpen && (
          <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1.25rem', marginBottom:16 }}>
            <div style={{ fontSize:14, fontWeight:500, color:'#111', marginBottom:6 }}>Set new closing date & time</div>
            <div style={{ fontSize:12, color:'#888', marginBottom:12 }}>
              Students who missed the deadline can start the assessment again after the new window opens.
            </div>
            <form onSubmit={handleExtend} style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <input type="datetime-local" value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)} required
                style={{ fontSize:13, padding:'7px 10px', border:'0.5px solid #e0e0e0', borderRadius:8, color:'#111' }} />
              <button type="submit" style={{ fontSize:13, fontWeight:500, background:'#534AB7', color:'#fff', border:'none', padding:'8px 18px', borderRadius:8, cursor:'pointer' }}>
                Save new deadline
              </button>
            </form>
            {extendMsg && (
              <div style={{ marginTop:10, fontSize:12, color: extendMsg.includes('success')||extendMsg.includes('extended') ? '#1D9E75' : '#E24B4A', fontWeight:500 }}>
                {extendMsg}
              </div>
            )}
          </div>
        )}

        {/* Loading / empty */}
        {loading && <div style={{ padding:'2rem', textAlign:'center', color:'#aaa', fontSize:13 }}>Loading…</div>}
        {!loading && data.length === 0 && (
          <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, textAlign:'center', color:'#aaa', fontSize:13, padding:'2.5rem' }}>
            No submissions yet.
          </div>
        )}

        {/* Submission cards */}
        {data.map(s => (
          <div key={s.session_id} style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:14, marginBottom:12, overflow:'hidden' }}>

            {/* Student header */}
            <div style={{ padding:'14px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10, borderBottom:'0.5px solid #f0f0f5', background:'#fafafe' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:38, height:38, borderRadius:'50%', background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:500, color:'#534AB7', flexShrink:0 }}>
                  {s.student.split(' ').map(n=>n[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:500, color:'#111' }}>{s.student}</div>
                  <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>
                    {s.student_class}
                    {s.submitted_at && ` · ${new Date(s.submitted_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}`}
                  </div>
                </div>
              </div>

              <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                {s.score !== null && (
                  <span style={{ fontSize:16, fontWeight:500, background:scoreBg(s.score), color:scoreColor(s.score), padding:'4px 14px', borderRadius:99 }}>
                    {s.score}%
                  </span>
                )}

                {/* Redo */}
                {confirmRedo === s.session_id ? (
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#E24B4A' }}>Reset this student?</span>
                    <button onClick={() => handleRedo(s.session_id)} style={dangerBtn}>Yes, reset</button>
                    <button onClick={() => setConfirmRedo(null)} style={ghostBtn}>Cancel</button>
                  </div>
                ) : (
                  <button onClick={() => setConfirmRedo(s.session_id)} style={ghostBtn}>
                    ↩ Redo
                  </button>
                )}

                {/* Expand/collapse answers */}
                <button onClick={() => toggleExpand(s.session_id)} style={{ ...ghostBtn, minWidth:110 }}>
                  {expanded[s.session_id] ? '▲ Hide answers' : '▼ View answers'}
                </button>
              </div>
            </div>

            {/* Redo feedback */}
            {redoMsg[s.session_id] && (
              <div style={{ padding:'8px 16px', fontSize:12, color:'#1D9E75', background:'#E1F5EE', borderBottom:'0.5px solid #d0ede2' }}>
                {redoMsg[s.session_id]}
              </div>
            )}

            {/* Answers — shown only when expanded */}
            {expanded[s.session_id] && (
              <div>
                {s.answers.map((a, idx) => {
                  const studentAns = a.typed_answer || a.selected_choice_text || '—'
                  const correctAns = a.correct_answer_text || '—'
                  const isCorrect  = a.is_correct
                  const needsReview = !a.reviewed && a.is_correct === null

                  return (
                    <div key={a.id} style={{
                      padding:'14px 16px',
                      borderBottom:'0.5px solid #f5f5f8',
                      background: isCorrect === true ? '#fafffc' : isCorrect === false ? '#fff9f9' : '#fff'
                    }}>

                      {/* Question */}
                      <div style={{ display:'flex', alignItems:'flex-start', gap:8, marginBottom:10 }}>
                        <span style={{ fontSize:11, fontWeight:500, background:'#f0f0f5', color:'#888', padding:'2px 8px', borderRadius:99, flexShrink:0, marginTop:1 }}>
                          Q{idx+1}
                        </span>
                        <div style={{ flex:1 }}>
                          <div style={{ fontSize:13, fontWeight:500, color:'#1a1a2e' }}>{a.question_text}</div>
                          {a.question_image && (
                            <img src={a.question_image} alt="" style={{ maxWidth:200, borderRadius:8, marginTop:8, border:'0.5px solid #eee' }} />
                          )}
                        </div>
                      </div>

                      {/* Three answer columns */}
                      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8 }}>

                        {/* Student's answer */}
                        <div style={{ background:'#f8f8ff', borderRadius:8, padding:'10px 12px', border:'0.5px solid #e8e8f5' }}>
                          <div style={{ fontSize:11, color:'#888', marginBottom:4, fontWeight:500 }}>Student answered</div>
                          <div style={{ fontSize:13, color:'#1a1a2e', fontWeight:500 }}>
                            {a.selected_choice_label && <span style={{ fontSize:11, background:'#EEEDFE', color:'#534AB7', padding:'1px 6px', borderRadius:4, marginRight:6 }}>{a.selected_choice_label}</span>}
                            {studentAns}
                          </div>
                          {a.uploaded_image && (
                            <a href={a.uploaded_image} target="_blank" rel="noreferrer"
                              style={{ fontSize:11, color:'#534AB7', display:'inline-flex', alignItems:'center', gap:4, marginTop:6 }}>
                              View image →
                            </a>
                          )}
                        </div>

                        {/* Correct answer */}
                        <div style={{ background:'#f0fff8', borderRadius:8, padding:'10px 12px', border:'0.5px solid #c8eed8' }}>
                          <div style={{ fontSize:11, color:'#1D9E75', marginBottom:4, fontWeight:500 }}>Correct answer</div>
                          <div style={{ fontSize:13, color:'#1a1a2e', fontWeight:500 }}>
                            {a.correct_answer_label && <span style={{ fontSize:11, background:'#EAF3DE', color:'#3B6D11', padding:'1px 6px', borderRadius:4, marginRight:6 }}>{a.correct_answer_label}</span>}
                            {correctAns}
                          </div>
                        </div>

                        {/* Result / review */}
                        <div style={{ background: isCorrect===true?'#f0fff8':isCorrect===false?'#fff5f5':'#fffbf0', borderRadius:8, padding:'10px 12px', border:`0.5px solid ${isCorrect===true?'#c8eed8':isCorrect===false?'#ffd0d0':'#ffe8a0'}` }}>
                          <div style={{ fontSize:11, color:'#888', marginBottom:4, fontWeight:500 }}>Result</div>
                          {a.reviewed ? (
                            <div>
                              <span style={{ fontSize:13, fontWeight:500, color: isCorrect?'#1D9E75':'#E24B4A' }}>
                                {isCorrect ? '✓ Correct' : '✗ Wrong'}
                              </span>
                              {a.admin_feedback && (
                                <div style={{ fontSize:11, color:'#aaa', marginTop:4 }}>{a.admin_feedback}</div>
                              )}
                            </div>
                          ) : needsReview ? (
                            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
                              <span style={{ fontSize:11, color:'#BA7517', fontWeight:500 }}>Needs review</span>
                              <div style={{ display:'flex', gap:5 }}>
                                <button onClick={() => handleReview(a.id, { is_correct:true, marks_awarded:1, admin_feedback:'Correct' })}
                                  style={{ flex:1, fontSize:11, fontWeight:500, background:'#EAF3DE', color:'#27500A', border:'none', padding:'4px 6px', borderRadius:6, cursor:'pointer' }}>
                                  ✓
                                </button>
                                <button onClick={() => handleReview(a.id, { is_correct:false, marks_awarded:0, admin_feedback:'Incorrect' })}
                                  style={{ flex:1, fontSize:11, fontWeight:500, background:'#FCEBEB', color:'#791F1F', border:'none', padding:'4px 6px', borderRadius:6, cursor:'pointer' }}>
                                  ✗
                                </button>
                              </div>
                            </div>
                          ) : (
                            <span style={{ fontSize:13, fontWeight:500, color: isCorrect===true?'#1D9E75':isCorrect===false?'#E24B4A':'#aaa' }}>
                              {isCorrect===true?'✓ Correct':isCorrect===false?'✗ Wrong':'—'}
                            </span>
                          )}
                        </div>
                      </div>

                    </div>
                  )
                })}
              </div>
            )}

          </div>
        ))}
      </div>
    </div>
  )
}

const ghostBtn = {
  fontSize:12, fontWeight:500,
  background:'none', color:'#555',
  border:'0.5px solid #e0e0e0',
  padding:'5px 12px', borderRadius:8, cursor:'pointer',
}
const dangerBtn = {
  fontSize:12, fontWeight:500,
  background:'#E24B4A', color:'#fff',
  border:'none', padding:'5px 12px', borderRadius:8, cursor:'pointer',
}