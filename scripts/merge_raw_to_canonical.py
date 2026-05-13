"""Merge raw HuggingFace datasets into canonical 23-class train/ split.

Adds new images to `train/` only — `val/` and `test/` are NEVER touched
(prevents train/test leakage). Uses MD5 of file bytes for exact-dup
detection across all splits + raw sources.

Also removes stray `images/` and `labels/` subdirs inside train/val/test
(detection-format pollution that YOLO-cls would otherwise treat as classes).

Usage:
    python scripts/merge_raw_to_canonical.py --root /path/to/agrianalyze-data
    python scripts/merge_raw_to_canonical.py --root ... --dry-run
"""
from __future__ import annotations

import argparse
import hashlib
import shutil
from collections import defaultdict
from pathlib import Path

IMG_EXTS = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

# Folders inside train/val/test that are NOT classes — must be removed.
NON_CLASS_DIRS = {"images", "labels"}

# Marker file written after a successful merge (idempotency).
MARKER = ".merged_v1"

# ─────────────────────────────────────────────────────────────────────────────
# Class-mapping table: (raw_source_relpath, raw_class_name) -> canonical_class
# Only sources that map cleanly to classification are listed. Detection-only
# sets (PDT, plantdoc, rice-diseases-v2/zoa8l) are intentionally excluded.
# ─────────────────────────────────────────────────────────────────────────────
MAPPINGS: dict[str, dict[str, str]] = {
    # data/train/ — 13.1K wheat images, already cleanly classified.
    "data/train": {
        "Aphid": "wheat_aphid",
        "Black Rust": "wheat_black_rust",
        "Blast": "wheat_blast",
        "Brown Rust": "wheat_brown_rust",
        "Common Root Rot": "wheat_root_rot",
        "Fusarium Head Blight": "wheat_fusarium_head_blight",
        "Healthy": "healthy_wheat",
        "Leaf Blight": "wheat_leaf_blight",
        "Mildew": "wheat_powdery_mildew",
        "Mite": "wheat_mite",
        "Septoria": "wheat_septoria",
        "Smut": "wheat_smut",
        "Stem fly": "wheat_stem_fly",
        "Tan spot": "wheat_tan_spot",
        "Yellow Rust": "wheat_yellow_rust",
    },
    # data/valid/ — additional ~1.8K wheat (HF "valid" split, NOT our val).
    "data/valid": {
        "Aphid": "wheat_aphid",
        "Black Rust": "wheat_black_rust",
        "Blast": "wheat_blast",
        "Brown Rust": "wheat_brown_rust",
        "Common Root Rot": "wheat_root_rot",
        "Fusarium Head Blight": "wheat_fusarium_head_blight",
        "Healthy": "healthy_wheat",
        "Leaf Blight": "wheat_leaf_blight",
        "Mildew": "wheat_powdery_mildew",
        "Mite": "wheat_mite",
        "Septoria": "wheat_septoria",
        "Smut": "wheat_smut",
        "Stem fly": "wheat_stem_fly",
        "Tan spot": "wheat_tan_spot",
        "Yellow Rust": "wheat_yellow_rust",
    },
    # Rice_Leaf_AUG/ — 3.8K rice (already augmented; dedup handles overlap).
    "Rice_Leaf_AUG": {
        "Bacterial Leaf Blight": "rice_bacterial_blight",
        "Brown Spot": "rice_brown_spot",
        "Healthy Rice Leaf": "healthy_rice",
        "Leaf Blast": "rice_blast",
        "Leaf scald": "rice_leaf_scald",
        "Sheath Blight": "rice_sheath_blight",
    },
}

# Standalone single-class folders → canonical class.
# (Each whole folder maps to one canonical class; no inner subdirs.)
SINGLE_CLASS_FOLDERS: dict[str, str] = {
    "wheat_aphid": "wheat_aphid",
    "wheat_blast": "wheat_blast",
    "wheat_smut": "wheat_smut",
    "wheat_yellow_rust": "wheat_yellow_rust",
    "wheat_leaf_rust": "wheat_brown_rust",  # leaf rust ≡ brown rust (P. triticina)
    "wheat_healthy": "healthy_wheat",
    "powdery_mildew": "wheat_powdery_mildew",
    "septoria": "wheat_septoria",
    "tan_spot": "wheat_tan_spot",
    "fusarium_head_blight": "wheat_fusarium_head_blight",
    "leaf_blight": "wheat_leaf_blight",
}


def md5_of_file(path: Path, _buf_size: int = 1 << 16) -> str:
    h = hashlib.md5()
    with path.open("rb") as f:
        while chunk := f.read(_buf_size):
            h.update(chunk)
    return h.hexdigest()


def iter_images(folder: Path):
    for p in folder.rglob("*"):
        if p.is_file() and p.suffix.lower() in IMG_EXTS:
            yield p


def remove_non_class_dirs(root: Path, dry: bool) -> None:
    for split in ("train", "val", "test"):
        split_dir = root / split
        if not split_dir.exists():
            continue
        for sub in split_dir.iterdir():
            if sub.is_dir() and sub.name in NON_CLASS_DIRS:
                n = sum(1 for _ in iter_images(sub))
                print(f"  [clean] {split}/{sub.name}/  ({n} files) — {'WOULD DELETE' if dry else 'deleted'}")
                if not dry:
                    shutil.rmtree(sub)


def collect_existing_hashes(root: Path) -> set[str]:
    """Hash every image already in train/val/test → use to dedup new additions
    AND prevent leaking val/test images into train."""
    hashes: set[str] = set()
    for split in ("train", "val", "test"):
        split_dir = root / split
        if not split_dir.exists():
            continue
        n = 0
        for img in iter_images(split_dir):
            hashes.add(md5_of_file(img))
            n += 1
        print(f"  hashed {split}/: {n} images")
    return hashes


def collect_additions(root: Path) -> dict[str, list[Path]]:
    """Walk all configured raw sources → group images by canonical class."""
    out: dict[str, list[Path]] = defaultdict(list)

    for rel, class_map in MAPPINGS.items():
        src_root = root / rel
        if not src_root.exists():
            print(f"  [skip] {rel}/ not found")
            continue
        for raw_class, canonical in class_map.items():
            src = src_root / raw_class
            if not src.exists():
                print(f"  [skip] {rel}/{raw_class}/ missing")
                continue
            imgs = list(iter_images(src))
            out[canonical].extend(imgs)
            print(f"  {rel}/{raw_class:<30s} → {canonical:<32s} {len(imgs):>5}")

    for folder, canonical in SINGLE_CLASS_FOLDERS.items():
        src = root / folder
        if not src.exists():
            print(f"  [skip] {folder}/ not found")
            continue
        imgs = list(iter_images(src))
        out[canonical].extend(imgs)
        print(f"  {folder:<35s} → {canonical:<32s} {len(imgs):>5}")

    return out


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", required=True, type=Path,
                    help="agrianalyze-data root (contains train/, val/, test/, raw folders)")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--force", action="store_true",
                    help="Re-run even if marker present (NOT recommended)")
    args = ap.parse_args()

    root: Path = args.root.resolve()
    if not root.exists():
        raise SystemExit(f"root not found: {root}")

    marker = root / MARKER
    if marker.exists() and not args.force:
        print(f"Already merged (marker {MARKER} present). Use --force to redo.")
        return

    print("\n=== STEP 1: clean detection-format pollution from splits ===")
    remove_non_class_dirs(root, args.dry_run)

    print("\n=== STEP 2: hash existing train/val/test images (dedup + leak guard) ===")
    existing = collect_existing_hashes(root)
    print(f"  total existing hashes: {len(existing)}")

    print("\n=== STEP 3: scan raw sources ===")
    additions = collect_additions(root)

    print("\n=== STEP 4: dedup + copy into train/ ===")
    train_root = root / "train"
    summary: list[tuple[str, int, int, int]] = []  # (class, candidates, dups, added)

    for canonical, imgs in sorted(additions.items()):
        added = dups = 0
        dest_dir = train_root / canonical
        if not args.dry_run:
            dest_dir.mkdir(parents=True, exist_ok=True)

        for src_img in imgs:
            h = md5_of_file(src_img)
            if h in existing:
                dups += 1
                continue
            existing.add(h)
            # Unique destination filename: <hash>_<orig>
            dst = dest_dir / f"{h[:10]}_{src_img.name}"
            if not args.dry_run:
                shutil.copy2(src_img, dst)
            added += 1

        summary.append((canonical, len(imgs), dups, added))

    print("\n=== SUMMARY ===")
    print(f"{'class':<32s} {'cand':>6s} {'dup':>6s} {'added':>6s}")
    print("-" * 56)
    tot_c = tot_d = tot_a = 0
    for cls, c, d, a in summary:
        print(f"{cls:<32s} {c:>6d} {d:>6d} {a:>6d}")
        tot_c += c; tot_d += d; tot_a += a
    print("-" * 56)
    print(f"{'TOTAL':<32s} {tot_c:>6d} {tot_d:>6d} {tot_a:>6d}")

    print("\n=== POST-MERGE train/ counts ===")
    for cls_dir in sorted((root / "train").iterdir()):
        if cls_dir.is_dir():
            n = sum(1 for _ in iter_images(cls_dir))
            print(f"  {cls_dir.name:<35s} {n:>6d}")

    if not args.dry_run:
        marker.write_text("ok\n")
        print(f"\nWrote marker: {marker}")
    else:
        print("\n(dry-run: no files copied, marker not written)")


if __name__ == "__main__":
    main()
