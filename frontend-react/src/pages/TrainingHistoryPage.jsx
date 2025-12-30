import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { Brain, Trash2, ChevronRight, Clock, BarChart3 } from 'lucide-react'

const API_URL = 'http://localhost:8000/api'

function TrainingHistoryPage() {
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/training/history`)
      if (res.ok) {
        const data = await res.json()
        setHistory(data)
      }
    } catch (err) {
      console.error('Failed to fetch training history', err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Hapus history training ini?')) return
    
    try {
      const res = await fetch(`${API_URL}/training/history/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchHistory()
      }
    } catch (err) {
      alert('Gagal menghapus: ' + err.message)
    }
  }

  const getAccuracyColor = (acc) => {
    if (acc >= 90) return '#22c55e'
    if (acc >= 70) return '#eab308'
    return '#ef4444'
  }

  if (loading) return <div>Loading...</div>

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>📊 Training History</h1>
          <p>Riwayat training model dengan metrics lengkap</p>
        </div>
        <div className="badge" style={{ fontSize: '14px' }}>
          Total: {history.length} Training
        </div>
      </div>

      {history.length === 0 ? (
        <div className="card" style={{ padding: '48px', textAlign: 'center' }}>
          <Brain size={48} color="#94a3b8" style={{ marginBottom: '16px' }} />
          <h3 style={{ color: '#64748b', margin: 0 }}>Belum Ada Training</h3>
          <p style={{ color: '#94a3b8' }}>
            Klik "Retrain Model" di halaman Dataset untuk mulai training.
          </p>
        </div>
      ) : (
        <div className="card">
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
                <th style={{ padding: '16px' }}>Tanggal</th>
                <th style={{ padding: '16px' }}>Split Ratio</th>
                <th style={{ padding: '16px' }}>Epochs</th>
                <th style={{ padding: '16px' }}>Samples</th>
                <th style={{ padding: '16px' }}>Train Acc</th>
                <th style={{ padding: '16px' }}>Val Acc</th>
                <th style={{ padding: '16px' }}>Test Acc</th>
                <th style={{ padding: '16px', textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {history.map((item) => (
                <tr 
                  key={item.id}
                  style={{ borderBottom: '1px solid #e2e8f0', cursor: 'pointer' }}
                  onClick={() => navigate(`/admin/training/${item.id}`)}
                  className="hover-row"
                >
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Clock size={16} color="#64748b" />
                      {format(new Date(item.trained_at), 'dd MMM yyyy HH:mm')}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span className="badge">{item.split_ratio}</span>
                  </td>
                  <td style={{ padding: '16px' }}>{item.epochs_run}</td>
                  <td style={{ padding: '16px' }}>{item.total_samples}</td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      color: getAccuracyColor(item.train_accuracy), 
                      fontWeight: '600' 
                    }}>
                      {item.train_accuracy}%
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      color: getAccuracyColor(item.val_accuracy), 
                      fontWeight: '600' 
                    }}>
                      {item.val_accuracy}%
                    </span>
                  </td>
                  <td style={{ padding: '16px' }}>
                    <span style={{ 
                      color: getAccuracyColor(item.test_accuracy), 
                      fontWeight: '600',
                      fontSize: '16px'
                    }}>
                      {item.test_accuracy}%
                    </span>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px' }}>
                      <ChevronRight size={18} color="#94a3b8" />
                      <button
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                        onClick={(e) => handleDelete(item.id, e)}
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
      )}

      <style>{`
        .hover-row:hover { background-color: #f8fafc; }
      `}</style>
    </div>
  )
}

export default TrainingHistoryPage
