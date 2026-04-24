"""Download AgriDrone datasets from HuggingFace.

Pulls from https://huggingface.co/datasets/ashu010/agridrone-data into
the local `data/` directory. Safe to re-run — already-present files are
skipped by content hash.

Usage:
    # Everything (~25 GB)
    python scripts/fetch_data.py

    # Only the training splits (~5 GB — enough to reproduce the model)
    python scripts/fetch_data.py --only training

    # Multiple subsets
    python scripts/fetch_data.py --only training --only raw/wheat
"""
from __future__ import annotations
import argparse
import os
from pathlib import Path

os.environ.setdefault("HF_HUB_ENABLE_HF_TRANSFER", "1")

REPO_ID = "ashu010/agridrone-data"
ROOT = Path(__file__).resolve().parent.parent
DEFAULT_TARGET = ROOT / "data"


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--only",
        action="append",
        default=None,
        metavar="SUBFOLDER",
        help="Limit download to this subfolder (repeatable). "
             "Examples: training, raw/wheat, externals/PDT_datasets",
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
        help="HuggingFace token (public repo works without one; "
             "set HF_TOKEN env var or use this flag for private/rate-limited pulls)",
    )
    args = parser.parse_args()

    try:
        from huggingface_hub import snapshot_download
    except ImportError:
        print("ERROR: install huggingface_hub first:")
        print("    pip install 'huggingface_hub[hf_transfer]'")
        raise SystemExit(1)

    args.target.mkdir(parents=True, exist_ok=True)

    allow_patterns = None
    if args.only:
        allow_patterns = [f"{p.rstrip('/')}/**" for p in args.only]
        print(f"Downloading subsets: {args.only}")
    else:
        print("Downloading ALL datasets (~25 GB) — this will take a while.")

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
