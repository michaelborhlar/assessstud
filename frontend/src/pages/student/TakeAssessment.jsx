import React, { useEffect, useState } from 'react'
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
  const [assessmentInfo, setAssessmentInfo] = useState(null)

  useEffect(() => {
    api.post(`/assessments/${id}/start/`).then(r => {
      setSession(r.data.session_id)
      setQuestions(r.data.questions)
      setAnswerType(r.data.answer_type)
      setAssessmentInfo(r.data)
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
    <div style={{ minHeight:'100vh', background:'#f0f4ff' }}>
      <div style={{ maxWidth:680, margin:'0 auto', padding:'2rem 1rem' }}>

        {/* Score card */}
        <div style={{ background:'#fff', borderRadius:16, padding:'2rem', textAlign:'center', boxShadow:'0 4px 20px rgba(0,0,0,0.1)', marginBottom:20 }}>
          <div style={{ fontSize:50, marginBottom:8 }}>
            {result.has_image_upload ? '📬' : result.score >= 70 ? '🎉' : result.score >= 50 ? '👍' : '📚'}
          </div>
          <h2 style={{ fontSize:22, fontWeight:700, marginBottom:8 }}>
            {result.has_image_upload ? 'Submitted for Review' : 'Assessment Complete!'}
          </h2>

          {result.show_results && result.score !== null && (
            <>
              <div style={{ fontSize:52, fontWeight:700, color: result.score >= 70 ? '#27ae60' : result.score >= 50 ? '#f39c12' : '#e74c3c', margin:'8px 0' }}>
                {result.score}%
              </div>
              <p style={{ color:'#888', fontSize:14 }}>
                {result.correct} correct out of {result.total} questions
              </p>
            </>
          )}

          {result.has_image_upload && (
            <p style={{ color:'#888', fontSize:14, marginTop:8 }}>
              Your uploaded answers will be reviewed by your teacher. Check back for your score.
            </p>
          )}

          {!result.show_results && !result.has_image_upload && (
            <p style={{ color:'#888', marginTop:8 }}>Your teacher will release results soon.</p>
          )}
        </div>

        {/* Breakdown */}
        {result.show_results && result.breakdown && result.breakdown.length > 0 && (
          <div>
            <h3 style={{ fontSize:17, fontWeight:600, marginBottom:12 }}>Answer Review</h3>
            {result.breakdown.map((item, i) => (
              <div key={i} style={{
                background:'#fff', borderRadius:12, padding:'1.25rem', marginBottom:12,
                borderLeft:`4px solid ${item.is_correct === true ? '#27ae60' : item.is_correct === false ? '#e74c3c' : '#f39c12'}`,
                boxShadow:'0 2px 8px rgba(0,0,0,0.06)'
              }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <p style={{ fontWeight:600, fontSize:14 }}>Q{i+1}. {item.question_text}</p>
                  <span style={{ fontSize:13, fontWeight:600, color: item.is_correct === true ? '#27ae60' : item.is_correct === false ? '#e74c3c' : '#f39c12' }}>
                    {item.is_correct === true ? '✓ Correct' : item.is_correct === false ? '✗ Wrong' : '⏳ Pending'}
                  </span>
                </div>
                <p style={{ fontSize:13, color:'#555', marginBottom:4 }}>
                  <strong>Your answer:</strong> {item.your_answer || '—'}
                </p>
                {item.is_correct === false && item.correct_answer && (
                  <p style={{ fontSize:13, color:'#27ae60', marginBottom:4 }}>
                    <strong>Correct answer:</strong> {item.correct_answer}
                  </p>
                )}
                {result.show_solution && item.solution && (
                  <div style={{ marginTop:8, padding:'8px 12px', background:'#f0f4ff', borderRadius:8 }}>
                    <p style={{ fontSize:12, color:'#667eea', fontWeight:600, marginBottom:2 }}>💡 Explanation</p>
                    <p style={{ fontSize:13, color:'#555' }}>{item.solution}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <button style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', marginTop:8 }}
          onClick={() => nav('/dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  )

  if (!session) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#f0f4ff' }}>
      <p style={{ color:'#667eea', fontWeight:600 }}>Loading assessment...</p>
    </div>
  )

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
        <button onClick={submitExam} style={{ padding:'8px 20px', background:'#e74c3c', color:'#fff', border:'none', borderRadius:8, fontWeight:600, cursor:'pointer' }}>
          Submit
        </button>
      </header>

      <div style={{ maxWidth:720, margin:'2rem auto', padding:'0 1rem' }}>
        {questions.map((q, i) => (
          <div key={q.id} style={{ background:'#fff', borderRadius:12, padding:'1.5rem', marginBottom:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
            <p style={{ fontSize:13, color:'#888', marginBottom:6 }}>Question {i+1} of {questions.length}</p>
            <p style={{ fontSize:16, fontWeight:500, marginBottom:12 }}>{q.text}</p>
            {q.image && <img src={q.image} alt="" style={{ maxWidth:'100%', borderRadius:8, marginBottom:12 }} />}

            {answerType === 'mcq' && q.choices.map(ch => (
              <div key={ch.id}
                onClick={() => setAnswer(q.id, { choice_id: ch.id })}
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
