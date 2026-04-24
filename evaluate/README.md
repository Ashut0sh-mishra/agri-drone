# evaluate/ — Research Evaluation Scripts

Scripts used for the **research paper** — ablation studies, statistical tests,
cross-dataset evaluation, and sensitivity analysis.

> These scripts are **for research reproducibility**, not for production use.
> They produce the numbers and tables that appear in the paper.

## Main Scripts

| Script | What it produces |
|--------|-----------------|
| `ablation_study.py` | Config A/B/C/D ablation — Table 3 in the paper |
| `statistical_tests.py` | Bootstrap 95% CIs + McNemar's chi-sq test |
| `statistical_tests_v2.py` | Updated statistical tests with Holm-Bonferroni |
| `cross_dataset_eval.py` | Evaluate on PlantVillage and PlantDoc (external datasets) |
| `sensitivity_analysis.py` | 125-config grid search for threshold sensitivity |
| `robustness_eval.py` | Noise, blur, and compression robustness tests |
| `paper_tables.py` | Generates LaTeX tables for the paper from results JSON |
| `llava_eval.py` | LLaVA-only evaluation (for comparison baseline) |

## Output Location

All evaluation outputs go to `evaluate/results/` (JSON, CSV) and
`outputs/evaluation/` (plots, charts).

## How to Reproduce Paper Results

```bash
# Step 1: Run full ablation
python evaluate/ablation_study.py

# Step 2: Run statistical tests
python evaluate/statistical_tests_v2.py

# Step 3: Cross-dataset validation
python evaluate/cross_dataset_eval.py

# Step 4: Generate paper tables
python evaluate/paper_tables.py
```

## Metric Definitions

- **MCC** (Matthews Correlation Coefficient) — primary metric for imbalanced classes
- **mAP@0.5** — detection quality
- **Bootstrap CI** — 10,000 resamples, 95% confidence interval
