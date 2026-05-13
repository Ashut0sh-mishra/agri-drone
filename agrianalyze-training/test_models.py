#!/usr/bin/env python3
"""Test all candidate best.pt models on wheat val images."""
import sys, json, shutil
from pathlib import Path

MODELS = [
    r"D:\Projects\agrianalyze_training_results\best.pt",
    r"D:\Projects\agri-analyze\runs\detect\outputs\training\best.pt",
    r"D:\Projects\agri-analyze\outputs\training\rice_v2\best.pt",
    r"D:\Projects\agri-analyze\outputs\training\india_agri_cls\best.pt",
]

VAL_DIR = Path(r"D:\Projects\wheat-split\val")
DEST = Path(r"D:\Projects\agri-analyze\models\best_wheat.pt")

# Gather one sample image per class
classes = sorted([d.name for d in VAL_DIR.iterdir() if d.is_dir()])
sample_images = []
for cls in classes:
    imgs = sorted((VAL_DIR / cls).glob("*.jpg"))
    if imgs:
        sample_images.append((cls, imgs[0]))

print(f"Wheat classes: {classes}")
print(f"Sample images: {len(sample_images)}\n")

from ultralytics import YOLO
import cv2

results_all = []

for i, model_path in enumerate(MODELS, 1):
    p = Path(model_path)
    print(f"{'='*60}")
    print(f"  MODEL {i}: {p}")
    print(f"{'='*60}")

    if not p.exists():
        print(f"  FILE NOT FOUND — skipping\n")
        results_all.append({"path": str(p), "exists": False, "correct": 0, "total": 0})
        continue

    try:
        model = YOLO(str(p), task="classify")
        names = model.names
        n_classes = len(names)
        print(f"  Classes: {n_classes}")
        print(f"  Names: {list(names.values())}")

        # Check if model has wheat-relevant classes
        name_str = " ".join(str(v).lower() for v in names.values())
        has_wheat = any(k in name_str for k in ["wheat", "rust", "rot", "smut", "leaf_rust", "crown"])
        print(f"  Has wheat classes: {has_wheat}")

        correct = 0
        total = len(sample_images)
        predictions = []

        for gt_cls, img_path in sample_images:
            img = cv2.imread(str(img_path))
            res = model(img, verbose=False)
            if res and res[0].probs is not None:
                probs = res[0].probs
                pred_name = names[probs.top1]
                conf = probs.top1conf.item()
                match = "✓" if pred_name == gt_cls else "✗"
                if pred_name == gt_cls:
                    correct += 1
                print(f"  {match} GT={gt_cls:<20} Pred={pred_name:<20} Conf={conf:.4f}")
                predictions.append({"gt": gt_cls, "pred": pred_name, "conf": round(conf, 4)})
            else:
                print(f"  ✗ GT={gt_cls:<20} Pred=FAILED")
                predictions.append({"gt": gt_cls, "pred": "FAILED", "conf": 0})

        acc = correct / total if total > 0 else 0
        print(f"\n  Score: {correct}/{total} = {acc:.1%}\n")
        results_all.append({
            "path": str(p),
            "exists": True,
            "n_classes": n_classes,
            "class_names": list(names.values()),
            "has_wheat_classes": has_wheat,
            "correct": correct,
            "total": total,
            "accuracy": round(acc, 4),
            "predictions": predictions,
        })

    except Exception as e:
        print(f"  ERROR loading model: {e}\n")
        results_all.append({"path": str(p), "exists": True, "error": str(e), "correct": 0, "total": 0})

# ── Pick best ──
print(f"{'='*60}")
print(f"  SUMMARY")
print(f"{'='*60}")

valid = [r for r in results_all if r.get("exists") and "error" not in r]
for r in valid:
    tag = " ← BEST" if r["correct"] == max(v["correct"] for v in valid) and r["correct"] > 0 else ""
    print(f"  {Path(r['path']).name:40} {r['correct']}/{r['total']} ({r.get('accuracy',0):.0%}) "
          f"classes={r.get('n_classes','?')} wheat={r.get('has_wheat_classes','?')}{tag}")

best = max(valid, key=lambda r: (r["correct"], r.get("has_wheat_classes", False)))

if best["correct"] == 0:
    print("\n  ⚠ ALL MODELS SCORED 0 — none work on wheat data!")
    print("  You need to train on Colab.")
    sys.exit(1)

print(f"\n  Winner: {best['path']}")
print(f"  Copying to {DEST}")
DEST.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(best["path"], DEST)
print(f"  Done!")

# Save results
out = Path(r"D:\Projects\agri-analyze\evaluate\results\model_comparison.json")
out.write_text(json.dumps(results_all, indent=2), encoding="utf-8")
print(f"  Saved: {out}")
