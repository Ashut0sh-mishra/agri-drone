import React, { useState, useMemo } from 'react'

function getColorForDisease(name) {
  const key = (name || '').toLowerCase()
  if (key.includes('healthy')) return '#22c55e'
  if (key.includes('rust')) return '#ef4444'
  if (key.includes('blight')) return '#dc2626'
  if (key.includes('blast')) return '#7c3aed'
  if (key.includes('spot')) return '#f97316'
  if (key.includes('deficiency')) return '#eab308'
  return '#ef4444'
}

function formatTime(sec) {
  const m = Math.floor(sec / 60)
  const s = Math.floor(sec % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function VideoResults({ frames, summary, onBack }) {
  const [selectedFrame, setSelectedFrame] = useState(0)
  const [showAnnotated, setShowAnnotated] = useState(true)

  const current = frames?.[selectedFrame]
  const timeline = summary?.health_timeline || []
  const diseaseEntries = Object.entries(summary?.disease_distribution || {}).sort((a, b) => b[1] - a[1])

  // Health timeline chart dimensions
  const chartW = 600
  const chartH = 120
  const maxT = timeline.length > 0 ? Math.max(...timeline.map(t => t.timestamp)) : 1

  const pathPoints = timeline.map((t, i) => {
    const x = (t.timestamp / (maxT || 1)) * chartW
    const y = chartH - (t.health / 100) * chartH
    return `${x},${y}`
  }).join(' ')

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}>
          ← New Scan
        </button>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Video Analysis — {summary?.filename || 'Video'}
        </h2>
        <div className="text-right">
          <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
            {summary?.duration_sec?.toFixed(1)}s · {summary?.fps}fps · {summary?.frames_processed} frames analyzed
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Frames', value: summary?.frames_processed || 0, color: 'var(--accent)' },
          { label: 'Duration', value: `${summary?.duration_sec?.toFixed(1) || 0}s`, color: '#3b82f6' },
          { label: 'Avg Health', value: `${summary?.avg_health_score || 0}%`, color: (summary?.avg_health_score || 0) >= 70 ? '#22c55e' : '#f59e0b' },
          { label: 'Diseases Found', value: Object.keys(summary?.disease_distribution || {}).filter(d => !d.toLowerCase().includes('healthy')).length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{s.label}</p>
            <p className="text-xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Health Timeline */}
      {timeline.length > 1 && (
        <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Health Timeline</h3>
          <svg viewBox={`-10 -10 ${chartW + 20} ${chartH + 30}`} className="w-full" style={{ maxHeight: '160px' }}>
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(v => (
              <g key={v}>
                <line x1="0" y1={chartH - (v / 100) * chartH} x2={chartW} y2={chartH - (v / 100) * chartH}
                  stroke="var(--border)" strokeWidth="0.5" strokeDasharray="4,4" />
                <text x="-8" y={chartH - (v / 100) * chartH + 3} fontSize="8" fill="var(--text-faint)" textAnchor="end">{v}</text>
              </g>
            ))}
            {/* Danger zone */}
            <rect x="0" y={chartH - (40 / 100) * chartH} width={chartW} height={(40 / 100) * chartH}
              fill="rgba(239,68,68,0.05)" />
            {/* Line */}
            <polyline points={pathPoints} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinejoin="round" />
            {/* Dots */}
            {timeline.map((t, i) => {
              const x = (t.timestamp / (maxT || 1)) * chartW
              const y = chartH - (t.health / 100) * chartH
              const color = t.health >= 70 ? '#22c55e' : t.health >= 40 ? '#f59e0b' : '#ef4444'
              return (
                <circle key={i} cx={x} cy={y} r={selectedFrame === i ? 6 : 4}
                  fill={color} stroke="#fff" strokeWidth="1.5"
                  className="cursor-pointer" onClick={() => setSelectedFrame(i)} />
              )
            })}
            {/* X axis labels */}
            {timeline.filter((_, i) => i % Math.max(1, Math.floor(timeline.length / 6)) === 0).map((t, i) => (
              <text key={i} x={(t.timestamp / (maxT || 1)) * chartW} y={chartH + 14} fontSize="8" fill="var(--text-faint)" textAnchor="middle">
                {formatTime(t.timestamp)}
              </text>
            ))}
          </svg>
        </div>
      )}

      {/* Main viewer: selected frame */}
      {current && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Frame image */}
          <div className="lg:col-span-2 rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: '1px solid var(--border)' }}>
              <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                Frame {selectedFrame + 1}/{frames.length} — {formatTime(current.timestamp_sec)}
              </span>
              <div className="flex gap-2">
                <button onClick={() => setShowAnnotated(!showAnnotated)}
                  className="px-3 py-1 rounded text-[10px] font-bold"
                  style={{ background: showAnnotated ? 'var(--accent)' : 'var(--bg-secondary)', color: showAnnotated ? '#fff' : 'var(--text-muted)', border: '1px solid var(--border)' }}>
                  {showAnnotated ? 'Annotated' : 'Original'}
                </button>
              </div>
            </div>
            <img
              src={showAnnotated ? current.annotated_image : current.original_image}
              alt={`Frame ${selectedFrame + 1}`}
              className="w-full"
            />

            {/* Frame info */}
            <div className="px-4 py-3 flex items-center justify-between" style={{ borderTop: '1px solid var(--border)' }}>
              <div className="flex items-center gap-3">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: getColorForDisease(current.disease_name) }} />
                <span className="text-sm font-bold" style={{ color: getColorForDisease(current.disease_name) }}>
                  {(current.disease_name || 'Unknown').replace(/_/g, ' ')}
                </span>
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {((current.confidence || 0) * 100).toFixed(0)}% confidence
                </span>
              </div>
              <span className="text-sm font-bold" style={{ color: current.health_score >= 70 ? '#22c55e' : current.health_score >= 40 ? '#f59e0b' : '#ef4444' }}>
                Health: {current.health_score}%
              </span>
            </div>
          </div>

          {/* Frame details sidebar */}
          <div className="space-y-4">
            {/* Disease distribution (video) */}
            <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
              <h4 className="text-xs font-bold mb-3" style={{ color: 'var(--text-faint)' }}>DISEASES ACROSS VIDEO</h4>
              {diseaseEntries.map(([disease, count]) => (
                <div key={disease} className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: getColorForDisease(disease) }} />
                  <span className="text-xs flex-1" style={{ color: 'var(--text-primary)' }}>
                    {disease.replace(/_/g, ' ')}
                  </span>
                  <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{count}x</span>
                </div>
              ))}
            </div>

            {/* Current frame detections */}
            {current.detections?.length > 0 && (
              <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <h4 className="text-xs font-bold mb-3" style={{ color: 'var(--text-faint)' }}>DETECTIONS IN FRAME</h4>
                {current.detections.map((det, i) => (
                  <div key={i} className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: getColorForDisease(det.class_name) }} />
                    <span className="text-xs flex-1" style={{ color: 'var(--text-primary)' }}>
                      {(det.class_name || '').replace(/_/g, ' ')}
                    </span>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>
                      {((det.confidence || 0) * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Frame strip (thumbnail timeline) */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-xs font-bold mb-3" style={{ color: 'var(--text-faint)' }}>ALL FRAMES</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {(frames || []).map((f, i) => {
            const isActive = selectedFrame === i
            const color = getColorForDisease(f.disease_name)
            return (
              <button key={i}
                onClick={() => setSelectedFrame(i)}
                className="flex-shrink-0 rounded-lg overflow-hidden transition-all duration-200"
                style={{
                  border: isActive ? `2px solid var(--accent)` : '2px solid var(--border)',
                  width: '120px',
                  opacity: isActive ? 1 : 0.7,
                }}>
                <div className="relative">
                  <img src={f.annotated_image} alt={`Frame ${i + 1}`} className="w-full aspect-video object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 px-1.5 py-1" style={{ background: 'rgba(0,0,0,0.7)' }}>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold" style={{ color }}>{(f.disease_name || '').replace(/_/g, ' ').slice(0, 12)}</span>
                      <span className="text-[9px] font-bold" style={{ color: f.health_score >= 70 ? '#22c55e' : '#ef4444' }}>{f.health_score}%</span>
                    </div>
                  </div>
                  <div className="absolute top-1 right-1 text-[8px] font-bold text-white bg-black/60 px-1 rounded">
                    {formatTime(f.timestamp_sec)}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
