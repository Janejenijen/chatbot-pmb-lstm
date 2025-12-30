import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react'

const API_URL = 'http://localhost:8000/api'

function IntentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [intent, setIntent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [newPattern, setNewPattern] = useState('')
  const [newResponse, setNewResponse] = useState('')

  useEffect(() => {
    fetchIntent()
  }, [id])

  const fetchIntent = async () => {
    try {
      const res = await fetch(`${API_URL}/intents/${id}`)
      if (!res.ok) throw new Error('Intent not found')
      const data = await res.json()
      setIntent(data)
    } catch (err) {
      console.error(err)
      alert('Failed to load intent')
      navigate('/admin/intents')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async (updates) => {
    try {
        const payload = {
            tag: updates.tag !== undefined ? updates.tag : intent.tag,
            patterns: updates.patterns !== undefined ? updates.patterns : intent.patterns.map(p => p.pattern_text),
            responses: updates.responses !== undefined ? updates.responses : intent.responses.map(r => r.response_text)
        }

        const res = await fetch(`${API_URL}/intents/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        
        if (!res.ok) throw new Error('Failed to update')
        fetchIntent()
    } catch (err) {
        alert(err.message)
    }
  }

  const addPattern = async (e) => {
    e.preventDefault()
    if (!newPattern.trim()) return
    
    // Optimistic update or refetch? Refetch is safer for ID sync
    // We can use the specific add endpoint if we made one, or just update the whole list
    // Since backend supports full update, let's append to list
    const currentPatterns = intent.patterns.map(p => p.pattern_text)
    await handleUpdate({ patterns: [...currentPatterns, newPattern] })
    setNewPattern('')
  }
  
  const addResponse = async (e) => {
    e.preventDefault()
    if (!newResponse.trim()) return
    const currentResponses = intent.responses.map(r => r.response_text)
    await handleUpdate({ responses: [...currentResponses, newResponse] })
    setNewResponse('')
  }

  const deletePattern = async (text) => {
    if(!confirm('Hapus pattern ini?')) return
    const currentPatterns = intent.patterns.map(p => p.pattern_text).filter(p => p !== text)
    await handleUpdate({ patterns: currentPatterns })
  }

  const deleteResponse = async (text) => {
    if(!confirm('Hapus response ini?')) return
    const currentResponses = intent.responses.map(r => r.response_text).filter(r => r !== text)
    await handleUpdate({ responses: currentResponses })
  }

  if (loading) return <div>Loading...</div>
  if (!intent) return null

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button onClick={() => navigate('/admin/intents')} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <ArrowLeft size={24} />
          </button>
          <div className="page-title">
            <h1 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {intent.tag}
              <span className="badge" style={{ fontSize: '14px', fontWeight: 'normal' }}>ID: {intent.id}</span>
            </h1>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        {/* Patterns Section */}
        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
             <h3 style={{ margin: 0 }}>Patterns (Pertanyaan)</h3>
          </div>
          
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
            <form onSubmit={addPattern} style={{ display: 'flex', gap: '8px' }}>
                <input 
                    className="form-control" 
                    placeholder="Tambah pertanyaan baru..." 
                    value={newPattern}
                    onChange={e => setNewPattern(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={!newPattern.trim()}>
                    <Plus size={18} />
                </button>
            </form>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {intent.patterns.map((p) => (
                        <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px' }}>{p.pattern_text}</td>
                            <td style={{ padding: '12px', textAlign: 'right', width: '40px' }}>
                                <button 
                                    onClick={() => deletePattern(p.pattern_text)}
                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {intent.patterns.length === 0 && (
                        <tr><td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Belum ada patterns</td></tr>
                    )}
                </tbody>
            </table>
          </div>
        </div>

        {/* Responses Section */}
        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
             <h3 style={{ margin: 0 }}>Responses (Jawaban)</h3>
          </div>
          
           <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
            <form onSubmit={addResponse} style={{ display: 'flex', gap: '8px' }}>
                <input 
                    className="form-control" 
                    placeholder="Tambah jawaban baru..." 
                    value={newResponse}
                    onChange={e => setNewResponse(e.target.value)}
                />
                <button type="submit" className="btn btn-primary" disabled={!newResponse.trim()}>
                    <Plus size={18} />
                </button>
            </form>
          </div>

          <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                    {intent.responses.map((r) => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '12px' }}>{r.response_text}</td>
                             <td style={{ padding: '12px', textAlign: 'right', width: '40px' }}>
                                <button 
                                    onClick={() => deleteResponse(r.response_text)}
                                    style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                    {intent.responses.length === 0 && (
                        <tr><td colSpan="2" style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>Belum ada responses</td></tr>
                    )}
                </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

export default IntentDetailPage
