# agridrone — Python Package (Backend Core)

This is the main Python package for the AgriDrone backend.
It is a **FastAPI** application that exposes REST endpoints for crop disease detection.

## Folder Map

```
agridrone/
│
├── api/            ← HTTP layer — FastAPI app, all routes, request/response schemas
│   ├── app.py      ← Entry point: creates FastAPI app, mounts routes, physics gate (Layer 1)
│   ├── schemas.py  ← Pydantic models for API request & response bodies
│   └── routes/     ← One file per feature area (detection, field, reports, voice …)
│
├── core/           ← Business logic — crop-type gating, detection, yield estimation
│   ├── crop_type_gate.py  ← Layer 2: decides wheat vs rice using YOLO softmax groups
│   ├── detector.py        ← Wraps YOLOv8 model, runs inference
│   └── spectral_features.py  ← Physics indices (GLI, ExG, NGRDI …)
│
├── vision/         ← AI / ML pipeline — ensemble voting, rule engine, LLM validator
│   ├── ensemble_voter.py     ← Combines YOLO + LLaVA + rules into one prediction
│   ├── disease_reasoning.py  ← Orchestrates the full inference pipeline
│   ├── rule_engine.py        ← Agronomic rule-based scoring
│   └── llm_validator.py      ← Calls Ollama/LLaVA for visual confirmation
│
├── knowledge/      ← Domain knowledge — disease profiles, KB loader
│   ├── diseases.json  ← 21 disease profiles + 10 differentials + 9 seasonal stages
│   └── kb_loader.py   ← Read/query diseases.json (DiseaseProfile dataclass)
│
├── services/       ← External integrations (weather APIs, phone bridge, etc.)
│
├── config.py       ← Central configuration (model paths, thresholds, class lists)
└── __init__.py     ← Package init, version string
```

## How to Run

```bash
# From the project root (agri-drone/)
uvicorn agridrone.api.app:app --host 127.0.0.1 --port 9000 --reload
```

## Key Design Decisions

| Layer | File | Purpose |
|-------|------|---------|
| L1 Physics Gate | `api/app.py` | Rejects non-plant images (HSV, GLI, face detection) |
| L2 Crop-Type Gate | `core/crop_type_gate.py` | Identifies wheat vs rice before running classifier |
| L3 Classifier | `vision/ensemble_voter.py` | 60% LLaVA + 40% YOLOv8n-cls, 21 classes |
