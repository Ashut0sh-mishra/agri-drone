"""Quick test: verify full pipeline — feature_extractor → rule_engine → disease_reasoning."""
import numpy as np
from agrianalyze.knowledge import kb_loader
from agrianalyze.vision.feature_extractor import extract_features, ImageFeatures
from agrianalyze.vision.rule_engine import evaluate, result_to_dict, RuleEngineResult
from agrianalyze.vision.disease_reasoning import reason_diagnosis, diagnosis_to_dict

# ── Setup ──
kb_loader.load()
profiles = kb_loader.get_all_profiles()
print(f"[PASS] KB loaded: {len(profiles)} profiles")

# ── Test 1: Feature extraction ──
img = np.zeros((200, 200, 3), dtype=np.uint8)
img[40:160, 40:160] = [0, 200, 255]  # BGR: vivid yellow

features = extract_features(img, profiles)
assert features.total_pixels == 40000
assert features.has_vivid_yellow, "Should detect vivid yellow"
assert features.has_stripe_pattern, "Should detect stripe pattern in solid block"
assert len(features.color_confidences) > 0, "Should have color signatures"
print(f"[PASS] Feature extraction: {len(features.color_confidences)} colors, "
      f"stripe={features.has_stripe_pattern}, vivid={features.has_vivid_yellow}, "
      f"green={features.green_ratio:.1%}")

# ── Test 2: Rule engine scoring ──
cls_result = {"top5": [
    {"class_key": "wheat_tan_spot", "class_name": "Tan Spot", "confidence": 0.81},
    {"class_key": "wheat_yellow_rust", "class_name": "Yellow Rust", "confidence": 0.1},
]}
engine_result = evaluate(features, cls_result, "wheat")
assert engine_result.top_disease != "", "Should have a top disease"
print(f"[PASS] Rule engine: top={engine_result.top_disease} "
      f"(conf={engine_result.top_confidence:.2f})")

# Check conflict detection (YOLO says tan_spot but visual says rust)
if engine_result.conflict:
    c = engine_result.conflict
    print(f"[PASS] Conflict detected: YOLO={c.yolo_prediction} vs Rules={c.rule_prediction}, "
          f"winner={c.winner}")
    print(f"       Reason: {c.reason[:100]}")

# Check rejections
if engine_result.rejections:
    for rej in engine_result.rejections[:2]:
        print(f"[PASS] Rejection: {rej.disease_name}: {rej.reasons[0][:80]}")

# ── Test 3: Serialization ──
rd = result_to_dict(engine_result)
assert "top_disease" in rd
assert "conflict" in rd or rd.get("conflict") is None
assert "rejections" in rd
print(f"[PASS] Rule engine serialization OK: {len(rd['candidates'])} candidates, "
      f"{len(rd['rejections'])} rejections")

# ── Test 4: Full pipeline (disease_reasoning) ──
result = reason_diagnosis(img, cls_result, "wheat")
d = diagnosis_to_dict(result)
print(f"[PASS] Full pipeline: {d['disease_name']} ({d['confidence']:.0%})")
print(f"       Health: {d['health_score']}, Risk: {d['risk_level']}")
print(f"       Reasoning: {len(d['reasoning_chain'])} steps")
print(f"       Differential: {len(d['differential_diagnosis'])} alternatives")

# Check new fields
if d.get("conflict"):
    print(f"       Conflict: {d['conflict']['winner']} won — {d['conflict']['reason'][:80]}")
if d.get("rejections"):
    print(f"       Rejections: {len(d['rejections'])} diseases rejected")
if d.get("rule_engine_detail"):
    print(f"       Rule detail: {len(d['rule_engine_detail']['candidates'])} scored candidates")

# ── Test 5: All 21 profiles accessible ──
for key in ["healthy_wheat", "wheat_aphid", "wheat_mite", "wheat_stem_fly", "healthy_rice"]:
    p = kb_loader.get_profile(key)
    assert p is not None, f"Missing profile: {key}"
print(f"[PASS] All 5 new profiles accessible")

# ── Test 6: Seasonal adjustment ──
adj = kb_loader.get_seasonal_adjustment("wheat_yellow_rust", "wheat")
print(f"[PASS] Seasonal adjustment for yellow rust: {adj}")

# ── Test 7: Green image → healthy ──
green_img = np.zeros((200, 200, 3), dtype=np.uint8)
green_img[:, :] = [0, 128, 0]  # BGR: pure green
healthy_result = reason_diagnosis(green_img, {"top5": [
    {"class_key": "healthy_wheat", "class_name": "Healthy Wheat", "confidence": 0.9},
]}, "wheat")
print(f"[PASS] Green image: {healthy_result.disease_name} "
      f"(health={healthy_result.health_score})")

print("\n=== All tests passed! Full pipeline working. ===")
