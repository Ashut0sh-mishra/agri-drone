# AgriDrone — Architecture

> Snapshot of the AgriDrone monorepo layout and how its layers connect.
> Current as of the `main` branch. Last refreshed: April 2026.

---

## 1. Top-level repository layout

```
agri-drone/
├── src/                # Python backend (agridrone package)
│   └── agridrone/
├── frontend/           # React + Vite + TailwindCSS dashboard (superset)
├── dashboard/          # Older minimal React dashboard (retained for compatibility)
├── evaluate/           # Offline evaluation scripts + results/
├── scripts/            # One-off ops scripts (training, dataset prep, fixes)
├── notebooks/          # Colab / Jupyter notebooks (training, exploration)
├── models/             # Trained model weights (.pt)
├── data/               # Input datasets
├── datasets/           # External datasets (e.g. PDT)
├── outputs/            # Training + inference outputs (logs, weights)
├── runs/               # Ultralytics / MLflow run artifacts
├── configs/            # YAML config files
├── deploy/             # HuggingFace Space Dockerfile + readme
├── tests/              # Regression tests
├── docs/               # ← you are here
├── paper/              # LaTeX manuscript + supplementary
├── Dockerfile          # CPU-only backend image
├── docker-compose.yml
├── pyproject.toml      # Python packaging config (src-layout)
├── requirements.txt    # Pip deps (superset of runtime needs)
├── requirements.lock.txt
└── README.md
```

The companion repository [`agri-drone-frontend`](https://github.com/Ashut0sh-mishra/agri-drone-frontend)
hosts the Vercel-deployed fork of `frontend/`. Both frontends talk to the
same backend API surface.

---

## 2. Backend package layout (`src/agridrone/`)

```
agridrone/
├── __init__.py         # Package version
├── config.py           # Settings loader
├── logging.py          # Loguru setup
│
├── api/                # ★ HTTP/WebSocket surface (FastAPI)
│   ├── app.py              # Factory + all routes (create_app, get_app)
│   └── structured_output.py  # Flat → structured response builder
│
├── vision/             # ★ Image-level ML
│   ├── gradcam.py          # Grad-CAM heatmap generator
│   ├── infer.py            # YOLO detection pipeline
│   ├── rule_engine.py      # Rule-based post-processor
│   ├── feature_extractor.py
│   ├── ensemble_voter.py
│   ├── llm_validator.py    # LLaVA second-opinion
│   ├── disease_reasoning.py
│   ├── postprocess.py
│   ├── rules_learned.py
│   └── rules_llm.py
│
├── core/               # ★ Decision logic + MC-Dropout
│   ├── detector.py         # Uncertainty-aware classifier wrapper
│   ├── crop_type_gate.py   # Layer-2 crop-type routing
│   ├── spectral_features.py
│   ├── temporal_tracker.py
│   └── yield_estimator.py
│
├── knowledge/          # Knowledge base + RAG
│   └── research_rag.py     # Paper retrieval for diagnoses
│
├── prescription/       # Treatment / economics advice generators
├── geo/                # Geospatial utilities (field polygons, zones)
├── environment/        # Weather / crop-stage adjusters
├── io/                 # File + image utilities
├── feedback/           # User-feedback persistence + KB updates
├── services/           # Thin wrappers for external APIs
├── actuation/          # Drone / sprayer control stubs
├── runtime/            # Runtime orchestration
├── sim/                # Simulation helpers
├── types/              # Shared TypedDict / dataclass definitions
└── ui/                 # Server-side UI helpers
```

`★` marks the modules touched on every `/detect` request.

---

## 3. Request lifecycle (`POST /detect`)

```
   Browser (frontend/src/components/UploadBox.jsx)
           │  multipart image + crop + acres + growth_stage
           ▼
   ┌───────────────────────────────────────────────────────────┐
   │  api/app.py :: detect_image  (route handler)              │
   │                                                           │
   │  1. Plant gatekeeper        - reject faces / non-plant    │
   │  2. Crop-type gate (L2)     - core/crop_type_gate         │
   │  3. YOLO classifier         - vision/infer +              │
   │                               core/detector (MC-Dropout)  │
   │  4. Rule engine             - vision/rule_engine          │
   │  5. LLaVA validator (async) - vision/llm_validator        │
   │  6. Grad-CAM                - vision/gradcam              │
   │  7. RAG research papers     - knowledge/research_rag      │
   │  8. Ensemble voting         - vision/ensemble_voter       │
   │  9. Structured output       - api/structured_output       │
   └───────────────────────────────────────────────────────────┘
           │  JSON { result, structured: { diagnosis, gradcam,
           │                               research_papers, … } }
           ▼
   Browser (frontend/src/components/ResultViewer.jsx)
           ├─ tabs: Original / Grad-CAM / Healthy Ref
           ├─ diagnosis card, confidence breakdown, differential
           ├─ ChatPanel (grounded on this result)
           └─ CostBenefitCard, UncertaintyMeter, ...
```

### Layer boundaries

| Layer           | Module(s)                            | Responsibility                                      |
|-----------------|--------------------------------------|-----------------------------------------------------|
| HTTP / WS       | `agridrone.api.*`                    | Request validation, streaming, CORS, WS sessions    |
| Vision pipeline | `agridrone.vision.*`                 | Everything pixels -> pixel-level outputs            |
| Core reasoning  | `agridrone.core.*`                   | Confidence, routing, temporal trends                |
| Knowledge / RAG | `agridrone.knowledge.*`              | Paper retrieval, domain facts                       |
| Economics       | `agridrone.prescription.*`           | Cost-benefit, dose recommendations                  |
| Persistence     | `agridrone.feedback.*`, `reports/`   | History, feedback loop, KB updates                  |

The `api` layer is the **only** layer allowed to import from every
other layer. Layers below must not import from `api`.

---

## 4. Frontend -> backend contract

- The frontend expects the backend to return a `structured` field
  containing: `diagnosis`, `confidence_breakdown`, `ai_validation`,
  `ensemble_voting`, `temporal`, `research_papers`, `gradcam`,
  `ensemble`, `metadata`.
- The `gradcam` object has shape `{ heatmap_image: <data-URL>,
  target_class, confidence, regions, cam_coverage }` and is rendered
  conditionally in `ResultViewer.jsx` (Grad-CAM tab).
- The frontend falls back gracefully to flat legacy fields if
  `structured` is missing.

---

## 5. Deployment targets

| Target                 | Entry point                                       | Config                   |
|------------------------|---------------------------------------------------|--------------------------|
| Local dev              | `uvicorn agridrone.api.app:get_app --factory`     | `.env.example`           |
| Docker (CPU)           | `Dockerfile` + `docker-compose.yml`               | same                     |
| HuggingFace Space      | `deploy/Dockerfile.hf`                            | HF Secrets               |
| Vercel (frontend only) | `agri-drone-frontend` repo + `vercel.json`        | `VITE_API_URL` env var   |

---

## 6. Evaluation & research artifacts

- `evaluate/data_split_manifest.json` - canonical 4364 / 935 / 935 split
- `evaluate/results/*.json` + `*.csv` - bootstrap CIs, McNemar,
  Holm-Bonferroni, cross-dataset PDT accuracy, EfficientNet baselines.
- `paper/` - LaTeX manuscript referencing those artifacts.

Do not move or rename files under `evaluate/` without updating every
script in `scripts/` and every path in `paper/main.tex`.

---

## 7. Legacy / aspirational design

The sections below describe the original research-prototype design
centred on site-specific spraying (drone + sprayer). That vision
remains the long-term goal; the current main branch is the
web-delivered disease-detection pipeline described above.

---

"""
AgriDrone System Architecture
==============================

## Overview

AgriDrone is a research prototype for site-specific crop protection using aerial imagery,
environmental sensing, and controlled selective spraying.

## System Architecture

```
Image Input
    ↓
[Vision Module]  → Detection hotspots
    ↓
[Geo Module]  → Georeferenced locations
    ↓
[Prescription Engine] → Severity scores
    ↓
[Environmental Fusion] → Risk modifiers
    ↓
[Safety Checks] → Validation
    ↓
[Actuation Controller] → Spray zones
    ↓
[Logging] → Mission record
```

## Core Modules

### 1. Vision Module (`src/agridrone/vision/`)

Detects hotspot classes using YOLO or similar deep learning models.

**Key Components:**
- `infer.py` - Inference pipeline
- `train.py` - Model training (future)
- `postprocess.py` - Post-processing and NMS
- `uncertainty.py` - Uncertainty estimation (optional)

**Interfaces:**
- Input: RGB image (numpy array)
- Output: DetectionBatch with Detection objects

**Configuration:**
- `configs/model.yaml` - Model architecture and inference parameters

### 2. Geospatial Module (`src/agridrone/geo/`)

Links image detections to field coordinates and generates tiled grids.

**Key Components:**
- `georef.py` - Pixel-to-geo coordinate transformation
- `grid.py` - Regular grid generation
- `shapefile.py` - Shapefile export

**Interfaces:**
- Input: Detection + CameraFrame (with GNSS)
- Output: GeoCoordinate or GridCell

**Configuration:**
- `configs/base.yaml` - CRS and grid parameters

### 3. Prescription Engine (`src/agridrone/prescription/`)

Converts detections into actionable spray recommendations using deterministic rules.

**Key Components:**
- `rules.py` - Rule-based prescription engine
- `severity.py` - Severity scoring
- `optimize.py` - Optimization methods (future)

**Interfaces:**
- Input: PrescriptionMap with GridCell severity scores
- Output: PrescriptionMap with recommended_action and spray_rate

**Configuration:**
- `configs/prescription.yaml` - Thresholds and spray rates

### 4. Environmental Fusion (`src/agridrone/environment/`)

Attaches environmental context and modifies prescriptions.

**Key Components:**
- `features.py` - Feature extraction and attachment
- `fusion.py` - Multi-sensor fusion

**Interfaces:**
- Input: Temperature, humidity, wind speed, etc.
- Output: GridCell with env_features attached

### 5. Actuation Module (`src/agridrone/actuation/`)

Controls sprayer hardware with mandatory safety interlocks.

**Key Components:**
- `controller.py` - Sprayer controller interface
- `safety.py` - Safety checks and validation
- `nozzle_logic.py` - Nozzle control logic
- `mock_controller.py` - Mock for testing

**Interfaces:**
- Input: ActuationPlan
- Output: ActuationEvent log

**Configuration:**
- `configs/actuation.yaml` - Hardware pins, safety settings

### 6. Simulation Module (`src/agridrone/sim/`)

Generates synthetic fields and enables closed-loop testing.

**Key Components:**
- `field_generator.py` - Synthetic field generation
- `infestation.py` - Hotspot distribution
- `spraying.py` - Spray outcome simulation
- `metrics.py` - Evaluation metrics

### 7. Runtime Module (`src/agridrone/runtime/`)

Orchestrates end-to-end pipeline execution.

**Key Components:**
- `pipeline.py` - Main execution pipeline
- `mission_state.py` - Mission state tracking
- `decision_engine.py` - Decision logic

### 8. API Module (`src/agridrone/api/`)

FastAPI-based REST API for mission control and monitoring.

**Endpoints:**
- `GET /` - Root health check
- `POST /missions` - Create mission
- `GET /missions/{id}` - Get mission details
- `POST /missions/{id}/detect` - Run detection
- `POST /missions/{id}/prescribe` - Generate prescription

## Data Flow

### Offline Research Workflow

```
Raw Images → Detection → Labels
                ↓
                ├→ Model Training
                ├→ Visualization
                └→ Metrics
```

### Runtime Workflow

```
Drone Capture
    ↓
[Image Ingestion]
    ↓
[Detection Inference]
    ↓
[Georeferencing]
    ↓
[Grid Generation]
    ↓
[Prescription Engine]
    ↓
[Environmental Fusion]
    ↓
[Safety Validation]
    ↓
[Human Review]
    ↓
[Actuation] (if approved)
    ↓
[Logging]
```

## Safety Design

### Safety Hierarchy

1. **Hardware Failsafe** - Sprayer defaults to OFF
2. **Software Interlocks** - Mandatory flags must be set
3. **Configuration Lockouts** - DRY_RUN and TEST_FLUID_ONLY modes
4. **Deterministic Rules** - No black-box decisions for actuation
5. **Human Review** - Operator approval before spray
6. **Audit Trail** - Complete logging of decisions

### Required Safety Flags

- `DRY_RUN=true` - Disables all actuation
- `SAFE_TEST_FLUID_ONLY=true` - Only allows test fluid
- Manual approval required before any real spray

### Decision Chain

Every spray decision must pass through:

1. Detection model (confidence score)
2. Postprocessing (overlap resolution)
3. Environmental fusion (risk modifiers)
4. Prescription engine (deterministic rules)
5. Safety validation (interlock checks)
6. Human review (operator approval)
7. Logging (complete audit trail)

## Configuration System

Settings loaded from (in order):
1. `.env` file (environment variables)
2. `configs/*.yaml` files (structured config)
3. Runtime overrides

Use `ConfigManager` to access:
```python
from agridrone import get_config
config = get_config()
severity_threshold = config.get("prescription.thresholds.high_severity")
```

## Type System

All modules use Pydantic models for safe data interchange:

- `Mission` - Mission metadata and telemetry
- `Detection` - Single detection output
- `DetectionBatch` - Batch of detections
- `GridCell` - Single prescription cell
- `PrescriptionMap` - Complete prescription map
- `ActuationEvent` - Spray actuation record
- `ActuationLog` - Mission actuation history

## Testing Strategy

### Unit Tests (`tests/unit/`)
- Prescription rule logic
- Coordinate transformations
- Data model validation
- Utility functions

### Integration Tests (`tests/integration/`)
- End-to-end pipeline
- Image→detection→prescription→actuation
- Data export formats

### Simulation Tests (`tests/sim/`)
- Synthetic field generation
- Closed-loop mission replay
- Reproducibility under fixed seeds

## Performance Targets

- **Inference**: <100ms per image on GPU
- **Prescription**: <1s for 1000-cell grid
- **Memory**: <2GB for typical mission
- **Throughput**: Real-time during flight

## Future Extensions

- **Multi-spectral Support** - Thermal, near-infrared
- **Machine Learning Prescription** - Learn optimal thresholds
- **Reinforcement Learning** - Adaptive spray policies
- **ROS Integration** - Drone middleware support
- **Edge Deployment** - ONNX runtime on Jetson
