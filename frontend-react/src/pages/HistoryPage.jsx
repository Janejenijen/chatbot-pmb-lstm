import { useState, useEffect } from 'react'
import { format } from 'date-fns'

const API_URL = 'http://localhost:8000/api'

function HistoryPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(0)
  const limit = 20

  useEffect(() => {
    fetchHistory()
  }, [page])

  const fetchHistory = async () => {
    try {
      const offset = page * limit
      const res = await fetch(`${API_URL}/chat/history?limit=${limit}&offset=${offset}`)
      const data = await res.json()
      setLogs(data.logs)
      setTotal(data.total)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">
          <h1>Riwayat Percakapan</h1>
          <p>Monitoring interaksi user dengan chatbot</p>
        </div>
        <div className="badge" style={{ fontSize: '14px' }}>
          Total: {total} Logs
        </div>
      </div>

      <div className="card">
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #e2e8f0', textAlign: 'left', background: '#f8fafc' }}>
              <th style={{ padding: '12px 16px', width: '150px' }}>Waktu</th>
              <th style={{ padding: '12px 16px' }}>User Message</th>
              <th style={{ padding: '12px 16px' }}>Bot Response</th>
              <th style={{ padding: '12px 16px', width: '120px' }}>Intent</th>
              <th style={{ padding: '12px 16px', width: '80px' }}>Conf.</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                <td style={{ padding: '12px 16px', color: '#64748b' }}>
                  {format(new Date(log.created_at), 'dd/MM HH:mm')}
                </td>
                <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                  {log.user_message}
                </td>
                <td style={{ padding: '12px 16px', color: '#475569' }}>
                  {log.bot_response}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {log.intent_tag ? (
                    <span className="badge">{log.intent_tag}</span>
                  ) : (
                    <span style={{ color: '#94a3b8' }}>-</span>
                  )}
                </td>
                <td style={{ padding: '12px 16px' }}>
                  {log.confidence ? `${Math.round(log.confidence * 100)}%` : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Simple Pagination */}
        <div style={{ padding: '16px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button 
            className="btn btn-secondary" 
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
          >
            Previous
          </button>
          <button 
            className="btn btn-secondary" 
            disabled={(page + 1) * limit >= total}
            onClick={() => setPage(p => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}

export default HistoryPage
