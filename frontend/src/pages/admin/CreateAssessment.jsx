import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'

export default function CreateAssessment() {
  const nav = useNavigate()
  const [classes, setClasses] = useState([])
  const [questions, setQuestions] = useState([])
  const [form, setForm] = useState({
    title:'', type:'test', answer_type:'mcq', subject:'',
    instructions:'', target_class:'', num_questions:10,
    randomise:true, randomise_values:false,
    duration_minutes:'', start_datetime:'', end_datetime:'',
    show_results:false, show_solution:false, is_active:true,
    question_ids:[]
  })

  useEffect(() => {
    api.get('/classes/').then(r => setClasses(r.data))
    api.get('/assessments/questions/').then(r => setQuestions(r.data))
  }, [])

  function toggleQ(id) {
    setForm(f => ({
      ...f,
      question_ids: f.question_ids.includes(id)
        ? f.question_ids.filter(x => x !== id)
        : [...f.question_ids, id]
    }))
  }

  async function submit(e) {
    e.preventDefault()
    await api.post('/assessments/', form)
    nav('/admin/dashboard')
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>
      <header style={{ background:'#1a1a2e', padding:'14px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:20, fontWeight:700, color:'#fff' }}>AssessStud Admin</span>
        <Link to="/admin/dashboard" style={{ color:'#ccc', fontSize:13, textDecoration:'none' }}>← Dashboard</Link>
      </header>
      <main style={{ maxWidth:780, margin:'2rem auto', padding:'0 1rem' }}>
        <h2 style={{ fontSize:20, fontWeight:700, marginBottom:20 }}>Create Assessment</h2>
        <form onSubmit={submit}>
          <section style={sec}>
            <h3 style={secTitle}>Basic Info</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <div><label style={lbl}>Title</label><input style={inp} required value={form.title} onChange={e => setForm({...form,title:e.target.value})} /></div>
              <div><label style={lbl}>Subject</label><input style={inp} value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} /></div>
              <div>
                <label style={lbl}>Type</label>
                <select style={inp} value={form.type} onChange={e => setForm({...form,type:e.target.value})}>
                  <option value="test">Test</option>
                  <option value="assignment">Weekly Assignment</option>
                  <option value="assessment">Weekly Assessment</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Answer Type</label>
                <select style={inp} value={form.answer_type} onChange={e => setForm({...form,answer_type:e.target.value})}>
                  <option value="mcq">Multiple Choice</option>
                  <option value="typed">Typed Answer</option>
                  <option value="typed_with_image">Typed + Image Upload</option>
                </select>
              </div>
              <div>
                <label style={lbl}>Target Class</label>
                <select style={inp} required value={form.target_class} onChange={e => setForm({...form,target_class:e.target.value})}>
                  <option value="">-- Select --</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div><label style={lbl}>Number of Questions</label><input style={inp} type="number" value={form.num_questions} onChange={e => setForm({...form,num_questions:e.target.value})} /></div>
            </div>
            <div style={{ marginTop:12 }}>
              <label style={lbl}>Instructions</label>
              <textarea rows={2} style={{ ...inp, resize:'vertical' }} value={form.instructions} onChange={e => setForm({...form,instructions:e.target.value})} placeholder="Optional instructions for students..." />
            </div>
          </section>

          <section style={sec}>
            <h3 style={secTitle}>Timing & Dates</h3>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:12 }}>
              <div><label style={lbl}>Duration (mins)</label><input style={inp} type="number" value={form.duration_minutes} onChange={e => setForm({...form,duration_minutes:e.target.value})} placeholder="Leave blank = no limit" /></div>
              <div><label style={lbl}>Opens At</label><input style={inp} type="datetime-local" value={form.start_datetime} onChange={e => setForm({...form,start_datetime:e.target.value})} /></div>
              <div><label style={lbl}>Closes At</label><input style={inp} type="datetime-local" value={form.end_datetime} onChange={e => setForm({...form,end_datetime:e.target.value})} /></div>
            </div>
          </section>

          <section style={sec}>
            <h3 style={secTitle}>Settings</h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:20 }}>
              {[
                ['randomise','Randomise question order'],
                ['randomise_values','Randomise variable values'],
                ['show_results','Show results immediately'],
                ['show_solution','Show solution after submit'],
                ['is_active','Set as active'],
              ].map(([key,label]) => (
                <label key={key} style={{ display:'flex', alignItems:'center', gap:8, fontSize:14, cursor:'pointer' }}>
                  <input type="checkbox" checked={form[key]} onChange={e => setForm({...form,[key]:e.target.checked})} />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <section style={sec}>
            <h3 style={secTitle}>Select Questions ({form.question_ids.length} selected)</h3>
            {questions.length === 0 && <p style={{ color:'#888', fontSize:13 }}>No questions in bank. <Link to="/admin/questions">Add questions first →</Link></p>}
            <div style={{ maxHeight:300, overflowY:'auto', display:'flex', flexDirection:'column', gap:8 }}>
              {questions.map(q => (
                <label key={q.id} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px', background: form.question_ids.includes(q.id) ? '#f0f0ff' : '#f9f9f9', borderRadius:8, border:`1.5px solid ${form.question_ids.includes(q.id) ? '#667eea' : '#eee'}`, cursor:'pointer' }}>
                  <input type="checkbox" checked={form.question_ids.includes(q.id)} onChange={() => toggleQ(q.id)} style={{ marginTop:2 }} />
                  <div>
                    <p style={{ fontSize:13, fontWeight:500 }}>{q.text}</p>
                    <p style={{ fontSize:11, color:'#888' }}>{q.subject} · {q.topic}</p>
                  </div>
                </label>
              ))}
            </div>
          </section>

          <button type="submit" style={{ width:'100%', padding:'13px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:10, fontSize:15, fontWeight:700, cursor:'pointer', marginBottom:'2rem' }}>
            Publish Assessment
          </button>
        </form>
      </main>
    </div>
  )
}

const sec     = { background:'#fff', borderRadius:12, padding:'1.25rem', marginBottom:16, boxShadow:'0 2px 8px rgba(0,0,0,0.05)' }
const secTitle= { fontSize:15, fontWeight:600, marginBottom:14, color:'#1a1a2e' }
const lbl     = { display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#555' }
const inp     = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #e0e0e0', fontSize:14 }