/**
 * FieldSessions - Field-worker dashboard showing active phone sessions.
 *
 * Polls the phone-server for currently-connected devices, daily photo counts,
 * and the most-recent detections. Used by farm supervisors to monitor
 * on-the-ground scanning activity.
 *
 * @component
 */
import React, { useState, useEffect, useRef } from 'react'

const PHONE_SERVER = import.meta.env.VITE_PHONE_SERVER || 'http://localhost:8765'

export default function FieldSessions() {
  const [stats, setStats] = useState({ active_devices: 0, photos_today: 0, diseases_found: 0, fields_scanned: 0 })
  const [sessions, setSessions] = useState([])
  const [feed, setFeed] = useState([])
  const [selectedSession, setSelectedSession] = useState(null)
  const [detailData, setDetailData] = useState(null)
  const [serverOnline, setServerOnline] = useState(false)
  const pollRef = useRef(null)

  /* ── Fetch helpers ── */
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
    pollRef.current = setInterval(refreshAll, 5000)
    return () => clearInterval(pollRef.current)
  }, [])

  /* ── Session detail ── */
  const openDetail = async (sid) => {
    setSelectedSession(sid)
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
      setSelectedSession(null)
      setDetailData(null)
      refreshAll()
    } catch { /* ignore */ }
  }

  /* ── Time helpers ── */
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

  /* ── Stat cards ── */
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
            Field Sessions
          </p>
          <h2 className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
            Phone Connect Admin
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: serverOnline ? '#22c55e' : '#ef4444' }}
          />
          <span className="text-xs font-medium" style={{ color: serverOnline ? '#22c55e' : '#ef4444' }}>
            {serverOnline ? 'Phone server online' : 'Phone server offline'}
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

      {/* QR code hint */}
      {!serverOnline && (
        <div
          className="rounded-xl px-5 py-4 text-center"
          style={{ background: 'var(--bg-card)', border: '1px dashed var(--border)' }}
        >
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Start the phone server to see active sessions:
          </p>
          <code
            className="block mt-2 text-xs px-4 py-2 rounded-lg font-mono"
            style={{ background: 'var(--bg-primary)', color: 'var(--accent)' }}
          >
            python scripts/phone_connect.py --crop wheat
          </code>
        </div>
      )}

      <div className="flex gap-4" style={{ minHeight: 400 }}>
        {/* ── Active sessions table ── */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                Active Sessions ({sessions.length})
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
              <div className="px-4 py-10 text-center">
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                  {serverOnline ? 'No active sessions. Waiting for phone connections…' : 'Server offline'}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Device', 'Location', 'Crop', 'Photos', 'Last Active', ''].map((h) => (
                        <th key={h} className="px-4 py-2 text-[10px] uppercase tracking-wider font-semibold" style={{ color: 'var(--text-faint)' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sessions.map((s) => (
                      <tr
                        key={s.session_id}
                        className="cursor-pointer transition"
                        style={{
                          borderBottom: '1px solid var(--border)',
                          background: selectedSession === s.session_id ? 'color-mix(in srgb, var(--accent) 8%, transparent)' : 'transparent',
                        }}
                        onClick={() => openDetail(s.session_id)}
                        onMouseEnter={(e) => { if (selectedSession !== s.session_id) e.currentTarget.style.background = 'color-mix(in srgb, var(--accent) 5%, transparent)' }}
                        onMouseLeave={(e) => { if (selectedSession !== s.session_id) e.currentTarget.style.background = 'transparent' }}
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full" style={{ background: '#22c55e' }} />
                            <div>
                              <p className="font-semibold text-xs" style={{ color: 'var(--text-primary)' }}>{s.device_name}</p>
                              <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{s.browser} · {s.ip}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>{s.location || '—'}</td>
                        <td className="px-4 py-3">
                          <span
                            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
                            style={{
                              background: s.crop_type === 'rice' ? 'rgba(234,179,8,0.15)' : 'rgba(34,197,94,0.15)',
                              color: s.crop_type === 'rice' ? '#eab308' : '#22c55e',
                            }}
                          >
                            {s.crop_type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{s.photos_uploaded}</td>
                        <td className="px-4 py-3 text-xs" style={{ color: 'var(--text-faint)' }}>{timeAgo(s.last_activity)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); disconnectSession(s.session_id) }}
                            className="text-[10px] px-2 py-1 rounded transition"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
                          >
                            End
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ── Live activity feed ── */}
          <div
            className="rounded-xl mt-4 overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                Live Activity Feed
              </span>
            </div>
            <div className="max-h-52 overflow-y-auto">
              {feed.length === 0 ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs" style={{ color: 'var(--text-faint)' }}>No activity yet</p>
                </div>
              ) : (
                feed.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-2 flex items-start gap-3"
                    style={{ borderBottom: '1px solid var(--border)' }}
                  >
                    <span className="text-sm mt-0.5">
                      {item.type === 'connect' ? '🟢' : item.type === 'upload' ? '📷' : item.type === 'analysis' ? '🔬' : '🔴'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs truncate" style={{ color: 'var(--text-primary)' }}>{item.message}</p>
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{timeAgo(item.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Session detail panel ── */}
        {selectedSession && detailData && (
          <div
            className="w-80 shrink-0 rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                Session Detail
              </span>
              <button
                onClick={() => { setSelectedSession(null); setDetailData(null) }}
                className="text-xs"
                style={{ color: 'var(--text-faint)' }}
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Device info */}
              <div className="space-y-2">
                <DetailRow label="Device" value={detailData.device_name} />
                <DetailRow label="Browser" value={detailData.browser} />
                <DetailRow label="IP" value={detailData.ip} />
                <DetailRow label="Location" value={detailData.location} />
                <DetailRow label="Crop" value={detailData.crop_type?.toUpperCase()} />
                <DetailRow label="Connected" value={new Date(detailData.connected_at).toLocaleString()} />
                <DetailRow label="Photos" value={detailData.photos_uploaded} />
                <DetailRow label="Status" value={detailData.status?.toUpperCase()} accent={detailData.status === 'active' ? '#22c55e' : '#ef4444'} />
              </div>

              {/* Health scores */}
              {detailData.health_scores?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                    Health Scores
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {detailData.health_scores.map((score, i) => (
                      <span
                        key={i}
                        className="text-[10px] font-bold px-2 py-0.5 rounded"
                        style={{
                          background: score >= 70 ? 'rgba(34,197,94,0.15)' : score >= 40 ? 'rgba(234,179,8,0.15)' : 'rgba(239,68,68,0.15)',
                          color: score >= 70 ? '#22c55e' : score >= 40 ? '#eab308' : '#ef4444',
                        }}
                      >
                        {score}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Diseases found */}
              {detailData.diseases_found?.length > 0 && (
                <div>
                  <p className="text-[10px] uppercase tracking-wider mb-2" style={{ color: 'var(--text-faint)' }}>
                    Diseases Detected
                  </p>
                  <div className="space-y-1">
                    {[...new Set(detailData.diseases_found)].map((d, i) => (
                      <p key={i} className="text-xs px-2 py-1 rounded" style={{ background: 'rgba(239,68,68,0.08)', color: '#fca5a5' }}>
                        {d}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <button
                onClick={() => disconnectSession(selectedSession)}
                className="w-full text-xs py-2 rounded-lg font-semibold transition"
                style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)' }}
              >
                End Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function DetailRow({ label, value, accent }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{label}</span>
      <span className="text-xs font-semibold" style={{ color: accent || 'var(--text-primary)' }}>{value || '—'}</span>
    </div>
  )
}
