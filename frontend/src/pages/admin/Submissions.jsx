import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api'

const typeColors  = { test:'#534AB7', assignment:'#BA7517', assessment:'#1D9E75' }
const typeBg      = { test:'#EEEDFE',  assignment:'#FFF3E0', assessment:'#E1F5EE' }

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
  const [data, setData]           = useState([])
  const [loading, setLoading]     = useState(true)
  const [extendOpen, setExtendOpen] = useState(false)
  const [newDeadline, setNewDeadline] = useState('')
  const [extendMsg, setExtendMsg]   = useState('')
  const [redoMsg, setRedoMsg]       = useState({})
  const [confirmRedo, setConfirmRedo] = useState(null) // session_id awaiting confirm

  function load() {
    api.get(`/assessments/${id}/submissions/`)
      .then(r => { setData(r.data); setLoading(false) })
  }
  useEffect(load, [id])

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
      setExtendMsg(r.data.message)
      setNewDeadline('')
      setTimeout(() => { setExtendMsg(''); setExtendOpen(false) }, 3000)
    } catch (err) {
      setExtendMsg(err.response?.data?.error || 'Failed to extend deadline.')
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--color-background-tertiary, #f0f4ff)', fontFamily:'var(--font-sans)' }}>

      {/* Header */}
      <header style={{ background:'#fff', borderBottom:'0.5px solid #e5e7eb', padding:'0 1.5rem', height:52, display:'flex', alignItems:'center', gap:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginRight:'auto' }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:'#534AB7' }} />
          <span style={{ fontSize:17, fontWeight:500, color:'#111' }}>AssessStud</span>
          <span style={{ fontSize:11, fontWeight:500, background:'#EEEDFE', color:'#3C3489', padding:'2px 8px', borderRadius:99, marginLeft:4 }}>Admin</span>
        </div>
        <Link to="/admin/dashboard" style={{ fontSize:13, color:'#666', textDecoration:'none', display:'flex', alignItems:'center', gap:4 }}>
          ← Dashboard
        </Link>
      </header>

      <div style={{ maxWidth:900, margin:'0 auto', padding:'1.5rem 1rem' }}>

        {/* Page title + Extend Deadline button */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
          <div>
            <div style={{ fontSize:18, fontWeight:500, color:'#111' }}>Submissions</div>
            <div style={{ fontSize:13, color:'#888', marginTop:2 }}>{data.length} student{data.length !== 1 ? 's' : ''} submitted</div>
          </div>
          <button
            onClick={() => setExtendOpen(o => !o)}
            style={{ fontSize:13, fontWeight:500, background: extendOpen ? '#EEEDFE' : '#fff', color: extendOpen ? '#3C3489' : '#534AB7', border:'0.5px solid #CECBF6', padding:'7px 16px', borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', gap:6 }}
          >
            ⏰ Extend deadline
          </button>
        </div>

        {/* Extend deadline panel */}
        {extendOpen && (
          <div style={{ background:'#fff', border:'0.5px solid #e5e7eb', borderRadius:12, padding:'1rem 1.25rem', marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:500, color:'#111', marginBottom:10 }}>Set new closing date &amp; time</div>
            <div style={{ fontSize:12, color:'#888', marginBottom:12 }}>
              This extends the deadline for students who missed it. They will be able to start the assessment again once the new window opens.
            </div>
            <form onSubmit={handleExtend} style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap' }}>
              <input
                type="datetime-local"
                value={newDeadline}
                onChange={e => setNewDeadline(e.target.value)}
                required
                style={{ fontSize:13, padding:'6px 10px', border:'0.5px solid #e0e0e0', borderRadius:8, color:'#111', background:'#fafafa' }}
              />
              <button type="submit" style={{ fontSize:13, fontWeight:500, background:'#534AB7', color:'#fff', border:'none', padding:'7px 18px', borderRadius:8, cursor:'pointer' }}>
                Save new deadline
              </button>
            </form>
            {extendMsg && (
              <div style={{ marginTop:10, fontSize:12, color: extendMsg.includes('success') ? '#1D9E75' : '#E24B4A', fontWeight:500 }}>
                {extendMsg}
              </div>
            )}
          </div>
        )}

        {/* Submissions list */}
        {loading && <div style={{ padding:'2rem', textAlign:'center', color:'#aaa', fontSize:13 }}>Loading…</div>}
        {!loading && data.length === 0 && (
          <div style={{ ...card, textAlign:'center', color:'#aaa', fontSize:13, padding:'2.5rem' }}>
            No submissions yet.
          </div>
        )}

        {data.map(s => (
          <div key={s.session_id} style={{ ...card, marginBottom:12, padding:0, overflow:'hidden' }}>

            {/* Student header row */}
            <div style={{ padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', borderBottom:'0.5px solid #f0f0f0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', background:'#EEEDFE', display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:500, color:'#534AB7', flexShrink:0 }}>
                  {s.student.split(' ').map(n => n[0]).join('').toUpperCase().slice(0,2)}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:500, color:'#111' }}>{s.student}</div>
                  <div style={{ fontSize:11, color:'#aaa', marginTop:1 }}>
                    {s.student_class}
                    {s.submitted_at && ` · ${new Date(s.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}`}
                  </div>
                </div>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                {s.score !== null && (
                  <span style={{ fontSize:18, fontWeight:500, background: scoreBg(s.score), color: scoreColor(s.score), padding:'4px 14px', borderRadius:99 }}>
                    {s.score}%
                  </span>
                )}
                {/* Redo button */}
                {confirmRedo === s.session_id ? (
                  <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#E24B4A' }}>Reset this student?</span>
                    <button onClick={() => handleRedo(s.session_id)} style={dangerBtn}>Yes, reset</button>
                    <button onClick={() => setConfirmRedo(null)} style={ghostBtn}>Cancel</button>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmRedo(s.session_id)}
                    style={ghostBtn}
                    title="Allow student to retake"
                  >
                    ↩ Redo
                  </button>
                )}
              </div>
            </div>

            {/* Redo feedback */}
            {redoMsg[s.session_id] && (
              <div style={{ padding:'8px 16px', fontSize:12, color:'#1D9E75', background:'#E1F5EE', borderBottom:'0.5px solid #d0ede2' }}>
                {redoMsg[s.session_id]}
              </div>
            )}

            {/* Answers */}
            {s.answers.map((a, idx) => (
              <div key={a.id} style={{ padding:'10px 16px', borderBottom:'0.5px solid #f5f5f5' }}>
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:10 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:12, color:'#aaa', marginBottom:3 }}>Q{idx + 1}</div>
                    <div style={{ fontSize:13, color:'#333' }}>
                      {a.typed_answer || a.selected_choice_text || '—'}
                    </div>
                    {a.uploaded_image && (
                      <a href={a.uploaded_image} target="_blank" rel="noreferrer"
                        style={{ fontSize:12, color:'#534AB7', display:'inline-flex', alignItems:'center', gap:4, marginTop:4 }}>
                        View uploaded image →
                      </a>
                    )}
                  </div>
                  <div style={{ flexShrink:0, textAlign:'right' }}>
                    {a.reviewed ? (
                      <span style={{ fontSize:12, fontWeight:500, background: a.is_correct ? '#EAF3DE' : '#FCEBEB', color: a.is_correct ? '#27500A' : '#791F1F', padding:'3px 10px', borderRadius:99 }}>
                        {a.is_correct ? '✓ Correct' : '✗ Wrong'}
                      </span>
                    ) : (
                      <div style={{ display:'flex', gap:6 }}>
                        <button onClick={() => handleReview(a.id, { is_correct:true, marks_awarded:1, admin_feedback:'Correct' })}
                          style={{ fontSize:11, fontWeight:500, background:'#EAF3DE', color:'#27500A', border:'none', padding:'4px 10px', borderRadius:6, cursor:'pointer' }}>
                          ✓ Correct
                        </button>
                        <button onClick={() => handleReview(a.id, { is_correct:false, marks_awarded:0, admin_feedback:'Incorrect' })}
                          style={{ fontSize:11, fontWeight:500, background:'#FCEBEB', color:'#791F1F', border:'none', padding:'4px 10px', borderRadius:6, cursor:'pointer' }}>
                          ✗ Wrong
                        </button>
                      </div>
                    )}
                    {a.admin_feedback && a.reviewed && (
                      <div style={{ fontSize:11, color:'#aaa', marginTop:3 }}>{a.admin_feedback}</div>
                    )}
                  </div>
                </div>
              </div>
            ))}

          </div>
        ))}
      </div>
    </div>
  )
}

const card = {
  background:'#fff',
  border:'0.5px solid #e5e7eb',
  borderRadius:12,
}
const ghostBtn = {
  fontSize:12, fontWeight:500,
  background:'none',
  color:'#555',
  border:'0.5px solid #e0e0e0',
  padding:'5px 12px',
  borderRadius:8,
  cursor:'pointer',
}
const dangerBtn = {
  fontSize:12, fontWeight:500,
  background:'#E24B4A',
  color:'#fff',
  border:'none',
  padding:'5px 12px',
  borderRadius:8,
  cursor:'pointer',
}
