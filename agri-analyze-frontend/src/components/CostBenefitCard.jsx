import React from 'react'

/* ── Colour helpers ── */
function recColor(rec) {
  switch (rec) {
    case 'TREAT':   return { fg: '#ef4444', bg: 'rgba(239,68,68,0.08)',   border: 'rgba(239,68,68,0.25)' }
    case 'MONITOR': return { fg: '#eab308', bg: 'rgba(234,179,8,0.08)',   border: 'rgba(234,179,8,0.25)' }
    case 'HEALTHY': return { fg: '#22c55e', bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.25)' }
    default:        return { fg: 'var(--accent)', bg: 'rgba(76,175,80,0.06)', border: 'var(--border)' }
  }
}

function roiColor(ratio) {
  if (ratio >= 2.0) return '#22c55e'
  if (ratio >= 1.0) return '#eab308'
  return '#ef4444'
}

/* ── INR formatter ── */
function fmt(n) {
  if (n == null) return '—'
  return '₹' + Math.round(n).toLocaleString('en-IN')
}

/* ── Metric row ── */
function Row({ label, value, valueColor, bold }) {
  return (
    <div className="flex items-center justify-between py-1.5"
      style={{ borderBottom: '1px solid var(--border)' }}>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        className="text-xs font-semibold tabular-nums"
        style={{ color: valueColor || 'var(--text-primary)', fontWeight: bold ? 700 : 600 }}
      >
        {value}
      </span>
    </div>
  )
}

/**
 * CostBenefitCard — shows yield loss and treatment ROI from the estimator.
 *
 * Props:
 *   estimate — yield_estimate object from the API response
 */
export default function CostBenefitCard({ estimate }) {
  if (!estimate) return null

  const {
    recommendation,
    recommendation_detail,
    yield_loss_percent,
    yield_loss_kg_per_acre,
    total_yield_loss_kg,
    revenue_loss_inr,
    treatment_cost_inr,
    yield_saved_inr,
    net_benefit_inr,
    roi_ratio,
    roi_label,
    area_acres,
    crop,
    severity,
    stage,
    notes,
  } = estimate

  const isHealthy = recommendation === 'HEALTHY'
  const cols = recColor(recommendation)

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--card-shadow)',
  }

  return (
    <div className="rounded-xl p-4 space-y-3" style={cardStyle}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-faint)' }}>
          Yield &amp; Cost Estimator
        </span>
        <div className="flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--text-faint)' }}>
          <span className="capitalize">{crop}</span>
          <span>·</span>
          <span>{area_acres} {area_acres === 1 ? 'acre' : 'acres'}</span>
          {stage && stage !== 'unknown' && (
            <>
              <span>·</span>
              <span className="capitalize">{stage.replace(/_/g, ' ')}</span>
            </>
          )}
        </div>
      </div>

      {/* Recommendation banner */}
      <div
        className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
        style={{ background: cols.bg, border: `1px solid ${cols.border}` }}
      >
        <span className="text-base shrink-0 mt-0.5">
          {recommendation === 'TREAT' ? '🚨' : recommendation === 'MONITOR' ? '👁️' : '✅'}
        </span>
        <div>
          <p className="text-xs font-bold" style={{ color: cols.fg }}>{recommendation}</p>
          <p className="text-[11px] leading-snug mt-0.5" style={{ color: 'var(--text-primary)' }}>
            {recommendation_detail}
          </p>
        </div>
      </div>

      {isHealthy ? null : (
        <>
          {/* ROI gauge */}
          {roi_ratio > 0 && (
            <div
              className="flex items-center justify-between px-3 py-2 rounded-lg"
              style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}
            >
              <span className="text-[11px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                Return on treatment
              </span>
              <span className="text-sm font-black tabular-nums" style={{ color: roiColor(roi_ratio) }}>
                {roi_label}
              </span>
            </div>
          )}

          {/* Metrics table */}
          <div className="px-1 space-y-0 divide-y" style={{ divideColor: 'var(--border)' }}>
            <Row
              label="Yield loss"
              value={`${yield_loss_percent}%  (${yield_loss_kg_per_acre} kg/acre)`}
              valueColor="#ef4444"
            />
            {area_acres > 1 && (
              <Row
                label="Total yield lost"
                value={`${total_yield_loss_kg} kg`}
                valueColor="#f97316"
              />
            )}
            <Row
              label="Revenue at risk"
              value={fmt(revenue_loss_inr)}
              valueColor="#ef4444"
              bold
            />
            <Row
              label="Treatment cost"
              value={fmt(treatment_cost_inr)}
            />
            <Row
              label="Yield saved by treating"
              value={fmt(yield_saved_inr)}
              valueColor="#22c55e"
            />
            <Row
              label="Net benefit"
              value={net_benefit_inr >= 0 ? `+${fmt(net_benefit_inr)}` : fmt(net_benefit_inr)}
              valueColor={net_benefit_inr >= 0 ? '#22c55e' : '#ef4444'}
              bold
            />
          </div>

          {/* Severity + notes */}
          <div className="flex items-center gap-2 flex-wrap">
            {severity && (
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                style={{
                  color: severity === 'severe' ? '#ef4444' : severity === 'moderate' ? '#f97316' : '#eab308',
                  background: severity === 'severe' ? 'rgba(239,68,68,0.08)' : severity === 'moderate' ? 'rgba(249,115,22,0.08)' : 'rgba(234,179,8,0.08)',
                  border: `1px solid ${severity === 'severe' ? 'rgba(239,68,68,0.2)' : severity === 'moderate' ? 'rgba(249,115,22,0.2)' : 'rgba(234,179,8,0.2)'}`,
                }}
              >
                {severity} severity
              </span>
            )}
            {notes && (
              <p className="text-[10px] leading-snug" style={{ color: 'var(--text-faint)' }}>
                {notes}
              </p>
            )}
          </div>
        </>
      )}
    </div>
  )
}
