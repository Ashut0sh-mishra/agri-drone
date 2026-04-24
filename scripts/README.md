# scripts/ — Utility & Automation Scripts

One-off scripts for training, evaluation, data prep, and system utilities.
These are **not part of the importable package** — run them directly from the project root.

## Training

| Script | Command | What it does |
|--------|---------|-------------|
| `train_model.py` | `python scripts/train_model.py` | Train 21-class YOLOv8n-cls on wheat + rice |
| `train_yolo_detector.py` | `python scripts/train_yolo_detector.py` | Train YOLOv8 detector (bounding boxes) |
| `train_with_tracking.py` | `python scripts/train_with_tracking.py` | Train with MLflow experiment tracking |
| `train_improved.py` | `python scripts/train_improved.py` | Improved training with data augmentation |

## Evaluation

| Script | Command | What it does |
|--------|---------|-------------|
| `evaluate_model.py` | `python scripts/evaluate_model.py` | Full eval: mAP, PR curves, confusion matrix |
| `compare_models.py` | `python scripts/compare_models.py` | Benchmark Ensemble vs YOLO vs LLaVA vs Rules |

## Data Preparation

| Script | What it does |
|--------|-------------|
| `download_all_datasets.py` | Download all datasets from Roboflow and Kaggle |
| `download_data.py` | Download a specific dataset |
| `annotate_wheat.py` | Semi-automatic wheat image annotation |
| `make_splits.py` | Create train/val/test splits |
| `prepare_yolo_dataset.py` | Convert annotations to YOLO format |

## System & Inference

| Script | What it does |
|--------|-------------|
| `run_inference.py` | Run inference on a single image or folder |
| `example_detection.py` | Quick demo: detect disease in a sample image |
| `smoke_test.py` | Quick sanity check that the whole stack is working |
| `audit_system.py` | Full system audit (models, API, data integrity) |
| `phone_connect.py` | Connect to mobile phone camera pipeline |
| `retrain_with_feedback.py` | Fine-tune model with user feedback data |

## Output Locations

All script outputs go to `/outputs/`:
- Training checkpoints → `outputs/training/`
- Evaluation results → `outputs/evaluation/`
- Comparison charts → `outputs/comparison/`
- MLflow runs → `outputs/mlruns/`
