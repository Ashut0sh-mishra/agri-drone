import axios from 'axios'

// ---------------------------------------------------------------------------
// Multi-port API discovery
// ---------------------------------------------------------------------------
const PORTS = [9000, 8000, 8080, 8001, 8888, 5000]

// In production (Vercel), VITE_API_URL points to the Render backend.
// In dev, fall back to localhost auto-discovery.
const PRODUCTION_API = import.meta.env.VITE_API_URL || ''

let currentApiUrl = PRODUCTION_API || localStorage.getItem('api_url') || 'http://localhost:9000'

export const findAPI = async () => {
  // If a production API URL is set, skip local discovery
  if (PRODUCTION_API) {
    currentApiUrl = PRODUCTION_API
    api.defaults.baseURL = PRODUCTION_API
    return PRODUCTION_API
  }
  for (const port of PORTS) {
    try {
      const r = await fetch(
        `http://localhost:${port}/health`,
        { signal: AbortSignal.timeout(1000) }
      )
      if (r.ok) {
        const data = await r.json()
        // Verify this is actually the agrianalyze backend
        if (data.status !== 'ok') continue
        const apiUrl = `http://localhost:${port}`
        currentApiUrl = apiUrl
        localStorage.setItem('api_port', port)
        localStorage.setItem('api_url', apiUrl)
        api.defaults.baseURL = apiUrl
        return apiUrl
      }
    } catch {}
  }
  api.defaults.baseURL = currentApiUrl
  return currentApiUrl
}

export const getApiUrl = () => currentApiUrl
export const API_URL = currentApiUrl

const api = axios.create({
  baseURL: currentApiUrl,
  timeout: 60000,
})

/**
 * Run detection on an image file
 * @param {File} imageFile - The image file to analyze
 * @param {Object} options - Detection options
 * @param {number} options.confidence_threshold - Confidence threshold (0.0-1.0)
 * @param {boolean} options.include_image - Include annotated image in response
 * @param {string} options.crop_type - Crop type ("wheat" or "rice")
 * @param {boolean} options.use_llava - Enable LLaVA vision analysis
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise} Detection results
 */
export const runDetection = async (imageFile, options = {}) => {
  const {
    confidence_threshold = 0.3,
    include_image = true,
    crop_type = 'wheat',
    use_llava = false,
    area_acres = 1,
    growth_stage = 'unknown',
    onProgress = null,
  } = options

  const formData = new FormData()
  formData.append('file', imageFile)
  formData.append('confidence_threshold', confidence_threshold)
  formData.append('include_image', include_image)
  formData.append('crop_type', crop_type)
  formData.append('use_llava', use_llava)
  formData.append('area_acres', area_acres)
  formData.append('growth_stage', growth_stage)

  try {
    const response = await api.post('/detect', formData, {
      onUploadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress({ type: 'upload', progress: percentCompleted })
        }
      },
      onDownloadProgress: (progressEvent) => {
        if (onProgress) {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          )
          onProgress({ type: 'download', progress: percentCompleted })
        }
      },
    })

    return response.data
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data?.detail || 'Detection failed')
    } else if (error.request) {
      throw new Error('No response from server. Is the API running?')
    } else {
      throw new Error(error.message)
    }
  }
}

/**
 * Poll for background LLaVA analysis result
 * @param {string} imgHash - Image hash from detection response
 * @param {number} maxRetries - Max polling attempts (default: 30 = ~60sec)
 * @param {number} intervalMs - Polling interval in ms (default: 2000)
 * @returns {Promise} LLaVA analysis result or null
 */
export const pollLlavaResult = async (imgHash, maxRetries = 30, intervalMs = 2000) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await api.get(`/detect/llava-status/${imgHash}`)
      if (response.data.status === 'complete') {
        return {
          llava_analysis: response.data.llava_analysis,
          llm_validation: response.data.llm_validation,
        }
      }
      if (response.data.status === 'not_found') {
        return null
      }
      // status === 'pending' — wait and retry
      await new Promise(resolve => setTimeout(resolve, intervalMs))
    } catch {
      return null
    }
  }
  return null
}

/**
 * Check detector health and status
 * @returns {Promise} Health status
 */
export const checkHealth = async () => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    throw new Error('Failed to check detector health')
  }
}

/**
 * Reset the detector
 * @returns {Promise} Reset status
 */
export const resetDetector = async () => {
  try {
    const response = await api.post('/api/detect/reset')
    return response.data
  } catch (error) {
    throw new Error('Failed to reset detector')
  }
}

// ─── ML Dashboard APIs ───

export const getMLMetrics = async () => {
  const response = await api.get('/api/ml/metrics')
  return response.data
}

export const getModelInfo = async () => {
  const response = await api.get('/api/ml/model-info')
  return response.data
}

export const getTrainingLogs = async () => {
  const response = await api.get('/api/ml/logs')
  return response.data
}

export const getMatrixProgress = async () => {
  const response = await api.get('/api/ml/matrix')
  return response.data
}

export const getTrainingImageUrl = (imageName) => {
  return `${currentApiUrl}/api/ml/training-images/${imageName}`
}

export const reloadModel = async () => {
  const response = await api.post('/api/model/reload')
  return response.data
}

// ─── Detection History / Reports ───

export const getDetectionHistory = async () => {
  const response = await api.get('/api/reports/history')
  return response.data
}

export const clearDetectionHistory = async () => {
  const response = await api.delete('/api/reports/history')
  return response.data
}

// ─── Activity Feed ───

export const getActivityFeed = async () => {
  const response = await api.get('/api/activity/feed')
  return response.data
}

// ─── Training Pipeline (Colab → UI) ───

export const getTrainingStatus = async () => {
  const response = await api.get('/api/training/status')
  return response.data
}

export const getTrainingArtifacts = async () => {
  const response = await api.get('/api/training/artifacts')
  return response.data
}

// ─── Dataset Collector ───

export const getDatasetStats = async () => {
  const response = await api.get('/api/dataset/stats')
  return response.data
}

export const uploadDatasetImages = async (className, files, onProgress = null) => {
  const form = new FormData()
  form.append('class_name', className)
  for (const f of files) form.append('files', f)
  const response = await api.post('/api/dataset/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total))
      }
    },
  })
  return response.data
}

export const deleteDatasetClass = async (className) => {
  const response = await api.delete(`/api/dataset/class/${encodeURIComponent(className)}`)
  return response.data
}

export default api

// ─── Batch Detection ───

/**
 * Run batch detection on multiple images in a single request
 * @param {File[]} imageFiles - Array of image files
 * @param {Object} options - Detection options
 * @param {Function} options.onProgress - Progress callback
 * @returns {Promise} Batch results with summary
 */
export const runBatchDetection = async (imageFiles, options = {}) => {
  const {
    confidence_threshold = 0.3,
    crop_type = 'wheat',
    area_acres = 1,
    growth_stage = 'unknown',
    onProgress = null,
  } = options

  const formData = new FormData()
  imageFiles.forEach((file) => formData.append('files', file))
  formData.append('confidence_threshold', confidence_threshold)
  formData.append('crop_type', crop_type)
  formData.append('area_acres', area_acres)
  formData.append('growth_stage', growth_stage)

  const response = await api.post('/detect/batch', formData, {
    timeout: 300000, // 5 min for large batches
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress({ type: 'upload', progress: pct })
      }
    },
    onDownloadProgress: (progressEvent) => {
      if (onProgress) {
        const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded))
        onProgress({ type: 'download', progress: pct })
      }
    },
  })
  return response.data
}

/**
 * Run detection on a video file
 * @param {File} videoFile - The video file
 * @param {Object} options - Options
 * @returns {Promise} Frame-by-frame results with summary
 */
export const runVideoDetection = async (videoFile, options = {}) => {
  const {
    confidence_threshold = 0.3,
    crop_type = 'wheat',
    frame_interval = 30,
    max_frames = 20,
    onProgress = null,
  } = options

  const formData = new FormData()
  formData.append('file', videoFile)
  formData.append('confidence_threshold', confidence_threshold)
  formData.append('crop_type', crop_type)
  formData.append('frame_interval', frame_interval)
  formData.append('max_frames', max_frames)

  const response = await api.post('/detect/video', formData, {
    timeout: 600000, // 10 min for video
    onUploadProgress: (progressEvent) => {
      if (onProgress) {
        const pct = Math.round((progressEvent.loaded * 100) / progressEvent.total)
        onProgress({ type: 'upload', progress: pct })
      }
    },
    onDownloadProgress: (progressEvent) => {
      if (onProgress) {
        const pct = Math.round((progressEvent.loaded * 100) / (progressEvent.total || progressEvent.loaded))
        onProgress({ type: 'download', progress: pct })
      }
    },
  })
  return response.data
}
