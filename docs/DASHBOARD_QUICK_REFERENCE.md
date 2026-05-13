# Dashboard Developer Quick Reference

Cheat sheet for working with the AgriAnalyze AI Dashboard.

## Installation (One-Time)

```bash
# Backend setup (in project root)
python -m venv venv
venv\Scripts\activate  # Windows: venv\Scripts\activate
pip install -e .

# Frontend setup
cd dashboard
npm install
```

## Running the Dashboard

### Quick Start (2 Commands)
```bash
# Terminal 1
uvicorn src.agrianalyze.api.app:app --reload --port 8000

# Terminal 2
cd dashboard && npm run dev
```

Then visit: `http://localhost:5173`

## File Quick Reference

| Component | Location | Purpose |
|-----------|----------|---------|
| Main App | `src/App.jsx` | State management, routing |
| Upload | `src/components/UploadBox.jsx` | Image upload |
| Results | `src/components/ResultViewer.jsx` | Display detections |
| Table | `src/components/DetectionTable.jsx` | Detection list |
| Stats | `src/components/StatsCards.jsx` | Metrics display |
| API | `src/services/api.js` | Backend calls |
| Config | `tailwind.config.js` | Theme colors |
| Styles | `src/index.css` | Global styles |

## Common Tasks

### Change Backend Port
```bash
# Use different port
uvicorn src.agrianalyze.api.app:app --reload --port 9000

# Update .env in dashboard/
VITE_API_URL=http://localhost:9000
```

### Change Frontend Port
```bash
npm run dev -- --port 5174
```

### Update Color Scheme
```javascript
// tailwind.config.js
colors: {
  'neon-blue': '#0ea5e9',    // Change to your color
  'neon-purple': '#a855f7',  // Change to your color
  'neon-cyan': '#06b6d4'     // Change to your color
}
```

### Add New Detection Class
```javascript
// ResultViewer.jsx
const colors = {
  'weed': '#ff6b6b',
  'disease': '#ffa500',
  'pest': '#ff1493',
  'anomaly': '#00d4ff',
  'new_class': '#your-color'  // Add here
}
```

### Modify Stats Cards
```javascript
// StatsCards.jsx - add new stat
const stats = [
  {
    label: 'New Metric',
    value: someValue,
    icon: SomeIcon,
    color: 'from-neon-blue to-cyan-500',
    bgColor: 'bg-neon-blue/20'
  }
]
```

### Change Model Confidence Threshold
```javascript
// App.jsx - detectObjects call
const response = await api.detectObjects(file, useMockModel);
// Change in detection endpoint (app.py): confidence_threshold=0.5
```

## API Endpoints

### POST /detect
```javascript
// Send image
const formData = new FormData()
formData.append('file', file)
formData.append('use_mock', true)

const response = await axios.post('http://localhost:8000/detect', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
```

### GET /health
```javascript
const response = await axios.get('http://localhost:8000/health')
// Returns: { status: 'ok', dry_run: bool, test_fluid_only: bool }
```

### GET /system
```javascript
const response = await axios.get('http://localhost:8000/system')
// Returns: { version, dry_run, test_fluid_only, device }
```

## Component Props

### UploadBox
```jsx
<UploadBox
  onFileSelect={(file) => handleDetection(file)}
  isLoading={false}
  useMockModel={true}
  onToggleMock={() => setUseMockModel(!useMockModel)}
/>
```

### ResultViewer
```jsx
<ResultViewer
  detections={detections}
  originalImage={imageBase64}
  processingTime={234.5}
/>
```

### DetectionTable
```jsx
<DetectionTable detections={detections} />
```

### StatsCards
```jsx
<StatsCards
  detections={detections}
  processingTime={processingTime}
/>
```

## State Management Pattern

```javascript
// App.jsx - Key state
const [detections, setDetections] = useState(null)
const [originalImage, setOriginalImage] = useState(null)
const [isLoading, setIsLoading] = useState(false)
const [processingTime, setProcessingTime] = useState(0)
const [error, setError] = useState(null)
const [useMockModel, setUseMockModel] = useState(true)
const [detectionHistory, setDetectionHistory] = useState([])
```

## Export Functions

### Download JSON
```javascript
const downloadJSON = () => {
  const data = JSON.stringify({
    timestamp: new Date().toISOString(),
    processingTime,
    detections
  }, null, 2)
  
  const blob = new Blob([data], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `detections-${Date.now()}.json`
  a.click()
}
```

### Download CSV
```javascript
const downloadCSV = () => {
  let csv = 'Class,Confidence,X1,Y1,X2,Y2,Area\n'
  detections.forEach(det => {
    const area = (det.x2 - det.x1) * (det.y2 - det.y1)
    csv += `${det.class_name},${det.confidence.toFixed(4)},${det.x1},${det.y1},${det.x2},${det.y2},${area}\n`
  })
  
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `detections-${Date.now()}.csv`
  a.click()
}
```

## Debugging

### Check API Connection
```bash
# In terminal
curl http://localhost:8000/health

# Should return
# {"status":"ok","dry_run":true,"test_fluid_only":true}
```

### Monitor Network Requests
```javascript
// In browser console
// Open DevTools (F12) → Network tab
// Upload image and watch request/response
```

### Check Backend Logs
```bash
# Terminal running FastAPI should show:
INFO:     127.0.0.1:51234 - "POST /detect HTTP/1.1" 200 OK
```

### Enable Debug Logging
```python
# In app.py
import logging
logging.basicConfig(level=logging.DEBUG)
```

## Performance Tips

### Make Detection Faster
```javascript
// Use mock model
useMockModel={true}

// Or resize image before upload
// Or use GPU: MODEL_DEVICE=cuda
```

### Make UI Smoother
```javascript
// Remove browser extensions
// Close other tabs
// Use modern browser (Chrome/Edge)
```

### Improve Load Time
```bash
# Optimize build
npm run build

# Serve static files
npm run preview
```

## Keyboard Shortcuts (In Browser)

- `F12` - Open DevTools
- `Ctrl+Shift+J` - Open Console
- `Ctrl+Shift+E` - Open Network tab
- `Ctrl+R` - Reload page
- `Ctrl+Shift+R` - Hard reload (clear cache)

## TypeScript (Optional Enhancement)

To add TypeScript:
```bash
npm install --save-dev typescript @types/react @types/react-dom

# Rename .jsx to .tsx
# Add tsconfig.json
```

## Testing

### Manual Test Checklist
- [ ] Upload image with drag & drop
- [ ] Upload image with click
- [ ] See image preview
- [ ] Click "Run AI Detection"
- [ ] See results appear
- [ ] See stats update
- [ ] Sort table columns
- [ ] Download JSON
- [ ] Download CSV
- [ ] Toggle mock model
- [ ] View history
- [ ] API status shows correct state

### Test with curl
```bash
# Test detection endpoint
curl -X POST http://localhost:8000/detect \
  -F "file=@test_image.jpg" \
  -F "use_mock=true"

# Test health
curl http://localhost:8000/health

# Test system info
curl http://localhost:8000/system
```

## Dependencies Overview

```json
{
  "react": "18.x",           // UI framework
  "react-dom": "18.x",       // DOM rendering
  "vite": "5.x",             // Build tool
  "tailwindcss": "3.x",      // Styling
  "framer-motion": "10.x",   // Animations
  "axios": "1.x",            // HTTP client
  "lucide-react": "0.x"      // Icons
}
```

## Common Errors & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| "API Disconnected" | Backend not running | Start: `uvicorn ... --port 8000` |
| "Failed to decode image" | Bad file format | Use JPG, PNG, or GIF |
| "Port 5173 in use" | Another process | Use `npm run dev -- --port 5174` |
| "Module not found" | Missing node_modules | Run `npm install` |
| "Tailwind not working" | Config not loaded | Restart dev server |
| "Slow detection" | CPU inference | Use mock model or GPU |

## Building for Production

```bash
# Build frontend
cd dashboard
npm run build
# Creates dist/ folder

# Serve frontend
npm run preview
# Or upload dist/ to web server

# Run backend
uvicorn src.agrianalyze.api.app:app --host 0.0.0.0 --port 8000 --workers 4
```

## Environment Variables Checklist

### Backend (.env in root)
```env
MODEL_CHECKPOINT=models/yolov8n-seg.pt
MODEL_DEVICE=auto
DRY_RUN=true
SAFE_TEST_FLUID_ONLY=true
LOG_LEVEL=INFO
```

### Frontend (dashboard/.env)
```env
VITE_API_URL=http://localhost:8000
```

## Resources & Links

- **React Docs**: https://react.dev
- **Vite Guide**: https://vitejs.dev
- **Tailwind CSS**: https://tailwindcss.com
- **Framer Motion**: https://www.framer.com/motion
- **Axios GitHub**: https://github.com/axios/axios
- **FastAPI Docs**: https://fastapi.tiangolo.com

## Useful npm Commands

```bash
# Development
npm run dev              # Start dev server with HMR

# Production
npm run build            # Build for production
npm run preview          # Preview production build locally

# Maintenance
npm install              # Install dependencies
npm update               # Update dependencies
npm audit                # Check security issues
npm outdated             # See outdated packages
```

## Git Workflow

```bash
# Check changes
git status

# Stage changes
git add .

# Commit with message
git commit -m "Add dashboard feature"

# Push to remote
git push origin main

# View log
git log --oneline
```

## Useful Commands Summary

```bash
# Full setup from scratch
rm -rf venv dashboard/node_modules
python -m venv venv
venv\Scripts\activate
pip install -e .
cd dashboard
npm install

# Start both servers
# Terminal 1:
uvicorn src.agrianalyze.api.app:app --reload --port 8000

# Terminal 2:
cd dashboard && npm run dev

# Build for production
npm run build

# Clean up
rm -rf node_modules dist
npm install
npm run build
```

## Next Level Customizations

### Add Authentication
```javascript
// Add login screen before dashboard
// Store JWT in localStorage
// Add auth header to API requests
```

### Add Database
```python
# Store detection results in SQLAlchemy
# Query historical detections
# Build analytics
```

### Add Analytics
```javascript
// Track user actions
// Monitor detection patterns
// Generate reports
```

### Add Real-Time Updates
```javascript
// Use WebSockets
// Stream detection results
// Live collaboration
```

---

**Quick Reference Version 1.0 - Keep this handy!**
