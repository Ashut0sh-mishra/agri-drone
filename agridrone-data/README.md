# `agridrone-data/` — Dataset Download Target

This folder is the **local landing zone** for training / evaluation datasets.
Actual dataset files are **not stored in Git** — they live on HuggingFace.

> **HuggingFace Dataset:** <https://huggingface.co/datasets/ashu010/agridrone-data> (25 GB, public)

## How to populate this folder

From the repository root:

```bash
# Essentials only — training splits (~5 GB, enough to reproduce the 21-class model)
python scripts/fetch_data.py --only training

# Everything (~25 GB)
python scripts/fetch_data.py
```

See [`scripts/fetch_data.py`](../scripts/fetch_data.py) for flags.

## Expected layout after full fetch

```
agridrone-data/
├── training/            # train/val/test splits (used by wheat_pipeline.py)
├── raw/
│   ├── wheat/           # raw wheat disease images
│   ├── rice/            # raw rice disease images
│   └── roboflow/        # Roboflow-sourced sets
├── wheat_raw/           # pseudo-annotated raw
├── wheat_annotated/     # pseudo-annotated labelled
├── externals/
│   ├── PDT_datasets/
│   └── pdt_plant_disease/
└── working/
    ├── wheat-raw/
    ├── wheat-clean/
    └── wheat-split/
```

## Why not in Git?

- GitHub repo cap: ~1 GB. Our datasets total **25 GB**.
- HuggingFace Datasets gives us 300 GB free, with deduplicated pulls and
  parallel downloads via `hf_transfer`.
- Keeps `git clone` instant and the repo focused on source code.

The folder itself is gitignored (`data/` + `agridrone-data/` in `.gitignore`).
This README is kept with a tiny `.gitkeep`-style allowlist so the folder
exists in fresh clones.
