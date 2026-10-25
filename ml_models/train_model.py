"""Split once, cross-validate only training rows, then evaluate the held-out set."""

import argparse
import hashlib
import json
import platform
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
import sklearn
from sklearn.compose import ColumnTransformer
from sklearn.dummy import DummyRegressor
from sklearn.ensemble import RandomForestRegressor
from sklearn.impute import SimpleImputer
from sklearn.inspection import permutation_importance
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import KFold, cross_validate, train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

from ml_models.features import (
    FEATURES, NUMERIC_RANGES, SCORING_VERSION, SEASONS, SEED, TARGET, validate_features,
)
from ml_models.generate_data import DEFAULT_DATA

DEFAULT_MODEL = Path(__file__).resolve().parent / "artifacts" / "risk_model.joblib"
DEFAULT_REPORT = Path(__file__).resolve().parent / "reports" / "training_report.json"


def build_pipeline(seed=SEED, n_estimators=120):
    numeric = Pipeline([("impute", SimpleImputer(strategy="median"))])
    categorical = Pipeline([
        ("impute", SimpleImputer(strategy="most_frequent")),
        ("encode", OneHotEncoder(handle_unknown="ignore", sparse_output=False)),
    ])
    preprocessing = ColumnTransformer([
        ("numeric", numeric, list(NUMERIC_RANGES)),
        ("season", categorical, ["season_factor"]),
    ])
    return Pipeline([
        ("preprocess", preprocessing),
        ("model", RandomForestRegressor(n_estimators=n_estimators, max_depth=16,
                                       min_samples_leaf=3, random_state=seed, n_jobs=-1)),
    ])


def metrics(actual, predicted):
    return {"r2": float(r2_score(actual, predicted)),
            "mae": float(mean_absolute_error(actual, predicted)),
            "rmse": float(np.sqrt(mean_squared_error(actual, predicted)))}


def train_and_evaluate(data, seed=SEED, n_estimators=120):
    if (len(data.columns) != 13 or set(data.columns) != set(FEATURES + [TARGET])
            or len(data) < 50):
        raise ValueError("Expected at least 50 rows with exactly 12 features and risk_score")
    if data[FEATURES].isna().all().any():
        raise ValueError("Every feature must have at least one observed training-dataset value")
    if data[TARGET].isna().any() or not data[TARGET].between(0, 100).all():
        raise ValueError("Targets must be present and between 0 and 100")
    # Reject invalid observed values while permitting explicit missing features.
    for row in data[FEATURES].to_dict("records"):
        # Temporary placeholders only skip range checks for explicit missing
        # cells. They are NOT written into data; the pipeline fits imputers.
        checked = {name: (SEASONS[0] if name == "season_factor" else NUMERIC_RANGES[name][0])
                   if pd.isna(value) else value for name, value in row.items()}
        validate_features(checked)
    x_train, x_test, y_train, y_test = train_test_split(
        data[FEATURES], data[TARGET], test_size=0.2, random_state=seed,
    )
    folds = KFold(n_splits=5, shuffle=True, random_state=seed)
    scoring = {"r2": "r2", "mae": "neg_mean_absolute_error",
               "rmse": "neg_root_mean_squared_error"}
    pipeline = build_pipeline(seed, n_estimators)
    baseline = DummyRegressor(strategy="mean")
    report = {
        "seed": seed, "scoring_version": SCORING_VERSION,
        "rows": len(data), "training_rows": len(x_train), "test_rows": len(x_test),
        "features": FEATURES, "feature_ranges": NUMERIC_RANGES,
        "season_categories": SEASONS,
        "assumptions": {
            "labels": "Synthetic weighted exposure index plus Gaussian noise (SD 3), clipped to 0-100.",
            "ranges": "Hypothetical simulation bounds, not measured Indian worker/city distributions.",
            "missingness": "Default generator hides 2% of context cells after labeling; inference requires complete inputs.",
            "preprocessing": "Numeric median and season mode/one-hot fitted inside each training fold.",
            "validation": "Random worker-week split; no genuine city/time or real insurance validation.",
            "recipe_documentation": "ml_models/README.md; generate_data.py synthetic_v1",
        },
        "missing_counts": data[FEATURES].isna().sum().to_dict(),
        "versions": {"python": platform.python_version(), "sklearn": sklearn.__version__,
                     "pandas": pd.__version__, "numpy": np.__version__, "joblib": joblib.__version__},
        "interpretation": "Synthetic scoring-process fidelity, not real insurance risk accuracy.",
        "cross_validation": {},
    }
    for name, estimator in [("random_forest", pipeline), ("dummy", baseline)]:
        cv = cross_validate(estimator, x_train, y_train, cv=folds, scoring=scoring, n_jobs=1)
        report["cross_validation"][name] = {}
        for metric in scoring:
            values = cv["test_" + metric] * (1 if metric == "r2" else -1)
            report["cross_validation"][name][metric] = {
                "folds": values.tolist(), "mean": float(values.mean()), "std": float(values.std()),
            }
    pipeline.fit(x_train, y_train)
    baseline.fit(x_train, y_train)
    report["held_out_test"] = {
        "random_forest": metrics(y_test, pipeline.predict(x_test)),
        "dummy": metrics(y_test, baseline.predict(x_test)),
    }
    report["training_metrics"] = metrics(y_train, pipeline.predict(x_train))
    report["forest_parameters"] = pipeline.named_steps["model"].get_params()
    names = pipeline.named_steps["preprocess"].get_feature_names_out()
    report["impurity_importance_encoded"] = dict(sorted(zip(
        names, pipeline.named_steps["model"].feature_importances_.tolist()
    ), key=lambda pair: pair[1], reverse=True))
    # Inspect original feature columns on training data only. Do not use test
    # importance to tune the model; correlated inputs can share importance.
    importance = permutation_importance(pipeline, x_train, y_train, scoring="r2",
                                        n_repeats=3, random_state=seed, n_jobs=1)
    report["training_permutation_importance"] = {
        name: {"mean_r2_drop": float(importance.importances_mean[index]),
               "std": float(importance.importances_std[index])}
        for index, name in sorted(enumerate(FEATURES),
                                  key=lambda item: importance.importances_mean[item[0]], reverse=True)
    }
    return pipeline, report


def save_model(pipeline, report, path=DEFAULT_MODEL):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump({"pipeline": pipeline, "metadata": report}, path, compress=3)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--data", type=Path, default=DEFAULT_DATA)
    parser.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    parser.add_argument("--report", type=Path, default=DEFAULT_REPORT)
    parser.add_argument("--seed", type=int, default=SEED)
    args = parser.parse_args()
    data = pd.read_csv(args.data)
    print(f"Training on {len(data)} rows; five-fold CV uses only the 80% training split.", flush=True)
    pipeline, report = train_and_evaluate(data, args.seed)
    report["dataset_sha256"] = hashlib.sha256(args.data.read_bytes()).hexdigest()
    save_model(pipeline, report, args.model)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, indent=2), encoding="utf-8")
    print(json.dumps(report["held_out_test"], indent=2))
    print(f"Model: {args.model}\nFull evaluation report: {args.report}")


if __name__ == "__main__":
    main()
