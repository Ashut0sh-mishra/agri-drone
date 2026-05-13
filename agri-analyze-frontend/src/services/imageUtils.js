/**
 * Image utility functions for AgriAnalyze frontend
 * - Format conversion (HEIC, BMP, WebP → JPEG)
 * - Camera capture
 * - YouTube frame extraction placeholder
 */

/**
 * Convert any image file to JPEG Blob for API upload.
 * Handles jpg, png, gif, bmp, webp natively via canvas.
 * HEIC is converted by drawing to canvas (browser-dependent).
 * @param {File} file - Input image file
 * @returns {Promise<File>} - JPEG File object
 */
export async function convertToJpeg(file) {
  // Already JPEG — return as-is
  if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d')
      // White background for transparency (PNG/GIF)
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(url)
          if (!blob) {
            reject(new Error('Failed to convert image'))
            return
          }
          const name = file.name.replace(/\.[^.]+$/, '.jpg')
          resolve(new File([blob], name, { type: 'image/jpeg' }))
        },
        'image/jpeg',
        0.92
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(url)
      // If browser can't decode (e.g. HEIC on non-Safari), return original
      // and let the backend handle it
      resolve(file)
    }

    img.src = url
  })
}

/**
 * Capture a snapshot from a video element as a JPEG File.
 * @param {HTMLVideoElement} video
 * @returns {Promise<File>}
 */
export function captureVideoFrame(video) {
  return new Promise((resolve, reject) => {
    if (!video || video.readyState < 2) {
      reject(new Error('Video not ready'))
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to capture frame'))
          return
        }
        const name = `camera_${Date.now()}.jpg`
        resolve(new File([blob], name, { type: 'image/jpeg' }))
      },
      'image/jpeg',
      0.92
    )
  })
}

/**
 * Sample disease images for "Try sample" feature.
 * Uses images from the backend's test dataset.
 */
export const SAMPLE_IMAGES = [
  { label: 'Yellow Rust', url: '/samples/wheat_yellow_rust.jpg', crop: 'wheat' },
  { label: 'Black Rust', url: '/samples/wheat_black_rust.jpg', crop: 'wheat' },
  { label: 'Brown Rust', url: '/samples/wheat_brown_rust.jpg', crop: 'wheat' },
  { label: 'Leaf Blight', url: '/samples/wheat_leaf_blight.jpg', crop: 'wheat' },
  { label: 'Blast', url: '/samples/wheat_blast.jpg', crop: 'wheat' },
  { label: 'Powdery Mildew', url: '/samples/wheat_powdery_mildew.jpg', crop: 'wheat' },
  { label: 'Healthy Wheat', url: '/samples/healthy_wheat.jpg', crop: 'wheat' },
]
