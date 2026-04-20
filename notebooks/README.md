# Notebooks

This folder contains the notebook workflow for AquaTrack.

## Execution Order

1. `01_eda.ipynb`
2. `02_preprocessing.ipynb`
3. `03_target_engineering.ipynb`
4. `04_ml_pipeline.ipynb`
5. `05_context_detection.ipynb`

## Conventions

- Keep notebooks orchestration-focused.
- Import shared helpers from `models.helper.*`.
- Do not define reusable helper functions inline in notebook cells.
