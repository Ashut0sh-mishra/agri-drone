import React, { useRef, useEffect } from 'react'

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6',
]

function getColor(index) {
  return COLORS[index % COLORS.length]
}

export default function DetectionCanvas({ imageUrl, detections = [], width, height }) {
  const canvasRef = useRef(null)
  const imgRef = useRef(null)
  const containerRef = useRef(null)

  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      imgRef.current = img
      draw()
    }
    img.src = imageUrl
  }, [imageUrl, detections])

  const draw = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    const container = containerRef.current
    const displayW = container ? container.clientWidth : img.naturalWidth
    const displayH = (displayW / img.naturalWidth) * img.naturalHeight

    canvas.width = displayW
    canvas.height = displayH

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw the image
    ctx.drawImage(img, 0, 0, displayW, displayH)

    // Scale factor from original image to canvas
    const scaleX = displayW / img.naturalWidth
    const scaleY = displayH / img.naturalHeight

    // Draw bounding boxes
    detections.forEach((det, i) => {
      const bbox = det.bbox || det
      const x1 = (bbox.x1 ?? bbox[0] ?? 0) * scaleX
      const y1 = (bbox.y1 ?? bbox[1] ?? 0) * scaleY
      const x2 = (bbox.x2 ?? bbox[2] ?? 0) * scaleX
      const y2 = (bbox.y2 ?? bbox[3] ?? 0) * scaleY
      const w = x2 - x1
      const h = y2 - y1

      const color = getColor(i)
      const confidence = det.confidence ? (det.confidence * 100).toFixed(0) : '?'
      const label = `${(det.class_name || det.class || 'Detection').replace(/_/g, ' ')} ${confidence}%`

      // Draw box
      ctx.strokeStyle = color
      ctx.lineWidth = 3
      ctx.strokeRect(x1, y1, w, h)

      // Semi-transparent fill
      ctx.fillStyle = color.replace(')', ', 0.1)').replace('rgb', 'rgba')
      // Convert hex to rgba for fill
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.08)`
      ctx.fillRect(x1, y1, w, h)

      // Label background
      ctx.font = 'bold 13px Inter, system-ui, sans-serif'
      const textMetrics = ctx.measureText(label)
      const textH = 22
      const textW = textMetrics.width + 12
      const labelY = Math.max(y1 - textH, 0)

      ctx.fillStyle = color
      ctx.fillRect(x1, labelY, textW, textH)

      // Label text
      ctx.fillStyle = '#ffffff'
      ctx.fillText(label, x1 + 6, labelY + 15)

      // Corner accents
      const cornerLen = Math.min(20, w / 4, h / 4)
      ctx.strokeStyle = color
      ctx.lineWidth = 4
      // Top-left
      ctx.beginPath()
      ctx.moveTo(x1, y1 + cornerLen)
      ctx.lineTo(x1, y1)
      ctx.lineTo(x1 + cornerLen, y1)
      ctx.stroke()
      // Top-right
      ctx.beginPath()
      ctx.moveTo(x2 - cornerLen, y1)
      ctx.lineTo(x2, y1)
      ctx.lineTo(x2, y1 + cornerLen)
      ctx.stroke()
      // Bottom-left
      ctx.beginPath()
      ctx.moveTo(x1, y2 - cornerLen)
      ctx.lineTo(x1, y2)
      ctx.lineTo(x1 + cornerLen, y2)
      ctx.stroke()
      // Bottom-right
      ctx.beginPath()
      ctx.moveTo(x2 - cornerLen, y2)
      ctx.lineTo(x2, y2)
      ctx.lineTo(x2, y2 - cornerLen)
      ctx.stroke()
    })

    // Detection count badge
    if (detections.length > 0) {
      const badgeText = `${detections.length} detection${detections.length > 1 ? 's' : ''}`
      ctx.font = 'bold 12px Inter, system-ui, sans-serif'
      const bw = ctx.measureText(badgeText).width + 16
      ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
      ctx.roundRect(8, 8, bw, 26, 6)
      ctx.fill()
      ctx.fillStyle = '#22c55e'
      ctx.fillText(badgeText, 16, 26)
    }
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-lg"
        style={{ display: 'block' }}
      />
    </div>
  )
}
