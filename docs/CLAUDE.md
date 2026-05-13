# CLAUDE.md

## Project
**AgriAnalyze Selective Spraying Research Prototype**

Low-cost research prototype for site-specific weed/pest/disease hotspot detection and prescription-map generation using a small drone, RGB camera, environmental sensing, and controlled selective spraying.

This is a **research system**, not a production pesticide platform. The system must prioritize safety, simulation-first development, reproducibility, and modularity.

---

## Core Goal
Build a low-cost, extensible precision-agriculture stack that can:

1. Capture aerial imagery from a drone flight.
2. Ingest environmental variables such as temperature and humidity.
3. Detect stress hotspots such as weeds, visible disease patches, or pest-affected zones.
4. Generate a georeferenced prescription map.
5. Optionally actuate a **test-fluid-only** spraying module in controlled conditions.
6. Log all sensing, inference, decisions, and actuation for later evaluation.

---

## Non-Negotiable Safety Rules

- Treat this project as a **research prototype** only.
- Do **not** optimize or generate code that encourages real-world unsafe pesticide deployment.
- Default all spray demos to **water or harmless colored test fluid only**.
- Never assume field legality, aviation approval, or spraying approval.
- Keep a software safety interlock so spray actuation is disabled unless explicitly enabled in a safe test mode.
- Never auto-trigger spraying solely from an LLM response.
- All actuation decisions must pass through deterministic rule checks.
- Maintain a full audit trail for every recommendation and actuation event.

---

## Development Philosophy

- Start **simulation-first**, then move to bench tests, then outdoor non-spray imaging, then controlled test-fluid actuation.
- Prefer reproducible, boring, debuggable engineering over flashy demos.
- Keep the system modular so each part can be swapped independently.
- Use open-source tools whenever practical.
- Optimize for research value, clarity, and testability.

---

## Recommended Technical Stack

### Language
- Python 3.11+

### Core Libraries
- `opencv-python`
- `numpy`
- `pandas`
- `scipy`
- `pydantic`
- `fastapi`
- `uvicorn`
- `torch`
- `torchvision`
- `ultralytics` for YOLO baselines
- `rasterio`
- `geopandas`
- `shapely`
- `pyproj`
- `networkx`
- `matplotlib`
- `plotly`
- `albumentations`
- `hydra-core` or `omegaconf`
- `pytest`
- `rich`
- `loguru`

### Optional
- `segment-anything` or lightweight segmentation wrappers
- `onnxruntime` for edge deployment
- `stable-baselines3` for RL experiments
- `pymavlink` or `dronekit` depending on flight stack
- `ros2` only if needed; avoid early overengineering

### Hardware Targets
- Research frame or Pixhawk-based platform
- RGB camera first
- Optional: thermal or multispectral later
- Optional onboard compute: Raspberry Pi 5 or Jetson Nano/Orin Nano
- Temp/humidity sensor connected via microcontroller or SBC

---

## Repository Intent
This repository should support both:

1. **Offline research workflow**
   - image ingestion
   - labeling
   - model training
   - map generation
   - evaluation

2. **Prototype runtime workflow**
   - data capture
   - inference
   - prescription generation
   - operator review
   - optional test-fluid actuation

---

## Suggested Repository Structure

```text
agri-analyze-selective-spray/
├── CLAUDE.md
├── README.md
├── pyproject.toml
├── requirements.txt
├── .env.example
├── configs/
│   ├── base.yaml
│   ├── data.yaml
│   ├── model.yaml
│   ├── inference.yaml
│   ├── prescription.yaml
│   ├── actuation.yaml
│   └── sim.yaml
├── data/
│   ├── raw/
│   ├── interim/
│   ├── processed/
│   ├── labels/
│   ├── orthomosaics/
│   └── sample/
├── docs/
│   ├── architecture.md
│   ├── api.md
│   ├── hardware.md
│   ├── safety.md
│   ├── evaluation.md
│   └── field_protocol.md
├── notebooks/
│   ├── eda.ipynb
│   ├── model_debug.ipynb
│   └── prescription_debug.ipynb
├── scripts/
│   ├── prepare_dataset.py
│   ├── train_detector.py
│   ├── run_inference.py
│   ├── build_prescription_map.py
│   ├── evaluate_pipeline.py
│   ├── simulate_field.py
│   └── replay_mission.py
├── src/
│   └── agrianalyze/
│       ├── __init__.py
│       ├── config.py
│       ├── logging.py
│       ├── types/
│       │   ├── mission.py
│       │   ├── detections.py
│       │   ├── mapdata.py
│       │   └── actuation.py
│       ├── io/
│       │   ├── image_loader.py
│       │   ├── telemetry_loader.py
│       │   ├── sensor_loader.py
│       │   └── exporters.py
│       ├── vision/
│       │   ├── dataset.py
│       │   ├── augment.py
│       │   ├── train.py
│       │   ├── infer.py
│       │   ├── postprocess.py
│       │   └── uncertainty.py
│       ├── geo/
│       │   ├── orthomosaic.py
│       │   ├── georef.py
│       │   ├── tiling.py
│       │   └── shapefile.py
│       ├── environment/
│       │   ├── features.py
│       │   └── fusion.py
│       ├── prescription/
│       │   ├── grid.py
│       │   ├── severity.py
│       │   ├── rules.py
│       │   ├── optimize.py
│       │   └── export.py
│       ├── actuation/
│       │   ├── controller.py
│       │   ├── safety.py
│       │   ├── nozzle_logic.py
│       │   └── mock_controller.py
│       ├── sim/
│       │   ├── field_generator.py
│       │   ├── infestation.py
│       │   ├── spraying.py
│       │   └── metrics.py
│       ├── runtime/
│       │   ├── pipeline.py
│       │   ├── mission_state.py
│       │   └── decision_engine.py
│       ├── api/
│       │   ├── app.py
│       │   └── routes/
│       └── ui/
│           ├── dashboard_schema.py
│           └── review_payloads.py
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
└── outputs/
    ├── runs/
    ├── reports/
    ├── maps/
    └── logs/
```

---

## Functional Modules

### 1. Vision Module
Responsibilities:
- ingest drone images or stitched orthomosaics
- detect hotspot classes such as weeds, disease patches, pest clusters, or generic anomaly regions
- support bounding box and segmentation modes
- output confidence and uncertainty

Implementation notes:
- start with YOLOv8-seg baseline
- keep model wrapper generic so future ViT or segmentation models can be plugged in
- all outputs must be normalized into one internal detection schema

### 2. Environmental Fusion Module
Responsibilities:
- ingest temperature, humidity, timestamp, and optional wind or soil metadata
- attach environmental context to detections or grid cells
- compute simple risk modifiers

Initial approach:
- use deterministic fusion rules first
- do not overcomplicate with LLM-based reasoning

### 3. Geospatial Module
Responsibilities:
- link image detections to field coordinates
- generate tiled field grids
- export GeoJSON, shapefile, CSV, and simple raster heatmaps

### 4. Prescription Module
Responsibilities:
- convert detections into actionable spray zones
- produce grid-cell severity scores
- generate spray/no-spray or variable-rate outputs

Initial algorithm:
- rule-based severity thresholding
- later add constrained optimization
- RL is optional and should only follow a stable deterministic baseline

### 5. Actuation Module
Responsibilities:
- mock spraying in simulation
- support GPIO or serial-based sprayer trigger for safe lab tests
- enforce safety lockouts

Safety requirements:
- must support `DRY_RUN=true`
- must support `SAFE_TEST_FLUID_ONLY=true`
- must fail closed

### 6. Simulation Module
Responsibilities:
- create synthetic field layouts
- simulate hotspot spread or distribution
- simulate drone coverage and prescription outcomes
- enable offline stress testing

### 7. API and Dashboard Module
Responsibilities:
- expose mission logs, detections, prescription maps, and actuation traces
- allow human review before any actuation
- show why a zone was flagged

---

## Coding Rules for Claude

When working in this repository, follow these rules:

1. Prefer small, composable functions.
2. Use type hints everywhere practical.
3. Use dataclasses or Pydantic models for shared schemas.
4. Never hardcode paths; use config.
5. Never mix training code with inference code in the same script unless clearly separated.
6. Keep deterministic baselines before introducing RL or LLM layers.
7. All modules must log key events, but avoid noisy logs in hot loops.
8. Add tests for any nontrivial business logic.
9. Avoid silent failure.
10. Fail with clear error messages that help field debugging.

---

## Decision Policy Rules

The system must not directly translate raw model outputs into real actuation.

Required decision chain:

1. Detection model produces hotspots with confidence.
2. Postprocessing cleans overlaps and artifacts.
3. Environmental fusion adjusts or annotates severity.
4. Prescription engine applies deterministic policy.
5. Safety rules validate mission mode and allowed actuation state.
6. Human review remains available unless explicitly running a controlled autonomous test mode.

At every stage, log:
- timestamp
- input file or mission id
- model version
- config version
- confidence score
- chosen prescription
- reason code

---

## Baseline Research Questions

Claude should keep development aligned with these research questions:

1. Can low-cost RGB imagery detect actionable hotspots well enough for patch spraying?
2. Does adding temperature/humidity improve prescription quality?
3. How much treated area can be reduced relative to uniform spraying?
4. How robust is the system under varying image quality, altitude, and lighting?
5. Does simulation help improve real-world transfer or debugging?

---

## Minimum Viable Prototype

### MVP Scope
- ingest field images from a cheap drone
- detect weed-like or anomaly patches from RGB imagery
- attach temperature and humidity metadata
- generate a field grid with spray recommendations
- export a prescription map as GeoJSON/CSV
- simulate spray actuation in software
- optionally trigger a bench sprayer with water only

### Out of Scope for MVP
- real pesticide deployment
- autonomous beyond-visual-line-of-sight operations
- sophisticated swarm coordination
- heavy ROS stack
- end-to-end LLM control of flight or spraying

---

## Phase-wise Roadmap

### Phase 0: Skeleton
- set up repo
- define config system
- define shared schemas
- add logging and test harness

### Phase 1: Offline Image Pipeline
- ingest images
- train basic detector
- run inference on sample farm data
- export overlays and CSV hotspot tables

### Phase 2: Prescription Mapping
- georeference detections
- grid the field
- assign severity and spray classes
- export map files

### Phase 3: Environmental Fusion
- ingest sensor data
- attach environmental features to zones
- implement rule-based risk modifiers

### Phase 4: Simulation
- synthetic field generator
- hotspot simulator
- closed-loop replay and metrics

### Phase 5: Controlled Actuation
- bench test pump/nozzle controller
- dry run mode
- water-only spray demo
- mission replay logs

### Phase 6: Real Prototype Validation
- outdoor image capture only
- compare map outputs against manual inspection
- evaluate precision/coverage/treated area savings

---

## Preferred First Tasks for Claude

When starting from scratch, do the following in order:

1. Create the repository skeleton.
2. Implement shared Pydantic models for mission, detections, and prescription cells.
3. Implement a simple image ingestion and inference interface.
4. Create a rule-based prescription engine.
5. Add exporters for CSV and GeoJSON.
6. Add a mock actuation controller.
7. Build a pipeline runner that chains all modules.
8. Add unit tests for prescription logic.

---

## Data Contracts

### Detection Output Schema
Each detection or segment should contain:
- `id`
- `class_name`
- `confidence`
- `uncertainty` if available
- `bbox` or `polygon`
- `severity_score`
- `source_image`
- `timestamp`
- `geo_reference` if available

### Prescription Cell Schema
Each grid cell should contain:
- `cell_id`
- `geometry`
- `hotspot_fraction`
- `severity_score`
- `env_features`
- `recommended_action`
- `spray_rate`
- `reason_codes`

### Mission Log Schema
Each mission should log:
- mission metadata
- sensor metadata
- model version
- config checksum
- outputs generated
- actuation events
- safety state

---

## Evaluation Metrics

### Vision
- precision
- recall
- F1
- IoU or mAP
- calibration or uncertainty reliability

### Prescription
- treated area ratio
- overlap with target zones
- false treatment ratio
- missed hotspot ratio

### Runtime
- inference latency
- map generation latency
- memory usage
- edge deployability

### Field Research
- estimated chemical savings
- estimated hotspot coverage
- operator review time
- agreement with manual scouting

---

## Prompting and AI Usage Rules

If LLMs are used anywhere in this project:

- never let an LLM directly control actuators
- use LLMs only for explanation, summarization, operator assistance, or code generation
- core field decisions must remain deterministic or model-based with explicit thresholds
- every LLM output must be treated as advisory only

---

## Documentation Expectations

Whenever Claude adds a major module, also update:
- `README.md`
- `docs/architecture.md`
- `docs/api.md` if endpoints changed
- `docs/safety.md` if actuation logic changed

Each new module should include:
- purpose
- inputs
- outputs
- failure modes
- test strategy

---

## Testing Expectations

### Unit Tests
Cover:
- prescription threshold logic
- environmental fusion logic
- geometry conversion helpers
- exporter correctness
- safety interlocks

### Integration Tests
Cover:
- image to detection
- detection to prescription map
- prescription to mock actuation

### Simulation Tests
Cover:
- synthetic hotspot generation stability
- reproducibility under fixed seeds
- replay consistency

---

## Anti-Patterns to Avoid

Do not:
- build a giant monolithic notebook as the primary system
- tie core logic to one model vendor or API
- hide business logic inside UI callbacks
- use brittle magic constants without config
- introduce RL before deterministic baselines work
- claim production readiness
- market unsafe pesticide automation

---

## Ideal Deliverables

The repository should eventually produce:

1. A working offline hotspot detection pipeline.
2. A prescription-map generator with exports.
3. A simulated closed-loop evaluation mode.
4. A controlled water-only actuation demo.
5. A reproducible experiment report.
6. A short demo video script and sample outputs.

---

## Example Research Positioning

Use language like:

> Low-cost research prototype for site-specific crop protection using aerial imagery, environmental sensing, and prescription-map generation.

Avoid language like:

> Fully autonomous pesticide drone ready for farm deployment.

---

## Definition of Done for Early Milestone

An early milestone is complete when the system can:
- read sample drone images
- detect hotspots using a baseline model
- generate a georeferenced grid or pseudo-grid
- output spray/no-spray recommendations with reason codes
- simulate actuation in dry-run mode
- save logs and visual overlays

---

## Final Instruction to Claude

When uncertain, choose the path that improves:
1. safety
2. reproducibility
3. modularity
4. clarity of research contribution
5. ease of future field validation

Always assume this repository is being built for a professor or research lab review. Code and documentation should therefore be clean, defensible, and easy to demo.