import React from 'react'

export default function ScanHistory({ scans, activeIndex, onSelect }) {
  if (!scans.length) return null

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold tracking-wide" style={{ color: 'var(--text-primary)' }}>
          SCAN HISTORY
        </h3>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-semibold"
          style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}
        >
          {scans.length} scan{scans.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
        {scans.map((scan, i) => {
          const isActive = i === activeIndex
          const disease = scan.result?.structured?.diagnosis?.disease_name || 'Unknown'
          const health = scan.health ?? 50
          const isHealthy = disease.toLowerCase().includes('healthy')

          // Color based on health
          let ringColor = 'var(--danger)'
          if (health >= 75) ringColor = 'var(--success, #22c55e)'
          else if (health >= 50) ringColor = 'var(--warning, #f59e0b)'

          return (
            <button
              key={scan.id}
              onClick={() => onSelect(i)}
              className="flex-shrink-0 rounded-lg p-1.5 transition-all duration-200 group"
              style={{
                background: isActive
                  ? 'color-mix(in srgb, var(--accent) 12%, transparent)'
                  : 'transparent',
                border: isActive
                  ? '2px solid var(--accent)'
                  : '2px solid var(--border)',
                width: '140px',
              }}
            >
              {/* Thumbnail */}
              <div className="relative rounded-md overflow-hidden mb-1.5" style={{ aspectRatio: '4/3' }}>
                {scan.imagePreview ? (
                  <img
                    src={scan.imagePreview}
                    alt={`Scan #${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div
                    className="w-full h-full flex items-center justify-center"
                    style={{ background: 'var(--bg-secondary)' }}
                  >
                    <svg className="w-6 h-6" style={{ color: 'var(--text-faint)' }} fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z" />
                    </svg>
                  </div>
                )}

                {/* Health badge */}
                <div
                  className="absolute top-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-bold"
                  style={{ background: 'rgba(0,0,0,0.7)', color: ringColor }}
                >
                  {health}%
                </div>

                {/* Scan number */}
                <div
                  className="absolute top-1 left-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ background: 'rgba(0,0,0,0.7)', color: 'white' }}
                >
                  {i + 1}
                </div>
              </div>

              {/* Disease name */}
              <p
                className="text-[11px] font-semibold truncate leading-tight"
                style={{ color: isHealthy ? 'var(--success, #22c55e)' : 'var(--danger)' }}
              >
                {disease}
              </p>

              {/* Time */}
              <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-faint)' }}>
                {scan.time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                {' · '}
                {scan.filename ? scan.filename.substring(0, 12) : `Scan #${i + 1}`}
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
