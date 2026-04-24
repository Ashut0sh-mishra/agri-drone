# `agridrone-models/` — Model Weight Files

Holds the trained `.pt` weights for the 21-class YOLOv8n-cls classifier and
related models.

> **Weights are NOT stored in Git.** They live on HuggingFace and are
> downloaded on demand. See "How to get the models" below.

## Files that belong here (after fetch)

| File | Type | Classes | Used by |
|---|---|---|---|
| `india_agri_cls.pt` | YOLOv8n-cls | 21 | **Production API** (primary classifier) |
| `india_agri_cls_21class_backup.pt` | YOLOv8n-cls | 21 | Backup |
| `india_agri_cls_4class_old.pt` | YOLOv8n-cls | 4 | Legacy prototype |
| `efficientnet_b0_21class.pt` | EfficientNet-B0 | 21 | Research comparison |
| `wheat_cls_v1.pt` | YOLOv8n-cls | 15 | Wheat-only v1 |
| `yolo_crop_disease.pt` | YOLOv8 detector | — | Object detection (bounding boxes) |
| `best.pt` | YOLOv8n-cls | 21 | Latest training checkpoint |
| `yolov8n.pt`, `yolov8n-seg.pt` | — | — | Pretrained backbones |

## How to get the models

The backend's `easy_setup.py` auto-downloads them from the HuggingFace Space:

```bash
python easy_setup.py
```

Or pull directly from the HF Space:

```python
from huggingface_hub import hf_hub_download
path = hf_hub_download(
    repo_id="ashu010/agri-drone-api",
    repo_type="space",
    filename="india_agri_cls.pt",
)
```

## Why not in Git?

- GitHub caps individual files at **100 MB** and repos at **~1 GB**.
- Some weights here exceed that, and bundling them would make `git clone` painfully slow.
- `.gitignore` excludes `*.pt`, `*.pth`, `*.onnx`, `*.h5`, `*.tflite`, `*.pb`.

The `src/agridrone/config.py` points `MODEL_PATH` here — no code changes needed once weights are fetched.
