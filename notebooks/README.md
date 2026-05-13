# AgriAnalyze — Colab Notebooks

All notebooks are designed to run on **Google Colab** with a **T4 GPU**.

## Notebooks

| Notebook | Purpose | Required secrets |
|---|---|---|
| `Dataset_Builder.ipynb` | Download all Roboflow + Kaggle sources, normalize labels, de-duplicate, build detection datasets | `ROBOFLOW_API_KEY`, `KAGGLE_API_TOKEN` |
| `AgriAnalyze_Mega_Dataset_CLS_Training.ipynb` | **Mega dataset classification training** — downloads ~30 K images, converts to cls format, trains YOLOv8n-cls (22 classes), saves `best.pt` to Drive | `ROBOFLOW_API_KEY`, `KAGGLE_API_TOKEN` |
| `Train_YOLOv8_Colab_GPU.ipynb` | Multi-architecture detection training on datasets built by `Dataset_Builder.ipynb` | None (reads from Drive) |
| `colab/01_run_matrix.ipynb` | Multi-backbone accuracy matrix | None |
| `colab/02_minimal_matrix_45cell.ipynb` | Paper-2 45-cell matrix (5 backbones × 3 folds × 3 datasets) | None |

## Recommended workflow for mega dataset

```
1. Open AgriAnalyze_Mega_Dataset_CLS_Training.ipynb in Colab
2. Runtime → Change runtime type → T4 GPU
3. Secrets (left sidebar) → add ROBOFLOW_API_KEY and KAGGLE_API_TOKEN
4. Runtime → Run all  (takes ~60–90 min on T4)
5. Download best.pt → place in models/india_agri_mega.pt
6. Run evaluate locally:
   python scripts/train_model.py --mega --gpu 0
```

## API key setup

**Never hard-code API keys in notebooks.** Use Colab Secrets:

1. Left sidebar → 🔑 **Secrets**
2. Click **+ Add new secret**
3. Add `ROBOFLOW_API_KEY` (get from [app.roboflow.com/account](https://app.roboflow.com/account))
4. Add `KAGGLE_API_TOKEN` (get from [kaggle.com/settings/account](https://www.kaggle.com/settings/account))

## GPU OOM notes

| GPU | Recommended settings |
|---|---|
| T4 (16 GB) | `batch=32`, `imgsz=224`, `cache="disk"`, `amp=True` |
| V100 (32 GB) | `batch=64`, `imgsz=224`, `cache="ram"`, `amp=True` |
| A100 (40 GB) | `batch=-1` (auto), `imgsz=224`, `cache="ram"`, `amp=True` |

If you get CUDA out-of-memory on T4, set `batch=16` and `cache=False`.
