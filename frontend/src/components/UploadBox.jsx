/**
 * UploadBox - Drag-and-drop / file-picker entry point for image analysis.
 *
 * Accepts a single or multiple images, lets the user pick crop type, area
 * (acres) and growth stage, and forwards selection to the parent via
 * callbacks.
 *
 * Props:
 *   onFileSelect(file)       - single-file analysis
 *   onMultiFileSelect(files) - batch analysis
 *   onCameraClick()          - open the CameraCapture modal
 *   selectedCrop, setSelectedCrop, areaAcres, setAreaAcres,
 *   growthStage, setGrowthStage, disabled
 *
 * @component
 */
import React, { useRef, useState } from 'react'

const ACCEPTED_FORMATS = 'image/jpeg,image/jpg,image/png,image/gif,image/bmp,image/webp,image/heic,image/heif,image/*'

export default function UploadBox({ onFileSelect, onMultiFileSelect, onCameraClick, selectedCrop, setSelectedCrop, areaAcres, setAreaAcres, growthStage, setGrowthStage, disabled }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  const onDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setDragging(e.type === 'dragenter' || e.type === 'dragover')
  }

  const onDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    if (disabled) return
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/') || /\.(heic|heif|bmp|webp)$/i.test(f.name))
    if (files.length > 1 && onMultiFileSelect) {
      onMultiFileSelect(files)
    } else if (files.length === 1) {
      onFileSelect(files[0])
    }
  }

  const onChange = (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 1 && onMultiFileSelect) {
      onMultiFileSelect(files)
    } else if (files.length === 1) {
      onFileSelect(files[0])
    }
    // Reset input so same file can be re-selected
    e.target.value = ''
  }

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-lg mx-auto py-6">
      {/* Drop zone */}
      <div
        onDragEnter={onDrag}
        onDragOver={onDrag}
        onDragLeave={onDrag}
        onDrop={onDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className="w-full border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-4 cursor-pointer"
        style={{
          borderColor: dragging ? 'var(--accent)' : 'var(--border)',
          background: dragging ? 'var(--upload-hover-bg)' : 'var(--bg-card)',
          boxShadow: 'var(--card-shadow)',
          transform: dragging ? 'scale(1.02)' : 'scale(1)',
          transition: 'all 0.3s ease',
          opacity: disabled ? 0.4 : 1,
          pointerEvents: disabled ? 'none' : 'auto',
        }}
        onMouseEnter={(e) => {
          if (!dragging) {
            e.currentTarget.style.borderColor = 'var(--accent)'
            e.currentTarget.style.background = 'var(--upload-hover-bg)'
          }
        }}
        onMouseLeave={(e) => {
          if (!dragging) {
            e.currentTarget.style.borderColor = 'var(--border)'
            e.currentTarget.style.background = 'var(--bg-card)'
          }
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_FORMATS}
          multiple
          onChange={onChange}
          className="hidden"
          disabled={disabled}
        />

        {/* Upload icon */}
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center"
          style={{
            background: 'color-mix(in srgb, var(--accent) 10%, transparent)',
            border: '1px solid color-mix(in srgb, var(--accent) 20%, transparent)',
          }}
        >
          <svg
            className="w-8 h-8"
            style={{ color: 'var(--accent)' }}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
            />
          </svg>
        </div>

        <div className="text-center">
          <p className="font-semibold text-base" style={{ color: 'var(--text-primary)' }}>
            Drop wheat / rice field photos here
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-faint)' }}>
            or click to browse &middot; JPG, PNG, WebP, HEIC, BMP, GIF &middot; Multiple files OK &middot; Max 10 MB each
          </p>
        </div>
      </div>

      {/* Camera button */}
      {onCameraClick && (
        <button
          onClick={(e) => { e.stopPropagation(); onCameraClick() }}
          disabled={disabled}
          className="px-5 py-2.5 rounded-lg text-sm font-semibold transition flex items-center gap-2 disabled:opacity-40"
          style={{ border: '1px solid var(--border)', color: 'var(--accent)' }}
        >
          <span>📷</span> Use Camera
        </button>
      )}

      {/* Crop selector */}
      <div className="flex gap-3 flex-wrap justify-center">
        {['wheat', 'rice', 'maize'].map((crop) => {
          const active = selectedCrop === crop
          return (
            <button
              key={crop}
              onClick={() => setSelectedCrop(crop)}
              className="px-6 py-2.5 rounded-lg text-sm font-bold tracking-wide border"
              style={{
                background: active ? 'var(--accent)' : 'transparent',
                borderColor: active ? 'var(--accent)' : 'var(--border)',
                color: active ? '#ffffff' : 'var(--accent)',
                boxShadow: active ? '0 4px 14px color-mix(in srgb, var(--accent) 30%, transparent)' : 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {crop.toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* Area + Stage row */}
      <div className="flex gap-3 flex-wrap justify-center items-center">
        {/* Field area */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Area (acres)</label>
          <input
            type="number"
            min="0.1"
            max="10000"
            step="0.5"
            value={areaAcres}
            onChange={(e) => setAreaAcres(Math.max(0.1, parseFloat(e.target.value) || 1))}
            className="w-20 text-center rounded-lg px-2 py-1.5 text-sm font-semibold outline-none"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          />
        </div>

        {/* Growth stage */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>Stage</label>
          <select
            value={growthStage}
            onChange={(e) => setGrowthStage(e.target.value)}
            className="rounded-lg px-2 py-1.5 text-sm font-semibold outline-none"
            style={{
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="unknown">Unknown</option>
            <option value="seedling">Seedling</option>
            <option value="tillering">Tillering</option>
            <option value="jointing">Jointing</option>
            <option value="booting">Booting</option>
            <option value="heading">Heading</option>
            <option value="flowering">Flowering</option>
            <option value="grain_fill">Grain Fill</option>
            <option value="ripening">Ripening</option>
          </select>
        </div>
      </div>
    </div>
  )
}
