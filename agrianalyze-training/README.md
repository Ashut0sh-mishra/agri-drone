# `agrianalyze-training/` — Model Training Scripts & Notebooks

Scripts and Jupyter notebooks used to train the 21-class YOLOv8n-cls
crop-disease classifier that powers the AgriAnalyze API.

## Files

| File | Purpose |
|---|---|
| `wheat_colab_train.ipynb` | End-to-end Colab notebook: data prep → YOLO training → eval |
| `wheat_pipeline.py` | CLI training pipeline (same logic as notebook, scriptable) |
| `test_models.py` | Sanity tests — load weights, run a predict, verify output shape |
| `test_wheat_model.py` | Accuracy + confusion-matrix evaluation on held-out split |

## Getting the training data

The dataset is hosted on HuggingFace (25 GB total). Pull only what you need:

```bash
# From repo root
python scripts/fetch_data.py --only training
# -> downloads agrianalyze-data/training/ into ./agrianalyze-data/training/
```

See [scripts/fetch_data.py](../scripts/fetch_data.py) for other subsets.

## Training a new model

**Option A — Google Colab (free GPU, recommended):**

1. Open `wheat_colab_train.ipynb` in Colab.
2. Upload your `kaggle.json` via the first cell (or use HF fetch).
3. Run all cells. Outputs go to `/content/runs/` in Colab and
   `agrianalyze_training_results/` when exported.

**Option B — Local GPU:**

```bash
pip install ultralytics
python wheat_pipeline.py --data ../agrianalyze-data/training --epochs 50
```

## Credentials note

`kaggle.json` is **gitignored**. Put yours in the same folder (never commit).
If you need one, download from https://www.kaggle.com/settings → Create API token.
