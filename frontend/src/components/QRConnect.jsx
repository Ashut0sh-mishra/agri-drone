/**
 * QRConnect - Pair-a-phone screen showing a scannable QR code.
 *
 * Renders a QR pointing to the phone-server URL and lists sessions as they
 * connect. Used as the entry point for field workers joining a scan.
 *
 * @component
 */
import React, { useState, useEffect, useRef } from 'react'

const PHONE_SERVER = import.meta.env.VITE_PHONE_SERVER || 'http://localhost:8765'

export default function QRConnect() {
  const [qrData, setQrData] = useState(null)
  const [sessions, setSessions] = useState([])
  const [serverOnline, setServerOnline] = useState(false)
  const pollRef = useRef(null)

  const fetchData = async () => {
    try {
      const [qrResp, sessResp] = await Promise.all([
        fetch(`${PHONE_SERVER}/api/qr-code`),
        fetch(`${PHONE_SERVER}/api/sessions/active`),
      ])
      if (qrResp.ok) {
        setQrData(await qrResp.json())
        setServerOnline(true)
      }
      if (sessResp.ok) {
        const data = await sessResp.json()
        setSessions(data.sessions || [])
      }
    } catch {
      setServerOnline(false)
    }
  }

  useEffect(() => {
    fetchData()
    pollRef.current = setInterval(fetchData, 3000)
    return () => clearInterval(pollRef.current)
  }, [])

  const timeAgo = (iso) => {
    if (!iso) return '—'
    const diff = Date.now() - new Date(iso).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    return `${Math.floor(mins / 60)}h ago`
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>
          Phone Connect
        </p>
        <h2 className="text-lg font-bold mt-1" style={{ color: 'var(--text-primary)' }}>
          QR Code Scanner
        </h2>
      </div>

      <div className="flex gap-6 items-start">
        {/* QR Code card */}
        <div
          className="rounded-xl p-6 text-center shrink-0"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)', width: 320 }}
        >
          {!serverOnline ? (
            <div className="py-8">
              <div className="text-3xl mb-3">📡</div>
              <p className="text-sm font-semibold mb-2" style={{ color: 'var(--danger)' }}>
                Phone server offline
              </p>
              <p className="text-xs mb-4" style={{ color: 'var(--text-faint)' }}>
                Start the server to generate a QR code:
              </p>
              <code
                className="block text-xs px-3 py-2 rounded-lg font-mono"
                style={{ background: 'var(--bg-primary)', color: 'var(--accent)' }}
              >
                python scripts/phone_connect.py --crop wheat
              </code>
            </div>
          ) : qrData ? (
            <>
              <div className="rounded-lg overflow-hidden inline-block mb-4 p-3" style={{ background: '#fff' }}>
                <img
                  src={`data:image/png;base64,${qrData.qr_code_base64}`}
                  alt="QR Code"
                  style={{ width: 200, height: 200, imageRendering: 'pixelated' }}
                />
              </div>
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-primary)' }}>
                Scan with your phone camera
              </p>
              <p
                className="text-xs font-mono px-3 py-1.5 rounded-lg inline-block mb-3"
                style={{ background: 'var(--bg-primary)', color: 'var(--accent)' }}
              >
                {qrData.url}
              </p>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {qrData.connected_devices} device{qrData.connected_devices !== 1 ? 's' : ''} connected
                </span>
              </div>
            </>
          ) : null}
        </div>

        {/* Connected devices list */}
        <div className="flex-1 min-w-0">
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}
          >
            <div className="px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>
                Connected Phones ({sessions.length})
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-3xl mb-2">📱</p>
                <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                  {serverOnline ? 'No phones connected yet. Scan the QR code to begin.' : 'Server offline'}
                </p>
              </div>
            ) : (
              <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
                {sessions.map((s) => (
                  <div key={s.session_id} className="px-4 py-3 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0"
                      style={{ background: 'color-mix(in srgb, var(--accent) 10%, transparent)' }}>
                      📱
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {s.device_name}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        {s.location} · {s.crop_type?.toUpperCase()} · {s.browser}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>
                        {s.photos_uploaded} photo{s.photos_uploaded !== 1 ? 's' : ''}
                      </p>
                      <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                        {timeAgo(s.last_activity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
