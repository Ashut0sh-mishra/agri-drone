# AgriAnalyze — Final Submission Checklist

> Generated: April 10, 2026

## Paper

- [x] `RESEARCH_PAPER_FINAL.md` — Complete (8 sections + 3 appendices, ~4,800 words)
- [x] Wheat numbers verified: Config A = 96.9% (96.88%), Config B = 39.1% (39.06%)
- [x] 21-class numbers verified: Config A = 96.15%, Config B = 60.17%
- [x] Abstract matches all experimental results
- [x] References: 19 citations
- [x] All tables and figures referenced

## Models

- [x] `models/india_agri_cls_21class_backup.pt` — 21-class YOLOv8n-cls (1.44M params, 96.15% accuracy)
- [x] `models/wheat_cls_v1.pt` — 4-class wheat YOLOv8n-cls (96.9% accuracy)
- [x] `models/india_agri_cls.pt` — Original 21-class model
- [x] `models/efficientnet_b0_21class.pt` — EfficientNet-B0 baseline (partial, not needed)

## Evaluation Results — 21-Class

- [x] `evaluate/results/ablation_table.csv` — Config A vs B per-class metrics
- [x] `evaluate/results/ablation_summary.json` — Aggregate metrics
- [x] `evaluate/results/ablation_latex.tex` — LaTeX table
- [x] `evaluate/results/confusion_matrix_A.png` — Config A confusion matrix
- [x] `evaluate/results/confusion_matrix_B.png` — Config B confusion matrix
- [x] `evaluate/results/predictions_A_yolo_only.csv` — Per-image predictions
- [x] `evaluate/results/predictions_B_yolo_rules.csv` — Per-image predictions

## Evaluation Results — Wheat-Specific

- [x] `evaluate/results_wheat/ablation_table.csv` — 4-class ablation
- [x] `evaluate/results_wheat/ablation_summary.json`
- [x] `evaluate/results_wheat/confusion_matrix_A.png`
- [x] `evaluate/results_wheat/confusion_matrix_B.png`
- [x] `evaluate/results_wheat/predictions_A_yolo_only.csv`
- [x] `evaluate/results_wheat/predictions_B_yolo_rules.csv`

## Sensitivity Analysis

- [x] `evaluate/results/sensitivity_grid.csv` — 125-config sweep
- [x] `evaluate/results/sensitivity_summary.json` — F1 σ = 0.0087
- [x] `evaluate/results/sensitivity_stripe_vs_color.png` — Heatmap
- [x] `evaluate/results/sensitivity_stripe_vs_threshold.png` — Heatmap

## EML (Expected Monetary Loss)

- [x] `evaluate/results/eml_comparison.csv` — Per-disease costs
- [x] `evaluate/results/eml_summary.json` — A = ₹294, B = ₹2,769
- [x] `evaluate/results/eml_bar_chart.png` — Visual comparison

## Robustness / Noise

- [x] `evaluate/results/robustness_summary.json` — 96.15% → 9.31%
- [x] `evaluate/results/robustness_report.txt` — Human-readable report
- [x] `evaluate/results/noisy_eval.csv` — Per-image noisy predictions
- [x] `evaluate/results/confusion_matrix_noisy.png`

## LLaVA Evaluation (21-sample preliminary)

- [x] `evaluate/results/llava_analysis.csv` — Per-image predictions
- [x] `evaluate/results/hh_ratio.json` — Help:Harm = 1.33, +4.76pp accuracy
- [x] `evaluate/results/mcnemar.json` — χ² = 0.0, p = 1.0 (not significant at n=21)

## Backend

- [x] `src/agrianalyze/` — FastAPI backend (Python 3.12)
- [x] `src/agrianalyze/api/app.py` — Main API with `/detect`, `/health`
- [x] `src/agrianalyze/vision/classifier.py` — YOLO inference
- [x] `src/agrianalyze/vision/ensemble_voter.py` — Bayesian voting
- [x] `src/agrianalyze/vision/llm_validator.py` — LLaVA integration
- [x] `configs/*.yaml` — All configuration files
- [x] `requirements.txt` — Python dependencies

## Frontend

- [x] `agri-analyze-frontend/` — React + Vite + TailwindCSS
- [x] `agri-analyze-frontend/dist/` — Built production bundle
- [x] Issue 1 ✓ — "New Scan" button moved to top of results
- [x] Issue 2 ✓ — Multi-image upload with "Scan All" batch mode
- [x] Issue 3 ✓ — Camera capture (CameraCapture.jsx, front/rear switch)
- [x] Issue 4 ✓ — YouTube URL frame extraction (YouTubeFrames.jsx)
- [x] Issue 5 ✓ — Phone format support (HEIC, BMP, WebP → JPEG conversion)
- [x] Issue 6 ✓ — Page-wide drag-and-drop, sample images, batch progress bar

## Evaluation Scripts

- [x] `evaluate/ablation_study.py` — Main ablation
- [x] `evaluate/sensitivity_analysis.py` — 125-config sweep
- [x] `evaluate/eml_analysis.py` — Economic analysis
- [x] `evaluate/noise_pipeline.py` — Noise augmentation
- [x] `evaluate/robustness_eval.py` — Noisy evaluation
- [x] `evaluate/llava_eval.py` — LLaVA ensemble evaluation

## Reproducibility

- [x] `pyproject.toml` — Project configuration
- [x] `requirements.txt` — Pinned dependencies
- [x] `configs/base.yaml` — Default config
- [x] Seed 42 used throughout all experiments
- [x] LaTeX tables in `evaluate/results/` for paper integration

## Known Limitations

- [ ] LLaVA full 200-sample evaluation not completed (CPU-only, ~4h needed)
- [ ] EfficientNet-B0 baseline training incomplete (not needed for paper conclusions)
- [ ] No field deployment test on actual drone hardware
- [ ] YouTube frame extraction requires yt-dlp on backend server
- [ ] Sample images require backend `/samples/` endpoint

## Summary of Key Results

| Experiment | Config A | Config B | Δ |
|---|---|---|---|
| 21-class accuracy | **96.15%** | 60.17% | −35.98pp |
| 21-class macro-F1 | **0.9618** | 0.6083 | −0.3535 |
| Wheat accuracy | **96.88%** | 39.06% | −57.82pp |
| Sensitivity F1 σ | — | 0.0087 | — |
| EML per batch | **₹294** | ₹2,769 | +841% |
| Noise robustness | 96.15% → 9.31% | — | −86.84pp |
| LLaVA H:H ratio | — | 1.33 | +4.76pp (n=21) |
