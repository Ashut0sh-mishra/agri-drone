#!/usr/bin/env python3
"""Quick test to verify the healthy_green fix works."""
import sys, cv2, glob
sys.path.insert(0, "src")

from agrianalyze.knowledge import kb_loader
from agrianalyze.vision.feature_extractor import extract_features
from agrianalyze.vision.rule_engine import evaluate as rule_evaluate

kb_loader.load()
kb = kb_loader.get_all_profiles()

# Test 1: wheat_smut image with YOLO at 99% — should NOT be overridden
imgs = glob.glob("data/training/test/wheat_smut/*.*")
if not imgs:
    imgs = glob.glob("data/training/test/wheat_loose_smut/*.*")
print(f"Found {len(imgs)} smut test images")
img = cv2.imread(imgs[0])
features = extract_features(img, kb)
print(f"Green ratio: {features.green_ratio:.2%}")
healthy_sigs = [k for k in features.color_confidences if "healthy" in k]
print(f"Healthy color sigs present: {healthy_sigs}")
print(f"Healthy sig values: {[(k, features.color_confidences[k]) for k in healthy_sigs]}")

# YOLO: 99% wheat_smut
cls_result = {"top5": [{"class_key": "wheat_smut", "confidence": 0.99}]}
result = rule_evaluate(features, cls_result, "wheat")
print(f"\nTest 1 - YOLO 99% wheat_smut:")
print(f"  Rule engine top: {result.top_disease} ({result.top_confidence:.2f})")
print(f"  Conflict winner: {result.conflict.winner if result.conflict else 'no conflict'}")
assert result.top_disease != "healthy_wheat", "FAIL: healthy_wheat still overriding!"

# Test 2: YOLO at 50% — rule engine might intervene
cls_result2 = {"top5": [{"class_key": "wheat_smut", "confidence": 0.50}]}
result2 = rule_evaluate(features, cls_result2, "wheat")
print(f"\nTest 2 - YOLO 50% wheat_smut:")
print(f"  Rule engine top: {result2.top_disease} ({result2.top_confidence:.2f})")
print(f"  Conflict winner: {result2.conflict.winner if result2.conflict else 'no conflict'}")

# Test 3: Healthy wheat image — should still detect healthy if truly green
healthy_imgs = glob.glob("data/training/test/healthy_wheat/*.*")
if healthy_imgs:
    img_h = cv2.imread(healthy_imgs[0])
    feat_h = extract_features(img_h, kb)
    print(f"\nTest 3 - Healthy wheat image:")
    print(f"  Green ratio: {feat_h.green_ratio:.2%}")
    healthy_sigs_h = [k for k in feat_h.color_confidences if "healthy" in k]
    print(f"  Healthy color sigs present: {healthy_sigs_h}")
    cls_h = {"top5": [{"class_key": "healthy_wheat", "confidence": 0.95}]}
    result_h = rule_evaluate(feat_h, cls_h, "wheat")
    print(f"  Rule engine top: {result_h.top_disease} ({result_h.top_confidence:.2f})")

print("\n=== ALL TESTS PASSED ===")
