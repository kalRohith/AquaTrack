# Models Directory

Reusable pipeline code and exported artifacts for AquaTrack.

## Layout

- `helper/`
  - Canonical helper import surface for notebooks (`models.helper.*`).
  - Includes wrappers for shared modules and notebook utility helpers.
- `artifacts/`
  - Serialized model bundles (`.pkl`) and generated plots.
- `*.py`
  - Core model/pipeline modules used by helper wrappers.

## Notebook Import Standard

Use helper imports consistently:

```python
from models.helper.eda_tools import high_correlation_pairs
from models.helper.notebook_helpers import plot_per_column_distribution
from models.helper.dehydration_pipeline import DehydrationArtifact
```

## Artifacts in This Folder

- `aquatrack_main_classifier.pkl`
- `aquatrack_context_classifier.pkl`
- `aquatrack_context_metadata.pkl`
- supporting medians/features files as produced by notebooks
