# configs/ — Configuration Files (YAML)

All runtime configuration is stored here as YAML files.
The Python code loads these via `src/agridrone/config.py`.

## Files

| File | Controls |
|------|----------|
| `base.yaml` | Global defaults (log level, device, seed) |
| `model.yaml` | Model paths, confidence thresholds, class names |
| `data.yaml` | Dataset paths, split ratios, augmentation settings |
| `inference.yaml` | Inference settings (batch size, image size, NMS params) |
| `actuation.yaml` | Drone actuation / spray parameters |
| `prescription.yaml` | Prescription map generation settings |
| `sim.yaml` | Simulation environment configuration |

## Sub-folders

| Folder | Purpose |
|--------|---------|
| `economics/` | Economic threshold configs for pesticide cost-benefit analysis |
| `matrix/` | Confusion matrix label mappings and class groupings |

## How to Override a Config Value

Most scripts accept `--config path/to/override.yaml` or environment variables.

For the API, edit `src/agridrone/config.py` to change active config paths.
For training, pass the yaml file directly to the training script:

```bash
python scripts/train_model.py --config configs/model.yaml
```
