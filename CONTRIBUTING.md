# Contributing to AgriAnalyze

Thanks for your interest in contributing! This guide will help you get started.

## Quick Start

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/agri-analyze.git
cd agri-analyze

# 2. Create a virtual environment
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # Linux/Mac

# 3. Install in dev mode
pip install -e ".[dev]"

# 4. Run the linter
ruff check .

# 5. Run tests
pytest -q tests/regression
python scripts/smoke_test.py --verbose

# 6. Start the API locally
cd src && python -m uvicorn agrianalyze.api.app:get_app --factory --port 9000
```

## Development Workflow

1. **Fork** the repo and create a feature branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```

2. **Make your changes** — keep commits small and focused.

3. **Lint and test** before pushing:
   ```bash
   ruff check .
   pytest -q tests/regression
   ```

4. **Push** and open a Pull Request against `main`.

5. **CI must pass** — your PR will be checked by:
   - Ruff linting
   - Regression tests
   - CodeQL security scan
   - Trivy secret scan
   - Dependency review

## What Can I Work On?

- Check [Issues](https://github.com/Ashut0sh-mishra/agri-analyze/issues) — look for `good first issue` and `help wanted` labels.
- Disease detection improvements (new crops, better rules)
- Frontend UI/UX enhancements
- Documentation and tutorials
- Performance optimizations
- Test coverage

## Code Style

- **Python**: Follows [Ruff](https://docs.astral.sh/ruff/) defaults. Run `ruff check .` before committing.
- **JavaScript/React**: Standard Vite + React patterns. Use functional components.
- **Commits**: Use [Conventional Commits](https://www.conventionalcommits.org/):
  - `feat:` new feature
  - `fix:` bug fix
  - `docs:` documentation
  - `ci:` CI/CD changes
  - `refactor:` code restructuring
  - `test:` adding tests

## Project Structure

```
agri-analyze/
├── src/agrianalyze/          # Main Python package
│   ├── api/                # FastAPI endpoints
│   ├── core/               # Detection, classification, spectral
│   ├── vision/             # Disease reasoning, rules, Grad-CAM
│   ├── knowledge/          # Disease KB, research RAG
│   └── services/           # LLM, reports
├── configs/                # YAML configs
├── models/                 # Trained model weights (.pt)
├── tests/                  # Test suite
├── scripts/                # Utility scripts
├── deploy/                 # HF Spaces deployment files
└── frontend/               # (see agri-analyze-frontend repo)
```

## Pull Request Guidelines

- **One concern per PR** — don't mix features with refactors.
- **Write a clear description** — what changed and why.
- **Link issues** — use `Fixes #123` or `Closes #123`.
- **Don't break CI** — all checks must pass.
- **No secrets** — never commit API keys, tokens, or credentials.

## Security

- Read [SECURITY.md](SECURITY.md) for vulnerability reporting.
- Never commit credentials or disable security checks.
- All user input must be validated (FastAPI does this via Pydantic schemas).

## Questions?

Open a [Discussion](https://github.com/Ashut0sh-mishra/agri-analyze/discussions) or reach out via Issues.
