import { useState, useEffect } from 'react'
import { Trash2, Edit2, Plus, Brain, Database, Check } from 'lucide-react'

const API_URL = 'http://localhost:8000/api'

function IntentPage() {
  const [intents, setIntents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isRetraining, setIsRetraining] = useState(false)
  const [editingIntent, setEditingIntent] = useState(null)
  
  // Form state
  const [formData, setFormData] = useState({
    tag: '',
    patterns: '',
    responses: ''
  })

  useEffect(() => {
    fetchIntents()
  }, [])

  const fetchIntents = async () => {
    try {
      const res = await fetch(`${API_URL}/intents/`)
      const data = await res.json()
      setIntents(data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleRetrain = async () => {
    if (!confirm('Apakah anda yakin ingin melatih ulang model? Ini mungkin memakan waktu.')) return
    
    setIsRetraining(true)
    try {
      const res = await fetch(`${API_URL}/intents/retrain`, { method: 'POST' })
      const data = await res.json()
      alert(data.message)
    } catch (err) {
      alert('Gagal melatih model')
    } finally {
      setIsRetraining(false)
    }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    
    // Convert newlines to arrays
    const payload = {
      tag: formData.tag,
      patterns: formData.patterns.split('\n').filter(s => s.trim()),
      responses: formData.responses.split('\n').filter(s => s.trim())
    }

    try {
      if (editingIntent) {
        // Update
        await fetch(`${API_URL}/intents/${editingIntent.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      } else {
        // Create
        await fetch(`${API_URL}/intents/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
      }
      
      setShowForm(false)
      setEditingIntent(null)
      fetchIntents()
      setFormData({ tag: '', patterns: '', responses: '' })
    } catch (err) {
      alert('Failed to save intent')
    }
  }

  const handleEdit = async (id) => {
    try {
      const res = await fetch(`${API_URL}/intents/${id}`)
      const data = await res.json()
      setEditingIntent(data)
      setFormData({
        tag: data.tag,
        patterns: data.patterns.map(p => p.pattern_text).join('\n'),
        responses: data.responses.map(r => r.response_text).join('\n')
      })
      setShowForm(true)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Hapus intent ini?')) return
    try {
      await fetch(`${API_URL}/intents/${id}`, { method: 'DELETE' })
      fetchIntents()
    } catch (err) {
      alert('Failed to delete')
    }
  }

  // Helper to reset form
  const openNewForm = () => {
    setEditingIntent(null)
    setFormData({ tag: '', patterns: '', responses: '' })
    setShowForm(true)
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Dataset Intent</h1>
          <p>Kelola data pertanyaan dan jawaban chatbot</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            onClick={handleRetrain} 
            disabled={isRetraining}
          >
            {isRetraining ? (
              <>Melatih Model...</>
            ) : (
              <><Brain size={18} /> Retrain Model</>
            )}
          </button>
          <button className="btn btn-primary" onClick={openNewForm}>
            <Plus size={18} /> Tambah Intent
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 style={{ marginBottom: '16px' }}>{editingIntent ? 'Edit Intent' : 'Tambah Intent Baru'}</h3>
          <form onSubmit={handleSave}>
            <div className="form-group">
              <label>Tag (Kategori)</label>
              <input 
                className="form-control" 
                value={formData.tag} 
                onChange={e => setFormData({...formData, tag: e.target.value})}
                placeholder="misal: info_biaya"
                required
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div className="form-group">
                <label>Patterns (Pertanyaan User)</label>
                <small style={{ display: 'block', color: '#64748b', marginBottom: '8px' }}>Satu baris satu kalimat</small>
                <textarea 
                  className="form-control" 
                  rows="6"
                  value={formData.patterns}
                  onChange={e => setFormData({...formData, patterns: e.target.value})}
                  placeholder="Berapa biayanya?&#10;Biaya pendaftaran berapa?"
                  required
                />
              </div>
              <div className="form-group">
                <label>Responses (Jawaban Bot)</label>
                <small style={{ display: 'block', color: '#64748b', marginBottom: '8px' }}>Satu baris satu variasi jawaban</small>
                <textarea 
                  className="form-control" 
                  rows="6"
                  value={formData.responses}
                  onChange={e => setFormData({...formData, responses: e.target.value})}
                  placeholder="Biaya pendaftaran adalah Rp 150.000"
                  required
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button type="submit" className="btn btn-primary">Simpan</button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Batal</button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
              <th style={{ padding: '16px' }}>Tag</th>
              <th style={{ padding: '16px' }}>Patterns</th>
              <th style={{ padding: '16px' }}>Responses</th>
              <th style={{ padding: '16px', textAlign: 'right' }}>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {intents.map((intent) => (
              <tr key={intent.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '16px', verticalAlign: 'top', fontWeight: '500' }}>
                  <span className="badge">{intent.tag}</span>
                </td>
                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                  {intent.pattern_count} patterns
                </td>
                <td style={{ padding: '16px', verticalAlign: 'top' }}>
                  {intent.response_count} responses
                </td>
                <td style={{ padding: '16px', textAlign: 'right', verticalAlign: 'top' }}>
                  <button 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', marginRight: '8px' }}
                    onClick={() => handleEdit(intent.id)}
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444' }}
                    onClick={() => handleDelete(intent.id)}
                  >
                    <Trash2 size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default IntentPage
