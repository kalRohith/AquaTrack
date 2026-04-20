# AquaTrack

AquaTrack is a notebook-first machine learning project for dehydration risk and context detection.
The repository is structured for reproducible experimentation and artifact export to support downstream inference.

## Project Structure

- `notebooks/` - end-to-end analysis and training workflow notebooks
  - `01_eda.ipynb`
  - `02_preprocessing.ipynb`
  - `03_target_engineering.ipynb`
  - `04_ml_pipeline.ipynb`
  - `05_context_detection.ipynb`
- `models/` - reusable Python modules and artifacts
  - `helper/` - canonical helper imports used by notebooks (`models.helper.*`)
  - `artifacts/` - exported model bundles and plots

## Environment Setup

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Running the Workflow

1. Run `notebooks/01_eda.ipynb` to perform exploratory checks and data profiling.
2. Run `notebooks/02_preprocessing.ipynb` and `notebooks/03_target_engineering.ipynb` to prepare data and labels.
3. Run `notebooks/04_ml_pipeline.ipynb` to train and export the main dehydration model.
4. Run `notebooks/05_context_detection.ipynb` to train and export the context model and metadata.

## Helper Import Convention

All reusable helpers are imported from `models.helper` in notebooks.
Avoid defining helper functions inline inside notebook cells.

## Artifacts

Generated artifacts are written under `models/artifacts/`, including:

- Main dehydration model bundles
- Context classifier and metadata bundles
- EDA and training plots

## GitHub Readiness Checklist

- Ensure notebooks run top-to-bottom in a clean kernel.
- Verify exported files in `models/artifacts/` are intentional before commit.
- Keep secrets and local-only files out of version control.
