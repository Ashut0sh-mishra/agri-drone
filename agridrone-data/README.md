---
license: mit
language:
- en
tags:
- agriculture
- crop-disease
- wheat
- rice
- computer-vision
- plant-pathology
pretty_name: AgriDrone Crop Disease Dataset
size_categories:
- 10K<n<100K
---

# AgriDrone — Crop Disease Detection Dataset

Full dataset collection used for training the AgriDrone crop-disease
detection system (21-class YOLOv8n-cls classifier, 15 wheat + 6 rice
diseases). **75,010 images, 24 folders, 23.6 GB.**

Code repo: <https://github.com/Ashut0sh-mishra/agri-drone>

## Folder layout

### Training splits (5 folders — used to train the model)

| Folder | Files | Purpose |
|---|---:|---|
| `train/` | 10,144 | Main training split |
| `val/` | 1,655 | Validation split |
| `test/` | 1,655 | Test split (used for the Config A/B/C ablation) |
| `train_orig/` | 4,987 | Original pre-augmentation training set |
| `val_orig/` | 1,247 | Original pre-augmentation validation set |

### Wheat disease classes (11 folders)

| Folder | Files |
|---|---:|
| `wheat_aphid/` | 300 |
| `wheat_blast/` | 300 |
| `wheat_healthy/` | 600 |
| `wheat_leaf_rust/` | 300 |
| `wheat_smut/` | 300 |
| `wheat_yellow_rust/` | 300 |
| `fusarium_head_blight/` | 300 |
| `leaf_blight/` | 300 |
| `powdery_mildew/` | 300 |
| `septoria/` | 300 |
| `tan_spot/` | 300 |

### Rice disease datasets (3 folders)

| Folder | Files | Source |
|---|---:|---|
| `Rice_Leaf_AUG/` | 3,829 | Augmented rice leaf set |
| `rice-diseases-v2/` | 10,346 | Roboflow rice disease v2 |
| `rice-diseases-zoa8l/` | 2,589 | Roboflow rice disease (zoa8l) |

### External benchmarks (3 folders)

| Folder | Files | Description |
|---|---:|---|
| `PDT dataset/` | 19,049 | Plant Disease Treatment dataset |
| `plantdoc/` | 196 | Original [PlantDoc](https://github.com/pratikkayal/PlantDoc-Dataset) benchmark |
| `plantdoc-v3/` | 1,552 | PlantDoc v3 |

### Raw detection set (1 folder)

| Folder | Files | Description |
|---|---:|---|
| `data/` | 14,154 | Roboflow-sourced wheat detection dataset (bounding boxes) |

## Usage

### Python — download a subset

```python
from huggingface_hub import snapshot_download

# Training splits only (enough to reproduce the 21-class model)
path = snapshot_download(
    repo_id="ashu010/agridrone-data",
    repo_type="dataset",
    allow_patterns=["train/**", "val/**", "test/**"],
)
```

### CLI — use the fetch script

From the GitHub repo:

```bash
python scripts/fetch_data.py --preset training   # train/val/test splits
python scripts/fetch_data.py --preset wheat      # all 11 wheat classes
python scripts/fetch_data.py --preset rice       # 3 rice datasets
python scripts/fetch_data.py --preset external   # PlantDoc + PDT
python scripts/fetch_data.py                     # everything (25 GB)
```

### Direct image URL (for dashboards / web apps)

Every image has a public resolve URL — no auth needed:

```
https://huggingface.co/datasets/ashu010/agridrone-data/resolve/main/<folder>/<filename>
```

Example:

```html
<img src="https://huggingface.co/datasets/ashu010/agridrone-data/resolve/main/wheat_aphid/wheat_aphid_0001.jpg">
```

Use these URLs directly in the AgriDrone frontend dashboard for live data display.

## License

MIT for the curation layer. Individual source datasets retain their original
licenses — see each folder for upstream attribution.

## Citation

See the AgriDrone repo: <https://github.com/Ashut0sh-mishra/agri-drone>
