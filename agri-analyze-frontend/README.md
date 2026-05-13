# AgriAnalyze Frontend

Modern, professional React + Vite + Tailwind CSS frontend for the AgriAnalyze AI hotspot detection system.

**Live Demo:** [agri-drone-frontend.vercel.app](https://agri-drone-frontend.vercel.app) | **Backend API:** [ashu010-agri-drone-api.hf.space](https://ashu010-agri-drone-api.hf.space)

## Features

✨ **Modern Design**
- Dark theme with glassmorphism effects
- Responsive layout for mobile, tablet, desktop
- Smooth animations and transitions
- Professional SaaS-style dashboard

🎯 **Core Functionality**
- Drag & drop image upload
- Real-time image preview
- One-click detection execution
- Interactive detection visualization
- Color-coded results

📊 **Results Visualization**
- Annotated image with bounding boxes
- Detection results table
- Confidence and severity scoring
- Processing time metrics
- Statistical summaries

💾 **Data Export**
- Download results as JSON
- Download results as CSV
- Download annotated image
- Batch processing support

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool & dev server
- **Tailwind CSS** - Utility-first styling
- **Axios** - HTTP client
- **Modern ES6+** - Clean, modern JavaScript

## Project Structure

```
src/
├── App.jsx                 # Main app component with state management
├── index.css               # Global styles + Tailwind imports
├── main.jsx                # React entry point
├── components/
│   ├── UploadBox.jsx       # Drag & drop file upload
│   ├── ResultViewer.jsx    # Image preview & statistics
│   └── DetectionTable.jsx  # Detection results table
└── services/
    └── api.js              # Axios API client

index.html                  # HTML entry point
vite.config.js              # Vite configuration
tailwind.config.js          # Tailwind theme
postcss.config.js           # PostCSS plugins
package.json                # Dependencies
```

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- FastAPI backend running on `http://localhost:8000`

### Installation

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Development

```bash
# Start dev server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Usage

1. **Upload Image**: Drag & drop or click to select a field image (JPG, PNG, BMP)
2. **Adjust Settings**: Set confidence threshold (0.0-1.0)
3. **Run Detection**: Click "Run Detection" button
4. **View Results**:
   - See annotated image with bounding boxes
   - Review detection statistics
   - Explore detailed results table
5. **Export Data**: Download as JSON, CSV, or image

## API Integration

### Backend URL

Set in `.env`:
```
VITE_API_URL=http://localhost:8000
```

### API Endpoints Used

- `POST /api/detect/` - Run detection on image
- `GET /api/detect/health` - Check API health
- `POST /api/detect/reset` - Reset detector

See `src/services/api.js` for implementation.

## Components

### UploadBox

Drag & drop file upload component with visual feedback.

**Props:**
- `onFileSelect: (file) => void` - File selection callback
- `disabled: boolean` - Disable upload
- `isLoading: boolean` - Show loading spinner

### ResultViewer

Displays detection results, statistics, and export options.

**Props:**
- `result: object` - Detection results from API
- `image: string` - Base64 or data URL of image
- `onDownloadJSON: () => void` - JSON export handler
- `onDownloadCSV: () => void` - CSV export handler

### DetectionTable

Interactive table displaying all detections with sorting.

**Props:**
- `detections: array` - Array of detection objects

## Styling

### Tailwind Classes

Custom components defined in `src/index.css`:
- `.glass-panel` - Glassmorphism card
- `.glass-button` - Secondary button
- `.glass-button-primary` - Primary button
- `.gradient-text` - Gradient text effect
- `.animated-gradient` - Animated gradient background

### Color Scheme

- **Dark Background**: `#0f172a`
- **Dark Card**: `#1e293b`
- **Primary Blue**: Brand color
- **Glassmorphism**: Semi-transparent white with backdrop blur

## Features in Detail

### Drag & Drop Upload

```jsx
<UploadBox
  onFileSelect={handleFileSelect}
  disabled={loading}
  isLoading={loading}
/>
```

- Visual feedback on drag
- File type validation
- File size display

### Detection Pipeline

```js
const result = await runDetection(file, {
  confidence_threshold: 0.5,
  include_image: true
})
```

- Progress tracking
- Error handling
- Automatic image annotation

### Results Export

```js
// JSON export
const json = JSON.stringify(result, null, 2)

// CSV export
const csv = generateCSV(result.detections)

// Image download
const imageUrl = `data:image/jpeg;base64,${result.annotated_image_base64}`
```

## Performance Optimization

- Code splitting with Vite
- Image lazy loading
- Memoization of components
- Efficient re-renders with React hooks
- Base64 image encoding for API responses

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Responsive Design

- **Mobile** (< 640px): Single column layout
- **Tablet** (640px - 1024px): Optimized two-column
- **Desktop** (> 1024px): Full three-column layout

## Error Handling

- API connection errors
- Invalid image formats
- Detection failures
- File upload errors
- Network timeouts

All errors displayed with helpful messages.

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- ARIA labels where needed
- Color contrast compliance
- Focus indicators on interactive elements

## Development Tips

### Enable API Logging

```js
// In services/api.js
api.interceptors.response.use(
  response => {
    console.log('API Response:', response)
    return response
  },
  error => {
    console.log('API Error:', error)
    return Promise.reject(error)
  }
)
```

### Debug State Changes

```js
useEffect(() => {
  console.log('Result updated:', result)
}, [result])
```

### CSS Debugging

Enable Tailwind's debug mode in `tailwind.config.js`:

```js
module.exports = {
  // ... config
  debug: true
}
```

## Deployment

### Build

```bash
npm run build
```

Creates optimized production build in `dist/`.

### Static Hosting

Deploy `dist/` folder to:
- Vercel
- Netlify
- GitHub Pages
- AWS S3
- Any static hosting service

### Environment

Create `.env.production`:
```
VITE_API_URL=https://api.yourdomain.com
```

## Contributing

1. Follow existing code style
2. Use functional components with hooks
3. Add meaningful component documentation
4. Test on multiple browsers/devices
5. Keep components focused and reusable

## License

Research Project - AgriAnalyze

## Support

For issues or questions:
1. Check API connectivity at `/api/detect/health`
2. Review console logs in browser DevTools
3. Verify FastAPI backend is running
4. Check network tab for failed requests

## Version

Frontend: v1.0.0
Compatible Backend: v1.0.0+
