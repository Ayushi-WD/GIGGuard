"""Reuse the trusted local ML pipeline, loaded lazily once per process."""

from functools import lru_cache
from threading import Lock

from fastapi import HTTPException

from ml_models.features import validate_features
from ml_models.predict import load_model, predict_risk
from ml_models.train_model import DEFAULT_MODEL

MODEL_UNAVAILABLE = (
    "Risk model unavailable. Ask the operator to prepare the local model using "
    "python -m ml_models.generate_data and python -m ml_models.train_model "
    "from the project root, then restart the backend. Check the recorded ML "
    "dependency versions if an existing artifact cannot load."
)
_model_lock = Lock()


@lru_cache(maxsize=1)
def get_model_artifact():
    return load_model(DEFAULT_MODEL)


def validate_risk_features(features):
    try:
        return validate_features(features)
    except (ValueError, TypeError, OverflowError) as error:
        # The shared validator reports feature names/ranges, never server paths.
        raise HTTPException(status_code=422, detail=str(error)) from error


def predict_score(features):
    values = validate_risk_features(features)
    try:
        # Serialize first-load cache access so simultaneous first requests
        # cannot deserialize the same large pipeline more than once.
        with _model_lock:
            artifact = get_model_artifact()
        return predict_risk(values, pipeline=artifact["pipeline"])
    except Exception as error:
        # Includes missing/corrupt artifacts, version mismatches, failed inference,
        # and invalid model output. Never train or expose exception text here.
        raise HTTPException(status_code=503, detail=MODEL_UNAVAILABLE) from error
