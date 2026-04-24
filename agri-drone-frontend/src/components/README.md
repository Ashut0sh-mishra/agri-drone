# components/ — React UI Components

Each file is a self-contained React component. No API calls here — all
network calls go through `../services/api.js`.

## Component Map

### Navigation & Layout
| Component | What it renders |
|-----------|----------------|
| `Navbar.jsx` | Top navigation bar — app title, connection status indicator |
| `Sidebar.jsx` | Left sidebar — page navigation links |

### Core Workflow (the main user journey)
| Component | What it renders |
|-----------|----------------|
| `UploadBox.jsx` | Drag-and-drop image upload area |
| `CameraCapture.jsx` | Live webcam / mobile camera capture |
| `AnalysisProgress.jsx` | Animated progress indicator while detection runs |
| `ResultViewer.jsx` | **Main results panel** — disease name, confidence, treatment, Grad-CAM heatmap, top-5 predictions, AI consensus |
| `DetectionCanvas.jsx` | Canvas overlay that draws bounding boxes on the image |
| `DetectionTable.jsx` | Table of all detected objects/diseases in the image |

### Batch & Video
| Component | What it renders |
|-----------|----------------|
| `BatchResults.jsx` | Results grid for multiple uploaded images |
| `VideoResults.jsx` | Frame-by-frame results for video input |
| `YouTubeFrames.jsx` | Analyse frames extracted from a YouTube URL |

### Dashboard & Monitoring
| Component | What it renders |
|-----------|----------------|
| `StatsCards.jsx` | Summary stats cards (total scans, accuracy, etc.) |
| `MLDashboard.jsx` | ML metrics dashboard (mAP, confusion matrix, training curves) |
| `TrainingLogs.jsx` | Live training log stream |
| `ActivityFeed.jsx` | Real-time feed of recent scans across all sessions |
| `LiveSessions.jsx` | List of currently active drone scanning sessions |
| `LiveStream.jsx` | Live video stream from drone camera |
| `ScanHistory.jsx` | Historical scan records with filtering |
| `FieldSessions.jsx` | Field-level session grouping |

### Tools
| Component | What it renders |
|-----------|----------------|
| `ChatPanel.jsx` | Conversational Q&A with the disease knowledge base |
| `VoiceInterface.jsx` | Voice input for hands-free operation |
| `QRConnect.jsx` | QR code to pair mobile phone as camera |
| `ReportsPage.jsx` | Generate and download PDF/CSV reports |
| `CostBenefitCard.jsx` | Economic analysis — pesticide cost vs crop loss |
| `UncertaintyMeter.jsx` | Visual confidence / uncertainty display |
| `DatasetCollector.jsx` | Collect and label new training images |
| `ColabPipeline.jsx` | Run training pipeline in Google Colab |

## Conventions

- Component file name = component function name (PascalCase)
- Each component exports a single `default` function
- Props are documented with JSDoc comments inside the file
- No direct `fetch`/`axios` calls — import from `../services/api.js`
