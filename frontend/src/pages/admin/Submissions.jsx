import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import api from '../../api'

export default function Submissions() {
  const { id } = useParams()
  const [data, setData] = useState([])

  useEffect(() => {
    api.get(`/assessments/${id}/submissions/`).then(r => setData(r.data))
  }, [id])

  async function review(answerId, payload) {
    await api.patch(`/assessments/answers/${answerId}/review/`, payload)
    api.get(`/assessments/${id}/submissions/`).then(r => setData(r.data))
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>
      <header style={{ background:'#1a1a2e', padding:'14px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:20, fontWeight:700, color:'#fff' }}>Submissions</span>
        <Link to="/admin/dashboard" style={{ color:'#ccc', fontSize:13, textDecoration:'none' }}>← Dashboard</Link>
      </header>
      <main style={{ maxWidth:900, margin:'2rem auto', padding:'0 1rem' }}>
        {data.length === 0 && <p style={{ color:'#888' }}>No submissions yet.</p>}
        {data.map(s => (
          <div key={s.session_id} style={{ background:'#fff', borderRadius:12, padding:'1.25rem', marginBottom:16, boxShadow:'0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:12 }}>
              <div>
                <h3 style={{ fontSize:16, fontWeight:600 }}>{s.student}</h3>
                <p style={{ fontSize:13, color:'#888' }}>Class: {s.student_class} · Submitted: {s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '—'}</p>
              </div>
              {s.score !== null && <span style={{ fontSize:22, fontWeight:700, color:'#667eea' }}>{s.score}%</span>}
            </div>
            {s.answers.map(a => (
              <div key={a.id} style={{ borderTop:'1px solid #f0f0f0', paddingTop:10, marginTop:10 }}>
                <p style={{ fontSize:13, color:'#555', marginBottom:4 }}><p style={{ fontSize:13, color:'#555', marginBottom:4 }}>
        Q{a.question}: {
          a.typed_answer ||
          a.selected_choice_text ||
          '—'
        }
      </p></p>
                {a.uploaded_image && <a href={a.uploaded_image} target="_blank" rel="noreferrer" style={{ fontSize:12, color:'#667eea' }}>View uploaded image</a>}
                {!a.reviewed && (
                  <div style={{ display:'flex', gap:8, marginTop:8 }}>
                    <button onClick={() => review(a.id, { is_correct:true, marks_awarded:1, admin_feedback:'Correct' })} style={{ padding:'5px 12px', background:'#27ae60', color:'#fff', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}>✓ Correct</button>
                    <button onClick={() => review(a.id, { is_correct:false, marks_awarded:0, admin_feedback:'Incorrect' })} style={{ padding:'5px 12px', background:'#e74c3c', color:'#fff', border:'none', borderRadius:6, fontSize:12, cursor:'pointer' }}>✗ Wrong</button>
                  </div>
                )}
                {a.reviewed && <span style={{ fontSize:12, color: a.is_correct ? '#27ae60' : '#e74c3c', fontWeight:600 }}>{a.is_correct ? '✓ Correct' : '✗ Wrong'} · {a.admin_feedback}</span>}
              </div>
            ))}
          </div>
        ))}
      </main>
    </div>
  )
}
