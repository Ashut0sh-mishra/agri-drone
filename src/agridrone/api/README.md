# api/ — HTTP Layer (FastAPI Routes)

All HTTP-facing code lives here. Nothing in this folder should contain
business logic — it just **receives requests, validates input, calls core/vision, returns responses**.

## Files

| File | What it does |
|------|-------------|
| `app.py` | Creates the FastAPI app instance, registers all routers, runs Layer-1 physics gate |
| `schemas.py` | Pydantic models: `DetectionRequest`, `DetectionResponse`, `FieldReport`, etc. |
| `structured_output.py` | Helpers to format LLM output into structured JSON |

## Routes (`routes/`)

| File | Endpoint prefix | Description |
|------|----------------|-------------|
| `detection.py` | `/detect` | Upload image → get disease diagnosis |
| `analysis.py` | `/analysis` | Aggregate field-level analysis |
| `field.py` | `/field` | Field management (register, list fields) |
| `reports.py` | `/reports` | Generate PDF/JSON reports |
| `chat.py` | `/chat` | Conversational Q&A about detected diseases |
| `voice.py` | `/voice` | Voice input pipeline (speech → diagnosis) |
| `stream.py` | `/stream` | Server-Sent Events for live progress updates |
| `universal.py` | `/` | Root-level fallback endpoints |

## Adding a New Endpoint

1. Create a new file in `routes/` (e.g. `routes/weather.py`)
2. Define an `APIRouter` and add your path operations
3. Import and mount it in `app.py` with `app.include_router(...)`
4. Add request/response Pydantic models to `schemas.py`
