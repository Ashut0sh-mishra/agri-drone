"""
Quick integration test for the LLM Validator module (Task Group C).

Tests:
  - Prompt template selection (validate, arbitrate, differentiate, healthy_check)
  - Response parsing (JSON + regex fallback)
  - Agreement scoring
  - Confidence fusion
"""

import numpy as np
from agridrone.knowledge import kb_loader
from agridrone.vision.feature_extractor import extract_features, ImageFeatures
from agridrone.vision.rule_engine import evaluate as rule_evaluate, RuleEngineResult
from agridrone.vision.llm_validator import (
    build_validation_prompt,
    parse_validation_response,
    fuse_confidence,
    validation_to_dict,
    LLMValidation,
)


def _make_synthetic_image(color_bgr=(0, 200, 255), size=240):
    """Create a synthetic solid-color test image."""
    img = np.zeros((size, size, 3), dtype=np.uint8)
    img[:] = color_bgr
    return img


def _make_stripe_image():
    """Create a synthetic stripe-pattern image (yellow stripes on green)."""
    img = np.zeros((240, 240, 3), dtype=np.uint8)
    img[:] = (0, 128, 0)  # Green base
    for r in range(0, 240, 8):
        img[r:r+4, :] = (0, 200, 255)  # Vivid yellow stripes
    return img


def _make_healthy_image():
    """Create a bright green image."""
    img = np.zeros((240, 240, 3), dtype=np.uint8)
    img[:] = (0, 200, 0)  # Bright green
    return img


def _get_cls_result(disease_key="wheat_tan_spot", conf=0.81):
    """Simulate a classifier result."""
    return {
        "top_prediction": disease_key.replace("_", " ").title(),
        "top_confidence": conf,
        "health_score": 30,
        "risk_level": "high",
        "is_healthy": False,
        "disease_probability": conf,
        "top5": [
            {"class_key": disease_key, "class_name": disease_key.replace("_", " ").title(),
             "confidence": conf, "severity": 0.6},
        ],
    }


def _get_healthy_cls_result():
    return {
        "top_prediction": "Healthy Wheat",
        "top_confidence": 0.90,
        "health_score": 95,
        "risk_level": "low",
        "is_healthy": True,
        "disease_probability": 0.05,
        "top5": [
            {"class_key": "healthy_wheat", "class_name": "Healthy Wheat",
             "confidence": 0.90, "severity": 0.0},
        ],
    }


# ─── Load KB ───
kb_loader.load()
kb = kb_loader.get_all_profiles()


# ─── Test 1: CONFLICT scenario → arbitrate template ───
print("─── Test 1: Conflict scenario → ARBITRATE template ───")
stripe_img = _make_stripe_image()
cls_result = _get_cls_result("wheat_tan_spot", 0.81)
features = extract_features(stripe_img, kb)
rule_result = rule_evaluate(features, cls_result, "wheat")

prompt, scenario = build_validation_prompt(rule_result, features, cls_result, "wheat")
assert scenario == "arbitrate", f"Expected 'arbitrate', got '{scenario}'"
assert "CONFLICT" in prompt
assert "Tan Spot" in prompt or "wheat_tan_spot" in prompt.lower()
assert "wheat_yellow_rust" in prompt.lower() or "Yellow Rust" in prompt or "Stripe Rust" in prompt
print(f"  [PASS] Scenario: {scenario}")
print(f"  [PASS] Prompt length: {len(prompt)} chars, mentions both diseases")


# ─── Test 2: HEALTHY scenario → healthy_check template ───
print("\n─── Test 2: Healthy scenario → HEALTHY_CHECK template ───")
green_img = _make_healthy_image()
healthy_cls = _get_healthy_cls_result()
healthy_features = extract_features(green_img, kb)
healthy_rules = rule_evaluate(healthy_features, healthy_cls, "wheat")

prompt2, scenario2 = build_validation_prompt(healthy_rules, healthy_features, healthy_cls, "wheat")
assert scenario2 == "healthy_check", f"Expected 'healthy_check', got '{scenario2}'"
assert "HEALTHY" in prompt2.upper()
print(f"  [PASS] Scenario: {scenario2}")


# ─── Test 3: Parse a JSON response (validate agree) ───
print("\n─── Test 3: Parse JSON validation response (agree) ───")
mock_json = '''{
  "agrees": true,
  "agreement_level": "full",
  "your_diagnosis": "Yellow Rust",
  "confidence": "high",
  "visible_symptoms": "Linear yellow-orange stripes along leaf veins",
  "reasons": ["Vivid yellow pusules in stripes", "Typical stripe rust pattern"],
  "health_score": 20,
  "risk_level": "critical",
  "recommendations": ["Apply Propiconazole 25% EC immediately"],
  "urgency": "immediate"
}'''
val = parse_validation_response(mock_json, "validate", "Yellow / Stripe Rust")
assert val.agrees is True
assert val.agreement_score == 1.0
assert val.llm_diagnosis == "Yellow Rust"
assert val.health_score == 20
assert val.risk_level == "critical"
assert len(val.reasons) == 2
print(f"  [PASS] agrees={val.agrees}, score={val.agreement_score}, diagnosis='{val.llm_diagnosis}'")


# ─── Test 4: Parse a JSON response (arbitrate → rules) ───
print("\n─── Test 4: Parse JSON arbitration response (agrees with rules) ───")
mock_arb = '''{
  "agrees_with": "rules",
  "your_diagnosis": "Yellow Rust",
  "confidence": "high",
  "visible_symptoms": "Clear linear stripes of bright yellow-orange pustules",
  "reasons": ["Stripe pattern clearly visible", "Too vivid for Tan Spot"],
  "health_score": 15,
  "risk_level": "critical",
  "recommendations": ["Apply Tebuconazole 25.9% EC"],
  "urgency": "immediate"
}'''
val_arb = parse_validation_response(mock_arb, "arbitrate", "Yellow / Stripe Rust")
assert val_arb.agrees is True
assert val_arb.agreement_score == 0.9
print(f"  [PASS] agrees={val_arb.agrees}, score={val_arb.agreement_score}")


# ─── Test 5: Parse a disagree response ───
print("\n─── Test 5: Parse disagree validation response ───")
mock_disagree = '''{
  "agrees": false,
  "agreement_level": "disagree",
  "your_diagnosis": "Powdery Mildew",
  "confidence": "medium",
  "visible_symptoms": "White powdery coating on leaf surface",
  "reasons": ["No yellow stripes visible", "White powder clearly present"],
  "health_score": 40,
  "risk_level": "medium",
  "recommendations": ["Apply sulfur-based fungicide"],
  "urgency": "within_7_days"
}'''
val_dis = parse_validation_response(mock_disagree, "validate", "Yellow / Stripe Rust")
assert val_dis.agrees is False
assert val_dis.agreement_score == 0.1  # Different family
print(f"  [PASS] agrees={val_dis.agrees}, score={val_dis.agreement_score}")


# ─── Test 6: Regex fallback parsing ───
print("\n─── Test 6: Regex fallback when JSON is broken ───")
broken = '''Based on my analysis:
"your_diagnosis": "Yellow Rust"
"confidence": "high"
"health_score": 18
"risk_level": "critical"
"agrees": true
I can see ... blah blah'''
val_broken = parse_validation_response(broken, "validate", "Yellow / Stripe Rust")
assert val_broken.llm_diagnosis == "Yellow Rust"
assert val_broken.health_score == 18
print(f"  [PASS] Regex parsed: diagnosis='{val_broken.llm_diagnosis}', health={val_broken.health_score}")


# ─── Test 7: Confidence fusion ───
print("\n─── Test 7: Confidence fusion (rule + LLM + classifier) ───")
fusion = fuse_confidence(0.85, val, 0.75)
assert fusion["fused_confidence"] > 0.5
assert fusion["llm_agrees"] is True
assert fusion["llm_scenario"] == "validate"
print(f"  [PASS] Fused confidence: {fusion['fused_confidence']:.3f}")
print(f"         Rule: {fusion['rule_confidence']}, LLM: {fusion['llm_agreement_score']}, Cls: {fusion['classifier_confidence']}")
print(f"         Note: {fusion['note']}")


# ─── Test 8: Confidence fusion without LLM ───
print("\n─── Test 8: Confidence fusion without LLM ───")
fusion_no_llm = fuse_confidence(0.85, None, 0.75)
assert fusion_no_llm["llm_agreement_score"] is None
assert fusion_no_llm["fused_confidence"] > 0.5
print(f"  [PASS] Fused (no LLM): {fusion_no_llm['fused_confidence']:.3f}")
print(f"         Note: {fusion_no_llm['note']}")


# ─── Test 9: validation_to_dict ───
print("\n─── Test 9: validation_to_dict serialization ───")
d = validation_to_dict(val)
assert isinstance(d, dict)
assert d["agrees"] is True
assert d["agreement_score"] == 1.0
assert "reasons" in d
print(f"  [PASS] Serialized: {len(d)} fields")


# ─── Test 10: Healthy check response ───
print("\n─── Test 10: Healthy check → truly_healthy=True ───")
healthy_json = '''{
  "truly_healthy": true,
  "your_diagnosis": "healthy",
  "confidence": "high",
  "visible_symptoms": "no symptoms visible",
  "reasons": ["Uniform green color", "No lesions or spots"],
  "health_score": 95,
  "risk_level": "low",
  "recommendations": ["Continue monitoring"],
  "urgency": "seasonal"
}'''
val_healthy = parse_validation_response(healthy_json, "healthy_check", "Healthy Wheat")
assert val_healthy.agrees is True
assert val_healthy.agreement_score == 0.95
print(f"  [PASS] agrees={val_healthy.agrees}, score={val_healthy.agreement_score}")


print("\n=== All 10 LLM Validator tests passed! ===")
