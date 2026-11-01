"""GIG-Guard backend application package."""

import sys
from pathlib import Path

# Uvicorn is started from backend/, while the shared ml_models package is
# beside backend/. Resolve the checkout root without machine-specific paths.
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
