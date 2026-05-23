import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'

export default function BulkUploadQuestions() {
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')
  const nav = useNavigate()

  async function submit(e) {
    e.preventDefault()
    if (!file) { setError('Please select a .docx file'); return }
    setLoading(true)
    setError('')
    setResult(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const r = await api.post('/assessments/questions/bulk-upload/', fd)
      setResult(r.data)
    } catch(err) {
      setError(err.response?.data?.error || 'Upload failed')
    }
    setLoading(false)
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>
      <header style={{ background:'#1a1a2e', padding:'14px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:20, fontWeight:700, color:'#fff' }}>AssessStud Admin</span>
        <nav style={{ display:'flex', gap:16 }}>
          <Link to="/admin/dashboard" style={{ color:'#ccc', textDecoration:'none', fontSize:13 }}>Dashboard</Link>
          <Link to="/admin/questions" style={{ color:'#ccc', textDecoration:'none', fontSize:13 }}>Add Single Question</Link>
        </nav>
      </header>

      <main style={{ maxWidth:700, margin:'2rem auto', padding:'0 1rem' }}>
        <h2 style={{ fontSize:20, fontWeight:700, marginBottom:6 }}>Bulk Upload Questions</h2>
        <p style={{ color:'#888', fontSize:14, marginBottom:24 }}>
          Upload a Word (.docx) file with multiple questions at once.
        </p>

        {/* Format guide */}
        <div style={{ background:'#fff', borderRadius:12, padding:'1.25rem', marginBottom:20, boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontSize:14, fontWeight:600, marginBottom:10, color:'#1a1a2e' }}>
            📋 Required Word Document Format
          </h3>
          <pre style={{ background:'#f8f8f8', borderRadius:8, padding:'1rem', fontSize:12, color:'#333', overflowX:'auto', lineHeight:1.8 }}>
{`Q: What is the powerhouse of the cell?
A: Nucleus
B: Mitochondria
C: Golgi Apparatus
D: Ribosome
ANSWER: B
TOPIC: Cell Biology
SUBJECT: bio

Q: What is the chemical symbol for water?
A: CO2
B: H2O2
C: H2O
D: HO
ANSWER: C
TOPIC: Chemistry
SUBJECT: chem
SOLUTION: Water is made of 2 hydrogen and 1 oxygen atoms`}
          </pre>
          <div style={{ marginTop:12, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
            <div style={{ background:'#f0f4ff', borderRadius:8, padding:'10px 12px', fontSize:12 }}>
              <p style={{ fontWeight:600, color:'#667eea', marginBottom:4 }}>Required lines</p>
              <p style={{ color:'#555', lineHeight:1.8 }}>
                Q: question text<br/>
                A: B: C: D: options<br/>
                ANSWER: correct letter
              </p>
            </div>
            <div style={{ background:'#f0fff4', borderRadius:8, padding:'10px 12px', fontSize:12 }}>
              <p style={{ fontWeight:600, color:'#27ae60', marginBottom:4 }}>Optional lines</p>
              <p style={{ color:'#555', lineHeight:1.8 }}>
                TOPIC: topic name<br/>
                SUBJECT: subject code<br/>
                SOLUTION: explanation
              </p>
            </div>
          </div>
          <div style={{ marginTop:10, background:'#fffbe6', borderRadius:8, padding:'10px 12px', fontSize:12, color:'#856404' }}>
            ⚠️ Leave a blank line between each question. Subject codes: math, eng, sci, bio, phy, chem, geo, hist, other
          </div>
        </div>

        {/* Upload form */}
        <div style={{ background:'#fff', borderRadius:12, padding:'1.5rem', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
          <form onSubmit={submit}>
            <div style={{ border:'2px dashed #e0e0e0', borderRadius:10, padding:'2rem', textAlign:'center', marginBottom:16,
              background: file ? '#f0fff4' : '#fafafa',
              borderColor: file ? '#27ae60' : '#e0e0e0' }}>
              <div style={{ fontSize:36, marginBottom:8 }}>📄</div>
              <p style={{ fontSize:14, color:'#555', marginBottom:10 }}>
                {file ? `✓ ${file.name}` : 'Select your Word document'}
              </p>
              <input
                type="file"
                accept=".docx"
                onChange={e => { setFile(e.target.files[0]); setResult(null); setError('') }}
                style={{ fontSize:13 }}
              />
            </div>

            {error && (
              <div style={{ background:'#fdecea', color:'#e74c3c', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:12 }}>
                ❌ {error}
              </div>
            )}

            <button type="submit" disabled={loading || !file}
              style={{ width:'100%', padding:'13px', background: loading ? '#aaa' : 'linear-gradient(135deg,#667eea,#764ba2)',
                color:'#fff', border:'none', borderRadius:8, fontWeight:600, fontSize:15,
                cursor: loading ? 'not-allowed' : 'pointer' }}>
              {loading ? '⏳ Uploading and parsing...' : '⬆️ Upload Questions'}
            </button>
          </form>

          {/* Results */}
          {result && (
            <div style={{ marginTop:20 }}>
              <div style={{ background:'#d4edda', color:'#155724', padding:'12px 16px', borderRadius:8, marginBottom:12, fontWeight:600 }}>
                ✅ {result.created} question{result.created !== 1 ? 's' : ''} uploaded successfully!
              </div>

              {result.errors && result.errors.length > 0 && (
                <div style={{ background:'#fdecea', color:'#e74c3c', padding:'12px 16px', borderRadius:8, marginBottom:12 }}>
                  <p style={{ fontWeight:600, marginBottom:6 }}>⚠️ {result.errors.length} error(s):</p>
                  {result.errors.map((e,i) => <p key={i} style={{ fontSize:13 }}>• {e}</p>)}
                </div>
              )}

              <div style={{ maxHeight:240, overflowY:'auto', border:'1px solid #e0e0e0', borderRadius:8 }}>
                {result.questions.map((q,i) => (
                  <div key={q.id} style={{ padding:'8px 14px', borderBottom:'1px solid #f0f0f0', fontSize:13, display:'flex', gap:10 }}>
                    <span style={{ color:'#667eea', fontWeight:600, minWidth:24 }}>{i+1}.</span>
                    <span style={{ color:'#333' }}>{q.text}</span>
                  </div>
                ))}
              </div>

              <div style={{ display:'flex', gap:10, marginTop:14 }}>
                <button onClick={() => { setFile(null); setResult(null) }}
                  style={{ flex:1, padding:'10px', background:'#f5f5f5', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13 }}>
                  Upload Another File
                </button>
                <button onClick={() => nav('/admin/create')}
                  style={{ flex:1, padding:'10px', background:'linear-gradient(135deg,#667eea,#764ba2)', color:'#fff', border:'none', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:13 }}>
                  Create Assessment →
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
