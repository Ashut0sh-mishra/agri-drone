import React, { useState, useMemo } from 'react'
import DetectionCanvas from './DetectionCanvas'

const DISEASE_COLORS = {
  healthy: '#22c55e',
  leaf_rust: '#ef4444',
  brown_spot: '#f97316',
  bacterial_leaf_blight: '#dc2626',
  blast: '#7c3aed',
  hispa: '#ec4899',
  tungro: '#f59e0b',
  sheath_blight: '#14b8a6',
  nitrogen_deficiency: '#eab308',
  water_stress: '#06b6d4',
  fusarium_head_blight: '#a855f7',
  crown_root_rot: '#be185d',
  wheat_loose_smut: '#78716c',
}

function getColorForDisease(name) {
  const key = (name || '').toLowerCase().replace(/[\s-]+/g, '_')
  if (key.includes('healthy')) return '#22c55e'
  for (const [k, v] of Object.entries(DISEASE_COLORS)) {
    if (key.includes(k)) return v
  }
  return '#ef4444'
}

function formatTimestamp(ms) {
  return ms < 1000 ? `${Math.round(ms)}ms` : `${(ms / 1000).toFixed(1)}s`
}

export default function BatchResults({ results, summary, onViewDetail, onBack }) {
  const [viewMode, setViewMode] = useState('grid')  // grid | list | summary
  const [filter, setFilter] = useState('all')        // all | healthy | diseased | rejected
  const [selectedIdx, setSelectedIdx] = useState(null)
  const [sortBy, setSortBy] = useState('index')       // index | health | confidence | disease

  const filteredResults = useMemo(() => {
    let filtered = results || []
    if (filter === 'healthy') filtered = filtered.filter(r => !r.rejected && (r.disease_name || '').toLowerCase().includes('healthy'))
    else if (filter === 'diseased') filtered = filtered.filter(r => !r.rejected && !(r.disease_name || '').toLowerCase().includes('healthy'))
    else if (filter === 'rejected') filtered = filtered.filter(r => r.rejected)

    if (sortBy === 'health') filtered = [...filtered].sort((a, b) => (a.health_score ?? 100) - (b.health_score ?? 100))
    else if (sortBy === 'confidence') filtered = [...filtered].sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0))
    else if (sortBy === 'disease') filtered = [...filtered].sort((a, b) => (a.disease_name || '').localeCompare(b.disease_name || ''))

    return filtered
  }, [results, filter, sortBy])

  const diseaseEntries = Object.entries(summary?.disease_distribution || {}).sort((a, b) => b[1] - a[1])
  const maxDiseaseCount = diseaseEntries.length > 0 ? diseaseEntries[0][1] : 1

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <button onClick={onBack} className="px-4 py-2 rounded-lg text-xs font-semibold" style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}>
          ← New Scan
        </button>
        <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
          Batch Analysis — {summary?.total_images || 0} images
        </h2>
        <div className="flex gap-2">
          {['grid', 'list', 'summary'].map(m => (
            <button key={m} onClick={() => setViewMode(m)}
              className="px-3 py-1.5 rounded text-xs font-bold uppercase"
              style={{
                background: viewMode === m ? 'var(--accent)' : 'transparent',
                color: viewMode === m ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${viewMode === m ? 'var(--accent)' : 'var(--border)'}`,
              }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total', value: summary?.total_images || 0, color: 'var(--accent)' },
          { label: 'Healthy', value: summary?.healthy_count || 0, color: '#22c55e' },
          { label: 'Diseased', value: summary?.diseased_count || 0, color: '#ef4444' },
          { label: 'Avg Health', value: `${summary?.avg_health_score || 0}%`, color: (summary?.avg_health_score || 0) >= 70 ? '#22c55e' : (summary?.avg_health_score || 0) >= 40 ? '#f59e0b' : '#ef4444' },
          { label: 'Detections', value: summary?.total_detections || 0, color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} className="rounded-lg p-3 text-center" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{s.label}</p>
            <p className="text-xl font-black mt-1" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filter + Sort */}
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs font-semibold" style={{ color: 'var(--text-faint)' }}>Filter:</span>
        {['all', 'healthy', 'diseased', 'rejected'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="px-3 py-1 rounded-full text-[11px] font-bold capitalize"
            style={{
              background: filter === f ? 'color-mix(in srgb, var(--accent) 15%, transparent)' : 'transparent',
              color: filter === f ? 'var(--accent)' : 'var(--text-muted)',
              border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
            }}>
            {f}
          </button>
        ))}
        <span className="text-xs font-semibold ml-4" style={{ color: 'var(--text-faint)' }}>Sort:</span>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)}
          className="rounded px-2 py-1 text-xs outline-none"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}>
          <option value="index">Upload Order</option>
          <option value="health">Health (worst first)</option>
          <option value="confidence">Confidence (highest)</option>
          <option value="disease">Disease Name</option>
        </select>
      </div>

      {/* Summary View */}
      {viewMode === 'summary' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Disease Distribution */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Disease Distribution</h3>
            <div className="space-y-3">
              {diseaseEntries.map(([disease, count]) => {
                const color = getColorForDisease(disease)
                const pct = (count / (summary?.total_images || 1)) * 100
                return (
                  <div key={disease}>
                    <div className="flex justify-between mb-1">
                      <span className="text-xs font-semibold" style={{ color }}>{disease.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-bold" style={{ color: 'var(--text-muted)' }}>{count} ({pct.toFixed(0)}%)</span>
                    </div>
                    <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(count / maxDiseaseCount) * 100}%`, background: color }} />
                    </div>
                  </div>
                )
              })}
              {diseaseEntries.length === 0 && <p className="text-xs" style={{ color: 'var(--text-faint)' }}>No diseases detected</p>}
            </div>
          </div>

          {/* Health Score Heatmap */}
          <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <h3 className="text-sm font-bold mb-4" style={{ color: 'var(--text-primary)' }}>Health Scores</h3>
            <div className="flex flex-wrap gap-1.5">
              {(results || []).filter(r => !r.rejected).map((r, i) => {
                const h = r.health_score ?? 50
                const bg = h >= 75 ? '#22c55e' : h >= 50 ? '#f59e0b' : h >= 25 ? '#f97316' : '#ef4444'
                return (
                  <div key={i} title={`${r.filename}: ${h}% — ${r.disease_name}`}
                    className="w-8 h-8 rounded flex items-center justify-center text-[9px] font-bold text-white cursor-pointer hover:scale-110 transition"
                    style={{ background: bg }}
                    onClick={() => setSelectedIdx(r.index)}>
                    {h}
                  </div>
                )
              })}
            </div>
            <div className="flex items-center gap-4 mt-4">
              {[{ label: 'Healthy (75+)', color: '#22c55e' }, { label: 'Warning (50-74)', color: '#f59e0b' }, { label: 'At Risk (25-49)', color: '#f97316' }, { label: 'Critical (<25)', color: '#ef4444' }].map(l => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded" style={{ background: l.color }} />
                  <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{l.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredResults.map((r) => {
            const isSelected = selectedIdx === r.index
            const color = getColorForDisease(r.disease_name)
            const isHealthy = (r.disease_name || '').toLowerCase().includes('healthy')

            return (
              <div key={r.index}
                className="rounded-xl overflow-hidden cursor-pointer transition-all duration-200 hover:scale-[1.02]"
                style={{
                  background: 'var(--bg-card)',
                  border: isSelected ? `2px solid var(--accent)` : '1px solid var(--border)',
                  boxShadow: isSelected ? '0 0 20px color-mix(in srgb, var(--accent) 20%, transparent)' : 'var(--card-shadow)',
                }}
                onClick={() => setSelectedIdx(isSelected ? null : r.index)}>

                {/* Annotated Image */}
                <div className="relative">
                  {r.rejected ? (
                    <div className="aspect-video flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                      <div className="text-center p-4">
                        <span className="text-3xl">🚫</span>
                        <p className="text-xs mt-2" style={{ color: 'var(--text-faint)' }}>{r.rejection_reason || r.error || 'Rejected'}</p>
                      </div>
                    </div>
                  ) : r.annotated_image ? (
                    <img src={r.annotated_image} alt={r.filename} className="w-full aspect-video object-cover" />
                  ) : r.original_image ? (
                    <img src={r.original_image} alt={r.filename} className="w-full aspect-video object-cover" />
                  ) : (
                    <div className="aspect-video flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                      <span className="text-2xl">🌾</span>
                    </div>
                  )}

                  {/* Overlay badges */}
                  {!r.rejected && (
                    <>
                      {/* Health score badge */}
                      <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs font-black"
                        style={{ background: 'rgba(0,0,0,0.75)', color: (r.health_score ?? 50) >= 70 ? '#22c55e' : (r.health_score ?? 50) >= 40 ? '#f59e0b' : '#ef4444' }}>
                        {r.health_score ?? '?'}%
                      </div>

                      {/* Detection count */}
                      {r.num_detections > 0 && (
                        <div className="absolute top-2 left-2 px-2 py-1 rounded-lg text-[10px] font-bold"
                          style={{ background: 'rgba(0,0,0,0.75)', color: '#22c55e' }}>
                          {r.num_detections} detection{r.num_detections > 1 ? 's' : ''}
                        </div>
                      )}

                      {/* Disease label */}
                      <div className="absolute bottom-0 left-0 right-0 px-3 py-2"
                        style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
                        <div className="flex items-center gap-2">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
                          <span className="text-xs font-bold text-white">{(r.disease_name || 'Unknown').replace(/_/g, ' ')}</span>
                          <span className="text-[10px] text-white/70 ml-auto">{((r.confidence || 0) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Image number */}
                  <div className="absolute top-2 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ background: 'rgba(0,0,0,0.6)' }}>
                    {r.index + 1}
                  </div>
                </div>

                {/* Info bar */}
                <div className="px-3 py-2.5">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] font-semibold truncate flex-1" style={{ color: 'var(--text-primary)' }}>
                      {r.filename}
                    </p>
                    <span className="text-[10px] ml-2 shrink-0" style={{ color: 'var(--text-faint)' }}>
                      {formatTimestamp(r.processing_time_ms || 0)}
                    </span>
                  </div>

                  {/* Detection details when expanded */}
                  {isSelected && !r.rejected && (
                    <div className="mt-3 pt-3 space-y-2" style={{ borderTop: '1px solid var(--border)' }}>
                      {/* Top-5 classifier predictions */}
                      {r.classifier_top5?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-faint)' }}>CLASSIFIER TOP-5</p>
                          {r.classifier_top5.slice(0, 5).map((pred, pi) => (
                            <div key={pi} className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ background: getColorForDisease(pred.name || pred.class) }} />
                              <span className="text-[10px] flex-1" style={{ color: 'var(--text-primary)' }}>
                                {(pred.name || pred.class || '').replace(/_/g, ' ')}
                              </span>
                              <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                                <div className="h-full rounded-full" style={{ width: `${(pred.confidence || 0) * 100}%`, background: getColorForDisease(pred.name || pred.class) }} />
                              </div>
                              <span className="text-[10px] font-bold w-8 text-right" style={{ color: 'var(--text-muted)' }}>
                                {((pred.confidence || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* YOLO detections */}
                      {r.detections?.length > 0 && (
                        <div>
                          <p className="text-[10px] font-bold mb-1.5" style={{ color: 'var(--text-faint)' }}>YOLO DETECTIONS</p>
                          {r.detections.map((det, di) => (
                            <div key={di} className="flex items-center gap-2 mb-1">
                              <div className="w-2 h-2 rounded-full" style={{ background: getColorForDisease(det.class_name) }} />
                              <span className="text-[10px] flex-1" style={{ color: 'var(--text-primary)' }}>
                                {(det.class_name || '').replace(/_/g, ' ')}
                              </span>
                              <span className="text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>
                                {((det.confidence || 0) * 100).toFixed(0)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Treatment */}
                      {r.treatment && (
                        <div>
                          <p className="text-[10px] font-bold mb-1" style={{ color: 'var(--text-faint)' }}>TREATMENT</p>
                          {r.treatment.chemical && <p className="text-[10px]" style={{ color: '#f59e0b' }}>💊 {r.treatment.chemical}</p>}
                          {r.treatment.organic && <p className="text-[10px]" style={{ color: '#22c55e' }}>🌿 {r.treatment.organic}</p>}
                          {r.treatment.prevention && <p className="text-[10px]" style={{ color: '#3b82f6' }}>🛡 {r.treatment.prevention}</p>}
                        </div>
                      )}

                      {/* View Full Detail button */}
                      {onViewDetail && (
                        <button onClick={(e) => { e.stopPropagation(); onViewDetail(r) }}
                          className="w-full mt-2 px-3 py-2 rounded-lg text-xs font-bold"
                          style={{ background: 'var(--accent)', color: '#fff' }}>
                          View Full Analysis →
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <div className="rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-secondary)' }}>
                {['#', 'Image', 'File', 'Disease', 'Confidence', 'Health', 'Detections', 'Time'].map(h => (
                  <th key={h} className="px-3 py-3 text-left text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-faint)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((r) => {
                const color = getColorForDisease(r.disease_name)
                return (
                  <tr key={r.index}
                    className="cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid var(--border)' }}
                    onClick={() => onViewDetail?.(r)}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-secondary)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-3 py-2 text-xs font-bold" style={{ color: 'var(--text-faint)' }}>{r.index + 1}</td>
                    <td className="px-3 py-2">
                      {r.annotated_image ? (
                        <img src={r.annotated_image} alt="" className="w-14 h-10 rounded object-cover" />
                      ) : (
                        <div className="w-14 h-10 rounded flex items-center justify-center" style={{ background: 'var(--bg-secondary)' }}>
                          <span className="text-xs">🌾</span>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold truncate max-w-[120px]" style={{ color: 'var(--text-primary)' }}>{r.filename}</td>
                    <td className="px-3 py-2">
                      {r.rejected ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444' }}>Rejected</span>
                      ) : (
                        <span className="text-xs font-bold flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full inline-block" style={{ background: color }} />
                          <span style={{ color }}>{(r.disease_name || '').replace(/_/g, ' ')}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {r.rejected ? '—' : `${((r.confidence || 0) * 100).toFixed(0)}%`}
                    </td>
                    <td className="px-3 py-2">
                      {r.rejected ? (
                        <span className="text-xs" style={{ color: 'var(--text-faint)' }}>—</span>
                      ) : (
                        <span className="text-xs font-bold" style={{ color: (r.health_score ?? 50) >= 70 ? '#22c55e' : (r.health_score ?? 50) >= 40 ? '#f59e0b' : '#ef4444' }}>
                          {r.health_score}%
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{r.num_detections ?? 0}</td>
                    <td className="px-3 py-2 text-[10px]" style={{ color: 'var(--text-faint)' }}>{formatTimestamp(r.processing_time_ms || 0)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
