# Changelog

All notable changes to AgriDrone are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project aims to adhere to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added
- Comprehensive Google-style module docstring for `src/agridrone/api/app.py`
  documenting the full backend surface (gatekeeper, crop-type gate,
  classifier, LLaVA, Grad-CAM, RAG, structured output).
- Docstrings for `get_app()` and module-level `__getattr__` in `app.py`.
- JSDoc file headers for every React component under
  `frontend/src/components/` (25 files).
- Refreshed `docs/architecture.md` with the current monorepo layout,
  request lifecycle, layer boundaries, and deployment targets. Legacy
  spray-drone sections preserved below the new content.
- This `CHANGELOG.md` file.

### Fixed
- `/api/dataset/stats` now handles YOLO-style `images/`, `Images/`,
  `JPEGImages/` subfolders inside class directories, so the Dataset
  Collector dashboard no longer shows 0 classes / 0 images for
  externally-sourced datasets such as PDT.

### Removed (housekeeping — all untracked files)
- Root-level duplicate YOLOv8 base weights (`yolov8n.pt`,
  `yolov8n-cls.pt`, `yolov8n-seg.pt`) — canonical copies already live
  in `models/`.
- Stray `src/yolov8n-seg.pt` weight file inside the Python package.
- Obsolete `README_old.md`.

---

## [1.0.0] — 2026-04-11

Publication-ready snapshot accompanying the manuscript submission.

### Added
- Springer LNCS LaTeX paper (`paper/main.tex`) ready for
  CVPPA / PlantCLEF submission.
- Multi-backbone evaluation script plus EfficientNet-B0 predictions
  (`evaluate/results/predictions_A_efficientnet_b0.csv`,
  `evaluate/results/efficientnet_results.json`).
- Holm-Bonferroni per-class correction (0/21 classes significant)
  plus `holm_bonferroni_perclass.{csv,json}`.
- Cross-dataset PDT evaluation (`cross_dataset_PDT.json` —
  accuracy 0.8438 on 672 held-out images).
- Bootstrap confidence intervals (n_boot = 10,000) for all
  pipeline variants A/B/C (`statistical_tests.json`).
- Mega-dataset classification training Colab notebook
  (`notebooks/AgriDrone_Mega_Dataset_CLS_Training.ipynb`).
- Hugging Face Spaces auto-deploy GitHub Action + `deploy/Dockerfile.hf`.
- Render blueprint (`render.yaml`) for one-click backend deploy.
- CITATION.cff, CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md.

### Changed
- Hardened CI workflow permissions, added Dependabot labels, added
  Trivy security scanning.
- Bumped core dependencies: FastAPI 0.121 → 0.136, Torch 2.5 → 2.11,
  torchvision 0.20 → 0.26, uvicorn 0.39 → 0.44, numpy 2.3 → 2.4,
  pandas 2.3 → 3.0, ruff 0.14 → 0.15.
- GPU-OOM fixes in the training pipeline; removed all hard-coded
  API keys in favour of environment variables.
- Plant gatekeeper (Layer 1) now accepts brown/diseased vegetation
  rather than rejecting it as non-plant.

### Fixed
- README clone URL and DOI placeholders reflect canonical
  `Ashut0sh-mishra/agri-drone`.
- CITATION.cff repository URLs point to canonical upstream.

---

## [0.9.0] — 2026-03

### Added
- Kaggle Notebooks port of the matrix runner (T4×2, 30 h/week free tier).
- `/api/ml/matrix` endpoint reading Colab `per_run.jsonl` artifacts
  with local + Google-Drive-desktop-mount fallbacks.
- Global kaggle-source fallbacks (BD / India / US / EU mirrors)
  for dataset downloads.
- Initial research-paper drafts (matrix + ablation + EML) under
  `docs/archive_manuscripts/`.
- Honest negative-result workshop draft and 5-backbone matrix
  with ResNet50 support.

---

## [0.8.0] — 2026-02

### Added
- Rule engine, ensemble voter, LLaVA second-opinion validator,
  disease-reasoning and Grad-CAM modules in `src/agridrone/vision/`.
- Frontend `ResultViewer` with Original / Grad-CAM / Healthy Ref
  tabs, confidence breakdown, reasoning chain, AI validation card,
  ensemble voting, temporal tracker and research-paper references.
- MC-Dropout uncertainty wrapper (`src/agridrone/core/detector.py`)
  with active-learning sink for low-confidence cases.
- Dataset Collector dashboard with drag-and-drop upload and
  per-class deletion.

---

## [0.1.0] — 2025

Initial prototype: YOLOv8 classifier + FastAPI backend + React dashboard.

### Added
- Core `agridrone` Python package with `src/` layout and
  `pyproject.toml`.
- FastAPI application factory (`agridrone.api.app:create_app`).
- Tailwind + Vite + React dashboard scaffolding.
- Dockerfile, docker-compose.yml for CPU-only local deployment.

[Unreleased]: https://github.com/Ashut0sh-mishra/agri-drone/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Ashut0sh-mishra/agri-drone/releases/tag/v1.0.0
[0.9.0]: https://github.com/Ashut0sh-mishra/agri-drone/releases/tag/v0.9.0
[0.8.0]: https://github.com/Ashut0sh-mishra/agri-drone/releases/tag/v0.8.0
[0.1.0]: https://github.com/Ashut0sh-mishra/agri-drone/releases/tag/v0.1.0
