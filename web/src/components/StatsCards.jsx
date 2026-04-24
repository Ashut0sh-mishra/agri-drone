import React from 'react'

export default function StatsCards({ stats }) {
  const cards = [
    {
      label: 'Total Scans',
      value: stats.totalScans,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 003.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0120.25 6v1.5m0 9V18A2.25 2.25 0 0118 20.25h-1.5m-9 0H6A2.25 2.25 0 013.75 18v-1.5" />
        </svg>
      ),
      color: 'var(--accent)',
    },
    {
      label: 'Diseases Found',
      value: stats.diseasesFound,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126z" />
        </svg>
      ),
      color: 'var(--danger)',
    },
    {
      label: 'Avg Health',
      value: stats.avgHealth != null ? `${stats.avgHealth}%` : '--',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
      color: 'var(--accent)',
    },
    {
      label: 'Last Scan',
      value: stats.lastScanTime || '--:--',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: 'var(--warning)',
    },
  ]

  return (
    <div className="grid grid-cols-4 gap-3">
      {cards.map((c, i) => (
        <div
          key={i}
          className="relative rounded-lg px-4 py-3 flex items-center gap-3 overflow-hidden scan-line"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {/* Colored top-line accent */}
          <div
            className="absolute top-0 left-0 right-0 h-[2px]"
            style={{ background: c.color }}
          />
          <div
            className="flex-shrink-0 w-9 h-9 rounded-md flex items-center justify-center"
            style={{ background: `color-mix(in srgb, ${c.color} 12%, transparent)`, color: c.color }}
          >
            {c.icon}
          </div>
          <div className="min-w-0">
            <div
              className="font-bold text-base leading-tight truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {c.value}
            </div>
            <div
              className="text-[10px] uppercase tracking-wider"
              style={{ color: 'var(--text-muted)' }}
            >
              {c.label}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
