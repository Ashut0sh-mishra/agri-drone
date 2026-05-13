import React, { useState, useEffect, useRef } from 'react'
import { getTrainingLogs, getMatrixProgress } from '../services/api'

export default function TrainingLogs() {
  const [logs, setLogs] = useState([])
  const [logFile, setLogFile] = useState('none')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(true)
  const [matrix, setMatrix] = useState(null)
  const scrollRef = useRef(null)
  const pollRef = useRef(null)

  const fetchLogs = async () => {
    try {
      const data = await getTrainingLogs()
      setLogs(data.logs || [])
      setLogFile(data.file || 'none')
      setLoading(false)
    } catch {
      setLogs(['Failed to fetch logs. Is the backend running?'])
      setLoading(false)
    }
    try {
      const m = await getMatrixProgress()
      setMatrix(m)
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [])

  useEffect(() => {
    if (autoRefresh) {
      pollRef.current = setInterval(fetchLogs, 2000)
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [autoRefresh])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [logs])

  const colorizeLine = (line) => {
    if (/error|fail|exception/i.test(line)) return '#ef4444'
    if (/warn/i.test(line)) return '#eab308'
    if (/success|complete|loaded/i.test(line)) return '#22c55e'
    if (/info|epoch/i.test(line)) return '#3b82f6'
    return 'var(--text-muted)'
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Admin Only</p>
          <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>Training Logs</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
            Source: <code style={{ color: 'var(--accent)' }}>{logFile}</code>
          </span>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
            style={{
              background: autoRefresh ? 'rgba(34,197,94,0.1)' : 'transparent',
              color: autoRefresh ? '#22c55e' : 'var(--text-muted)',
              border: `1px solid ${autoRefresh ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
            }}
          >
            {autoRefresh ? '● Auto-refresh ON' : '○ Auto-refresh OFF'}
          </button>
          <button
            onClick={fetchLogs}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
            style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Colab Matrix Progress */}
      <div
        className="rounded-xl p-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
              Colab Matrix Run (live)
            </p>
            <h3 className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
              {matrix?.run_id || 'waiting for per_run.jsonl…'}
            </h3>
          </div>
          {matrix?.found ? (
            <div className="flex items-center gap-4 text-xs font-mono">
              <span style={{ color: '#22c55e' }}>ok {matrix.ok}</span>
              <span style={{ color: '#ef4444' }}>fail {matrix.failed}</span>
              <span style={{ color: '#eab308' }}>skip {matrix.skipped}</span>
              <span style={{ color: 'var(--text-muted)' }}>total {matrix.total}</span>
            </div>
          ) : (
            <span className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
              not found locally
            </span>
          )}
        </div>

        {matrix?.found ? (
          <>
            <div className="h-2 rounded-full overflow-hidden mb-3" style={{ background: 'rgba(255,255,255,0.05)' }}>
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(100, (matrix.total / 54) * 100)}%`,
                  background: 'linear-gradient(90deg, #22c55e, #3b82f6)',
                }}
              />
            </div>
            <div className="text-[11px] font-mono mb-2" style={{ color: 'var(--text-faint)' }}>
              updated {matrix.updated_at} · {matrix.file}
            </div>
            <div className="overflow-auto max-h-48 rounded-lg" style={{ background: '#0d1117', border: '1px solid #30363d' }}>
              <table className="w-full text-[11px] font-mono">
                <thead>
                  <tr style={{ color: '#8b949e' }}>
                    <th className="text-left px-2 py-1">status</th>
                    <th className="text-left px-2 py-1">backbone</th>
                    <th className="text-left px-2 py-1">dataset</th>
                    <th className="text-left px-2 py-1">frac</th>
                    <th className="text-left px-2 py-1">seed/fold</th>
                    <th className="text-left px-2 py-1">top1</th>
                  </tr>
                </thead>
                <tbody>
                  {matrix.cells.slice().reverse().map((c, i) => (
                    <tr key={i} style={{ color: '#c9d1d9' }}>
                      <td className="px-2 py-0.5" style={{
                        color: c.status === 'ok' ? '#22c55e'
                             : c.status === 'failed' ? '#ef4444'
                             : '#eab308'
                      }}>{c.status}</td>
                      <td className="px-2 py-0.5">{c.backbone}</td>
                      <td className="px-2 py-0.5">{c.dataset}</td>
                      <td className="px-2 py-0.5">{c.train_fraction}</td>
                      <td className="px-2 py-0.5">{c.seed}/{c.fold}</td>
                      <td className="px-2 py-0.5">
                        {c.metrics?.top1 != null ? c.metrics.top1.toFixed(3) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
            {matrix?.message || 'Colab writes per_run.jsonl to Drive. Mount Drive via "Google Drive for desktop" or sync evaluate/results/v2/matrix/ locally to see live progress here.'}
          </p>
        )}
      </div>

      {/* Terminal */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          background: '#0d1117',
          border: '1px solid #30363d',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
        }}
      >
        {/* Terminal header */}
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: '#161b22', borderBottom: '1px solid #30363d' }}>
          <span className="w-3 h-3 rounded-full" style={{ background: '#ff5f56' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#ffbd2e' }} />
          <span className="w-3 h-3 rounded-full" style={{ background: '#27c93f' }} />
          <span className="ml-3 text-xs font-mono" style={{ color: '#8b949e' }}>training.log — AgriAnalyze AI</span>
          {autoRefresh && (
            <span className="ml-auto flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
              <span className="text-[10px] font-mono" style={{ color: '#22c55e' }}>live</span>
            </span>
          )}
        </div>

        {/* Log content */}
        <div
          ref={scrollRef}
          className="p-4 overflow-y-auto font-mono text-xs leading-relaxed"
          style={{ height: '500px', color: '#c9d1d9' }}
        >
          {loading ? (
            <div className="flex items-center gap-2" style={{ color: '#8b949e' }}>
              <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#22c55e', borderTopColor: 'transparent' }} />
              Loading logs...
            </div>
          ) : (
            logs.map((line, i) => (
              <div key={i} className="flex gap-3 hover:bg-white/[0.02] px-1 rounded">
                <span className="select-none shrink-0 w-8 text-right" style={{ color: '#484f58' }}>{i + 1}</span>
                <span style={{ color: colorizeLine(line) }}>{line}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
