import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../../api'

export default function StudentRegister() {
  const [classes, setClasses] = useState([])
  const [form, setForm] = useState({ first_name:'', last_name:'', username:'', password:'', student_class:'' })
  const [error, setError] = useState('')
  const nav = useNavigate()

  useEffect(() => {
    api.get('/classes/').then(r => setClasses(r.data))
  }, [])

  async function submit(e) {
    e.preventDefault()
    setError('')
    try {
      await api.post('/auth/register/student/', form)
      nav('/login')
    } catch(err) {
      setError(JSON.stringify(err.response?.data || 'Error'))
    }
  }

  const s = styles
  return (
    <div style={s.page}>
      <div style={s.card}>
        <div style={s.logo}>AssessStud</div>
        <h2 style={s.title}>Create Student Account</h2>
        {error && <p style={s.error}>{error}</p>}
        <form onSubmit={submit}>
          <div style={s.row}>
            <div style={s.group}>
              <label style={s.label}>First Name</label>
              <input style={s.input} required value={form.first_name}
                onChange={e => setForm({...form, first_name: e.target.value})} />
            </div>
            <div style={s.group}>
              <label style={s.label}>Last Name</label>
              <input style={s.input} required value={form.last_name}
                onChange={e => setForm({...form, last_name: e.target.value})} />
            </div>
          </div>
          <div style={s.group}>
            <label style={s.label}>Username</label>
            <input style={s.input} required value={form.username}
              onChange={e => setForm({...form, username: e.target.value})} />
          </div>
          <div style={s.group}>
            <label style={s.label}>Password</label>
            <input style={s.input} type="password" required value={form.password}
              onChange={e => setForm({...form, password: e.target.value})} />
          </div>
          <div style={s.group}>
            <label style={s.label}>Class</label>
            <select style={s.input} required value={form.student_class}
              onChange={e => setForm({...form, student_class: e.target.value})}>
              <option value="">-- Select Class --</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button style={s.btn} type="submit">Register</button>
        </form>
        <p style={s.link}>Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  )
}

const styles = {
  page:  { minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg,#667eea,#764ba2)' },
  card:  { background:'#fff', borderRadius:16, padding:'2.5rem', width:'100%', maxWidth:480, boxShadow:'0 20px 60px rgba(0,0,0,0.2)' },
  logo:  { fontSize:22, fontWeight:700, color:'#667eea', marginBottom:8 },
  title: { fontSize:20, fontWeight:600, marginBottom:20, color:'#1a1a2e' },
  row:   { display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 },
  group: { marginBottom:14 },
  label: { display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#555' },
  input: { width:'100%', padding:'10px 12px', borderRadius:8, border:'1.5px solid #e0e0e0', fontSize:14, outline:'none', transition:'border .2s' },
  btn:   { width:'100%', padding:'12px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:8, fontSize:15, fontWeight:600, cursor:'pointer', marginTop:8 },
  error: { color:'#e74c3c', fontSize:13, marginBottom:12, background:'#fdecea', padding:'8px 12px', borderRadius:8 },
  link:  { textAlign:'center', marginTop:16, fontSize:13, color:'#777' },
}