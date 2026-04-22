/**
 * AnalysisProgress - Multi-stage progress indicator for the image-analysis pipeline.
 *
 * Displays upload â†’ preprocess â†’ YOLO â†’ classify â†’ LLaVA â†’ reasoning stages with
 * estimated durations and a completion spinner. Driven by the backend response
 * timings exposed through the /detect endpoint.
 *
 * @component
 */
import React, { useState, useEffect, useRef } from 'react'

const STAGES = [
  { key: 'upload', label: 'Uploading image', icon: '📤', estimatedSec: 3 },
  { key: 'preprocess', label: 'Preprocessing', icon: '🔧', estimatedSec: 2 },
  { key: 'yolo', label: 'YOLO detection', icon: '🔍', estimatedSec: 4 },
  { key: 'classify', label: 'Disease classification', icon: '🧠', estimatedSec: 3 },
  { key: 'llava', label: 'LLaVA AI analysis', icon: '🤖', estimatedSec: 90 },
  { key: 'ensemble', label: 'Building report', icon: '📊', estimatedSec: 2 },
]

export default function AnalysisProgress({ uploadProgress, downloadProgress, useLlava }) {
  const [elapsed, setElapsed] = useState(0)
  const [activeStage, setActiveStage] = useState(0)
  const startRef = useRef(Date.now())
  const timerRef = useRef(null)

  // Tick elapsed time every 100ms
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setElapsed((Date.now() - startRef.current) / 1000)
    }, 100)
    return () => clearInterval(timerRef.current)
  }, [])

  // Advance stages based on progress signals and elapsed time
  useEffect(() => {
    if (uploadProgress >= 100 && activeStage < 1) setActiveStage(1)
  }, [uploadProgress, activeStage])

  useEffect(() => {
    if (downloadProgress > 0 && activeStage < 5) setActiveStage(5)
  }, [downloadProgress, activeStage])

  // Time-based stage advancement for middle stages
  useEffect(() => {
    const totalBefore = STAGES.slice(0, activeStage).reduce((s, st) => s + st.estimatedSec, 0)
    const currentEst = STAGES[activeStage]?.estimatedSec || 5
    if (elapsed > totalBefore + currentEst && activeStage < STAGES.length - 1) {
      // Skip LLaVA stage if not using it
      const next = activeStage + 1
      if (!useLlava && STAGES[next]?.key === 'llava') {
        setActiveStage(next + 1)
      } else {
        setActiveStage(next)
      }
    }
  }, [elapsed, activeStage, useLlava])

  const stages = useLlava ? STAGES : STAGES.filter(s => s.key !== 'llava')
  const totalEstSec = stages.reduce((s, st) => s + st.estimatedSec, 0)
  const overallPct = Math.min(95, Math.round((elapsed / totalEstSec) * 100))

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return m > 0 ? `${m}m ${s}s` : `${s}s`
  }

  const remainEst = Math.max(0, totalEstSec - elapsed)

  return (
    <div className="rounded-xl p-6 space-y-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.1)' }}>
            <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
          </div>
          <div>
            <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Analyzing crop image...</p>
            <p className="text-[11px]" style={{ color: 'var(--text-faint)' }}>
              {stages[activeStage]?.label || 'Processing'}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold tabular-nums" style={{ color: 'var(--accent)' }}>{formatTime(elapsed)}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
            {remainEst > 0 ? `~${formatTime(remainEst)} left` : 'Finishing up...'}
          </p>
        </div>
      </div>

      {/* Overall progress bar */}
      <div>
        <div className="flex justify-between text-[10px] mb-1.5" style={{ color: 'var(--text-faint)' }}>
          <span>Overall progress</span>
          <span>{overallPct}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${overallPct}%`,
              background: 'linear-gradient(90deg, var(--accent), #22c55e)',
            }}
          />
        </div>
      </div>

      {/* Stage list */}
      <div className="space-y-2">
        {stages.map((stage, i) => {
          const isDone = i < activeStage
          const isCurrent = i === activeStage
          return (
            <div
              key={stage.key}
              className="flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-300"
              style={{
                background: isCurrent ? 'rgba(34,197,94,0.06)' : 'transparent',
                border: `1px solid ${isCurrent ? 'rgba(34,197,94,0.15)' : 'transparent'}`,
                opacity: isDone ? 0.5 : isCurrent ? 1 : 0.35,
              }}
            >
              {/* Status icon */}
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0"
                style={{
                  background: isDone ? 'rgba(34,197,94,0.15)' : isCurrent ? 'rgba(34,197,94,0.1)' : 'var(--bg-tertiary)',
                }}>
                {isDone ? (
                  <span style={{ color: '#22c55e' }}>✓</span>
                ) : isCurrent ? (
                  <div className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                ) : (
                  <span style={{ color: 'var(--text-faint)' }}>{stage.icon}</span>
                )}
              </div>

              {/* Label */}
              <span className="text-xs font-medium flex-1" style={{ color: isDone ? '#22c55e' : isCurrent ? 'var(--text-primary)' : 'var(--text-faint)' }}>
                {stage.label}
              </span>

              {/* Time / status */}
              <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-faint)' }}>
                {isDone ? '✓ Done' : isCurrent ? `~${stage.estimatedSec}s` : ''}
              </span>
            </div>
          )
        })}
      </div>

      {/* Upload detail (when still uploading) */}
      {uploadProgress > 0 && uploadProgress < 100 && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--text-faint)' }}>Upload:</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
            <div className="h-full rounded-full transition-all" style={{ width: `${uploadProgress}%`, background: 'var(--accent)' }} />
          </div>
          <span className="text-[10px] tabular-nums" style={{ color: 'var(--text-faint)' }}>{uploadProgress}%</span>
        </div>
      )}

      {/* Fun tip */}
      <p className="text-[10px] text-center" style={{ color: 'var(--text-faint)' }}>
        {useLlava
          ? '🧠 LLaVA vision analysis takes longer but provides detailed disease diagnosis'
          : '⚡ Running fast YOLO + classifier detection'}
      </p>
    </div>
  )
}
