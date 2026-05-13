import React, { useState, useEffect, useRef } from 'react'
import { getDatasetStats, uploadDatasetImages, deleteDatasetClass } from '../services/api'

function StatCard({ label, value, color }) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden" style={{
      background: 'var(--bg-card)', border: '1px solid var(--border)', boxShadow: 'var(--card-shadow)',
    }}>
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: color }} />
      <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: 'var(--text-faint)' }}>{label}</p>
      <p className="text-3xl font-black mt-2 tabular-nums" style={{ color }}>{value}</p>
    </div>
  )
}

function ClassRow({ cls, dataset, onDelete, deletable }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 rounded-lg"
         style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-8 h-8 rounded-md flex items-center justify-center text-xs font-bold"
             style={{ background: 'color-mix(in srgb, var(--accent) 15%, transparent)', color: 'var(--accent)' }}>
          {cls.n_images}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{cls.name}</p>
          <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{cls.size_mb} MB</p>
        </div>
      </div>
      {deletable && (
        <button
          className="text-xs px-2 py-1 rounded hover:opacity-80"
          style={{ color: '#ef4444', border: '1px solid #ef4444' }}
          onClick={() => {
            if (confirm(`Delete all ${cls.n_images} images in '${cls.name}'? This cannot be undone.`)) {
              onDelete(dataset.name, cls.name)
            }
          }}
        >
          Delete
        </button>
      )}
    </div>
  )
}

export default function DatasetCollector() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [className, setClassName] = useState('')
  const [files, setFiles] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [message, setMessage] = useState(null)
  const fileInputRef = useRef(null)

  const fetchStats = async () => {
    try {
      const d = await getDatasetStats()
      setData(d)
      setError(null)
    } catch (e) {
      setError(`Failed to load dataset stats. Is the backend running? (${e.message})`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
    const t = setInterval(fetchStats, 10000)
    return () => clearInterval(t)
  }, [])

  const handleUpload = async (e) => {
    e.preventDefault()
    if (!className.trim()) {
      setMessage({ type: 'err', text: 'Please enter a class name (e.g. "leaf_rust").' })
      return
    }
    if (files.length === 0) {
      setMessage({ type: 'err', text: 'Please select at least one image.' })
      return
    }
    setUploading(true)
    setUploadProgress(0)
    setMessage(null)
    try {
      const res = await uploadDatasetImages(className.trim(), files, setUploadProgress)
      setMessage({
        type: 'ok',
        text: `Saved ${res.saved.length} file(s) into '${res.class}' (${res.total_in_class} total). ${res.skipped.length ? `${res.skipped.length} skipped.` : ''}`,
      })
      setFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
      await fetchStats()
    } catch (err) {
      setMessage({ type: 'err', text: `Upload failed: ${err.message}` })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (datasetName, clsName) => {
    if (datasetName !== 'user_uploads') return
    try {
      await deleteDatasetClass(clsName)
      setMessage({ type: 'ok', text: `Deleted class '${clsName}'.` })
      await fetchStats()
    } catch (err) {
      setMessage({ type: 'err', text: `Delete failed: ${err.message}` })
    }
  }

  if (loading) {
    return (
      <div className="p-6 text-center" style={{ color: 'var(--text-muted)' }}>Loading dataset stats…</div>
    )
  }

  if (error) {
    return (
      <div className="p-6 rounded-xl text-sm"
           style={{ background: 'color-mix(in srgb, #ef4444 10%, transparent)', border: '1px solid #ef4444', color: '#ef4444' }}>
        {error}
      </div>
    )
  }

  const totalImages = data.datasets.reduce((a, d) => a + (d.total_images || 0), 0)
  const totalClasses = data.datasets.reduce((a, d) => a + (d.classes?.length || 0), 0)
  const totalBytes = data.datasets.reduce((a, d) => a + (d.total_bytes || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dataset Collector</h2>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
          View existing datasets and contribute labeled images for future training runs.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Datasets" value={data.datasets.length} color="#3b82f6" />
        <StatCard label="Total Classes" value={totalClasses} color="#22c55e" />
        <StatCard label="Total Images" value={totalImages.toLocaleString()} color="var(--accent)" />
      </div>
      <p className="text-xs" style={{ color: 'var(--text-faint)' }}>
        Disk usage: {(totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB · Root: <code>{data.root}</code>
      </p>

      {/* Upload form */}
      <div className="rounded-xl p-5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <h3 className="text-lg font-semibold mb-3" style={{ color: 'var(--text-primary)' }}>Contribute Images</h3>
        <p className="text-xs mb-4" style={{ color: 'var(--text-muted)' }}>
          Images land under <code>datasets/user_uploads/&lt;class_name&gt;/</code> and become available
          to the next training matrix run (add <code>user_uploads</code> to a config's <code>datasets</code> list).
        </p>
        <form onSubmit={handleUpload} className="space-y-3">
          <div>
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Class Name</label>
            <input
              type="text"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="e.g. leaf_rust, healthy_wheat"
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--bg-tertiary)',
                border: '1px solid var(--border)',
                color: 'var(--text-primary)',
              }}
            />
          </div>
          <div>
            <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Images (multiple)</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => setFiles(Array.from(e.target.files || []))}
              className="w-full mt-1 text-sm"
              style={{ color: 'var(--text-primary)' }}
            />
            {files.length > 0 && (
              <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
                {files.length} file(s) selected ({(files.reduce((a, f) => a + f.size, 0) / (1024 * 1024)).toFixed(1)} MB)
              </p>
            )}
          </div>
          {uploading && (
            <div className="w-full rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)', height: '6px' }}>
              <div style={{ width: `${uploadProgress}%`, height: '100%', background: 'var(--accent)', transition: 'width .2s' }} />
            </div>
          )}
          <button
            type="submit"
            disabled={uploading}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
            style={{ background: 'var(--accent)', color: '#000' }}
          >
            {uploading ? `Uploading ${uploadProgress}%…` : 'Upload Images'}
          </button>
        </form>
        {message && (
          <div className="mt-3 text-xs px-3 py-2 rounded-lg"
               style={{
                 background: message.type === 'ok'
                   ? 'color-mix(in srgb, #22c55e 15%, transparent)'
                   : 'color-mix(in srgb, #ef4444 15%, transparent)',
                 color: message.type === 'ok' ? '#22c55e' : '#ef4444',
               }}>
            {message.text}
          </div>
        )}
      </div>

      {/* Datasets breakdown */}
      <div className="space-y-4">
        {data.datasets.map((ds) => (
          <div key={ds.name} className="rounded-xl p-4"
               style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {ds.name}
                  {ds.writable && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'color-mix(in srgb, var(--accent) 20%, transparent)', color: 'var(--accent)' }}>
                      writable
                    </span>
                  )}
                  {ds.source === 'huggingface' && (
                    <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full"
                          style={{ background: 'color-mix(in srgb, #FFD21E 20%, transparent)', color: '#FFD21E' }}>
                      🤗 HuggingFace
                    </span>
                  )}
                </h3>
                {ds.url ? (
                  <a href={ds.url} target="_blank" rel="noreferrer"
                     className="text-[10px] underline" style={{ color: 'var(--text-faint)' }}>
                    {ds.path}
                  </a>
                ) : (
                  <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>{ds.path}</p>
                )}
              </div>
              <div className="text-right">
                <p className="text-sm font-bold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                  {(ds.total_images || 0).toLocaleString()} images
                </p>
                <p className="text-[10px]" style={{ color: 'var(--text-faint)' }}>
                  {(ds.classes?.length || 0)} classes · {((ds.total_bytes || 0) / (1024 * 1024)).toFixed(1)} MB
                </p>
              </div>
            </div>
            {(!ds.classes || ds.classes.length === 0) ? (
              <p className="text-xs italic" style={{ color: 'var(--text-faint)' }}>
                {ds.source === 'huggingface'
                  ? <>Hosted on HuggingFace. Pull locally with <code>python scripts/fetch_data.py --only {ds.name}</code></>
                  : (ds.writable ? 'No images yet. Upload some above to get started.' : 'No images.')}
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                {ds.classes.map((cls) => (
                  <ClassRow
                    key={cls.name}
                    cls={cls}
                    dataset={ds}
                    onDelete={handleDelete}
                    deletable={ds.writable}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
