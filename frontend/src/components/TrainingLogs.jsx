/**
 * TrainingLogs - Live tail of training / inference log files.
 *
 * Auto-refreshes from /api/ml/logs and renders colour-coded log lines.
 * Useful for monitoring long-running training jobs from the dashboard.
 *
 * @component
 */
import React, { useState, useEffect, useRef } from 'react'
import { getTrainingLogs } from '../services/api'

export default function TrainingLogs() {
  const [logs, setLogs] = useState([])
  const [logFile, setLogFile] = useState('none')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [loading, setLoading] = useState(true)
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
          <span className="ml-3 text-xs font-mono" style={{ color: '#8b949e' }}>training.log — AgriDrone AI</span>
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
