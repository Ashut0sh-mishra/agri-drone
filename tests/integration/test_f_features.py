"""Quick test: verify all F1-F4 features fire in /detect endpoint."""
import requests, json
from pathlib import Path

# Find a sample image
samples = []
for ext in ("*.jpg", "*.jpeg", "*.png"):
    samples.extend(Path("data").rglob(ext))
    if samples:
        break

if not samples:
    print("No sample images found in data/")
    exit(1)

img = samples[0]
print(f"Testing with: {img}")

with open(img, "rb") as f:
    r = requests.post(
        "http://127.0.0.1:9000/detect",
        files={"file": (img.name, f, "image/jpeg")},
        data={"crop_type": "wheat", "use_llava": "false", "include_image": "false"},
    )

print(f"Status: {r.status_code}")
d = r.json()
s = d.get("structured", {})
diag = s.get("diagnosis", {})
print(f"Diagnosis: {diag.get('disease_name')} (conf={diag.get('confidence')})")
print(f"Health: {s.get('health', {}).get('score')}")
print(f"Pipeline: v{s.get('metadata', {}).get('pipeline_version')}")
print()

# F1
print("=== F1 Grad-CAM ===")
gc = s.get("gradcam")
if gc:
    print(f"  Has heatmap: {bool(gc.get('heatmap_image'))}")
    print(f"  Coverage: {gc.get('cam_coverage', 0) * 100:.1f}%")
    print(f"  Regions: {len(gc.get('regions', []))}")
else:
    print("  NOT present")

# F2
print("=== F2 Research Papers ===")
papers = s.get("research_papers")
if papers:
    print(f"  {len(papers)} papers retrieved")
    for p in papers[:2]:
        print(f"  - {p.get('title', '')[:65]}")
else:
    print("  NOT present (expected if healthy)")

# F3
print("=== F3 Ensemble Voting ===")
ev = s.get("ensemble_voting")
if ev:
    print(f"  Agreement: {ev.get('agreement_level')}")
    print(f"  Method: {ev.get('voting_method')}")
    print(f"  Models: {ev.get('num_models')}")
    for v in ev.get("individual_votes", []):
        print(f"    {v['model']}: {v['disease']} ({v['confidence']*100:.0f}% conf, {v['reliability']*100:.0f}% rel)")
else:
    print("  NOT present")

# F4
print("=== F4 Temporal ===")
tmp = s.get("temporal")
if tmp:
    print(f"  Trend: {tmp.get('trend')}")
    print(f"  Previous scans: {tmp.get('num_previous_scans', 0)}")
    print(f"  Trajectory pts: {len(tmp.get('health_trajectory', []))}")
    if tmp.get("recommendations"):
        for rec in tmp["recommendations"][:2]:
            print(f"  - {rec}")
else:
    print("  NOT present")

print()
all_ok = all([
    s.get("gradcam"),
    s.get("ensemble_voting"),
    s.get("temporal"),
])
papers_ok = s.get("research_papers") or diag.get("disease_key", "").startswith("healthy")
print(f"RESULT: {'ALL F-FEATURES WORKING' if all_ok and papers_ok else 'SOME FEATURES MISSING'}")
