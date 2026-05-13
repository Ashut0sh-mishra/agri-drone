"""Download AgriAnalyze datasets from HuggingFace.

Pulls from https://huggingface.co/datasets/ashu010/agrianalyze-data into
the local `agrianalyze-data/` directory. Safe to re-run — already-present
files are skipped by content hash.

Usage:
    # Everything (~25 GB, 75k files)
    python scripts/fetch_data.py

    # Only the training splits (enough to reproduce the 21-class model)
    python scripts/fetch_data.py --preset training

    # Only wheat disease classes
    python scripts/fetch_data.py --preset wheat

    # Only rice datasets
    python scripts/fetch_data.py --preset rice

    # External benchmarks (PlantDoc + PDT)
    python scripts/fetch_data.py --preset external

    # Specific folders by exact name (repeatable):
    python scripts/fetch_data.py --only train --only val --only test
"""
from __future__ import annotations
import argparse
import os
from pathlib import Path

os.environ.setdefault("HF_HUB_ENABLE_HF_TRANSFER", "1")

REPO_ID = "ashu010/agrianalyze-data"
ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TARGET = ROOT / "agrianalyze-data"

# Presets map friendly names -> list of top-level folders on HF.
PRESETS: dict[str, list[str]] = {
    "training": ["train", "val", "test", "train_orig", "val_orig"],
    "wheat": [
        "wheat_aphid", "wheat_blast", "wheat_healthy", "wheat_leaf_rust",
        "wheat_smut", "wheat_yellow_rust", "fusarium_head_blight",
        "leaf_blight", "powdery_mildew", "septoria", "tan_spot",
    ],
    "rice": ["Rice_Leaf_AUG", "rice-diseases-v2", "rice-diseases-zoa8l"],
    "external": ["PDT dataset", "plantdoc", "plantdoc-v3"],
    "raw": ["data"],
}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--preset",
        choices=sorted(PRESETS.keys()),
        help="Download a named group of folders (training/wheat/rice/external/raw)",
    )
    parser.add_argument(
        "--only",
        action="append",
        default=None,
        metavar="FOLDER",
        help="Exact folder name on HF (repeatable). Examples: train, wheat_aphid, 'PDT dataset'",
    )
    parser.add_argument(
        "--target",
        type=Path,
        default=DEFAULT_TARGET,
        help=f"Local directory to download into (default: {DEFAULT_TARGET})",
    )
    parser.add_argument(
        "--token",
        default=os.environ.get("HF_TOKEN"),
        help="HuggingFace token (public repo works without one)",
    )
    args = parser.parse_args()

    try:
        from huggingface_hub import snapshot_download
    except ImportError:
        print("ERROR: install huggingface_hub first:")
        print("    pip install 'huggingface_hub[hf_transfer]'")
        raise SystemExit(1)

    args.target.mkdir(parents=True, exist_ok=True)

    folders: list[str] = []
    if args.preset:
        folders.extend(PRESETS[args.preset])
    if args.only:
        folders.extend(args.only)
    folders = sorted(set(folders))

    if folders:
        allow_patterns = [f"{f}/**" for f in folders]
        print(f"Downloading folders: {folders}")
    else:
        allow_patterns = None
        print("Downloading ALL datasets (~25 GB, 75k files) — will take a while.")

    path = snapshot_download(
        repo_id=REPO_ID,
        repo_type="dataset",
        local_dir=str(args.target),
        allow_patterns=allow_patterns,
        token=args.token,
    )
    print(f"Done. Files available under: {path}")


if __name__ == "__main__":
    main()
