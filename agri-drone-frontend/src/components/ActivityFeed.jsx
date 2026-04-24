import React, { useState, useEffect, useRef } from 'react'
import { getActivityFeed } from '../services/api'

const PHONE_SERVER = import.meta.env.VITE_PHONE_SERVER || 'http://localhost:8765'

const TYPE_ICONS = {
  connect: '🟢',
  upload: '📷',
  analysis: '🔬',
  disconnect: '🔴',
  treatment: '💊',
  detection: '🔍',
  scan_complete: '✅',
  model_reload: '🔄',
}

export default function ActivityFeed() {
  const [feed, setFeed] = useState([])
  const [serverOnline, setServerOnline] = useState(false)
  const pollRef = useRef(null)
  const scrollRef = useRef(null)

  const refresh = async () => {
    // Try backend activity feed first
    try {
      const data = await getActivityFeed()
      if (data.feed && data.feed.length > 0) {
        setFeed(data.feed.reverse())
        setServerOnline(true)
        return
      }
    } catch {}

    // Fallback to phone server
    try {
      const resp = await fetch(`${PHONE_SERVER}/api/sessions/feed`)
      if (!resp.ok) throw new Error()
      const data = await resp.json()
      setFeed((data.feed || []).reverse())
      setServerOnline(true)
    } catch {
      setServerOnline(false)
    }
  }

  useEffect(() => {
    refresh()
    pollRef.current = setInterval(refresh, 3000)
    return () => clearInterval(pollRef.current)
  }, [])

  const timeAgo = (iso) => {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
  }

  const typeBg = (type) => {
    switch (type) {
      case 'connect': return 'rgba(34,197,94,0.08)'
      case 'disconnect': return 'rgba(239,68,68,0.08)'
      case 'analysis': return 'rgba(59,130,246,0.08)'
      case 'treatment': return 'rgba(168,85,247,0.08)'
      default: return 'transparent'
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            Real-Time
          </p>
          <h2 className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            Activity Feed
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: serverOnline ? '#22c55e' : '#ef4444' }} />
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>
            Auto-refresh 3s
          </span>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="rounded-xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
      >
        {!serverOnline ? (
          <div className="px-4 py-12 text-center">
            <p className="text-3xl mb-3">📡</p>
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
              No activity data available. Run a detection to start logging.
            </p>
          </div>
        ) : feed.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-3xl mb-3">📋</p>
            <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
              No activity yet. Upload an image to start scanning.
            </p>
          </div>
        ) : (
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {feed.map((item, i) => {
              const itemType = item.type || item.action || 'info'
              const itemMsg = item.message || item.detail || itemType
              const itemTime = item.timestamp || item.time
              return (
                <div
                  key={item.id || i}
                  className="px-4 py-3 flex items-start gap-3 transition"
                  style={{ background: typeBg(itemType) }}
                >
                  <span className="text-lg mt-0.5 shrink-0">{TYPE_ICONS[itemType] || '📋'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--text-primary)' }}>
                      {itemMsg}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                      {item.time || (itemTime ? new Date(itemTime).toLocaleTimeString('en-US', { hour12: false }) : '')} · {timeAgo(itemTime)}
                    </p>
                  </div>
                  <span
                    className="text-[9px] font-bold uppercase px-2 py-0.5 rounded shrink-0 mt-1"
                    style={{ background: 'var(--bg-primary)', color: 'var(--text-faint)' }}
                  >
                    {itemType}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
