import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'

export default function UploadContent() {
  const [classes, setClasses] = useState([])
  const [content, setContent] = useState([])
  const [form, setForm] = useState({ title:'', description:'', subject:'', target_class:'', video_url:'', is_visible:true })
  const [videoFile, setVideoFile] = useState(null)
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    api.get('/classes/').then(r => setClasses(r.data))
    api.get('/content/').then(r => setContent(r.data))
  }, [])

  async function submit(e) {
    e.preventDefault()
    const fd = new FormData()
    Object.entries(form).forEach(([k,v]) => fd.append(k, v))
    if (videoFile) fd.append('video_file', videoFile)
    await api.post('/content/', fd)
    setSuccess(true)
    api.get('/content/').then(r => setContent(r.data))
    setTimeout(() => setSuccess(false), 3000)
  }

  async function toggleVisibility(id, current) {
    await api.patch(`/content/${id}/`, { is_visible: !current })
    api.get('/content/').then(r => setContent(r.data))
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>
      <header style={{ background:'#1a1a2e', padding:'14px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:20, fontWeight:700, color:'#fff' }}>Learning Content</span>
        <Link to="/admin/dashboard" style={{ color:'#ccc', fontSize:13, textDecoration:'none' }}>← Dashboard</Link>
      </header>
      <main style={{ maxWidth:800, margin:'2rem auto', padding:'0 1rem' }}>
        <h2 style={{ fontSize:20, fontWeight:700, marginBottom:20 }}>Upload Learning Content</h2>
        {success && <div style={{ background:'#d4edda', color:'#155724', padding:'10px 16px', borderRadius:8, marginBottom:16 }}>✓ Content uploaded!</div>}

        <form onSubmit={submit} style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'0 2px 10px rgba(0,0,0,0.06)', marginBottom:24 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
            <div><label style={lbl}>Title</label><input style={inp} required value={form.title} onChange={e => setForm({...form,title:e.target.value})} /></div>
            <div><label style={lbl}>Subject</label><input style={inp} value={form.subject} onChange={e => setForm({...form,subject:e.target.value})} /></div>
            <div>
              <label style={lbl}>Target Class</label>
              <select style={inp} required value={form.target_class} onChange={e => setForm({...form,target_class:e.target.value})}>
                <option value="">-- Select --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Visible to Students</label>
              <select style={inp} value={form.is_visible} onChange={e => setForm({...form,is_visible:e.target.value === 'true'})}>
                <option value="true">Yes — show on portal</option>
                <option value="false">No — hide for now</option>
              </select>
            </div>
          </div>
          <div style={{ marginBottom:12 }}><label style={lbl}>Description</label><textarea rows={2} style={{ ...inp, resize:'vertical' }} value={form.description} onChange={e => setForm({...form,description:e.target.value})} /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><label style={lbl}>Video URL (YouTube / Drive)</label><input style={inp} value={form.video_url} onChange={e => setForm({...form,video_url:e.target.value})} placeholder="https://..." /></div>
            <div><label style={lbl}>Or Upload Video File</label><input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} /></div>
          </div>
          <button type="submit" style={{ width:'100%', marginTop:16, padding:'12px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:14, cursor:'pointer' }}>Upload Content</button>
        </form>

        <h3 style={{ fontSize:16, fontWeight:600, marginBottom:12 }}>Existing Content</h3>
        {content.map(c => (
          <div key={c.id} style={{ background:'#fff', borderRadius:10, padding:'1rem 1.25rem', marginBottom:10, display:'flex', justifyContent:'space-between', alignItems:'center', boxShadow:'0 1px 6px rgba(0,0,0,0.05)' }}>
            <div>
              <p style={{ fontWeight:600, fontSize:14 }}>{c.title}</p>
              <p style={{ fontSize:12, color:'#888' }}>{c.subject} · {c.target_class}</p>
            </div>
            <button onClick={() => toggleVisibility(c.id, c.is_visible)}
              style={{ padding:'6px 14px', background: c.is_visible ? '#27ae60' : '#95a5a6', color:'#fff', border:'none', borderRadius:8, fontSize:12, cursor:'pointer' }}>
              {c.is_visible ? 'Visible ✓' : 'Hidden'}
            </button>
          </div>
        ))}
      </main>
    </div>
  )
}

const lbl = { display:'block', fontSize:13, fontWeight:500, marginBottom:5, color:'#555' }
const inp = { width:'100%', padding:'9px 12px', borderRadius:8, border:'1.5px solid #e0e0e0', fontSize:14 }
