import React from 'react'

/**
 * UncertaintyMeter — Confidence bar with error bars and uncertainty colouring.
 *
 * Props:
 *   uncertainty  — the uncertainty object from the backend response
 *                  { mean_confidence, std_confidence, confidence_interval,
 *                    prediction_consistency, is_uncertain, uncertainty_reason, ... }
 */

function bandColor(std) {
  if (std < 0.08) return '#22c55e'   // green — stable
  if (std <= 0.15) return '#eab308'  // yellow — moderate
  return '#ef4444'                   // red — high uncertainty
}

function bandLabel(std) {
  if (std < 0.08) return 'STABLE'
  if (std <= 0.15) return 'MODERATE'
  return 'UNCERTAIN'
}

export default function UncertaintyMeter({ uncertainty }) {
  if (!uncertainty) return null

  const {
    mean_confidence,
    std_confidence,
    confidence_interval,
    prediction_consistency,
    is_uncertain,
    uncertainty_reason,
    n_forward_passes,
  } = uncertainty

  const pct = (mean_confidence * 100).toFixed(1)
  const stdPct = (std_confidence * 100).toFixed(1)
  const ciLow = (confidence_interval[0] * 100).toFixed(1)
  const ciHigh = (confidence_interval[1] * 100).toFixed(1)
  const consist = (prediction_consistency * 100).toFixed(0)

  const color = bandColor(std_confidence)
  const label = bandLabel(std_confidence)

  // Bar positions (0–100 scale)
  const barMean = Math.min(mean_confidence * 100, 100)
  const barLow = Math.min(confidence_interval[0] * 100, 100)
  const barHigh = Math.min(confidence_interval[1] * 100, 100)

  return (
    <div className="rounded-xl p-4 space-y-3" style={{
      background: 'var(--bg-card)',
      border: `1px solid ${is_uncertain ? `${color}40` : 'var(--border)'}`,
      boxShadow: 'var(--card-shadow)',
    }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-semibold"
          style={{ color: 'var(--text-faint)' }}>
          Prediction Uncertainty
        </span>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{
          color,
          background: `${color}15`,
          border: `1px solid ${color}30`,
        }}>
          {label}
        </span>
      </div>

      {/* Main confidence with ± */}
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-black tabular-nums" style={{ color: 'var(--text-primary)' }}>
          {pct}%
        </span>
        <span className="text-sm font-semibold" style={{ color }}>
          ±{stdPct}%
        </span>
        <span className="text-[10px] ml-1" style={{ color: 'var(--text-faint)' }}>
          ({n_forward_passes} passes)
        </span>
      </div>

      {/* Error bar visualisation */}
      <div className="relative h-6 rounded-full overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
        {/* CI range band */}
        <div
          className="absolute top-0 h-full rounded-full"
          style={{
            left: `${barLow}%`,
            width: `${Math.max(barHigh - barLow, 0.5)}%`,
            background: `${color}25`,
            border: `1px solid ${color}40`,
          }}
        />
        {/* Mean confidence fill */}
        <div
          className="absolute top-0 h-full rounded-full transition-all duration-500"
          style={{
            width: `${barMean}%`,
            background: `linear-gradient(90deg, ${color}60, ${color})`,
          }}
        />
        {/* Error bar whiskers (CI low and high markers) */}
        <div className="absolute top-0 h-full w-0.5" style={{
          left: `${barLow}%`,
          background: color,
          opacity: 0.7,
        }} />
        <div className="absolute top-0 h-full w-0.5" style={{
          left: `${Math.min(barHigh, 99.5)}%`,
          background: color,
          opacity: 0.7,
        }} />
        {/* Mean line */}
        <div className="absolute top-0 h-full w-1 rounded-full" style={{
          left: `${Math.min(barMean, 99)}%`,
          background: '#fff',
          boxShadow: `0 0 4px ${color}`,
        }} />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-[11px]" style={{ color: 'var(--text-muted)' }}>
        <span>95% CI: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{ciLow}–{ciHigh}%</span></span>
        <span>Consistency: <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{consist}%</span></span>
      </div>

      {/* Warning banner when uncertain */}
      {is_uncertain && (
        <div className="flex items-start gap-2 rounded-lg px-3 py-2" style={{
          background: `${color}08`,
          border: `1px solid ${color}25`,
        }}>
          <svg className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color }} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
          <p className="text-[11px] leading-snug" style={{ color }}>
            {uncertainty_reason}
          </p>
        </div>
      )}
    </div>
  )
}
