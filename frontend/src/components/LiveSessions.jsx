/**
 * LiveSessions - Real-time map / list of active scanning sessions.
 *
 * Shows healthy / medium / disease zone counts per connected device,
 * refreshing every few seconds from the phone-server.
 *
 * @component
 */
import React, { useState, useEffect, useRef } from 'react'

const PHONE_SERVER = import.meta.env.VITE_PHONE_SERVER || 'http://localhost:8765'

const ZONE_COLORS = {
  healthy: '#22c55e',
  medium: '#eab308',
  disease: '#ef4444',
  empty: 'var(--border)',
}

function riskColor(level) {
  if (!level) return 'var(--text-faint)'
  const l = level.toLowerCase()
  if (l.includes('low') || l.includes('healthy')) return '#22c55e'
  if (l.includes('medium') || l.includes('moderate')) return '#eab308'
  return '#ef4444'
}

function scoreColor(score) {
  if (score == null) return 'var(--text-faint)'
  if (score >= 70) return '#22c55e'
  if (score >= 40) return '#eab308'
  return '#ef4444'
}

export default function LiveSessions() {
  const [stats, setStats] = useState({ active_devices: 0, photos_today: 0, diseases_found: 0, fields_scanned: 0 })
  const [sessions, setSessions] = useState([])
  const [feed, setFeed] = useState([])
  const [expandedSession, setExpandedSession] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [serverOnline, setServerOnline] = useState(false)
  const pollRef = useRef(null)

  const fetchJSON = async (path) => {
    const resp = await fetch(`${PHONE_SERVER}${path}`)
    if (!resp.ok) throw new Error(resp.statusText)
    return resp.json()
  }

  const refreshAll = async () => {
    try {
      const [statsData, sessData, feedData] = await Promise.all([
        fetchJSON('/api/sessions/stats'),
        fetchJSON('/api/sessions/active'),
        fetchJSON('/api/sessions/feed'),
      ])
      setStats(statsData)
      setSessions(sessData.sessions || [])
      setFeed(feedData.feed || [])
      setServerOnline(true)
    } catch {
      setServerOnline(false)
    }
  }

  useEffect(() => {
    refreshAll()
    pollRef.current = setInterval(refreshAll, 4000)
    return () => clearInterval(pollRef.current)
  }, [])

  const openDetail = async (sid) => {
    if (expandedSession === sid) {
      setExpandedSession(null)
      setDetailData(null)
      return
    }
    setExpandedSession(sid)
    try {
      const data = await fetchJSON(`/api/sessions/${sid}`)
      setDetailData(data)
    } catch {
      setDetailData(null)
    }
  }

  const disconnectSession = async (sid) => {
    try {
      await fetch(`${PHONE_SERVER}/api/sessions/${sid}`, { method: 'DELETE' })
      setExpandedSession(null)
      setDetailData(null)
      refreshAll()
    } catch { /* ignore */ }
  }

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

  /* ── Compute field zone summary ── */
  const zoneMap = () => {
    const zones = { North: [], South: [], East: [], West: [], Center: [] }
    sessions.forEach((s) => {
      const photos = s.photos || detailData?.photos || []
      photos.forEach((p) => {
        const z = (p.zone || 'Center').replace(/[\s_-]/g, '')
        const key = Object.keys(zones).find((k) => z.toLowerCase().includes(k.toLowerCase())) || 'Center'
        zones[key].push(p.health_score)
      })
    })
    return Object.entries(zones).map(([name, scores]) => ({
      name,
      avg: scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      count: scores.length,
    }))
  }

  const statCards = [
    { label: 'Active Devices', value: stats.active_devices, icon: '📱', color: 'var(--accent)' },
    { label: 'Photos Today', value: stats.photos_today, icon: '📷', color: '#22c55e' },
    { label: 'Diseases Found', value: stats.diseases_found, icon: '🦠', color: '#ef4444' },
    { label: 'Fields Scanned', value: stats.fields_scanned, icon: '🗺️', color: '#eab308' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
            Live Sessions
          </p>
          <h2 className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            Multi-Device Field Scanner
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: serverOnline ? '#22c55e' : '#ef4444' }} />
          <span className="text-xs font-medium" style={{ color: serverOnline ? '#22c55e' : '#ef4444' }}>
            {serverOnline ? 'Server online' : 'Server offline'}
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statCards.map((s) => (
          <div
            key={s.label}
            className="rounded-xl px-4 py-4"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <span className="text-2xl font-black" style={{ color: s.color }}>{s.value}</span>
            </div>
            <p className="text-[10px] mt-2 uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* Server offline hint */}
      {!serverOnline && (
        <div
          className="rounded-xl px-5 py-4 text-center"
          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Start the phone server to see live sessions:
          </p>
          <code
            className="block mt-2 text-xs px-4 py-2 rounded-lg font-mono"
            style={{ background: 'var(--bg-primary)', color: 'var(--accent)' }}
          >
            python scripts/phone_connect.py --crop wheat
          </code>
        </div>
      )}

      {/* Device grid + detail panel */}
      <div className="flex gap-4" style={{ minHeight: 400 }}>
        {/* Device grid cards */}
        <div className="flex-1 min-w-0 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
              Connected Devices ({sessions.length})
            </span>
            <button
              onClick={refreshAll}
              className="text-xs px-3 py-1 rounded-md transition"
              style={{ background: 'var(--bg-primary)', color: 'var(--accent)', border: '1px solid var(--border)' }}
            >
              Refresh
            </button>
          </div>

          {sessions.length === 0 ? (
            <div
              className="rounded-xl px-4 py-12 text-center"
              style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
            >
              <p className="text-3xl mb-3">📱</p>
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                {serverOnline ? 'No devices connected. Scan QR code to begin.' : 'Server offline'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sessions.map((s) => {
                const avgHealth = s.health_scores?.length > 0
                  ? Math.round(s.health_scores.reduce((a, b) => a + b, 0) / s.health_scores.length)
                  : null
                const worstRisk = s.diseases_found?.length > 0 ? 'disease' : avgHealth != null && avgHealth < 60 ? 'medium' : 'healthy'
                const isExpanded = expandedSession === s.session_id

                return (
                  <div
                    key={s.session_id}
                    className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200"
                    style={{
                      background: 'var(--bg-card)',
                      border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border)'}`,
                      boxShadow: isExpanded ? '0 0 0 1px var(--accent)' : 'var(--card-shadow)',
                    }}
                    onClick={() => openDetail(s.session_id)}
                  >
                    <div className="px-4 py-3 flex items-center gap-3">
                      {/* Status indicator */}
                      <div className="relative shrink-0">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
                          style={{
                            background: `color-mix(in srgb, ${riskColor(worstRisk)} 12%, transparent)`,
                            border: `2px solid ${riskColor(worstRisk)}`,
                          }}
                        >
                          📱
                        </div>
                        <span
                          className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                          style={{ background: '#22c55e', borderColor: 'var(--bg-card)' }}
                        />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                          {s.device_name}
                        </p>
                        <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                          {s.location || '—'} · {s.crop_type?.toUpperCase()} · {timeAgo(s.last_activity)}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold" style={{ color: 'var(--accent)' }}>
                          {s.photos_uploaded} photo{s.photos_uploaded !== 1 ? 's' : ''}
                        </p>
                        {avgHealth != null && (
                          <p className="text-[10px] font-semibold" style={{ color: scoreColor(avgHealth) }}>
                            Avg: {avgHealth}/100
                          </p>
                        )}
                      </div>

                      {/* Risk badge */}
                      <span
                        className="text-[10px] font-bold uppercase px-2 py-0.5 rounded shrink-0"
                        style={{
                          background: `color-mix(in srgb, ${riskColor(worstRisk)} 15%, transparent)`,
                          color: riskColor(worstRisk),
                        }}
                      >
                        {worstRisk === 'disease' ? '🔴 DISEASE' : worstRisk === 'medium' ? '🟡 MEDIUM' : '🟢 HEALTHY'}
                      </span>
                    </div>

                    {/* Diseases row */}
                    {s.diseases_found?.length > 0 && (
                      <div className="px-4 pb-2 flex flex-wrap gap-1">
                        {[...new Set(s.diseases_found)].slice(0, 4).map((d, i) => (
                          <span
                            key={i}
                            className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}
                          >
                            {d}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Detail / Photo gallery panel ── */}
        {expandedSession && detailData && (
          <div
            className="w-96 shrink-0 rounded-xl overflow-hidden flex flex-col"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', maxHeight: 600 }}
          >
            {/* Header */}
            <div className="px-4 py-3 flex items-center justify-between shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <div>
                <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                  {detailData.device_name}
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                  {detailData.location} · {detailData.crop_type?.toUpperCase()}
                </p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setExpandedSession(null); setDetailData(null) }}
                className="text-sm px-2 py-1 rounded"
                style={{ color: 'var(--text-faint)' }}
              >
                ✕
              </button>
            </div>

            {/* Summary row */}
            <div className="px-4 py-2 flex items-center gap-4 shrink-0" style={{ borderBottom: '1px solid var(--border)' }}>
              <div className="text-center">
                <p className="text-lg font-black" style={{ color: 'var(--accent)' }}>{detailData.photos_uploaded}</p>
                <p className="text-[9px] uppercase" style={{ color: 'var(--text-faint)' }}>Photos</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black" style={{ color: scoreColor(
                  detailData.health_scores?.length
                    ? Math.round(detailData.health_scores.reduce((a, b) => a + b, 0) / detailData.health_scores.length)
                    : null
                ) }}>
                  {detailData.health_scores?.length
                    ? Math.round(detailData.health_scores.reduce((a, b) => a + b, 0) / detailData.health_scores.length)
                    : '—'}
                </p>
                <p className="text-[9px] uppercase" style={{ color: 'var(--text-faint)' }}>Avg Health</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-black" style={{ color: '#ef4444' }}>
                  {detailData.diseases_found?.length || 0}
                </p>
                <p className="text-[9px] uppercase" style={{ color: 'var(--text-faint)' }}>Diseases</p>
              </div>
            </div>

            {/* Photo gallery */}
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                Photo Gallery
              </p>

              {(!detailData.photos || detailData.photos.length === 0) ? (
                <p className="text-xs text-center py-6" style={{ color: 'var(--text-faint)' }}>
                  No photos yet
                </p>
              ) : (
                detailData.photos.map((photo, i) => (
                  <div
                    key={photo.photo_id || i}
                    className="rounded-lg p-3"
                    style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-3">
                      {/* Score circle */}
                      <div className="relative w-11 h-11 shrink-0">
                        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                          <circle cx="18" cy="18" r="15.91" fill="none" stroke="var(--border)" strokeWidth="3" />
                          <circle
                            cx="18" cy="18" r="15.91" fill="none"
                            stroke={scoreColor(photo.health_score)}
                            strokeWidth="3"
                            strokeDasharray={`${(photo.health_score || 0)} 100`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <span
                          className="absolute inset-0 flex items-center justify-center text-[10px] font-black"
                          style={{ color: scoreColor(photo.health_score) }}
                        >
                          {photo.health_score ?? '?'}
                        </span>
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                          {photo.filename || `Photo #${i + 1}`}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(photo.diseases || []).map((d, j) => (
                            <span
                              key={j}
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#fca5a5' }}
                            >
                              {d}
                            </span>
                          ))}
                          {(!photo.diseases || photo.diseases.length === 0) && (
                            <span
                              className="text-[9px] font-semibold px-1.5 py-0.5 rounded"
                              style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e' }}
                            >
                              Healthy
                            </span>
                          )}
                        </div>
                        <p className="text-[9px] mt-1" style={{ color: 'var(--text-faint)' }}>
                          {photo.zone || 'Center'} · {photo.risk_level || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Treatment */}
                    {photo.treatment && (
                      <p className="text-[10px] mt-2 px-2 py-1 rounded" style={{ background: 'color-mix(in srgb, var(--accent) 8%, transparent)', color: 'var(--accent)' }}>
                        💊 {photo.treatment}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="px-4 py-3 shrink-0 flex gap-2" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={(e) => { e.stopPropagation(); disconnectSession(expandedSession) }}
                className="flex-1 text-xs py-2 rounded-lg font-semibold transition"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                End Session
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Activity feed */}
      <ActivityFeedSection feed={feed} timeAgo={timeAgo} />

      {/* Field zone map */}
      <FieldZoneMap zones={zoneMap()} />
    </div>
  )
}

/* ── Inline Activity Feed ── */
function ActivityFeedSection({ feed, timeAgo }) {
  const typeIcons = {
    connect: '🟢',
    upload: '📷',
    analysis: '🔬',
    disconnect: '🔴',
    treatment: '💊',
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
          Live Activity Feed
        </span>
      </div>
      <div className="max-h-52 overflow-y-auto">
        {feed.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs" style={{ color: 'var(--text-faint)' }}>No activity yet</p>
          </div>
        ) : (
          feed.map((item) => (
            <div
              key={item.id}
              className="px-4 py-2 flex items-start gap-3"
              style={{ borderBottom: '1px solid var(--border)' }}
            >
              <span className="text-sm mt-0.5">{typeIcons[item.type] || '📋'}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{item.message}</p>
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{timeAgo(item.timestamp)}</p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

/* ── Field Zone Map ── */
function FieldZoneMap({ zones }) {
  const gridPos = { North: [0, 1], South: [2, 1], East: [1, 2], West: [1, 0], Center: [1, 1] }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
    >
      <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
          Field Zone Overview
        </span>
      </div>
      <div className="p-6 flex justify-center">
        <div className="grid grid-cols-3 grid-rows-3 gap-2" style={{ width: 240, height: 240 }}>
          {Array.from({ length: 9 }).map((_, idx) => {
            const row = Math.floor(idx / 3)
            const col = idx % 3
            const zone = zones.find((z) => {
              const [r, c] = gridPos[z.name] || [-1, -1]
              return r === row && c === col
            })

            if (!zone) {
              return <div key={idx} className="rounded-lg" style={{ background: 'transparent' }} />
            }

            const bg = zone.count === 0 ? ZONE_COLORS.empty
              : zone.avg >= 70 ? ZONE_COLORS.healthy
              : zone.avg >= 40 ? ZONE_COLORS.medium
              : ZONE_COLORS.disease

            return (
              <div
                key={idx}
                className="rounded-lg flex flex-col items-center justify-center"
                style={{
                  background: `color-mix(in srgb, ${bg} 15%, transparent)`,
                  border: `2px solid ${bg}`,
                }}
              >
                <span className="text-[10px] font-bold uppercase" style={{ color: bg }}>
                  {zone.name}
                </span>
                {zone.count > 0 ? (
                  <>
                    <span className="text-lg font-black" style={{ color: bg }}>{zone.avg}</span>
                    <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>
                      {zone.count} photo{zone.count !== 1 ? 's' : ''}
                    </span>
                  </>
                ) : (
                  <span className="text-[9px]" style={{ color: 'var(--text-faint)' }}>No data</span>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
