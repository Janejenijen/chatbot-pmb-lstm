import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Edit2, Plus, Brain, Database, Check, ChevronRight, X } from 'lucide-react'

const API_URL = 'http://localhost:8000/api'

function IntentPage() {
  const navigate = useNavigate()
  const [intents, setIntents] = useState([])
  const [loading, setLoading] = useState(true)
  const [isRetraining, setIsRetraining] = useState(false)
  
  // Assignment Modal State
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedLog, setSelectedLog] = useState(null)
  
  // New Intent Modal State
  const [showNewIntentModal, setShowNewIntentModal] = useState(false)
  const [newIntentTag, setNewIntentTag] = useState('')

  /* New Data State */
  const [newData, setNewData] = useState([])

  useEffect(() => {
    fetchIntents()
    fetchNewData()
  }, [])

  const fetchNewData = async () => {
    try {
      const res = await fetch(`${API_URL}/chat/new-data`)
      if (res.ok) {
        const data = await res.json()
        setNewData(data)
      }
    } catch (err) {
      console.error("Failed to fetch new data", err)
    }
  }

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
      
      if (!res.ok) throw new Error(data.detail || 'Gagal melatih model')
      
      alert(data.message)
      fetchNewData()
    } catch (err) {
      console.error(err)
      alert(`Error: ${err.message}`)
    } finally {
      setIsRetraining(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Hapus intent ini?')) return
    try {
      const res = await fetch(`${API_URL}/intents/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete')
      fetchIntents()
    } catch (err) {
      alert(`Error deleting: ${err.message}`)
    }
  }

  const openAssignModal = (log) => {
    setSelectedLog(log)
    setShowAssignModal(true)
  }

  const handleAssign = async (intentId) => {
    try {
        const res = await fetch(`${API_URL}/chat/assign`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                log_id: selectedLog.id,
                intent_id: intentId,
                pattern_text: selectedLog.user_message
            })
        })
        
        if (!res.ok) throw new Error('Failed to assign')
        
        setShowAssignModal(false)
        setSelectedLog(null)
        fetchNewData() // Refresh list
        // fetchIntents() // Optional: refresh counts
    } catch (err) {
        alert(err.message)
    }
  }
  
  const createNewIntent = async (e) => {
      e.preventDefault()
      try {
          const res = await fetch(`${API_URL}/intents/`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  tag: newIntentTag,
                  patterns: [],
                  responses: []
              })
          })
          if (!res.ok) throw new Error('Failed')
          
          const data = await res.json()
          setShowNewIntentModal(false)
          setNewIntentTag('')
          // Navigate to new detail
          navigate(`/admin/intents/${data.id}`)
      } catch (err) {
          alert(err.message)
      }
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
          <button className="btn btn-primary" onClick={() => setShowNewIntentModal(true)}>
            <Plus size={18} /> Tambah Intent
          </button>
        </div>
      </div>

      {newData.length > 0 && (
        <div className="card" style={{ marginBottom: '24px', border: '1px solid #3b82f6' }}>
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#eff6ff' }}>
            <h3 style={{ margin: 0, color: '#1e40af', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Database size={18} />
              Inbox Pertanyaan Baru ({newData.length})
            </h3>
            <small style={{ color: '#1e40af' }}>Data ini belum dilatih</small>
          </div>
          <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <thead style={{ position: 'sticky', top: 0, background: '#fff' }}>
                <tr style={{ textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px' }}>Pertanyaan User</th>
                  <th style={{ padding: '12px' }}>Prediksi Intent</th>
                  <th style={{ padding: '12px', textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {newData.map((item) => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontWeight: '500' }}>{item.user_message}</td>
                    <td style={{ padding: '12px' }}>
                      <span className="badge" style={{ background: '#e2e8f0', color: '#475569' }}>
                        {item.predicted_intent || '?'} ({Math.round(item.confidence * 100)}%)
                      </span>
                    </td>
                    <td style={{ padding: '12px', textAlign: 'right' }}>
                      <button 
                        className="btn btn-sm" 
                        style={{ fontSize: '12px', padding: '4px 8px', background: '#3b82f6', color: 'white' }}
                        onClick={() => openAssignModal(item)}
                      >
                        <Plus size={14} style={{ marginRight: '4px' }}/> Tambah ke Dataset
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Intent List */}
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
              <tr 
                key={intent.id} 
                style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}
                onClick={() => navigate(`/admin/intents/${intent.id}`)}
                className="hover-row"
              >
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
                   <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '4px' }}>
                      <ChevronRight size={18} color="#94a3b8" />
                      <button 
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                        onClick={(e) => handleDelete(intent.id, e)}
                      >
                        <Trash2 size={18} />
                      </button>
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Assign Modal */}
      {showAssignModal && (
          <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
              <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
                  <h3 style={{ marginTop: 0 }}>Pilih Intent Tujuan</h3>
                  <p>Masukkan "{selectedLog?.user_message}" ke dalam:</p>
                  
                  <div style={{ maxHeight: '300px', overflowY: 'auto', border: '1px solid #e2e8f0', borderRadius: '4px', marginBottom: '16px' }}>
                      {intents.map(i => (
                          <div 
                            key={i.id} 
                            style={{ padding: '12px', borderBottom: '1px solid #f1f5f9', cursor: 'pointer' }}
                            className="hover-bg"
                            onClick={() => handleAssign(i.id)}
                          >
                              <div style={{ fontWeight: '500' }}>{i.tag}</div>
                          </div>
                      ))}
                  </div>
                  
                   <button 
                      className="btn btn-secondary" 
                      onClick={() => setShowAssignModal(false)}
                      style={{ width: '100%' }}
                   >
                      Batal
                   </button>
              </div>
          </div>
      )}
      
      {/* New Intent Modal */}
      {showNewIntentModal && (
           <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }}>
               <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '400px', maxWidth: '90%' }}>
                  <h3 style={{ marginTop: 0 }}>Buat Intent Baru</h3>
                  <form onSubmit={createNewIntent}>
                      <div className="form-group">
                          <label>Nama Tag</label>
                          <input 
                            className="form-control" 
                            value={newIntentTag} 
                            onChange={e => setNewIntentTag(e.target.value)}
                            placeholder="misal: info_beasiswa" 
                            required 
                          />
                      </div>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
                          <button type="submit" className="btn btn-primary">Buat</button>
                          <button type="button" className="btn btn-secondary" onClick={() => setShowNewIntentModal(false)}>Batal</button>
                      </div>
                  </form>
               </div>
          </div>
      )}
      
      <style>{`
        .hover-row:hover { background-color: #f8fafc; }
        .hover-bg:hover { background-color: #f1f5f9; }
      `}</style>
    </div>
  )
}

export default IntentPage
