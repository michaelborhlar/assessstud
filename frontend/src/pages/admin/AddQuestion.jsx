import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api'

const SUBJECTS = ['math','F/math','eng','sci','bio','phy','chem','geo','hist','other']

export default function AddQuestion() {
  const [form, setForm] = useState({
    subject:'math',
    topic:'',
    text:'',
    correct_text_answer:'',
    solution_description:''
  })

  const [choices, setChoices] = useState([
    { label:'A', text:'', is_correct:false },
    { label:'B', text:'', is_correct:false },
    { label:'C', text:'', is_correct:false },
    { label:'D', text:'', is_correct:false },
  ])

  const [image, setImage] = useState(null)
  const [success, setSuccess] = useState(false)
  const [answerType, setAnswerType] = useState('mcq')
  const [questions, setQuestions] = useState([])

  function setCorrect(i) {
    setChoices(
      choices.map((c,j) => ({
        ...c,
        is_correct: i === j
      }))
    )
  }

  async function loadQuestions() {
    try {
      const res = await api.get('/assessments/questions/')
      setQuestions(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => {
    loadQuestions()
  }, [])

  async function submit(e) {
    e.preventDefault()

    const fd = new FormData()

    fd.append('subject', form.subject)
    fd.append('topic', form.topic)
    fd.append('text', form.text)
    fd.append('correct_text_answer', form.correct_text_answer)
    fd.append('solution_description', form.solution_description)
    fd.append('choices', JSON.stringify(choices))

    if (image) {
      fd.append('image', image)
    }

    await api.post('/assessments/questions/', fd)

    loadQuestions()

    setSuccess(true)

    setForm({
      subject:'math',
      topic:'',
      text:'',
      correct_text_answer:'',
      solution_description:''
    })

    setChoices([
      {label:'A',text:'',is_correct:false},
      {label:'B',text:'',is_correct:false},
      {label:'C',text:'',is_correct:false},
      {label:'D',text:'',is_correct:false}
    ])

    setImage(null)

    setTimeout(() => setSuccess(false), 3000)
  }

  async function deleteQuestion(id) {
    const ok = window.confirm('Delete this question?')

    if (!ok) return

    try {
      await api.delete(`/assessments/questions/${id}/delete/`)

      setQuestions(prev =>
        prev.filter(q => q.id !== id)
      )

      alert('Question deleted successfully')
    } catch (err) {
      console.error(err)
      alert('Failed to delete question')
    }
  }

  return (
    <div style={{ minHeight:'100vh', background:'#f5f5f5' }}>
      <header style={{
        background:'#1a1a2e',
        padding:'14px 2rem',
        display:'flex',
        justifyContent:'space-between',
        alignItems:'center'
      }}>
        <span style={{
          fontSize:20,
          fontWeight:700,
          color:'#fff'
        }}>
          AssessStud Admin
        </span>

        <Link
          to="/admin/dashboard"
          style={{
            color:'#ccc',
            textDecoration:'none',
            fontSize:13
          }}
        >
          ← Dashboard
        </Link>
      </header>

      <main style={{
        maxWidth:680,
        margin:'2rem auto',
        padding:'0 1rem'
      }}>

        <h2 style={{
          fontSize:20,
          fontWeight:700,
          marginBottom:20
        }}>
          Add Question to Bank
        </h2>

        {success && (
          <div style={{
            background:'#d4edda',
            color:'#155724',
            padding:'10px 16px',
            borderRadius:8,
            marginBottom:16
          }}>
            ✓ Question saved!
          </div>
        )}

        <form
          onSubmit={submit}
          style={{
            background:'#fff',
            borderRadius:12,
            padding:'1.5rem',
            boxShadow:'0 2px 10px rgba(0,0,0,0.06)'
          }}
        >

          <div style={{
            display:'grid',
            gridTemplateColumns:'1fr 1fr',
            gap:12,
            marginBottom:14
          }}>

            <div>
              <label style={lbl}>Subject</label>

              <select
                style={inp}
                value={form.subject}
                onChange={e =>
                  setForm({
                    ...form,
                    subject:e.target.value
                  })
                }
              >
                {SUBJECTS.map(s => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase()+s.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={lbl}>Topic</label>

              <input
                style={inp}
                value={form.topic}
                onChange={e =>
                  setForm({
                    ...form,
                    topic:e.target.value
                  })
                }
                placeholder="e.g. Photosynthesis"
              />
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={lbl}>Question Text</label>

            <textarea
              rows={3}
              style={{ ...inp, resize:'vertical' }}
              required
              value={form.text}
              onChange={e =>
                setForm({
                  ...form,
                  text:e.target.value
                })
              }
              placeholder="Type question here..."
            />
          </div>

          <div style={{ marginBottom:14 }}>
            <label style={lbl}>
              Question Image (optional)
            </label>

            <input
              type="file"
              accept="image/*"
              onChange={e =>
                setImage(e.target.files[0])
              }
            />
          </div>

          <div style={{ marginBottom:16 }}>
            <label style={lbl}>
              This question's answer type
            </label>

            <select
              style={inp}
              value={answerType}
              onChange={e =>
                setAnswerType(e.target.value)
              }
            >
              <option value="mcq">
                Multiple Choice
              </option>

              <option value="typed">
                Typed Answer
              </option>
            </select>
          </div>

          {answerType === 'mcq' && (
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>
                Answer Choices
                <span style={{
                  color:'#888',
                  fontWeight:400
                }}>
                  {' '} (select radio = correct answer)
                </span>
              </label>

              {choices.map((c,i) => (
                <div
                  key={i}
                  style={{
                    display:'flex',
                    alignItems:'center',
                    gap:10,
                    marginBottom:8
                  }}
                >
                  <input
                    type="radio"
                    name="correct"
                    checked={c.is_correct}
                    onChange={() => setCorrect(i)}
                  />

                  <span style={{
                    fontWeight:700,
                    color:'#667eea',
                    width:20
                  }}>
                    {c.label}.
                  </span>

                  <input
                    style={{
                      ...inp,
                      flex:1,
                      marginBottom:0
                    }}
                    value={c.text}
                    onChange={e =>
                      setChoices(
                        choices.map((cc,j) =>
                          j===i
                            ? {...cc,text:e.target.value}
                            : cc
                        )
                      )
                    }
                    placeholder={`Option ${c.label}`}
                    required
                  />
                </div>
              ))}
            </div>
          )}

          {answerType === 'typed' && (
            <div style={{ marginBottom:16 }}>
              <label style={lbl}>
                Correct Answer
                <span style={{ color:'#e74c3c' }}>
                  {' '}*
                </span>
              </label>

              <input
                style={inp}
                value={form.correct_text_answer}
                onChange={e =>
                  setForm({
                    ...form,
                    correct_text_answer:e.target.value
                  })
                }
                placeholder="Type the exact correct answer here..."
              />

              <p style={{
                fontSize:11,
                color:'#888',
                marginTop:4
              }}>
                Student's answer will be compared
                to this. Case-insensitive exact match.
              </p>
            </div>
          )}

          <div style={{ marginBottom:16 }}>
            <label style={lbl}>
              Solution / Explanation (optional)
            </label>

            <textarea
              rows={3}
              style={{ ...inp, resize:'vertical' }}
              value={form.solution_description}
              onChange={e =>
                setForm({
                  ...form,
                  solution_description:e.target.value
                })
              }
              placeholder="Explain how to arrive at the correct answer..."
            />
          </div>

          <button
            type="submit"
            style={{
              width:'100%',
              padding:'12px',
              background:'linear-gradient(135deg,#667eea,#764ba2)',
              color:'#fff',
              border:'none',
              borderRadius:8,
              fontWeight:600,
              fontSize:15,
              cursor:'pointer'
            }}
          >
            Save Question
          </button>
        </form>

        {/* Saved Questions */}
        <div style={{
          marginTop:'2rem',
          background:'#fff',
          borderRadius:12,
          padding:'1.5rem',
          boxShadow:'0 2px 10px rgba(0,0,0,0.06)'
        }}>

          <h3 style={{ marginBottom:16 }}>
            Saved Questions
          </h3>

          {questions.length === 0 && (
            <p style={{ color:'#777' }}>
              No questions yet.
            </p>
          )}

          {questions.map(q => (
            <div
              key={q.id}
              style={{
                border:'1px solid #eee',
                borderRadius:8,
                padding:'12px',
                marginBottom:'12px'
              }}
            >

              <div style={{
                fontWeight:600,
                marginBottom:6
              }}>
                {q.text}
              </div>

              <div style={{
                fontSize:12,
                color:'#777',
                marginBottom:10
              }}>
                {q.subject} • {q.topic}
              </div>

              <button
                onClick={() => deleteQuestion(q.id)}
                style={{
                  background:'#e74c3c',
                  color:'#fff',
                  border:'none',
                  padding:'8px 14px',
                  borderRadius:6,
                  cursor:'pointer',
                  fontWeight:600
                }}
              >
                Delete
              </button>

            </div>
          ))}
        </div>

      </main>
    </div>
  )
}

const lbl = {
  display:'block',
  fontSize:13,
  fontWeight:500,
  marginBottom:5,
  color:'#555'
}

const inp = {
  width:'100%',
  padding:'9px 12px',
  borderRadius:8,
  border:'1.5px solid #e0e0e0',
  fontSize:14,
  marginBottom:0
}
