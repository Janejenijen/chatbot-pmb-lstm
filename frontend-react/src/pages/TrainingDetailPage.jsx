import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { format } from 'date-fns'
import { ArrowLeft, Brain, Database, Target, Layers } from 'lucide-react'

const API_URL = 'http://localhost:8000/api'

function TrainingDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDetail()
  }, [id])

  const fetchDetail = async () => {
    try {
      const res = await fetch(`${API_URL}/training/history/${id}`)
      if (!res.ok) throw new Error('Not found')
      const data = await res.json()
      setDetail(data)
    } catch (err) {
      console.error(err)
      alert('Training history tidak ditemukan')
      navigate('/admin/training')
    } finally {
      setLoading(false)
    }
  }

  const getAccuracyColor = (acc) => {
    if (acc >= 0.9) return '#22c55e'
    if (acc >= 0.7) return '#eab308'
    return '#ef4444'
  }

  const getConfusionMatrixColor = (value, maxValue) => {
    if (maxValue === 0) return 'rgba(59, 130, 246, 0.1)'
    const intensity = value / maxValue
    return `rgba(59, 130, 246, ${0.1 + intensity * 0.8})`
  }

  if (loading) return <div>Loading...</div>
  if (!detail) return null

  const confMatrix = detail.confusion_matrix || []
  const classNames = detail.class_names || []
  const classReport = detail.classification_report || {}
  const maxConfValue = Math.max(...confMatrix.flat(), 1)

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button 
            onClick={() => navigate('/admin/training')} 
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
          >
            <ArrowLeft size={24} />
          </button>
          <div className="page-title">
            <h1>📈 Training Detail</h1>
            <p>
              {detail.trained_at && format(new Date(detail.trained_at), 'dd MMMM yyyy, HH:mm')}
            </p>
          </div>
        </div>
      </div>

      {/* Info Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <Layers size={24} color="#3b82f6" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: '700' }}>{detail.split_ratio}</div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>Split Ratio</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <Brain size={24} color="#8b5cf6" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: '700' }}>{detail.epochs_run}</div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>Epochs</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <Database size={24} color="#06b6d4" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: '700' }}>{detail.total_samples}</div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>Total Samples</div>
        </div>
        <div className="card" style={{ padding: '20px', textAlign: 'center' }}>
          <Target size={24} color="#22c55e" style={{ marginBottom: '8px' }} />
          <div style={{ fontSize: '24px', fontWeight: '700' }}>{detail.num_classes}</div>
          <div style={{ color: '#64748b', fontSize: '14px' }}>Classes</div>
        </div>
      </div>

      {/* Data Split & Accuracy Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
        {/* Data Split */}
        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0 }}>📊 Pembagian Data</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Training</span>
                <span style={{ fontWeight: '600' }}>
                  {detail.train_samples} ({Math.round(detail.train_samples / detail.total_samples * 100)}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '24px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${detail.train_samples / detail.total_samples * 100}%`, 
                  height: '100%', 
                  background: '#3b82f6' 
                }}></div>
              </div>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Validation</span>
                <span style={{ fontWeight: '600' }}>
                  {detail.val_samples} ({Math.round(detail.val_samples / detail.total_samples * 100)}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '24px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${detail.val_samples / detail.total_samples * 100}%`, 
                  height: '100%', 
                  background: '#8b5cf6' 
                }}></div>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span>Testing</span>
                <span style={{ fontWeight: '600' }}>
                  {detail.test_samples} ({Math.round(detail.test_samples / detail.total_samples * 100)}%)
                </span>
              </div>
              <div style={{ width: '100%', height: '24px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                <div style={{ 
                  width: `${detail.test_samples / detail.total_samples * 100}%`, 
                  height: '100%', 
                  background: '#22c55e' 
                }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Accuracy Metrics */}
        <div className="card">
          <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
            <h3 style={{ margin: 0 }}>🎯 Akurasi Model</h3>
          </div>
          <div style={{ padding: '20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div style={{ textAlign: 'center', padding: '16px', background: '#eff6ff', borderRadius: '8px' }}>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: '700', 
                  color: getAccuracyColor(detail.train_accuracy) 
                }}>
                  {(detail.train_accuracy * 100).toFixed(2)}%
                </div>
                <div style={{ color: '#64748b', marginTop: '4px' }}>Training</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f5f3ff', borderRadius: '8px' }}>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: '700', 
                  color: getAccuracyColor(detail.val_accuracy) 
                }}>
                  {(detail.val_accuracy * 100).toFixed(2)}%
                </div>
                <div style={{ color: '#64748b', marginTop: '4px' }}>Validation</div>
              </div>
              <div style={{ textAlign: 'center', padding: '16px', background: '#f0fdf4', borderRadius: '8px' }}>
                <div style={{ 
                  fontSize: '28px', 
                  fontWeight: '700', 
                  color: getAccuracyColor(detail.test_accuracy) 
                }}>
                  {(detail.test_accuracy * 100).toFixed(2)}%
                </div>
                <div style={{ color: '#64748b', marginTop: '4px' }}>Testing</div>
              </div>
            </div>
            <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '14px', color: '#64748b' }}>
              <div style={{ textAlign: 'center' }}>
                Loss: {detail.train_loss?.toFixed(4)}
              </div>
              <div style={{ textAlign: 'center' }}>
                Loss: {detail.val_loss?.toFixed(4)}
              </div>
              <div style={{ textAlign: 'center' }}>
                Loss: {detail.test_loss?.toFixed(4)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confusion Matrix */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h3 style={{ margin: 0 }}>🔢 Confusion Matrix</h3>
        </div>
        <div style={{ padding: '20px', overflowX: 'auto' }}>
          {confMatrix.length > 0 ? (
            <table style={{ borderCollapse: 'collapse', margin: '0 auto' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px', border: '1px solid #e2e8f0', background: '#f8fafc' }}>
                    Actual \ Predicted
                  </th>
                  {classNames.map((name, i) => (
                    <th key={i} style={{ 
                      padding: '8px 12px', 
                      border: '1px solid #e2e8f0', 
                      background: '#f8fafc',
                      fontSize: '12px',
                      maxWidth: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confMatrix.map((row, i) => (
                  <tr key={i}>
                    <th style={{ 
                      padding: '8px 12px', 
                      border: '1px solid #e2e8f0', 
                      background: '#f8fafc',
                      fontSize: '12px',
                      textAlign: 'left',
                      maxWidth: '100px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}>
                      {classNames[i]}
                    </th>
                    {row.map((val, j) => (
                      <td key={j} style={{ 
                        padding: '12px 16px', 
                        border: '1px solid #e2e8f0',
                        textAlign: 'center',
                        background: getConfusionMatrixColor(val, maxConfValue),
                        fontWeight: i === j ? '700' : '400',
                        color: i === j ? '#1e40af' : '#475569'
                      }}>
                        {val}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', color: '#94a3b8' }}>Confusion matrix tidak tersedia</p>
          )}
        </div>
      </div>

      {/* Classification Report */}
      <div className="card">
        <div style={{ padding: '16px', borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
          <h3 style={{ margin: 0 }}>📋 Classification Report</h3>
        </div>
        <div style={{ padding: '0', overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', borderBottom: '1px solid #e2e8f0' }}>Class</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Precision</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Recall</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>F1-Score</th>
                <th style={{ padding: '12px 16px', textAlign: 'center', borderBottom: '1px solid #e2e8f0' }}>Support</th>
              </tr>
            </thead>
            <tbody>
              {classNames.map((name) => {
                const metrics = classReport[name] || {}
                return (
                  <tr key={name} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 16px', fontWeight: '500' }}>
                      <span className="badge">{name}</span>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {(metrics.precision * 100 || 0).toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {(metrics.recall * 100 || 0).toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {(metrics['f1-score'] * 100 || 0).toFixed(1)}%
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {metrics.support || 0}
                    </td>
                  </tr>
                )
              })}
              {/* Summary rows */}
              {['accuracy', 'macro avg', 'weighted avg'].map((key) => {
                const metrics = classReport[key]
                if (!metrics) return null
                return (
                  <tr key={key} style={{ borderBottom: '1px solid #e2e8f0', background: '#fafafa', fontWeight: '600' }}>
                    <td style={{ padding: '12px 16px' }}>{key}</td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {typeof metrics === 'number' ? '' : (metrics.precision * 100 || 0).toFixed(1) + '%'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {typeof metrics === 'number' ? '' : (metrics.recall * 100 || 0).toFixed(1) + '%'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {typeof metrics === 'number' 
                        ? (metrics * 100).toFixed(1) + '%' 
                        : (metrics['f1-score'] * 100 || 0).toFixed(1) + '%'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                      {typeof metrics === 'number' ? detail.test_samples : metrics.support || ''}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TrainingDetailPage
