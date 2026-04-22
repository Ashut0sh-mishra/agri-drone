/**
 * CameraCapture - In-browser webcam / phone camera snapshot UI.
 *
 * Opens `getUserMedia`, streams to a hidden <video>, and on "Capture" freezes
 * a frame into a File suitable for the /detect endpoint.
 *
 * Props:
 *   onCapture(file: File) - invoked when the user takes the snapshot
 *   onClose()             - invoked when the modal is dismissed
 *
 * @component
 */
import React, { useRef, useState, useCallback, useEffect } from 'react'
import { captureVideoFrame } from '../services/imageUtils'

/**
 * Camera capture component.
 * Opens webcam/phone camera, takes a snapshot, returns a File.
 */
export default function CameraCapture({ onCapture, onClose }) {
  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState(null)
  const [facingMode, setFacingMode] = useState('environment') // rear camera on phones

  const startCamera = useCallback(async (facing) => {
    setError(null)
    setReady(false)
    // Stop existing stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop())
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 960 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
        setReady(true)
      }
    } catch (err) {
      setError('Camera access denied or unavailable. Check browser permissions.')
    }
  }, [])

  useEffect(() => {
    startCamera(facingMode)
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleCapture = async () => {
    try {
      const file = await captureVideoFrame(videoRef.current)
      // Stop camera after capture
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop())
      }
      onCapture(file)
    } catch (err) {
      setError('Failed to capture photo. Try again.')
    }
  }

  const switchCamera = () => {
    const next = facingMode === 'environment' ? 'user' : 'environment'
    setFacingMode(next)
    startCamera(next)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div className="relative w-full max-w-lg mx-4 rounded-xl overflow-hidden" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <h3 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Camera Capture</h3>
          <button onClick={onClose} className="text-lg leading-none px-2" style={{ color: 'var(--text-muted)' }}>✕</button>
        </div>

        {/* Video feed */}
        <div className="relative" style={{ aspectRatio: '4/3', background: '#000' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {!ready && !error && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        {error && (
          <div className="px-4 py-3" style={{ background: 'rgba(239,68,68,0.1)' }}>
            <p className="text-xs" style={{ color: '#ef4444' }}>{error}</p>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4 px-4 py-4">
          <button
            onClick={switchCamera}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
            title="Switch camera"
          >
            🔄 Flip
          </button>
          <button
            onClick={handleCapture}
            disabled={!ready}
            className="px-8 py-3 rounded-full text-white font-bold text-sm disabled:opacity-40"
            style={{ background: 'var(--accent)' }}
          >
            📸 Capture
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-semibold"
            style={{ border: '1px solid var(--border)', color: 'var(--text-muted)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
