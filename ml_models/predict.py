"""Load a locally trained pipeline and predict from complete validated inputs."""

import argparse
import json
import math
from pathlib import Path

import joblib
import pandas as pd
import sklearn
from sklearn.pipeline import Pipeline

from ml_models.features import FEATURES, SCORING_VERSION, validate_features
from ml_models.train_model import DEFAULT_MODEL


def load_model(model_path=DEFAULT_MODEL):
    path = Path(model_path)
    if not path.is_file():
        raise FileNotFoundError(f"Model not found at {path}. Run python -m ml_models.train_model first.")
    # joblib is pickle-based: load only artifacts you created or trust.
    artifact = joblib.load(path)
    if not isinstance(artifact, dict) or not isinstance(artifact.get("pipeline"), Pipeline):
        raise ValueError("Invalid model artifact: expected pipeline and metadata")
    metadata = artifact.get("metadata", {})
    if metadata.get("features") != FEATURES or metadata.get("scoring_version") != SCORING_VERSION:
        raise ValueError("Model feature contract or scoring version does not match this code")
    if metadata.get("versions", {}).get("sklearn") != sklearn.__version__:
        raise ValueError("scikit-learn version differs from training; use recorded versions or retrain")
    return artifact


def predict_risk(worker_features, model_path=DEFAULT_MODEL, *, pipeline=None):
    row = validate_features(worker_features)
    if pipeline is None:
        pipeline = load_model(model_path)["pipeline"]
    prediction = float(pipeline.predict(pd.DataFrame([row], columns=FEATURES))[0])
    if not math.isfinite(prediction) or not 0 <= prediction <= 100:
        raise ValueError("Model produced a score outside the finite 0-100 range")
    return min(100.0, max(0.0, prediction))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", type=Path, required=True)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    args = parser.parse_args()
    try:
        score = predict_risk(json.loads(args.input.read_text(encoding="utf-8")), args.model)
    except (ValueError, FileNotFoundError) as error:
        parser.exit(2, f"Prediction error: {error}\n")
    print(json.dumps({"risk_score": score, "method": "random_forest_synthetic_v1"}, indent=2))


if __name__ == "__main__":
    main()
