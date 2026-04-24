# AgriDrone Frontend - Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies (1 min)

```bash
cd agri-drone-frontend
npm install
```

This installs React, Vite, Tailwind CSS, Axios, and all dev dependencies.

### Step 2: Start Backend Server (1 min)

In a separate terminal, from the `agri-drone` directory:

```bash
# Make sure all Python dependencies are installed
pip install -r requirements.txt

# Start FastAPI server
uvicorn agridrone.api.app:app --reload --host 127.0.0.1 --port 8000
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
```

### Step 3: Start Frontend Dev Server (1 min)

From the `agri-drone-frontend` directory:

```bash
npm run dev
```

You should see:
```
  VITE v5.0.0  ready in XXX ms

  ➜  Local:   http://localhost:5173/
  ➜  press h to show help
```

### Step 4: Open in Browser (1 min)

Visit: **http://localhost:5173**

You should see the AgriDrone dashboard with:
- Upload box on the left
- Empty results area on the right
- Green "API Connected" indicator in header

### Step 5: Test Detection (1 min)

1. Drag & drop a test image or click to upload
2. Leave "Confidence Threshold" at 0.5
3. Click "Run Detection"
4. Wait for results (typically 1-3 seconds)
5. Explore the results:
   - See annotated image with bounding boxes
   - Review detection statistics
   - Check the results table
   - Download as JSON or CSV

---

## Troubleshooting

### "API Offline" in Header

**Problem**: Red indicator shows "API Offline"

**Solution**:
- Check if FastAPI backend is running on http://localhost:8000
- Start it with: `uvicorn agridrone.api.app:app --reload`

### "Cannot connect to API"

**Problem**: Error message when running detection

**Solution**:
- Verify backend is running: `curl http://localhost:8000/api/detect/health`
- Check if ports 8000 and 5173 are available
- Try: `lsof -i :8000` to see what's using port 8000

### Styles Look Broken

**Problem**: Tailwind CSS not working

**Solution**:
- Delete `node_modules` folder
- Run: `npm install`
- Restart dev server: `npm run dev`

### Image Upload Not Working

**Problem**: File selection doesn't work

**Solution**:
- Check browser console for errors (F12)
- Ensure image is JPEG, PNG, or BMP
- Try smaller file size (< 10MB)

---

## File Structure Overview

```
agri-drone-frontend/
├── src/
│   ├── App.jsx                 # Main app (3-column layout)
│   ├── components/
│   │   ├── UploadBox.jsx       # Drag & drop zone
│   │   ├── ResultViewer.jsx    # Stats & exports
│   │   └── DetectionTable.jsx  # Results table
│   ├── services/
│   │   └── api.js              # Axios client
│   ├── index.css               # Tailwind + custom styles
│   └── main.jsx                # React entry
├── index.html                  # HTML root
├── vite.config.js              # Build config
├── tailwind.config.js          # Tailwind theme
├── package.json                # Dependencies
└── README.md                   # Full documentation
```

---

## Key Features

### Upload Box
- Drag & drop or click to select
- File size display
- Loading spinner during detection
- Visual feedback on drag

### Detection Results
- Original and annotated image side-by-side
- 4 stat cards showing:
  - Number of detections
  - Processing time
  - Max confidence
  - Average confidence

### Results Table
- Sortable columns
- Color-coded class badges
- Confidence/severity progress bars
- Detection coordinates

### Export Options
- **JSON**: Full detection data with metadata
- **CSV**: Spreadsheet-friendly format
- **Image**: Annotated image with boxes drawn

---

## Customization

### Change Colors

Edit `tailwind.config.js`:

```js
theme: {
  extend: {
    colors: {
      'primary': '#your-color',
      'secondary': '#your-color',
    },
  },
}
```

### Change API URL

Create `.env`:

```
VITE_API_URL=http://your-api-url:8000
```

### Modify Confidence Threshold Range

In `src/App.jsx`:

```jsx
<input type="range" min="0" max="1" step="0.1" />
```

---

## Common Tasks

### Add New Component

```jsx
// src/components/MyComponent.jsx
export default function MyComponent({ props }) {
  return <div className="glass-panel">...</div>
}
```

### Call API Endpoint

```jsx
import { runDetection } from './services/api'

const result = await runDetection(file, {
  confidence_threshold: 0.5,
  include_image: true
})
```

### Update Styles

Global styles in `src/index.css`:

```css
@layer components {
  .my-class {
    @apply px-4 py-2 rounded-lg;
  }
}
```

---

## Performance Tips

- Keep images under 5MB for faster uploads
- Use confidence_threshold of 0.5+ for fewer false positives
- Modern browsers recommended (Chrome, Firefox, Safari)
- Disable browser extensions if issues occur

---

## Next Steps

1. ✅ Frontend is running
2. ✅ Backend is connected
3. Ready to: Upload test images and detect hotspots!

---

## Support

Need help?

1. **Check browser console**: F12 → Console tab
2. **Check network tab**: F12 → Network tab
3. **Verify backend health**: `curl http://localhost:8000/api/detect/health`
4. **Read full docs**: See `README.md` in this directory

---

## What's Next?

- Try with different confidence thresholds
- Export results to analyze
- Integrate with your own backend
- Customize styles to match your brand
- Deploy to production hosting

Enjoy! 🚀
