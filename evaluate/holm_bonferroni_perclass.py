#!/usr/bin/env python3
"""
holm_bonferroni_perclass.py
───────────────────────────
Per-class McNemar test with Holm-Bonferroni correction (A vs B).

Reads committed prediction CSVs:
  evaluate/results/predictions_A_yolo_only.csv
  evaluate/results/predictions_B_yolo_rules.csv

Outputs:
  evaluate/results/holm_bonferroni_perclass.json
  evaluate/results/holm_bonferroni_perclass.csv

Usage:
    python evaluate/holm_bonferroni_perclass.py
"""
import csv
import json
import math
from pathlib import Path

RESULTS_DIR = Path(__file__).resolve().parent / "results"
CSV_A = RESULTS_DIR / "predictions_A_yolo_only.csv"
CSV_B = RESULTS_DIR / "predictions_B_yolo_rules.csv"
OUT_JSON = RESULTS_DIR / "holm_bonferroni_perclass.json"
OUT_CSV  = RESULTS_DIR / "holm_bonferroni_perclass.csv"

ALPHA = 0.05


# ── Load predictions ──────────────────────────────────────────────────────────
def load_preds(path: Path) -> dict[str, dict]:
    """Return {image: {'gt': str, 'pred': str, 'correct': bool}}"""
    rows = {}
    with open(path, newline="", encoding="utf-8") as f:
        for row in csv.DictReader(f):
            rows[row["image"]] = {
                "gt":      row["ground_truth"],
                "pred":    row["predicted"],
                "correct": row["correct"].strip() == "1",
            }
    return rows


preds_a = load_preds(CSV_A)
preds_b = load_preds(CSV_B)

# Keep only images present in both CSVs
common = sorted(set(preds_a) & set(preds_b))
print(f"Common images: {len(common)}")

# ── Collect all classes ───────────────────────────────────────────────────────
classes = sorted({preds_a[img]["gt"] for img in common})
print(f"Classes: {len(classes)}")


# ── Per-class McNemar (continuity-corrected) ──────────────────────────────────
def mcnemar_cc(b: int, c: int) -> float:
    """McNemar continuity-corrected p-value (two-sided chi-squared)."""
    denom = b + c
    if denom == 0:
        return 1.0  # no discordant pairs → no evidence of difference
    chi2 = (abs(b - c) - 1) ** 2 / denom
    # p = P(Chi2(1) >= chi2)  — using incomplete gamma approximation
    return _chi2_sf(chi2, df=1)


def _chi2_sf(x: float, df: int = 1) -> float:
    """Survival function of chi-squared distribution (df=1) via regularised gamma."""
    if x <= 0:
        return 1.0
    # For df=1: chi2_sf(x,1) = erfc(sqrt(x/2))
    return math.erfc(math.sqrt(x / 2))


per_class_raw: list[dict] = []

for cls in classes:
    # Within this class's images only
    cls_images = [img for img in common if preds_a[img]["gt"] == cls]
    n = len(cls_images)
    if n == 0:
        continue

    # Discordant counts:
    # b = A correct, B wrong (rule hurt)
    # c = A wrong,   B correct (rule helped)
    b = sum(1 for img in cls_images if     preds_a[img]["correct"] and not preds_b[img]["correct"])
    c = sum(1 for img in cls_images if not preds_a[img]["correct"] and     preds_b[img]["correct"])

    acc_a = sum(preds_a[img]["correct"] for img in cls_images) / n
    acc_b = sum(preds_b[img]["correct"] for img in cls_images) / n

    p_raw = mcnemar_cc(b, c)

    per_class_raw.append({
        "class":       cls,
        "n":           n,
        "acc_A":       round(acc_a, 4),
        "acc_B":       round(acc_b, 4),
        "delta_acc":   round(acc_b - acc_a, 4),
        "discordant_b": b,   # A correct, B wrong
        "discordant_c": c,   # A wrong, B correct
        "p_raw":       round(p_raw, 6),
    })

# ── Holm-Bonferroni correction ────────────────────────────────────────────────
# Sort by raw p ascending
per_class_raw.sort(key=lambda r: r["p_raw"])
m = len(per_class_raw)

results = []
reject_count = 0
for rank, row in enumerate(per_class_raw, start=1):
    # Holm threshold: alpha / (m - rank + 1)
    threshold = ALPHA / (m - rank + 1)
    significant = row["p_raw"] <= threshold
    if significant:
        reject_count += 1
    results.append({
        **row,
        "holm_rank":      rank,
        "holm_threshold": round(threshold, 6),
        "significant":    significant,
    })

# ── Summary ───────────────────────────────────────────────────────────────────
summary = {
    "method":          "McNemar continuity-corrected + Holm-Bonferroni",
    "alpha":           ALPHA,
    "n_classes_tested": m,
    "n_significant":   reject_count,
    "note": (
        "0 significant A-vs-B per-class differences after Holm-Bonferroni correction. "
        "The rule engine neither reliably helps nor hurts any individual class."
        if reject_count == 0 else
        f"{reject_count} class(es) show significant A-vs-B difference after correction."
    ),
    "per_class": results,
}

# ── Write outputs ─────────────────────────────────────────────────────────────
OUT_JSON.write_text(json.dumps(summary, indent=2))
print(f"✅ {OUT_JSON.name}")

fields = ["class", "n", "acc_A", "acc_B", "delta_acc",
          "discordant_b", "discordant_c", "p_raw",
          "holm_rank", "holm_threshold", "significant"]
with open(OUT_CSV, "w", newline="", encoding="utf-8") as f:
    w = csv.DictWriter(f, fieldnames=fields)
    w.writeheader()
    for row in results:
        w.writerow({k: row[k] for k in fields})
print(f"✅ {OUT_CSV.name}")

# ── Print table ───────────────────────────────────────────────────────────────
print(f"\n{'Class':<35} {'n':>4} {'Acc_A':>6} {'Acc_B':>6} {'Δ':>7} {'p_raw':>8} {'p≤thresh':>9} {'Sig':>4}")
print("─" * 90)
for r in results:
    sig = "✱" if r["significant"] else ""
    print(f"{r['class']:<35} {r['n']:>4} {r['acc_A']:>6.3f} {r['acc_B']:>6.3f} "
          f"{r['delta_acc']:>+7.3f} {r['p_raw']:>8.4f} {r['holm_threshold']:>9.4f} {sig:>4}")

print(f"\nResult: {reject_count}/{m} classes significant after Holm-Bonferroni (α={ALPHA})")
print(summary["note"])
