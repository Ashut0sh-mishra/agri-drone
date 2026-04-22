/**
 * MLDashboard - Operator console for the active classifier model.
 *
 * Shows current model metrics (accuracy, F1 per class, confusion matrix
 * samples), model-info metadata, training-image previews, and a "Reload
 * Model" action. Data sourced from /api/ml/* endpoints.
 *
 * @component
 */
import React, { useState, useEffect, useRef } from 'react'
import { getMLMetrics, getModelInfo, getTrainingImageUrl, reloadModel } from '../services/api'

function MetricCard({ label, value, color, suffix = '' }) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden" style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)',
    }}>
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
      <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-faint)' }}>{label}</p>
      <p className="text-3xl font-black mt-2 tabular-nums" style={{ color }}>
        {typeof value === 'number' ? value.toFixed(3) : value}{suffix}
      </p>
    </div>
  )
}

function MetricChart({ history, metricKey, label, color }) {
  if (!history || history.length < 2) return null
  const values = history.map(h => h[metricKey] || 0)
  const max = Math.max(...values, 0.01)
  const w = 300, h = 80, padX = 30, padY = 10
  const chartW = w - padX * 2, chartH = h - padY * 2

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * chartW
    const y = padY + chartH - (v / max) * chartH
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="rounded-lg p-3" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <p className="text-[10px] font-semibold mb-1" style={{ color: 'var(--text-faint)' }}>{label}</p>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" style={{ height: '80px' }}>
        <polyline points={points} fill="none" stroke={color} strokeWidth="2" />
        <text x={padX - 4} y={padY + 4} textAnchor="end" fill="var(--text-faint)" fontSize="8">{max.toFixed(2)}</text>
        <text x={padX - 4} y={h - padY + 4} textAnchor="end" fill="var(--text-faint)" fontSize="8">0</text>
      </svg>
    </div>
  )
}

export default function MLDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [modelInfo, setModelInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [reloading, setReloading] = useState(false)
  const [error, setError] = useState(null)
  const [activeImage, setActiveImage] = useState('results.png')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [m, mi] = await Promise.all([getMLMetrics(), getModelInfo()])
      setMetrics(m)
      setModelInfo(mi)
    } catch (err) {
      setError(err.message || 'Failed to load ML data')
    } finally {
      setLoading(false)
    }
  }

  const handleReload = async () => {
    setReloading(true)
    try {
      await reloadModel()
      await loadData()
    } catch (err) {
      setError(err.message)
    } finally {
      setReloading(false)
    }
  }

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--card-shadow)',
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-3 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Admin Panel</p>
          <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>ML Dashboard</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadData} className="px-4 py-2 text-xs font-semibold rounded-lg transition" style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}>
            Refresh
          </button>
          <button
            onClick={handleReload}
            disabled={reloading}
            className="px-4 py-2 text-xs font-bold rounded-lg text-white transition disabled:opacity-50"
            style={{ background: 'var(--accent)' }}
          >
            {reloading ? 'Reloading...' : 'Reload Models'}
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
          {error}
        </div>
      )}

      {/* Training Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="mAP@50" value={metrics?.mAP50 || 0} color="#22c55e" />
        <MetricCard label="mAP@50-95" value={metrics?.mAP50_95 || 0} color="#3b82f6" />
        <MetricCard label="Precision" value={metrics?.precision || 0} color="#a78bfa" />
        <MetricCard label="Recall" value={metrics?.recall || 0} color="#f59e0b" />
      </div>

      {/* Metric Charts */}
      {metrics?.history && metrics.history.length > 1 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <MetricChart history={metrics.history} metricKey="mAP50" label="mAP@50 over epochs" color="#22c55e" />
          <MetricChart history={metrics.history} metricKey="precision" label="Precision over epochs" color="#a78bfa" />
          <MetricChart history={metrics.history} metricKey="recall" label="Recall over epochs" color="#f59e0b" />
          <MetricChart history={metrics.history} metricKey="train_loss" label="Training Loss over epochs" color="#ef4444" />
        </div>
      )}

      {/* Training Images */}
      <div className="rounded-xl p-5" style={cardStyle}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-faint)' }}>Training Visualizations</span>
          <div className="flex gap-2">
            {['results.png', 'confusion_matrix.png', 'confusion_matrix_normalized.png', 'F1_curve.png', 'PR_curve.png'].map(img => (
              <button
                key={img}
                onClick={() => setActiveImage(img)}
                className="px-3 py-1 text-[11px] font-semibold rounded-lg transition"
                style={{
                  background: activeImage === img ? 'var(--accent)' : 'transparent',
                  color: activeImage === img ? '#fff' : 'var(--text-muted)',
                  border: `1px solid ${activeImage === img ? 'var(--accent)' : 'var(--border)'}`,
                }}
              >
                {img.replace('.png', '').replace(/_/g, ' ')}
              </button>
            ))}
          </div>
        </div>
        <div className="rounded-lg overflow-hidden" style={{ background: 'var(--bg-primary)', minHeight: 120 }}>
          <img
            key={activeImage}
            src={getTrainingImageUrl(activeImage)}
            alt={activeImage}
            className="w-full h-auto"
            onError={(e) => { e.target.style.display = 'none' }}
          />
        </div>
      </div>

      {/* Model Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Models */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-faint)' }}>Loaded Models</span>
          <div className="mt-3 space-y-3">
            {modelInfo?.models?.map((m, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
                  <div>
                    <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                    <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                      {m.size_mb} MB • Last modified: {new Date(m.last_modified).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {modelInfo?.classifier && (
              <div className="px-3 py-2.5 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-2 h-2 rounded-full" style={{ background: '#f59e0b' }} />
                  <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{modelInfo.classifier.name}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded" style={{ color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)' }}>
                    {modelInfo.classifier.num_classes} classes
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Dataset Info */}
        <div className="rounded-xl p-5" style={cardStyle}>
          <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-faint)' }}>Dataset Information</span>
          <div className="mt-3 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="px-3 py-3 rounded-lg text-center" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-bold" style={{ color: 'var(--accent)' }}>{modelInfo?.dataset?.total_images || '—'}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>Total Images</p>
              </div>
              <div className="px-3 py-3 rounded-lg text-center" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <p className="text-2xl font-bold" style={{ color: '#3b82f6' }}>{modelInfo?.dataset?.classes || '—'}</p>
                <p className="text-[10px] mt-1" style={{ color: 'var(--text-faint)' }}>Classes</p>
              </div>
            </div>
            <div className="px-3 py-2.5 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                Dataset: <strong style={{ color: 'var(--text-primary)' }}>{modelInfo?.dataset?.dataset_name || 'N/A'}</strong>
              </p>
            </div>
            {metrics?.epochs > 0 && (
              <div className="px-3 py-2.5 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Trained: <strong style={{ color: 'var(--text-primary)' }}>{metrics.epochs} epochs</strong>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
