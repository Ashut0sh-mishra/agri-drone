"""
QUICK REFERENCE: YOLOv8 Detection Pipeline
==========================================

## Installation & Setup

```bash
# Install package with dependencies
pip install -e .

# Download model (automatic on first use, or manual)
python -c "from ultralytics import YOLO; YOLO('yolov8n-seg')"
```

## 1-Minute Quick Start

```python
from agridrone.vision import YOLOv8Detector
import cv2

# Initialize detector
detector = YOLOv8Detector("yolov8n-seg", "models/yolov8n-seg.pt", device="cuda")

# Load image
image = cv2.imread("field.jpg")

# Run detection
detections = detector.detect(image, confidence_threshold=0.5)

# Access results
for det in detections.detections:
    print(f"{det.class_name}: {det.confidence:.2f}")
    print(f"  BBox: ({det.bbox.x1}, {det.bbox.y1}) to ({det.bbox.x2}, {det.bbox.y2})")
```

## Full Pipeline with Post-Processing

```python
from agridrone.vision import YOLOv8Detector, DetectionPostProcessor
from agridrone.io.exporters import DetectionExporter
import cv2

# 1. Initialize
detector = YOLOv8Detector("yolov8n-seg", "models/yolov8n-seg.pt")

# 2. Detect
image = cv2.imread("field.jpg")
detections = detector.detect(image)
print(f"Raw detections: {detections.num_detections}")

# 3. Filter confidence & area
detections = DetectionPostProcessor.filter_batch(
    detections,
    min_confidence=0.4,
    min_area_px=100
)
print(f"After filtering: {detections.num_detections}")

# 4. Apply NMS
detections = DetectionPostProcessor.nms(detections, iou_threshold=0.5)
print(f"After NMS: {detections.num_detections}")

# 5. Merge duplicates
detections = DetectionPostProcessor.merge_duplicates(detections)
print(f"After merging: {detections.num_detections}")

# 6. Export
DetectionExporter.to_json(detections, "detections.json")
DetectionExporter.to_csv(detections, "detections.csv")
```

## Class Reference

### YOLOv8Detector

```python
detector = YOLOv8Detector(
    model_name="yolov8n-seg",           # Model size
    model_path="models/yolov8n-seg.pt", # File path
    device="cuda"                        # "cuda" or "cpu"
)

# Run inference
batch = detector.detect(
    image,                    # numpy array (BGR or RGB)
    confidence_threshold=0.5  # Confidence cutoff
)

# Batch inference
results = detector.detect_batch(
    [image1, image2, image3],
    confidence_threshold=0.5
)
```

### DetectionPostProcessor

```python
# Filter by confidence and area
filtered = DetectionPostProcessor.filter_batch(
    batch,
    min_confidence=0.3,
    min_area_px=50,
    max_area_px=10000
)

# Non-maximum suppression
nms = DetectionPostProcessor.nms(
    batch,
    iou_threshold=0.5  # Suppress if IoU > 0.5
)

# Merge near-duplicates
merged = DetectionPostProcessor.merge_duplicates(
    batch,
    iou_threshold=0.9  # Merge if IoU > 0.9
)
```

## Detection Object Structure

```python
detection = Detection(
    detection_id="det_abc123",
    class_name="weed",                    # Class label
    confidence=0.85,                      # Score 0-1
    uncertainty=None,                     # Optional
    bbox=BoundingBox(x1, y1, x2, y2),   # Pixel coordinates
    polygon=Polygon([...]),               # Segmentation (optional)
    source_image="field.jpg",
    timestamp=datetime.now(),
    model_name="yolov8n-seg",
    model_version="8.0"
)

# Access properties
print(detection.bbox.width)        # Width in pixels
print(detection.bbox.height)       # Height in pixels
print(detection.bbox.area)         # Area in pixels²
print(detection.bbox.center)       # Center (x, y)
print(detection.severity_score)    # Uses confidence
```

## DetectionBatch Methods

```python
batch = DetectionBatch(...)

# Add detection
batch.add_detection(detection)

# Filter by confidence
high_conf = batch.filter_by_confidence(threshold=0.7)

# Filter by class
weeds = batch.filter_by_class("weed")

# Filter by area
large = batch.filter_by_area(min_area=1000, max_area=50000)

# Properties
print(batch.num_detections)         # Detection count
print(batch.processing_time_ms)     # Inference time
```

## Model Selection

```
Speed   │ Model        │ Use Case
────────┼──────────────┼──────────────────
Fast    │ yolov8n-seg  │ Real-time, edge
Medium  │ yolov8s-seg  │ Balanced
Slow    │ yolov8m-seg  │ High accuracy needed
Slower  │ yolov8l-seg  │ Large objects
        │ yolov8x-seg  │ Maximum accuracy
```

## Configuration

```yaml
# configs/model.yaml
model:
  backbone: yolov8n   # n=nano, s=small, m=medium, l=large, x=xlarge

inference:
  confidence_threshold: 0.5
  iou_threshold: 0.45
  device: cuda        # or "cpu"
  batch_size: 8
  half_precision: true
```

## Troubleshooting

### Import Error
```python
# Ensure package is installed
pip install -e .
python -c "from agridrone.vision import YOLOv8Detector"
```

### Model Not Found
```python
# Auto-download will happen on first use
# Or download manually:
python -c "from ultralytics import YOLO; YOLO('yolov8n-seg')"
```

### CUDA Not Available
```python
# Check GPU
python -c "import torch; print(torch.cuda.is_available())"

# Fall back to CPU
detector = YOLOv8Detector(..., device="cpu")
```

### OOM (Out of Memory)
```python
# Use smaller model
detector = YOLOv8Detector("yolov8n-seg", ...)  # Nano

# Reduce batch size
results = detector.detect(single_image)  # Not batch

# Restart Python to clear GPU memory
```

## Testing

```bash
# Run tests
pytest tests/unit/test_vision.py -v

# Test with mock (no model required)
python scripts/example_detection.py --use-mock

# Benchmark
python scripts/example_detection.py --device cuda --output-dir outputs/benchmark
```

## Performance Tips

```python
# Tip 1: Batch processing
images = [cv2.imread(p) for p in image_paths]
results = detector.detect_batch(images)  # More efficient

# Tip 2: Reuse detector instance
detector = YOLOv8Detector(...)
for image in images:
    detections = detector.detect(image)

# Tip 3: Use nano model for speed
detector = YOLOv8Detector("yolov8n-seg", ...)

# Tip 4: Filter early to reduce load
detections = DetectionPostProcessor.filter_batch(detections, min_confidence=0.5)

# Tip 5: GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
detector = YOLOv8Detector(..., device=device)
```

## Export Formats

```python
from agridrone.io.exporters import DetectionExporter

# JSON (detailed)
DetectionExporter.to_json(batch, "out.json")

# CSV (tabular)
DetectionExporter.to_csv(batch, "out.csv")

# Custom export
import json
with open("custom.json", "w") as f:
    json.dump(batch.model_dump(), f, indent=2)
```

## Common Workflows

### Workflow 1: Single Image Analysis
```python
detector = YOLOv8Detector(...)
img = cv2.imread("field.jpg")
detections = detector.detect(img, confidence_threshold=0.5)
filtered = DetectionPostProcessor.filter_batch(detections, min_confidence=0.4)
```

### Workflow 2: Batch Image Processing
```python
from agridrone.io.image_loader import ImageLoader

loader = ImageLoader("data/raw")
detector = YOLOv8Detector(...)

for img_path in loader.images:
    img = loader.load_as_rgb(img_path)
    det = detector.detect(img)
    print(f"{img_path}: {det.num_detections} detections")
```

### Workflow 3: Full Pipeline with Export
```python
# See "Full Pipeline with Post-Processing" example above
```

## API Reference Quick Links

Full documentation: `make docs`
Examples: `scripts/example_detection.py`
Tests: `tests/unit/test_vision.py`
Module docs: `docs/vision_module.md`

## Key Methods Reference

| Method | Purpose | Input | Output |
|--------|---------|-------|--------|
| `detect()` | Run inference | image, confidence | DetectionBatch |
| `detect_batch()` | Batch inference | images, confidence | list[DetectionBatch] |
| `filter_batch()` | Filter results | batch, confidence, area | DetectionBatch |
| `nms()` | Remove overlaps | batch, iou_threshold | DetectionBatch |
| `merge_duplicates()` | Combine similar | batch, iou_threshold | DetectionBatch |

## Version Info

```python
from agridrone import __version__
from agridrone.vision import YOLOv8Detector

print(f"agridrone: {__version__}")
print(f"YOLOv8 version: {detector._get_model_version()}")
```

---

**For more details**, see:
- Full vision module docs: `docs/vision_module.md`
- Architecture: `docs/architecture.md`
- Implementation details: `IMPLEMENTATION_SUMMARY_VISION.md`
