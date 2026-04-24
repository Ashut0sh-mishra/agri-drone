import React, { useState } from 'react'
import { runDetection, getApiUrl } from '../services/api'

/**
 * YouTube frame extraction component.
 * Sends YouTube URL to backend, which extracts frames every N seconds,
 * runs detection on each, and returns results.
 *
 * Fallback: If backend doesn't support /api/youtube/extract,
 * shows an informative message.
 */
export default function YouTubeFrames({ selectedCrop, areaAcres, growthStage, onResults }) {
  const [url, setUrl] = useState('')
  const [interval, setInterval_] = useState(5)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState('')
  const [frames, setFrames] = useState([])
  const [error, setError] = useState(null)

  const isValidUrl = (u) => {
    return /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)/.test(u.trim())
  }

  const extractFrames = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL')
      return
    }
    if (!isValidUrl(url)) {
      setError('Invalid YouTube URL. Use format: https://www.youtube.com/watch?v=...')
      return
    }

    setLoading(true)
    setError(null)
    setFrames([])
    setProgress('Sending URL to backend for frame extraction...')

    try {
      const apiUrl = getApiUrl()
      const resp = await fetch(`${apiUrl}/api/youtube/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          interval_seconds: interval,
          crop_type: selectedCrop,
        }),
      })

      if (!resp.ok) {
        if (resp.status === 404) {
          setError('YouTube extraction endpoint not available. Make sure yt-dlp is installed on the backend server and the /api/youtube/extract endpoint is enabled.')
          setLoading(false)
          return
        }
        const data = await resp.json().catch(() => ({}))
        throw new Error(data.detail || `Server error: ${resp.status}`)
      }

      const data = await resp.json()
      const extractedFrames = data.frames || []

      if (extractedFrames.length === 0) {
        setError('No frames extracted. The video may be too short or unavailable.')
        setLoading(false)
        return
      }

      setProgress(`Extracted ${extractedFrames.length} frames. Running detection...`)

      // Run detection on each frame
      const results = []
      for (let i = 0; i < extractedFrames.length; i++) {
        const frame = extractedFrames[i]
        setProgress(`Detecting frame ${i + 1}/${extractedFrames.length} (${frame.timestamp}s)...`)

        try {
          // Convert base64 frame to File
          const resp2 = await fetch(`data:image/jpeg;base64,${frame.image_b64}`)
          const blob = await resp2.blob()
          const file = new File([blob], `frame_${frame.timestamp}s.jpg`, { type: 'image/jpeg' })

          const det = await runDetection(file, {
            crop_type: selectedCrop,
            area_acres: areaAcres,
            growth_stage: growthStage,
            use_llava: false,
            include_image: true,
          })

          results.push({
            timestamp: frame.timestamp,
            imageData: `data:image/jpeg;base64,${frame.image_b64}`,
            result: det,
            disease: det.detections?.[0]?.class_name || 'healthy',
            confidence: det.detections?.[0]?.confidence || 0,
          })
        } catch (err) {
          results.push({
            timestamp: frame.timestamp,
            imageData: `data:image/jpeg;base64,${frame.image_b64}`,
            result: null,
            error: err.message,
          })
        }
      }

      setFrames(results)
      setProgress('')
      if (onResults) onResults(results)
    } catch (err) {
      setError(err.message || 'Frame extraction failed')
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--card-shadow)',
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl p-5 space-y-4" style={cardStyle}>
        <div className="flex items-center gap-2">
          <span className="text-lg">▶</span>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--accent)' }}>YouTube Video Analysis</h3>
        </div>

        <div className="space-y-3">
          <input
            type="url"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => { setUrl(e.target.value); setError(null) }}
            disabled={loading}
            className="block w-full text-sm rounded-lg px-4 py-2.5"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
          />

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <label className="text-xs" style={{ color: 'var(--text-muted)' }}>Extract every</label>
              <input
                type="number"
                min={1}
                max={60}
                value={interval}
                onChange={(e) => setInterval_(Math.max(1, parseInt(e.target.value) || 5))}
                className="w-16 text-center rounded-lg px-2 py-1.5 text-sm"
                style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
              />
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>seconds</span>
            </div>

            <button
              onClick={extractFrames}
              disabled={loading || !url.trim()}
              className="px-5 py-2 rounded-lg text-white text-xs font-bold disabled:opacity-40"
              style={{ background: 'var(--accent)' }}
            >
              {loading ? 'Processing...' : 'Extract & Detect'}
            </button>
          </div>
        </div>

        {error && (
          <div className="rounded-lg px-4 py-2" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)' }}>
            <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}

        {progress && (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" style={{ color: 'var(--accent)', borderTopColor: 'var(--accent)' }} />
            <p className="text-xs" style={{ color: 'var(--accent)' }}>{progress}</p>
          </div>
        )}
      </div>

      {/* Frame results grid */}
      {frames.length > 0 && (
        <div className="rounded-xl p-5 space-y-4" style={cardStyle}>
          <h3 className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
            Detected {frames.length} frames
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {frames.map((f, i) => (
              <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <div className="relative" style={{ aspectRatio: '16/9' }}>
                  <img src={f.imageData} alt={`Frame ${f.timestamp}s`} className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 text-[10px] font-bold text-white" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    {f.timestamp}s
                  </div>
                </div>
                <div className="p-2">
                  {f.error ? (
                    <p className="text-[10px]" style={{ color: '#ef4444' }}>Error</p>
                  ) : (
                    <>
                      <p className="text-xs font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {(f.disease || 'healthy').replace(/_/g, ' ')}
                      </p>
                      {f.confidence > 0 && (
                        <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                          {(f.confidence * 100).toFixed(0)}% confidence
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
