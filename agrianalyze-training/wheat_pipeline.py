#!/usr/bin/env python3
"""
Wheat Dataset Pipeline — Extract, Clean, Balance, Split
All 5 phases in one script. Seed=42 everywhere.
"""

import io
import json
import os
import random
import shutil
import sys
import zipfile
from pathlib import Path

import numpy as np

# ── Paths ──
ZIP_DIR    = Path(r"D:\Projects\zip-data")
RAW_DIR    = Path(r"D:\Projects\wheat-raw")
CLEAN_DIR  = Path(r"D:\Projects\wheat-clean")
SPLIT_DIR  = Path(r"D:\Projects\wheat-split")
NOTEBOOK   = Path(r"D:\Projects\wheat_colab_train.ipynb")

SEED = 42
IMG_SIZE = 224
EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tif", ".tiff", ".webp", ".gif"}

# Folder-name → class-key mapping
CLASS_MAP = {
    "crown":   "crown_root_rot",
    "healthy": "healthy_wheat",
    "leaf":    "leaf_rust",
    "smut":    "wheat_loose_smut",
}

random.seed(SEED)
np.random.seed(SEED)


def map_class(folder_name: str) -> str | None:
    low = folder_name.lower()
    for keyword, cls in CLASS_MAP.items():
        if keyword in low:
            return cls
    return None


# ═══════════════════════════════════════════════════════════════
# PHASE 1 — EXTRACT AND VALIDATE
# ═══════════════════════════════════════════════════════════════

def phase1():
    print("=" * 50)
    print("  PHASE 1 — EXTRACT AND VALIDATE")
    print("=" * 50)

    if RAW_DIR.exists():
        shutil.rmtree(RAW_DIR)
    RAW_DIR.mkdir(parents=True)

    zips = sorted(ZIP_DIR.glob("*.zip"))
    print(f"  Found {len(zips)} zip files")

    for zp in zips:
        print(f"  Extracting: {zp.name}")
        with zipfile.ZipFile(zp, "r") as zf:
            zf.extractall(RAW_DIR)

    # Walk extracted tree and organize by class
    # First, find all image files and map their parent folders
    all_images = []
    for root, dirs, files in os.walk(RAW_DIR):
        for fname in files:
            fp = Path(root) / fname
            if fp.suffix.lower() in EXTENSIONS:
                # Determine class from any ancestor folder name
                cls = None
                for part in fp.parts:
                    cls_candidate = map_class(part)
                    if cls_candidate:
                        cls = cls_candidate
                        break
                if cls:
                    all_images.append((fp, cls))

    # Move into flat class folders under RAW_DIR
    for fp, cls in all_images:
        dest_dir = RAW_DIR / cls
        dest_dir.mkdir(exist_ok=True)
        dest = dest_dir / fp.name
        # Handle duplicates
        if dest.exists():
            stem = fp.stem
            suffix = fp.suffix
            i = 1
            while dest.exists():
                dest = dest_dir / f"{stem}_{i}{suffix}"
                i += 1
        shutil.copy2(fp, dest)

    # Clean up non-class folders (the extracted zip structure)
    for item in RAW_DIR.iterdir():
        if item.is_dir() and item.name not in {c for c in CLASS_MAP.values()}:
            shutil.rmtree(item)

    # Count
    print(f"\n  Raw image counts:")
    counts = {}
    for cls_dir in sorted(RAW_DIR.iterdir()):
        if cls_dir.is_dir():
            n = sum(1 for f in cls_dir.iterdir() if f.suffix.lower() in EXTENSIONS)
            counts[cls_dir.name] = n
            warning = " ⚠ WARNING: fewer than 50!" if n < 50 else ""
            print(f"    {cls_dir.name}: {n}{warning}")

    print(f"  Total: {sum(counts.values())}")
    return counts


# ═══════════════════════════════════════════════════════════════
# PHASE 2 — CLEAN AND BALANCE
# ═══════════════════════════════════════════════════════════════

def phase2():
    print(f"\n{'=' * 50}")
    print("  PHASE 2 — CLEAN AND BALANCE")
    print("=" * 50)

    try:
        import cv2
    except ImportError:
        print("  Installing opencv-python...")
        import subprocess
        subprocess.check_call([sys.executable, "-m", "pip", "install", "opencv-python", "-q"])
        import cv2

    if CLEAN_DIR.exists():
        shutil.rmtree(CLEAN_DIR)

    def resize_with_padding(img, target_size=IMG_SIZE):
        """Resize maintaining aspect ratio with black padding."""
        h, w = img.shape[:2]
        scale = target_size / max(h, w)
        new_w, new_h = int(w * scale), int(h * scale)
        resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_AREA)

        canvas = np.zeros((target_size, target_size, 3), dtype=np.uint8)
        y_off = (target_size - new_h) // 2
        x_off = (target_size - new_w) // 2
        canvas[y_off:y_off + new_h, x_off:x_off + new_w] = resized
        return canvas

    # Process each class
    counts = {}
    corrupt = 0
    for cls_dir in sorted(RAW_DIR.iterdir()):
        if not cls_dir.is_dir():
            continue
        cls = cls_dir.name
        out_dir = CLEAN_DIR / cls
        out_dir.mkdir(parents=True, exist_ok=True)

        idx = 0
        for img_path in sorted(cls_dir.iterdir()):
            if img_path.suffix.lower() not in EXTENSIONS:
                continue
            try:
                img = cv2.imread(str(img_path))
                if img is None:
                    corrupt += 1
                    continue
                padded = resize_with_padding(img)
                out_name = f"{cls}_{idx:04d}.jpg"
                cv2.imwrite(str(out_dir / out_name), padded,
                            [cv2.IMWRITE_JPEG_QUALITY, 95])
                idx += 1
            except Exception:
                corrupt += 1
                continue

        counts[cls] = idx
        print(f"  {cls}: {idx} clean images")

    if corrupt:
        print(f"  Removed {corrupt} corrupt files silently")

    # Balance: cap healthy_wheat to 2x the smallest non-healthy class
    non_healthy = {c: n for c, n in counts.items() if c != "healthy_wheat"}
    if non_healthy:
        min_other = min(non_healthy.values())
        cap = min_other * 2
        hw_count = counts.get("healthy_wheat", 0)
        if hw_count > cap:
            print(f"\n  Balancing: capping healthy_wheat from {hw_count} to {cap}")
            hw_dir = CLEAN_DIR / "healthy_wheat"
            hw_files = sorted(hw_dir.glob("*.jpg"))
            random.shuffle(hw_files)
            for f in hw_files[cap:]:
                f.unlink()
            counts["healthy_wheat"] = cap

    print(f"\n  Final clean counts:")
    for cls in sorted(counts):
        print(f"    {cls}: {counts[cls]}")
    print(f"  Total: {sum(counts.values())}")
    return counts


# ═══════════════════════════════════════════════════════════════
# PHASE 3 — SPLIT
# ═══════════════════════════════════════════════════════════════

def phase3():
    print(f"\n{'=' * 50}")
    print("  PHASE 3 — STRATIFIED SPLIT (70/15/15)")
    print("=" * 50)

    if SPLIT_DIR.exists():
        shutil.rmtree(SPLIT_DIR)

    split_counts = {"train": {}, "val": {}, "test": {}}

    for cls_dir in sorted(CLEAN_DIR.iterdir()):
        if not cls_dir.is_dir():
            continue
        cls = cls_dir.name
        images = sorted([f for f in cls_dir.iterdir() if f.suffix.lower() in EXTENSIONS])
        random.shuffle(images)

        n = len(images)
        n_val = max(1, round(n * 0.15))
        n_test = max(1, round(n * 0.15))
        n_train = n - n_val - n_test

        splits = {
            "train": images[:n_train],
            "val":   images[n_train:n_train + n_val],
            "test":  images[n_train + n_val:],
        }

        for split_name, file_list in splits.items():
            dest = SPLIT_DIR / split_name / cls
            dest.mkdir(parents=True, exist_ok=True)
            for fp in file_list:
                shutil.copy2(fp, dest / fp.name)
            split_counts[split_name][cls] = len(file_list)

    total_train = sum(split_counts["train"].values())
    total_val = sum(split_counts["val"].values())
    total_test = sum(split_counts["test"].values())

    print(f"  Train: {total_train}")
    for cls in sorted(split_counts["train"]):
        print(f"    {cls}: {split_counts['train'][cls]}")
    print(f"  Val: {total_val}")
    for cls in sorted(split_counts["val"]):
        print(f"    {cls}: {split_counts['val'][cls]}")
    print(f"  Test: {total_test}")
    for cls in sorted(split_counts["test"]):
        print(f"    {cls}: {split_counts['test'][cls]}")

    return total_train, total_val, total_test


# ═══════════════════════════════════════════════════════════════
# PHASE 4 — GENERATE COLAB NOTEBOOK
# ═══════════════════════════════════════════════════════════════

def phase4():
    print(f"\n{'=' * 50}")
    print("  PHASE 4 — GENERATE COLAB NOTEBOOK")
    print("=" * 50)

    cells = [
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "import torch\n",
                'print(f"GPU: {torch.cuda.get_device_name(0)}")\n',
                'print(f"VRAM: {torch.cuda.get_device_properties(0).total_mem'
                'ory/1e9:.1f}GB")\n',
            ],
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "!pip install ultralytics -q\n",
            ],
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "from google.colab import drive\n",
                "drive.mount('/content/drive')\n",
            ],
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "!unzip -q /content/drive/MyDrive/wheat-split.zip \\\n",
                "  -d /content/wheat-split/\n",
                "!ls /content/wheat-split/\n",
            ],
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "from ultralytics import YOLO\n",
                "model = YOLO('yolov8n-cls.pt')\n",
                "results = model.train(\n",
                "    data='/content/wheat-split/',\n",
                "    epochs=50,\n",
                "    imgsz=224,\n",
                "    batch=32,\n",
                "    device=0,\n",
                "    project='/content/drive/MyDrive/agrianalyze-wheat',\n",
                "    name='wheat_v1',\n",
                "    seed=42,\n",
                "    patience=10,\n",
                "    save=True,\n",
                "    plots=True,\n",
                "    augment=True\n",
                ")\n",
            ],
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "metrics = model.val()\n",
                'print(f"Top-1 Accuracy: {metrics.top1:.3f}")\n',
                'print(f"Top-5 Accuracy: {metrics.top5:.3f}")\n',
                'print("Model saved to Google Drive")\n',
                'print("Download: agrianalyze-wheat/wheat_v1/weights/best.pt")\n',
            ],
        },
        {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": [
                "from google.colab import files\n",
                "files.download(\n",
                "  '/content/drive/MyDrive/agrianalyze-wheat/wheat_v1/weights/best.pt'\n",
                ")\n",
            ],
        },
    ]

    notebook = {
        "nbformat": 4,
        "nbformat_minor": 0,
        "metadata": {
            "colab": {"provenance": [], "gpuType": "T4"},
            "kernelspec": {
                "name": "python3",
                "display_name": "Python 3",
            },
            "language_info": {"name": "python"},
            "accelerator": "GPU",
        },
        "cells": cells,
    }

    NOTEBOOK.write_text(json.dumps(notebook, indent=1), encoding="utf-8")
    print(f"  Saved: {NOTEBOOK}")


# ═══════════════════════════════════════════════════════════════
# PHASE 5 — PRINT FINAL INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════

def phase5(n_train, n_val, n_test):
    print(f"""
========================================
WHEAT DATASET READY
========================================
Classes: 4
Train images: {n_train}
Val images: {n_val}
Test images: {n_test}

NEXT STEPS:
1. Zip D:\\Projects\\wheat-split\\
   Right-click → Send to → Compressed folder

2. Upload wheat-split.zip to Google Drive
   drive.google.com → New → File Upload

3. Open Google Colab
   colab.research.google.com

4. Upload wheat_colab_train.ipynb
   File → Upload notebook → D:\\Projects\\wheat_colab_train.ipynb

5. Run all cells top to bottom
   Runtime → Run all

6. Wait 15-20 minutes for training

7. best.pt will auto-download when done

8. Copy best.pt to D:\\Projects\\agri-analyze\\models\\
   and rename to wheat_model.pt

9. Come back and tell me training is done
========================================""")


# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    phase1()
    phase2()
    n_train, n_val, n_test = phase3()
    phase4()
    phase5(n_train, n_val, n_test)
