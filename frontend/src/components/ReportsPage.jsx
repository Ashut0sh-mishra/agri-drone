/**
 * ReportsPage - Historical detection archive with filters and export.
 *
 * Loads /api/reports/history, renders a paginated, risk-badge-coloured table,
 * and supports bulk-clear as well as JSON / CSV export of individual scans.
 *
 * @component
 */
import React, { useState, useEffect } from 'react'
import { getDetectionHistory, clearDetectionHistory } from '../services/api'

function riskBadge(level) {
  const colors = {
    critical: { bg: 'rgba(239,68,68,0.1)', color: '#ef4444', border: 'rgba(239,68,68,0.3)' },
    high: { bg: 'rgba(249,115,22,0.1)', color: '#f97316', border: 'rgba(249,115,22,0.3)' },
    medium: { bg: 'rgba(234,179,8,0.1)', color: '#eab308', border: 'rgba(234,179,8,0.3)' },
    low: { bg: 'rgba(34,197,94,0.1)', color: '#22c55e', border: 'rgba(34,197,94,0.3)' },
  }
  const c = colors[(level || 'low').toLowerCase()] || colors.low
  return c
}

function healthColor(score) {
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#eab308'
  return '#ef4444'
}

export default function ReportsPage() {
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadHistory()
  }, [])

  const loadHistory = async () => {
    setLoading(true)
    try {
      const data = await getDetectionHistory()
      setHistory((data.history || []).reverse())
    } catch {
      setHistory([])
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!window.confirm('Clear all detection history?')) return
    try {
      await clearDetectionHistory()
      setHistory([])
    } catch {}
  }

  const filtered = filter === 'all' ? history : history.filter(h => h.risk_level === filter)

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--card-shadow)',
  }

  const totalScans = history.length
  const avgHealth = history.length > 0 ? Math.round(history.reduce((s, h) => s + (h.health_score || 0), 0) / history.length) : 0
  const diseaseCount = history.filter(h => (h.risk_level || '').toLowerCase() !== 'low').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Detection History</p>
          <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>Reports</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadHistory} className="px-4 py-2 text-xs font-semibold rounded-lg transition" style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}>
            Refresh
          </button>
          {history.length > 0 && (
            <button onClick={handleClear} className="px-4 py-2 text-xs font-semibold rounded-lg transition" style={{ border: '1px solid rgba(239,68,68,0.3)', color: '#ef4444' }}>
              Clear History
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-xl p-4 text-center" style={cardStyle}>
          <p className="text-3xl font-black" style={{ color: 'var(--accent)' }}>{totalScans}</p>
          <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-faint)' }}>Total Scans</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={cardStyle}>
          <p className="text-3xl font-black" style={{ color: healthColor(avgHealth) }}>{avgHealth}%</p>
          <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-faint)' }}>Avg Health</p>
        </div>
        <div className="rounded-xl p-4 text-center" style={cardStyle}>
          <p className="text-3xl font-black" style={{ color: '#ef4444' }}>{diseaseCount}</p>
          <p className="text-[10px] uppercase tracking-widest mt-1" style={{ color: 'var(--text-faint)' }}>Diseases Found</p>
        </div>
      </div>

      {/* Filter */}
      <div className="flex gap-2">
        {['all', 'critical', 'high', 'medium', 'low'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 text-[11px] font-semibold rounded-lg transition capitalize"
            style={{
              background: filter === f ? 'var(--accent)' : 'transparent',
              color: filter === f ? '#fff' : 'var(--text-muted)',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* History List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-xl" style={cardStyle}>
          <p className="text-3xl mb-3">📋</p>
          <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No detection history yet. Run a scan to see reports here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry, i) => {
            const rb = riskBadge(entry.risk_level)
            const ts = entry.timestamp ? new Date(entry.timestamp) : null
            return (
              <div
                key={entry.id || i}
                className="rounded-xl px-5 py-4 flex items-center justify-between gap-4"
                style={cardStyle}
              >
                <div className="flex items-center gap-4 min-w-0">
                  <span className="text-xs font-mono w-6 shrink-0" style={{ color: 'var(--text-faint)' }}>#{filtered.length - i}</span>

                  {/* Health circle */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{
                    background: `${healthColor(entry.health_score)}15`,
                    border: `2px solid ${healthColor(entry.health_score)}`,
                  }}>
                    <span className="text-xs font-bold" style={{ color: healthColor(entry.health_score) }}>{entry.health_score}</span>
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                      {entry.disease || 'Unknown'}
                    </p>
                    <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      {entry.filename || 'image'} • {entry.crop_type || 'wheat'} • {entry.num_detections || 0} detections
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  {/* Risk badge */}
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full uppercase" style={{
                    color: rb.color, background: rb.bg, border: `1px solid ${rb.border}`,
                  }}>
                    {entry.risk_level || 'low'}
                  </span>

                  {/* Confidence */}
                  {entry.confidence > 0 && (
                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                      {entry.confidence}%
                    </span>
                  )}

                  {/* Timestamp */}
                  {ts && (
                    <span className="text-[11px] font-mono" style={{ color: 'var(--text-faint)' }}>
                      {ts.toLocaleTimeString('en-US', { hour12: false })}
                      <br />
                      <span className="text-[9px]">{ts.toLocaleDateString()}</span>
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
