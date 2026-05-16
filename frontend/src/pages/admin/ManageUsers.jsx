import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../api'
import { useAuth } from '../../context/AuthContext'

export default function ManageUsers() {
  const { user, logout } = useAuth()
  const nav = useNavigate()
  const [students, setStudents] = useState([])
  const [admins, setAdmins] = useState([])
  const [stats, setStats] = useState(null)
  const [tab, setTab] = useState('students')
  const [classFilter, setClassFilter] = useState('')
  const [classes, setClasses] = useState([])
  const [search, setSearch] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [studRes, adminRes, statsRes, classRes] = await Promise.all([
        api.get('/auth/students/'),
        api.get('/auth/admins/'),
        api.get('/auth/stats/'),
        api.get('/classes/'),
      ])
      setStudents(studRes.data)
      setAdmins(adminRes.data)
      setStats(statsRes.data)
      setClasses(classRes.data)
    } catch(e) {
      console.error(e)
    }
    setLoading(false)
  }

  async function deleteUser(userId) {
    try {
      await api.delete(`/auth/users/${userId}/delete/`)
      setConfirmDelete(null)
      fetchAll()
    } catch(e) {
      alert(e.response?.data?.error || 'Could not delete user')
    }
  }

  const filteredStudents = students.filter(s => {
    const matchClass = classFilter ? s.student_class === parseInt(classFilter) : true
    const matchSearch = search
      ? `${s.first_name} ${s.last_name} ${s.username}`.toLowerCase().includes(search.toLowerCase())
      : true
    return matchClass && matchSearch
  })

  const filteredAdmins = admins.filter(a =>
    search ? `${a.first_name} ${a.last_name} ${a.username}`.toLowerCase().includes(search.toLowerCase()) : true
  )

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>

      {/* Header */}
      <header style={{ background:'#1a1a2e', padding:'14px 2rem', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:20, fontWeight:700, color:'#fff' }}>
          AssessStud <span style={{ fontSize:12, background:'#667eea', padding:'2px 8px', borderRadius:99, marginLeft:8 }}>Admin</span>
        </span>
        <nav style={{ display:'flex', gap:16 }}>
          {[
            ['Dashboard','/admin/dashboard'],
            ['Add Question','/admin/questions'],
            ['New Assessment','/admin/create'],
            ['Content','/admin/content'],
            ['Users','/admin/users'],
          ].map(([label,path]) => (
            <Link key={path} to={path} style={{ color: path === '/admin/users' ? '#fff' : '#ccc', textDecoration:'none', fontSize:13, fontWeight: path === '/admin/users' ? 700 : 500 }}>{label}</Link>
          ))}
          <button onClick={() => { logout(); nav('/admin/login') }}
            style={{ background:'none', border:'1px solid #555', color:'#ccc', padding:'5px 12px', borderRadius:8, cursor:'pointer', fontSize:12 }}>
            Logout
          </button>
        </nav>
      </header>

      <main style={{ maxWidth:1100, margin:'2rem auto', padding:'0 1rem' }}>

        {/* Stats cards */}
        {stats && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(140px,1fr))', gap:12, marginBottom:24 }}>
            <div style={statCard}>
              <div style={statNum}>{stats.total_students}</div>
              <div style={statLbl}>Total Students</div>
            </div>
            <div style={statCard}>
              <div style={statNum}>{stats.total_admins}</div>
              <div style={statLbl}>Total Admins</div>
            </div>
            {stats.per_class.map(c => (
              <div key={c.class} style={statCard}>
                <div style={statNum}>{c.count}</div>
                <div style={statLbl}>{c.class}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display:'flex', gap:8, marginBottom:20 }}>
          <button onClick={() => setTab('students')}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
              background: tab === 'students' ? '#667eea' : '#fff',
              color: tab === 'students' ? '#fff' : '#555',
              boxShadow:'0 2px 6px rgba(0,0,0,0.08)' }}>
            Students ({students.length})
          </button>
          <button onClick={() => setTab('admins')}
            style={{ padding:'8px 20px', borderRadius:8, border:'none', cursor:'pointer', fontWeight:600, fontSize:13,
              background: tab === 'admins' ? '#667eea' : '#fff',
              color: tab === 'admins' ? '#fff' : '#555',
              boxShadow:'0 2px 6px rgba(0,0,0,0.08)' }}>
            Admins ({admins.length})
          </button>
        </div>

        {/* Search and filter */}
        <div style={{ display:'flex', gap:10, marginBottom:16 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or username..."
            style={{ flex:1, padding:'9px 12px', borderRadius:8, border:'1.5px solid #e0e0e0', fontSize:13 }}
          />
          {tab === 'students' && (
            <select value={classFilter} onChange={e => setClassFilter(e.target.value)}
              style={{ padding:'9px 12px', borderRadius:8, border:'1.5px solid #e0e0e0', fontSize:13 }}>
              <option value="">All Classes</option>
              {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          )}
        </div>

        {/* Table */}
        {loading ? (
          <p style={{ color:'#888' }}>Loading...</p>
        ) : (
          <div style={{ background:'#fff', borderRadius:12, boxShadow:'0 2px 10px rgba(0,0,0,0.06)', overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#f9f9f9' }}>
                  <th style={th}>Name</th>
                  <th style={th}>Username</th>
                  {tab === 'students' && <th style={th}>Class</th>}
                  <th style={th}>Role</th>
                  <th style={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {(tab === 'students' ? filteredStudents : filteredAdmins).map(u => (
                  <tr key={u.id} style={{ borderBottom:'1px solid #f0f0f0' }}>
                    <td style={td}>{u.first_name} {u.last_name}</td>
                    <td style={td}>{u.username}</td>
                    {tab === 'students' && <td style={td}>{u.student_class_name || '—'}</td>}
                    <td style={td}>
                      <span style={{ fontSize:11, fontWeight:600, color:'#fff',
                        background: u.role === 'admin' ? '#667eea' : '#27ae60',
                        padding:'2px 8px', borderRadius:99 }}>
                        {u.role}
                      </span>
                    </td>
                    <td style={td}>
                      {u.id !== user.id ? (
                        <button onClick={() => setConfirmDelete(u)}
                          style={{ padding:'5px 12px', background:'#fdecea', color:'#e74c3c', border:'none', borderRadius:6, cursor:'pointer', fontSize:12, fontWeight:600 }}>
                          Delete
                        </button>
                      ) : (
                        <span style={{ fontSize:12, color:'#aaa' }}>You</span>
                      )}
                    </td>
                  </tr>
                ))}
                {(tab === 'students' ? filteredStudents : filteredAdmins).length === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding:'2rem', textAlign:'center', color:'#888' }}>
                      No {tab} found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999 }}>
          <div style={{ background:'#fff', borderRadius:16, padding:'2rem', maxWidth:380, width:'90%', textAlign:'center', boxShadow:'0 20px 60px rgba(0,0,0,0.2)' }}>
            <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
            <h3 style={{ fontSize:18, fontWeight:700, marginBottom:8 }}>Delete Account</h3>
            <p style={{ color:'#666', fontSize:14, marginBottom:20 }}>
              Are you sure you want to delete <strong>{confirmDelete.first_name} {confirmDelete.last_name}</strong>?
              This cannot be undone.
            </p>
            <div style={{ display:'flex', gap:10, justifyContent:'center' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding:'10px 24px', borderRadius:8, border:'1.5px solid #e0e0e0', background:'#fff', cursor:'pointer', fontWeight:600, fontSize:14 }}>
                Cancel
              </button>
              <button onClick={() => deleteUser(confirmDelete.id)}
                style={{ padding:'10px 24px', borderRadius:8, border:'none', background:'#e74c3c', color:'#fff', cursor:'pointer', fontWeight:600, fontSize:14 }}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const statCard = { background:'#fff', borderRadius:12, padding:'1rem', textAlign:'center', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }
const statNum  = { fontSize:26, fontWeight:700, color:'#667eea' }
const statLbl  = { fontSize:12, color:'#888', marginTop:4 }
const th = { padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:600, color:'#888', textTransform:'uppercase', letterSpacing:'0.04em' }
const td = { padding:'12px 16px', color:'#333' }
