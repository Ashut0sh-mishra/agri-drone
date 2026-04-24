# Dashboard Setup & Integration Guide

Complete guide for setting up and running the AgriDrone premium AI dashboard with the FastAPI backend.

## Quick Start (5 minutes)

### Prerequisites
- Node.js 16+ and npm installed
- Python 3.11+ with AgriDrone backend installed
- Two terminal windows

### Setup

**Terminal 1: Start FastAPI Backend**
```bash
cd d:/Projects/agri-drone
python -m venv venv
venv\Scripts\activate  # On macOS/Linux: source venv/bin/activate
pip install -e .

# Start the API server
uvicorn src.agridrone.api.app:app --reload --port 8000
```

**Terminal 2: Start React Dashboard**
```bash
cd d:/Projects/agri-drone/dashboard
npm install
npm run dev
```

Open your browser to `http://localhost:5173`

## Full Setup Guide

### Step 1: Install Backend Dependencies

```bash
cd d:/Projects/agri-drone

# Create Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install AgriDrone and dependencies
pip install -e .
```

### Step 2: Configure Backend

```bash
# Copy environment template
cp .env.example .env

# Edit .env if needed (usually defaults work fine)
```

### Step 3: Start Backend API

```bash
# With auto-reload for development
uvicorn src.agridrone.api.app:app --reload --port 8000

# Or for production
uvicorn src.agridrone.api.app:app --host 0.0.0.0 --port 8000 --workers 4
```

You should see output like:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete
```

Visit `http://localhost:8000/docs` to see interactive API documentation.

### Step 4: Install Dashboard Dependencies

```bash
cd dashboard
npm install
```

This installs:
- React 18
- Vite 5
- Tailwind CSS 3
- Framer Motion 10
- Axios
- Lucide React icons

Installation takes 2-3 minutes.

### Step 5: Configure Dashboard

```bash
# Copy environment template
cp .env.example .env

# Default .env content (usually doesn't need changes):
# VITE_API_URL=http://localhost:8000
```

### Step 6: Start Dashboard Dev Server

```bash
npm run dev
```

Output:
```
  ➜  Local:   http://localhost:5173/
  ➜  Press q to quit
```

Dashboard automatically opens in your browser.

## Architecture Overview

```
┌─────────────────────────────────────────┐
│   Browser (localhost:5173)              │
│   ┌─────────────────────────────────┐   │
│   │    React Dashboard UI           │   │
│   │  - Upload Box                   │   │
│   │  - Detection Viewer             │   │
│   │  - Stats Cards                  │   │
│   │  - Detection Table              │   │
│   └─────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │ HTTP/CORS
                   ▼
┌─────────────────────────────────────────┐
│   FastAPI Server (localhost:8000)       │
│   ┌─────────────────────────────────┐   │
│   │  POST /detect                   │   │
│   │  - Image upload (multipart)     │   │
│   │  - YOLOv8 inference             │   │
│   │  - JSON response                │   │
│   ├─────────────────────────────────┤   │
│   │  GET /health                    │   │
│   │  - API status check             │   │
│   ├─────────────────────────────────┤   │
│   │  GET /system                    │   │
│   │  - System info                  │   │
│   └─────────────────────────────────┘   │
└──────────────────┬──────────────────────┘
                   │ File I/O
                   ▼
         ┌──────────────────┐
         │  YOLOv8 Model    │
         │  CUDA/CPU        │
         └──────────────────┘
```

## API Endpoints Reference

### POST /detect
**Upload image for detection**

```bash
curl -X POST "http://localhost:8000/detect" \
  -F "file=@image.jpg" \
  -F "use_mock=false"
```

**Response:**
```json
{
  "detections": [
    {
      "class_name": "weed",
      "confidence": 0.92,
      "x1": 100,
      "y1": 150,
      "x2": 200,
      "y2": 250
    }
  ],
  "image": "data:image/jpeg;base64,...",
  "processing_time_ms": 234.5,
  "num_detections": 1,
  "filename": "image.jpg"
}
```

### GET /health
**Check API health status**

```bash
curl http://localhost:8000/health
```

**Response:**
```json
{
  "status": "ok",
  "dry_run": true,
  "test_fluid_only": true
}
```

### GET /system
**Get system information**

```bash
curl http://localhost:8000/system
```

**Response:**
```json
{
  "version": "1.0.0",
  "dry_run": true,
  "test_fluid_only": true,
  "device": "cpu"
}
```

## Dashboard Features

### Upload Section
- Drag & drop image upload
- Click to browse files
- Live preview
- File size validation
- Mock model toggle for testing

### Detection Results
- Processed image with bounding boxes
- Color-coded detections by class
- Confidence scores visible
- Processing time display

### Sortable Table
- Sort by class, confidence, area
- Color-coded class badges
- Animated progress bars
- Responsive design

### Statistics
- Total detection count
- Average confidence percentage  
- Processing time metrics
- Animated number transitions

### Data Export
- Download as JSON (full metadata)
- Download as CSV (spreadsheet)
- Timestamped filenames

### History
- Last 10 detection sessions
- Quick access to previous results
- Session summary with timestamps

## Development Workflow

### Making Changes

**Frontend Changes (React)**
```bash
# Changes hot-reload automatically
cd dashboard
npm run dev
# Edit components in src/

# Changes reflect instantly in browser
```

**Backend Changes (Python)**
```bash
# API auto-reloads with --reload flag
# Edit files in src/agridrone/

# Just save and refresh dashboard
```

### Building for Production

**Frontend Build**
```bash
cd dashboard
npm run build

# Output in dashboard/dist/
# Ready to deploy to static hosting
```

**Backend Production**
```bash
# Install gunicorn for production server
pip install gunicorn

# Run with gunicorn
gunicorn src.agridrone.api.app:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000
```

## Troubleshooting

### Dashboard Won't Connect to API

**Issue**: "API Disconnected" error

**Solutions**:
1. Ensure backend is running: `http://localhost:8000/health`
2. Check CORS is enabled in backend (should be by default)
3. Verify `VITE_API_URL` in `dashboard/.env`
4. Check browser console for network errors
5. Firewall might block localhost connections

### Image Upload Fails

**Issue**: "Failed to decode image"

**Solutions**:
1. Verify image is valid (PNG, JPG, GIF)
2. Check file size < 50MB
3. Make sure it's an actual image file, not corrupted
4. Try with different image format

### Slow Detection

**Issue**: Inference takes > 1 second

**Solutions**:
1. Using mock model? Toggle off to use real model
2. Check GPU availability: `nvidia-smi`
3. Large image size slows inference
4. Model might need to be loaded on first request

### Dashboard Won't Start

**Issue**: npm error or port already in use

**Solutions**:
```bash
# Clear node_modules
rm -rf node_modules
npm install

# Use different port
npm run dev -- --port 5174
```

### Python Virtual Environment Issues

```bash
# Recreate venv
rm -rf venv
python -m venv venv
venv\Scripts\activate
pip install -e .
```

## Performance Tips

### For Faster Detection
- Use mock model initially (`use_mock=true`)
- Resize large images before upload
- Use GPU if available (check CUDA installation)
- Process smaller image batches

### For Smoother UI
- Keep browser devtools closed
- Disable browser extensions
- Use modern browser (Chrome/Edge recommended)
- Clear browser cache if laggy

### For Backend
- Use `-e` flag with uvicorn for hot-reload
- Monitor memory with `nvidia-smi` for GPU
- Check logs for errors: `tail -f outputs/logs/app.log`

## Environment Variables

### Backend (.env in project root)
```env
# Model settings
MODEL_CHECKPOINT=models/yolov8n-seg.pt
MODEL_DEVICE=auto  # cpu, cuda, auto

# API settings
API_HOST=0.0.0.0
API_PORT=8000

# Safety
DRY_RUN=true
SAFE_TEST_FLUID_ONLY=true

# Logging
LOG_LEVEL=INFO
LOG_FILE=outputs/logs/app.log
```

### Dashboard (.env in dashboard/)
```env
# API endpoint
VITE_API_URL=http://localhost:8000

# Optional: API timeout
VITE_API_TIMEOUT=60000
```

## Testing the Dashboard

### Manual Testing Checklist

- [ ] Upload image (drag & drop)
- [ ] Upload image (click)
- [ ] Mock model toggle works
- [ ] Detection runs and shows results
- [ ] Bounding boxes render correctly
- [ ] Table sorts by columns
- [ ] Download JSON works
- [ ] Download CSV works
- [ ] API status indicator updates
- [ ] Mobile responsive view
- [ ] Dark theme looks good

### Testing with Different Files

```bash
# Create test image
python -c "
import numpy as np
from PIL import Image
img = Image.fromarray(np.random.randint(0, 255, (480, 640, 3), dtype='uint8'))
img.save('test_image.jpg')
"

# Upload test_image.jpg to dashboard
```

## Deployment Options

### Local Development
```bash
# Terminal 1: Backend
uvicorn src.agridrone.api.app:app --reload --port 8000

# Terminal 2: Frontend
cd dashboard && npm run dev
```

### Single Machine (Production-like)
```bash
# Backend in screen session
screen -S api uvicorn src.agridrone.api.app:app --port 8000

# Frontend in screen session
screen -S web bash -c "cd dashboard && npm run build && npm run preview"
```

### Docker Deployment
```dockerfile
# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY . .
RUN pip install -e .
EXPOSE 8000
CMD ["uvicorn", "src.agridrone.api.app:app", "--host", "0.0.0.0"]

# Frontend Dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY dashboard .
RUN npm install && npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=build /app/dist /app/dist
RUN npm install -g serve
CMD ["serve", "-s", "dist", "-l", "5173"]
```

## Common Tasks

### Enable GPU for Faster Inference
```bash
# Check CUDA is available
python -c "import torch; print(torch.cuda.is_available())"

# Update config to use GPU
# In src/agridrone/config.py or .env:
# MODEL_DEVICE=cuda
```

### Change Model
```bash
# Edit src/agridrone/config.py
# MODEL_CHECKPOINT=models/yolov8m-seg.pt  # larger model
# MODEL_BACKBONE=yolov8m-seg
```

### Change API Port
```bash
# Terminal 1
uvicorn src.agridrone.api.app:app --port 9000

# Terminal 2 - Update dashboard .env
# VITE_API_URL=http://localhost:9000
```

### Debug Mode
```bash
# Backend debug
export LOG_LEVEL=DEBUG
uvicorn src.agridrone.api.app:app --reload

# Frontend debug
# Open DevTools: F12 → Console
# Check Network tab for API calls
```

## Next Steps

1. **Run example detection**: Upload `data/sample/` images
2. **Train custom model**: See `scripts/train_detector.py`
3. **Integrate with drone**: See `docs/hardware.md`
4. **Field validation**: See `docs/field_protocol.md`
5. **Build prescription maps**: See `scripts/build_prescription_map.py`

## Support & Documentation

- **API Docs**: `http://localhost:8000/docs` (Swagger UI)
- **Dashboard README**: `dashboard/README.md`
- **Architecture**: `docs/architecture.md`
- **Safety Guide**: `docs/safety.md`

---

**Happy detecting! 🚀**
