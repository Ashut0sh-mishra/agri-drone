# services/ — API Client & Utility Functions

This folder contains all code that talks to the outside world (backend API, browser APIs).
**No React or JSX here** — pure JavaScript functions that components can import.

## Files

### `api.js` — Backend API Client

All HTTP calls to the FastAPI backend.

| Export | What it does |
|--------|-------------|
| `findAPI()` | Auto-discovers the backend by scanning ports 9000→8000→8080… |
| `getApiUrl()` | Returns the currently active backend URL |
| `checkHealth()` | GET `/health` — checks if backend is alive |
| `runDetection(file)` | POST `/detect` — uploads image, returns disease diagnosis |
| `pollLlavaResult(taskId)` | GET `/llava-result/:id` — polls for async LLaVA result |
| `runBatchDetection(files)` | POST `/batch-detect` — detect on multiple images at once |
| `runVideoDetection(file)` | POST `/video-detect` — analyse a video file frame by frame |

**How to add a new API call:**
```js
// In api.js — follow the existing pattern:
export const myNewCall = async (param) => {
  const response = await api.post('/my-endpoint', { param })
  return response.data
}
```

### `imageUtils.js` — Image Preprocessing Utilities

Helper functions for image handling in the browser before upload.

| Export | What it does |
|--------|-------------|
| `convertToJpeg(file)` | Converts PNG/WebP/HEIC to JPEG (backend prefers JPEG) |
| `SAMPLE_IMAGES` | Array of built-in sample image paths for demo purposes |

## Error Handling

All API functions throw on network errors. Catch in the calling component:
```js
try {
  const result = await runDetection(file)
} catch (err) {
  // err.response.data has the FastAPI error detail
  console.error(err.response?.data?.detail ?? err.message)
}
```
