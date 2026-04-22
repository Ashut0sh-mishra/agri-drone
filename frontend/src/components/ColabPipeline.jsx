/**
 * ColabPipeline - Dashboard view of a Google-Colab training pipeline.
 *
 * Polls /api/training/* endpoints to display the 4-stage pipeline
 * (Setup â†’ Dataset Download â†’ Training â†’ Evaluation), live logs, and
 * downloadable artifacts.
 *
 * @component
 */
import React, { useState, useEffect, useRef } from 'react'
import { getTrainingStatus, getTrainingArtifacts, getTrainingLogs, getTrainingImageUrl } from '../services/api'

const STAGES = [
  { key: 'setup', label: '1. Setup & Install', icon: '⚙️' },
  { key: 'download', label: '2. Dataset Download', icon: '📦' },
  { key: 'training', label: '3. Training', icon: '🔥' },
  { key: 'evaluation', label: '4. Evaluation', icon: '📊' },
  { key: 'export', label: '5. Export & Save', icon: '💾' },
  { key: 'complete', label: '6. Complete', icon: '✅' },
]

function StageIndicator({ stages, currentStage, error }) {
  const currentIdx = stages.findIndex(s => s.key === currentStage)
  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {stages.map((stage, i) => {
        const isComplete = i < currentIdx
        const isCurrent = stage.key === currentStage
        const isError = isCurrent && error
        const bg = isError ? '#ef4444' : isComplete ? '#22c55e' : isCurrent ? 'var(--accent)' : 'var(--bg-tertiary)'
        const textColor = isComplete || isCurrent ? '#fff' : 'var(--text-faint)'
        return (
          <React.Fragment key={stage.key}>
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap"
              style={{ background: bg, color: textColor, minWidth: 'fit-content' }}>
              <span>{stage.icon}</span>
              <span>{stage.label}</span>
            </div>
            {i < stages.length - 1 && (
              <div className="w-6 h-0.5 flex-shrink-0" style={{ background: isComplete ? '#22c55e' : 'var(--border)' }} />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
}

function LogViewer({ logs }) {
  const scrollRef = useRef(null)
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [logs])

  const colorizeLine = (line) => {
    if (/error|fail|exception|traceback/i.test(line)) return '#ef4444'
    if (/warn/i.test(line)) return '#eab308'
    if (/success|complete|saved|loaded/i.test(line)) return '#22c55e'
    if (/epoch|training|downloading/i.test(line)) return '#3b82f6'
    return 'var(--text-muted)'
  }

  return (
    <div ref={scrollRef} className="rounded-lg p-4 font-mono text-xs overflow-auto"
      style={{ background: '#0d1117', maxHeight: '400px', border: '1px solid var(--border)' }}>
      {logs.length === 0 ? (
        <p style={{ color: '#666' }}>Waiting for logs...</p>
      ) : logs.map((line, i) => (
        <div key={i} className="flex gap-2 leading-relaxed">
          <span style={{ color: '#555', userSelect: 'none' }}>{String(i + 1).padStart(3)}</span>
          <span style={{ color: colorizeLine(line) }}>{line}</span>
        </div>
      ))}
    </div>
  )
}

function ArtifactGrid({ artifacts }) {
  if (!artifacts) return null
  const { images = [], logs = [], models = [], csvs = [] } = artifacts
  const total = images.length + logs.length + models.length + csvs.length
  if (total === 0) return (
    <div className="text-center py-8">
      <p className="text-sm" style={{ color: 'var(--text-faint)' }}>No artifacts synced yet. Run the sync script after Colab training.</p>
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Models */}
      {models.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#22c55e' }}>Models ({models.length})</p>
          <div className="grid grid-cols-2 gap-2">
            {models.map((m, i) => (
              <div key={i} className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)' }}>
                <span className="text-lg">🧠</span>
                <div>
                  <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>{m.name}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{m.size_kb > 1024 ? `${(m.size_kb / 1024).toFixed(1)} MB` : `${m.size_kb} KB`}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Images */}
      {images.length > 0 && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#3b82f6' }}>Training Images ({images.length})</p>
          <div className="grid grid-cols-3 gap-2">
            {images.slice(0, 9).map((img, i) => (
              <div key={i} className="rounded-lg overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                <img src={getTrainingImageUrl(img.name)} alt={img.name} className="w-full h-24 object-cover" onError={e => e.target.style.display = 'none'} />
                <p className="text-[10px] px-2 py-1 truncate" style={{ color: 'var(--text-faint)', background: 'var(--bg-card)' }}>{img.name}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* CSVs + Logs */}
      {(csvs.length > 0 || logs.length > 0) && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: '#eab308' }}>Data Files ({csvs.length + logs.length})</p>
          <div className="space-y-1">
            {[...csvs, ...logs].map((f, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-1.5 rounded" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <span className="text-xs" style={{ color: 'var(--text-primary)' }}>{f.name}</span>
                <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{f.size_kb} KB</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ColabPipeline() {
  const [status, setStatus] = useState(null)
  const [artifacts, setArtifacts] = useState(null)
  const [logs, setLogs] = useState([])
  const [logFile, setLogFile] = useState('none')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [activeTab, setActiveTab] = useState('status')
  const [loading, setLoading] = useState(true)
  const pollRef = useRef(null)

  const fetchAll = async () => {
    try {
      const [s, a, l] = await Promise.all([
        getTrainingStatus(),
        getTrainingArtifacts(),
        getTrainingLogs(),
      ])
      setStatus(s)
      setArtifacts(a)
      setLogs(l.logs || [])
      setLogFile(l.file || 'none')
    } catch (err) {
      setStatus({ stage: 'error', message: 'Cannot reach backend. Is the API server running?' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchAll() }, [])

  useEffect(() => {
    if (autoRefresh) {
      pollRef.current = setInterval(fetchAll, 3000)
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [autoRefresh])

  const hasError = status?.stage === 'error' || status?.errors?.length > 0

  const TABS = [
    { id: 'status', label: 'Pipeline Status' },
    { id: 'logs', label: 'Training Logs' },
    { id: 'artifacts', label: 'Artifacts' },
    { id: 'howto', label: 'Setup Guide' },
  ]

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
    </div>
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>Colab Integration</p>
          <h2 className="text-xl font-bold mt-1" style={{ color: 'var(--text-primary)' }}>Training Pipeline</h2>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => setAutoRefresh(!autoRefresh)}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
            style={{
              background: autoRefresh ? 'rgba(34,197,94,0.1)' : 'transparent',
              color: autoRefresh ? '#22c55e' : 'var(--text-muted)',
              border: `1px solid ${autoRefresh ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
            }}>
            {autoRefresh ? '● Live' : '○ Paused'}
          </button>
          <button onClick={fetchAll} className="px-3 py-1.5 text-xs font-semibold rounded-lg transition"
            style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Stage Progress */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <StageIndicator stages={STAGES} currentStage={status?.stage || 'idle'} error={hasError} />
        {status?.stage === 'idle' ? (
          <div className="mt-4 flex items-center gap-3 px-4 py-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}>
            <span className="text-xl">📋</span>
            <div>
              <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Ready for training</p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-faint)' }}>
                Open the Colab notebook, run training, then sync results. Click <strong>Setup Guide</strong> tab for instructions.
              </p>
            </div>
          </div>
        ) : status?.message && (
          <p className="mt-3 text-sm" style={{ color: hasError ? '#ef4444' : 'var(--text-muted)' }}>
            {status.message}
          </p>
        )}
        {status?.progress != null && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--text-faint)' }}>
              <span>Progress</span>
              <span>{status.progress}%</span>
            </div>
            <div className="w-full h-2 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${status.progress}%`, background: hasError ? '#ef4444' : 'var(--accent)' }} />
            </div>
          </div>
        )}
        {status?.epoch && (
          <p className="mt-2 text-xs" style={{ color: 'var(--text-faint)' }}>
            Epoch {status.epoch}/{status.total_epochs || '?'} • mAP50: {status.mAP50 || 'N/A'} • Loss: {status.loss || 'N/A'}
          </p>
        )}
        {status?.updated_at && (
          <p className="mt-1 text-[10px]" style={{ color: 'var(--text-faint)' }}>
            Last update: {new Date(status.updated_at).toLocaleString()}
          </p>
        )}
      </div>

      {/* Error Details */}
      {status?.errors?.length > 0 && (
        <div className="rounded-xl p-4" style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)' }}>
          <p className="text-xs font-bold uppercase mb-2" style={{ color: '#ef4444' }}>Runtime Errors</p>
          {status.errors.map((err, i) => (
            <div key={i} className="mb-2 last:mb-0">
              <p className="text-xs font-mono" style={{ color: '#ef4444' }}>{err.type || 'Error'}: {err.message}</p>
              {err.traceback && (
                <pre className="mt-1 text-[10px] font-mono p-2 rounded overflow-x-auto" style={{ background: '#1a0000', color: '#ff8888' }}>
                  {err.traceback}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 rounded-lg p-1" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-1 px-3 py-2 text-xs font-semibold rounded-md transition"
            style={{
              background: activeTab === tab.id ? 'var(--accent)' : 'transparent',
              color: activeTab === tab.id ? '#fff' : 'var(--text-muted)',
            }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-xl p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {activeTab === 'status' && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Training Details</h3>
            {status?.dataset && (
              <div className="grid grid-cols-2 gap-3">
                <InfoCard label="Dataset" value={status.dataset} />
                <InfoCard label="Model" value={status.model || 'YOLOv8s'} />
                <InfoCard label="Images" value={status.num_images || '—'} />
                <InfoCard label="Classes" value={status.num_classes || '—'} />
                <InfoCard label="GPU" value={status.gpu || '—'} />
                <InfoCard label="Batch Size" value={status.batch_size || '—'} />
              </div>
            )}
            {!status?.dataset && (
              <p className="text-sm" style={{ color: 'var(--text-faint)' }}>
                No training data yet. Start training on Colab and sync results.
              </p>
            )}
          </div>
        )}
        {activeTab === 'logs' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Training Output</h3>
              <span className="text-[10px]" style={{ color: 'var(--text-faint)' }}>Source: <code style={{ color: 'var(--accent)' }}>{logFile}</code></span>
            </div>
            <LogViewer logs={logs} />
          </div>
        )}
        {activeTab === 'artifacts' && <ArtifactGrid artifacts={artifacts} />}
        {activeTab === 'howto' && <SetupGuide />}
      </div>
    </div>
  )
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
      <p className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-faint)' }}>{label}</p>
      <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>{value}</p>
    </div>
  )
}

function SetupGuide() {
  return (
    <div className="space-y-4 text-sm" style={{ color: 'var(--text-muted)' }}>
      <h3 className="font-bold text-base" style={{ color: 'var(--text-primary)' }}>How to Use the Training Pipeline</h3>

      <div className="space-y-3">
        <Step num={1} title="Open Colab Notebook">
          Open <code className="px-1 rounded" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent)' }}>notebooks/Train_YOLOv8_Colab_GPU.ipynb</code> in Google Colab.
          Set runtime to <strong>T4 GPU</strong> and click <strong>Run All</strong>.
        </Step>

        <Step num={2} title="Training Runs on Colab">
          The notebook downloads the dataset, trains YOLOv8, evaluates, and saves everything to Google Drive automatically.
          Errors and progress are logged in real-time.
        </Step>

        <Step num={3} title="Download Results ZIP">
          After training completes, the notebook creates a ZIP file and triggers auto-download.
          Save it anywhere on your PC.
        </Step>

        <Step num={4} title="Sync to Dashboard">
          Run in terminal:
          <pre className="mt-2 p-3 rounded-lg font-mono text-xs" style={{ background: '#0d1117', color: '#e6edf3' }}>
{`cd D:\\Projects\\agri-drone
python scripts/sync_colab_results.py <path-to-zip> --reload`}
          </pre>
          This extracts all artifacts into the right folders and reloads models.
        </Step>

        <Step num={5} title="View Results">
          Switch to <strong>ML Dashboard</strong> for metrics and charts, or <strong>Training Logs</strong> for the full output.
          All results auto-refresh every 3 seconds.
        </Step>
      </div>

      <div className="rounded-lg p-3 mt-4" style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)' }}>
        <p className="text-xs font-bold mb-1" style={{ color: '#3b82f6' }}>Quick Terminal Commands</p>
        <pre className="text-[11px] font-mono" style={{ color: 'var(--text-muted)' }}>
{`# Start backend API
cd D:\\Projects\\agri-drone\\src
python -m uvicorn agridrone.api.app:get_app --factory --host 127.0.0.1 --port 8000

# Start frontend (new terminal)
cd D:\\Projects\\agri-drone-frontend
npm run dev

# Sync Colab results (after training)
cd D:\\Projects\\agri-drone
python scripts/sync_colab_results.py "C:\\Users\\...\\Downloads\\agridrone_colab_results.zip" --reload`}
        </pre>
      </div>
    </div>
  )
}

function Step({ num, title, children }) {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
        style={{ background: 'var(--accent)', color: '#fff' }}>
        {num}
      </div>
      <div>
        <p className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
        <div className="mt-1" style={{ color: 'var(--text-muted)' }}>{children}</div>
      </div>
    </div>
  )
}
