# tests/ — Test Suite

All automated tests live here. We use **pytest**.

## Structure

```
tests/
├── unit/           ← Fast, isolated tests — no external services needed
│   ├── test_models.py       Tests for model loading and inference shapes
│   ├── test_prescription.py Tests for prescription map generation logic
│   └── test_vision.py       Tests for vision pipeline components
│
├── integration/    ← Slower tests that spin up the real FastAPI app or call Ollama
│   ├── test_detection_api.py  End-to-end: upload image → check response shape
│   ├── test_gate_edge_cases.py Tests physics gate (L1) and crop-type gate (L2)
│   ├── test_kb_integration.py  Tests knowledge base loading and queries
│   ├── test_pipeline.py        Full pipeline: image → ensemble prediction
│   ├── test_phone_pipeline.py  Mobile camera pipeline tests
│   ├── test_llava_latency.py   LLaVA response time benchmarks
│   ├── test_llava_poll.py      LLaVA polling / async behaviour
│   ├── test_llm_validator.py   LLM validator output format checks
│   ├── test_f_features.py      Feature extractor output checks
│   ├── test_phone_speed.py     Mobile pipeline speed benchmarks
│   └── test_fix.py             Regression test for past bug fixes
│
├── regression/     ← Tests that guard against previously fixed bugs
└── fixtures/       ← Shared test images, mock data, and pytest fixtures
```

## How to Run

```bash
# Run all tests
pytest

# Run only unit tests (fast, no GPU/Ollama needed)
pytest tests/unit/

# Run a specific file
pytest tests/integration/test_detection_api.py -v

# Run with coverage report
pytest --cov=agrianalyze --cov-report=html
```

## Requirements

- Unit tests: Python + the agrianalyze package installed (`pip install -e .`)
- Integration tests: API server running on port 9000 + Ollama on port 11434
  - Start the API: `uvicorn agrianalyze.api.app:app --port 9000`
  - Start Ollama: `ollama serve`

## CI

Tests run automatically on every pull request via GitHub Actions (`.github/workflows/`).
