# Dashboard UI Feature Guide

Visual reference and usage guide for the AgriDrone AI Dashboard.

## Dashboard Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  🚀 AgriDrone | AI Detection System                 🟢 API Connected│
├───────────────────────────────────┬─────────────────────────────────┤
│                                   │                                   │
│  SIDEBAR                          │  MAIN CONTENT                    │
│  ────────                         │  ────────────────────────────   │
│                                   │                                   │
│  📊 Dashboard          ◄──┐       │  # Detection Dashboard           │
│  📤 Upload & Detect    │   │       │  Real-time AI-powered analysis  │
│  📋 History            │   │       │                                  │
│  ⚙️  Settings          │   │       │  ┌─────────┐ ┌──────────┐      │
│                        │   └──────┤─ │ Stats   │ │ Avg Conf │      │
│  ──────────────────    │          │  │ Cards   │ │ 89.3%    │      │
│  settings              │          │  └─────────┘ └──────────┘      │
│  Logout                │          │                                  │
│  v1.0.0                │          │  ┌──────────────────────────┐   │
│                        │          │  │   Detection Results       │   │
│  Research Prototype    │          │  │   [Processed Image with  │   │
│                        │          │  │    Bounding Boxes]       │   │
│                        │          │  └──────────────────────────┘   │
│                        │          │                                  │
│                        │          │  ┌──────────────────────────┐   │
│                        │          │  │   Detection Table        │   │
│                        │          │  │                          │   │
│                        │          │  │  Class │ Conf │ BBox │  │   │
│                        │          │  │  ────────────────────│  │   │
│                        │          │  │  weed  │ 92%  │ ...  │  │   │
│                        │          │  │  pest  │ 78%  │ ...  │  │   │
│                        │          │  └──────────────────────────┘   │
│                        │          │                                  │
└────────────────────────┴──────────┴──────────────────────────────────┘
```

## Features Overview

### 1. Navbar (Top)
- **Logo**: AgriDrone with version
- **Active Section Title**: Shows current page
- **API Status Indicator**: Green (connected) or Red (disconnected)
  - Pulses gently when connected
  - Updates every 5 seconds

### 2. Sidebar (Left)
- **Navigation Menu**
  - Dashboard - View detection results
  - Upload & Detect - Upload and process images  
  - History - Past detection sessions
  - Settings - (Coming soon)
  
- **Active Indicator**: Blue dot shows current page
- **Hover Effects**: Smooth transitions

- **Dynamic Update**: Active menu item highlights when navigating

### 3. Upload Section

#### Drag & Drop Zone
```
┌────────────────────────────────┐
│  ☁️  Drop your image here      │
│     or click to select          │
│                                │
│  PNG, JPG, GIF up to 50MB      │
└────────────────────────────────┘
```

**Features**:
- Click to open file browser
- Drag image to upload
- Animated icons on hover
- Validates file type
- Shows error if file invalid

#### Model Toggle
```
┌────────────────────────────────┐
│  Model Mode                    │
│  Using Mock Model (Demo)       │
│                                │
│  [●────────] ← Toggle button   │
└────────────────────────────────┘
```

- **Mock Model**: Instant results (for testing UI)
- **Real Model**: Uses YOLOv8 detector (actual inference)

#### Image Preview
- Shows selected image
- Displays filename
- Clear button (X) to reset
- "Run AI Detection" button

**States**:
- Selected: Shows image preview
- Processing: Loading spinner
- Ready: Clickable detection button

### 4. Detection Results Section

#### Stats Cards
```
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  📊 Total    │  │  🎯 Avg Conf │  │  ⚡ Time     │
│  Detections  │  │  89.3%       │  │  234ms       │
│  3           │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

**Features**:
- Animated numbers counting up
- Hover: Card lifts, glow effect
- Value updates with each detection
- Color-coded by metric

#### Image Viewer with Bounding Boxes
```
┌────────────────────────────────┐
│  Detection Results             │
│  ✓ Found 3 hotspots (234ms)   │
├────────────────────────────────┤
│  [IMAGE WITH BOXES]            │
│  ┌─────┐ ┌─────┐ ┌─────┐      │
│  │weed │ │pest │ │dis. │      │
│  │92%  │ │78%  │ │87%  │      │
│  └─────┘ └─────┘ └─────┘      │
└────────────────────────────────┘
```

**Features**:
- Colored bounding boxes per class
- Label with class name + confidence
- Scrollable if image is large
- Nice aspect ratio handling
- "No detections" message if empty

#### Export Buttons
```
┌─────────────────┐  ┌─────────────┐
│ 📄 Download JSON│  │ 📊 Download │
│                 │  │ CSV         │
└─────────────────┘  └─────────────┘
```

**Features**:
- Click to download detection data
- JSON: Full metadata + timestamps
- CSV: Spreadsheet format
- Timestamped filenames
- Only appears if detections exist

### 5. Detection Table

```
┌──────────┬──────────┬──────────────┬────────────┐
│ Class ↕  │ Conf. ↕  │ B.Box ↕      │ Area       │
├──────────┼──────────┼──────────────┼────────────┤
│ 🌿 weed  │ 92.1% ██ │ (100,150)→ │ 15,000 px²│
│          │          │ (200,250)    │            │
├──────────┼──────────┼──────────────┼────────────┤
│ 🐛 pest  │ 78.5% ██ │ (650,600)→ │ 20,000 px²│
│          │          │ (850,850)    │            │
├──────────┼──────────┼──────────────┼────────────┤
│ 🦠 disease│87.3% ██ │ (500,200)→ │ 22,500 px²│
│          │          │ (700,500)    │            │
└──────────┴──────────┴──────────────┴────────────┘
```

**Features**:
- **Sortable Columns**: Click to sort
  - Class Name (alphabetical)
  - Confidence (ascending/descending)
  - Area size
  
- **Color-Coded Badges**:
  - Weed: Red
  - Disease: Orange
  - Pest: Pink
  - Anomaly: Cyan

- **Animated Bars**: Shows confidence visually
- **Hover**: Rows highlight
- **Responsive**: Horizontal scroll on mobile

### 6. History Section

```
Recent Detections

┌──────────────────────────────────┐
│ field_01.jpg                     │ 15 detections
│ Detected 15 hotspots            │ 2024-03-18 14:32  [15]
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ aerial_test.png                  │  8 detections
│ Detected 8 hotspots             │ 2024-03-18 14:15  [ 8]
└──────────────────────────────────┘

┌──────────────────────────────────┐
│ drone_flight_02.jpg              │  3 detections
│ Detected 3 hotspots             │ 2024-03-18 13:45  [ 3]
└──────────────────────────────────┘
```

**Features**:
- List of last 10 detection sessions
- Filename displayed
- Detection count
- Timestamp
- Click to view those results
- Removes old entries automatically

## Color Scheme

### Detection Classes
| Class | Color | RGB | 
|-------|-------|-----|
| Weed | Red | #ff6b6b |
| Disease | Orange | #ffa500 |
| Pest | Pink | #ff1493 |
| Anomaly | Cyan | #00d4ff |

### UI Colors
| Element | Color | Use |
|---------|-------|-----|
| Primary Accent | Blue | #0ea5e9 |
| Secondary | Purple | #a855f7 |
| Success | Green | #4ade80 |
| Warning | Yellow | #fbbf24 |
| Error | Red | #f87171 |
| Dark BG | Slate | #0f172a |

## Animations

### Entrance Animations
- **Fade In**: Smooth opacity
- **Slide Up**: Cards slide from bottom
- **Scale**: Elements grow slightly

### Hover Effects
- **Cards**: Lift up with glow
- **Buttons**: Scale and color shift
- **Links**: Underline + color change

### Loading States
- **Spinner**: Rotating circle animation
- **Progress Bar**: Animated width
- **Pulse**: Glow effect on API indicator

### Interactive Elements
- **Confidence Bar**: Animates to full width
- **Number Counter**: Counts up to value
- **Checkbox Toggle**: Smooth slide animation

## Usage Workflow

### 1. Upload & Detect
```
1. Click "Upload & Detect" in sidebar
2. Drag image or click to browse
3. (Optional) Toggle "Mock Model" for instant demo
4. Click "Run AI Detection"
5. Wait for processing (visualized with spinner)
6. See results appear
```

### 2. Review Results
```
1. View processed image with bounding boxes
2. Check stats cards (total, confidence, time)
3. Review detection table with full details
4. Hover table rows for emphasis
5. Click column headers to sort
```

### 3. Export Data
```
1. Click "Download JSON" for full data with metadata
2. Click "Download CSV" for spreadsheet analysis
3. Files saved with timestamp in filename
4. CSV format: Class, Confidence, Bbox coords, Area
```

### 4. View History
```
1. Click "History" in sidebar
2. See list of past detection sessions
3. Click entry to view those results
4. Last 10 sessions kept automatically
```

## Responsive Behavior

### Desktop (1024px+)
- Full sidebar visible
- 3-column stats layout
- Full detection table with all columns
- Side-by-side layouts

### Tablet (768px - 1023px)
- Sidebar hidden (menu icon appears)
- 2-column stats layout
- Table columns wrap
- Optimized touch targets

### Mobile (< 768px)
- Hamburger menu sidebar
- Single-column layout
- Stats stack vertically
- Table horizontal scroll
- Larger touch targets (44px min)

## Keyboard Shortcuts (Coming Soon)
- `Ctrl+U` → Upload & Detect section
- `Ctrl+D` → Dashboard section
- `Ctrl+H` → History section
- `Ctrl+E` → Export CSV
- `Ctrl+J` → Export JSON

## Dark Mode Details

### Color Palette
- **Primary Background**: #0f172a (very dark blue)
- **Secondary**: #1e293b (dark blue-gray)
- **Hover**: #334155 (lighter slate)
- **Text**: #e2e8f0 (light gray)
- **Subtle Text**: #94a3b8 (medium gray)
- **Borders**: #334155 with 10-20% opacity

### Contrast
- All text meets WCAG AA standards
- Links clearly distinguishable
- Buttons have sufficient contrast
- Icons visible in all states

## Glass Morphism Effect

Cards use a subtle glass effect:
```css
background: rgba(15, 23, 42, 0.7);
backdrop-filter: blur(12px);
border: 1px solid rgba(148, 163, 184, 0.1);
```

**Features**:
- Semi-transparent background
- Blur effect behind cards
- Subtle border outline
- Hover increases opacity & blur

## Performance Optimizations

- **Lazy Loading**: Components load on demand
- **Memoization**: Prevent unnecessary re-renders
- **Canvas Rendering**: Fast bounding box drawing
- **Efficient State**: Minimal re-renders on input
- **Animations**: 60 FPS with GPU acceleration
- **Image Optimization**: Base64 encoding, quality 85 JPEG

## Accessibility Features

- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Tab through all controls
- **Focus Indicators**: Clear focus state
- **Color Contrast**: WCAG AA compliant
- **Form Labels**: Proper label associations
- **Loading States**: Clear user feedback

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Full support |
| Edge | 90+ | ✅ Full support |
| Firefox | 88+ | ✅ Full support |
| Safari | 14+ | ✅ Full support |
| Mobile Safari | 14+ | ✅ Full support |
| Chrome Mobile | Latest | ✅ Full support |

## Tips & Tricks

### Speed Up Detections
- Use mock model while developing UI
- Resize large images (>2K) before upload
- Use GPU if available

### Better Images
- JPG format most compatible
- RGB images (not RGBA)
- Good lighting helps detection
- Aerial view works best

### Export Workflow
- Download JSON for full trace
- Use CSV for spreadsheet analysis
- Import CSV to GIS software
- Share results with team

### Debugging
- Open DevTools (F12)
- Check Network tab for API calls
- Monitor Console for errors
- Check API health indicator

---

**Built with React, Vite, Tailwind CSS, and Framer Motion**
