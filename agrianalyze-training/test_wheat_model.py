"""Test downloaded wheat model on val set."""
from ultralytics import YOLO
from pathlib import Path
import cv2, shutil

model = YOLO(r"D:\Projects\best.pt", task="classify")
names = model.names
print(f"Classes: {len(names)}")
print(f"Names: {list(names.values())}")
print(f"Architecture: {model.model.__class__.__name__}")
print(f"Task: {model.task}")
print()

val_dir = Path(r"D:\Projects\wheat-split\val")
classes = sorted([d.name for d in val_dir.iterdir() if d.is_dir()])
print(f"Val classes: {classes}\n")

# 3 samples per class
for cls in classes:
    imgs = sorted((val_dir / cls).glob("*.jpg"))[:3]
    for img_path in imgs:
        img = cv2.imread(str(img_path))
        res = model(img, verbose=False)
        if res and res[0].probs is not None:
            pred = names[res[0].probs.top1]
            conf = res[0].probs.top1conf.item()
            tag = "OK" if pred == cls else "MISS"
            print(f"  [{tag}] GT={cls:<20} Pred={pred:<20} Conf={conf:.4f}")
        else:
            print(f"  [FAIL] GT={cls:<20}")
    print()

# Full val accuracy
correct = 0
total = 0
per_class = {}
for cls in classes:
    tp = 0
    n = 0
    for img_path in sorted((val_dir / cls).glob("*.jpg")):
        img = cv2.imread(str(img_path))
        res = model(img, verbose=False)
        n += 1
        total += 1
        if res and res[0].probs is not None:
            pred = names[res[0].probs.top1]
            if pred == cls:
                correct += 1
                tp += 1
    per_class[cls] = (tp, n)

acc = correct / total if total else 0
print(f"Full val accuracy: {correct}/{total} = {acc:.1%}")
for cls in classes:
    tp, n = per_class[cls]
    a = tp / n if n else 0
    print(f"  {cls}: {tp}/{n} = {a:.1%}")

if acc > 0.5:
    dest = Path(r"D:\Projects\agri-analyze\models\wheat_best.pt")
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(r"D:\Projects\best.pt", dest)
    print(f"\nVERDICT: PASS ({acc:.1%} > 50%)")
    print(f"Copied to {dest}")
    print("Model is READY TO USE")
else:
    print(f"\nVERDICT: FAIL ({acc:.1%} < 50%)")
    print("Need to retrain on Colab")
