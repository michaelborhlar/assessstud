import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../../api'

export default function TakeAssessment() {
  const { id } = useParams()
  const nav = useNavigate()
  const [session, setSession] = useState(null)
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [timeLeft, setTimeLeft] = useState(null)
  const [result, setResult] = useState(null)
  const [answerType, setAnswerType] = useState('mcq')

  useEffect(() => {
    api.post(`/assessments/${id}/start/`).then(r => {
      setSession(r.data.session_id)
      setQuestions(r.data.questions)
      setAnswerType(r.data.answer_type)
      if (r.data.duration_minutes) setTimeLeft(r.data.duration_minutes * 60)
    }).catch(e => alert(e.response?.data?.error || 'Cannot start'))
  }, [id])

  useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) { submitExam(); return }
    const t = setInterval(() => setTimeLeft(s => s - 1), 1000)
    return () => clearInterval(t)
  }, [timeLeft])

  function setAnswer(qId, data) {
    setAnswers(a => ({ ...a, [qId]: { ...a[qId], ...data } }))
  }

  async function submitExam() {
    const fd = new FormData()
    fd.append('answers', JSON.stringify(answers))
    Object.entries(answers).forEach(([qId, ans]) => {
      if (ans.image) fd.append(`image_${qId}`, ans.image)
    })
    const r = await api.post(`/assessments/session/${session}/submit/`, fd)
    setResult(r.data)
  }

  if (result) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4ff' }}>
      <div style={{ background:'#fff', borderRadius:16, padding:'2rem', maxWidth:420, textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize:50, marginBottom:12 }}>🎉</div>
        <h2 style={{ fontSize:22, fontWeight:700 }}>Submitted!</h2>
        {result.show_results && result.score !== null && (
          <p style={{ fontSize:36, fontWeight:700, color:'#667eea', margin:'12px 0' }}>{result.score}%</p>
        )}
        {!result.show_results && <p style={{ color:'#888', marginTop:8 }}>Your teacher will release results soon.</p>}
        <button style={{ marginTop:16, padding:'10px 28px', background:'#667eea', color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}
          onClick={() => nav('/dashboard')}>Back to Dashboard</button>
      </div>
    </div>
  )

  if (!session) return <div style={{ padding:'2rem', textAlign:'center' }}>Loading...</div>

  const mins = timeLeft !== null ? String(Math.floor(timeLeft/60)).padStart(2,'0') : '--'
  const secs = timeLeft !== null ? String(timeLeft%60).padStart(2,'0') : '--'

  return (
    <div style={{ minHeight:'100vh', background:'#f0f4ff' }}>
      <header style={{ background:'#fff', padding:'12px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.08)', position:'sticky', top:0, zIndex:10 }}>
        <span style={{ fontWeight:700, color:'#667eea', fontSize:18 }}>AssessStud</span>
        {timeLeft !== null && (
          <span style={{ fontWeight:700, fontSize:20, color: timeLeft < 300 ? '#e74c3c' : '#27ae60', fontFamily:'monospace' }}>
            ⏱ {mins}:{secs}
          </span>
        )}
        <button onClick={submitExam} style={{ padding:'8px 20px', background:'#e74c3c', color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>Submit</button>
      </header>

      <div style={{ maxWidth:720, margin:'2rem auto', padding:'0 1rem' }}>
        {questions.map((q, i) => (
          <div key={q.id} style={{ background:'#fff', borderRadius:12, padding:'1.5rem', marginBottom:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:13, color:'#888', marginBottom:6 }}>Question {i+1} of {questions.length}</p>
            <p style={{ fontSize:16, fontWeight:500, marginBottom:12 }}>{q.text}</p>
            {q.image && <img src={q.image} alt="" style={{ maxWidth:'100%', borderRadius:8, marginBottom:12 }} />}

            {answerType === 'mcq' && q.choices.map(ch => (
              <div key={ch.id} onClick={() => setAnswer(q.id, { choice_id: ch.id })}
                style={{ padding:'10px 14px', borderRadius:8, border:`2px solid ${answers[q.id]?.choice_id === ch.id ? '#667eea' : '#e0e0e0'}`, marginBottom:8, cursor:'pointer', background: answers[q.id]?.choice_id === ch.id ? '#f0f0ff' : '#fff', transition:'all .15s' }}>
                <span style={{ fontWeight:600, marginRight:8, color:'#667eea' }}>{ch.label}.</span>{ch.text}
              </div>
            ))}

            {(answerType === 'typed' || answerType === 'typed_with_image') && (
              <textarea rows={4} placeholder="Type your answer here..."
                style={{ width:'100%', padding:'10px', borderRadius:8, border:'1.5px solid #e0e0e0', fontSize:14, resize:'vertical' }}
                value={answers[q.id]?.text || ''}
                onChange={e => setAnswer(q.id, { text: e.target.value })} />
            )}

            {answerType === 'typed_with_image' && (
              <div style={{ marginTop:8 }}>
                <label style={{ fontSize:13, color:'#555', display:'block', marginBottom:4 }}>Upload image (optional)</label>
                <input type="file" accept="image/*" onChange={e => setAnswer(q.id, { image: e.target.files[0] })} />
              </div>
            )}
          </div>
        ))}
        <button onClick={submitExam} style={{ width:'100%', padding:'14px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:10, fontSize:16, fontWeight:700, cursor:'pointer', marginBottom:'2rem' }}>
          Submit Assessment
        </button>
      </div>
    </div>
  )
}