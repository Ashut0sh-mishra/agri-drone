import os, sys
sys.path.insert(0, "src")
from ultralytics import YOLO
import cv2

# Test classifier (now 21-class)
cls = YOLO('models/india_agri_cls.pt', task='classify')
print(f'Classifier: {len(cls.names)} classes')
print()

# Test on different diseases
tests = [
    ('Leaf Rust', 'data/raw/wheat/data/train/Leaf Rust'),
    ('Black Rust', 'data/raw/wheat/data/train/Black Rust'),
    ('Fusarium', 'data/raw/wheat/data/train/Fusarium Head Blight'),
    ('Healthy', 'data/raw/wheat/data/train/Healthy'),
    ('Smut', 'data/raw/wheat/data/train/Smut'),
    ('Septoria', 'data/raw/wheat/data/train/Septoria'),
]

for label, path in tests:
    if not os.path.isdir(path):
        continue
    imgs = [f for f in os.listdir(path) if f.lower().endswith(('.jpg','.png','.jpeg'))]
    if not imgs:
        continue
    img = cv2.imread(os.path.join(path, imgs[0]))
    r = cls(img, verbose=False)
    p = r[0].probs
    top = cls.names[p.top5[0]]
    conf = p.top5conf[0].item()
    second = cls.names[p.top5[1]]
    conf2 = p.top5conf[1].item()
    print(f'{label:25s} => {top:30s} ({conf:.1%}) / {second} ({conf2:.1%})')

print()
print('--- Plant Gatekeeper Test ---')
from agridrone.api.app import _is_plant_image
for label, path in tests:
    if not os.path.isdir(path):
        continue
    imgs = [f for f in os.listdir(path) if f.lower().endswith(('.jpg','.png','.jpeg'))]
    if not imgs:
        continue
    img = cv2.imread(os.path.join(path, imgs[0]))
    result = _is_plant_image(img)
    is_p = result["is_plant"]
    gr = result["green_ratio"]
    sk = result["skin_ratio"]
    print(f'{label:25s} => plant={is_p} green={gr:.1%} skin={sk:.1%}')
