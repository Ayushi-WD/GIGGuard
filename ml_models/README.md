# Synthetic Random Forest risk prototype

This standalone experiment predicts a **synthetic 0–100 risk index**, not a
probability of a real claim. It neither reads worker databases nor changes the
working FastAPI pricing endpoint. The endpoint still accepts a simulated score.
No weather API, frontend, fraud detection, or payment code is included.

## Files

- `features.py`: names, ranges, version, seed, and prediction input checks.
- `generate_data.py`: creates 20,000 correlated simulated profiles and labels.
- `train_model.py`: preprocessing pipeline, training, five-fold validation,
  baseline comparison, held-out evaluation, importance, and artifact saving.
- `predict.py`: loads the saved pipeline and exposes `predict_risk(worker_features)`.
- `sample_worker.json`: complete example observations, all fictional.
- `tests/test_ml.py`: small, fast training fixtures; no development data used.
- `requirements.txt`: ML dependencies, separate from backend dependencies.
- `data/synthetic_profiles.csv`: generated data, ignored by Git.
- `artifacts/risk_model.joblib`: compressed preprocessing + model + metadata,
  ignored by Git.
- `reports/training_report.json`: small report with actual metrics, fold scores,
  importances, parameters, library versions, missing counts, and dataset hash.

## Windows PowerShell commands

Run from the repository root, **not** from `backend`:

```powershell
cd "C:\Users\HP\OneDrive\Desktop\code\majorproject\GIGGuard"
.\backend\.venv\Scripts\python.exe -m pip install -r ml_models\requirements.txt
.\backend\.venv\Scripts\python.exe -m ml_models.generate_data
.\backend\.venv\Scripts\python.exe -m ml_models.train_model
Get-Content ml_models\reports\training_report.json
.\backend\.venv\Scripts\python.exe -m ml_models.predict --input ml_models\sample_worker.json
.\backend\.venv\Scripts\python.exe -m pytest ml_models\tests -q
```

Training automatically evaluates the held-out test set and writes its results;
reading the report does not retrain the model. Default seed is 42 for generation,
splitting, folds, forest, and permutation importance. Commands accept `--help`;
generation supports `--rows`, `--seed`, and `--output`. Training accepts `--data`,
`--seed`, `--model`, and `--report`. Default output paths are anchored to this
module, independent of the terminal directory. Regenerating/training replaces
only the named generated outputs; it does not edit SQLite records.

Run the existing backend tests separately so their pytest configuration is used:

```powershell
Push-Location backend
.\.venv\Scripts\python.exe -m pytest -q
Pop-Location
```

`-m` runs a Python module; the explicit executable uses the existing environment.
`Push-Location` changes directory and remembers it; `Pop-Location` returns.

## Feature contract and simulation assumptions

**All ranges, distributions, correlations, and weights below are prototype
assumptions. They are plausible simulation bounds, not measured Indian city or
delivery-worker statistics.** No geography-specific truth is implied. A risk
index of 80 does not mean an 80% chance of a claim.

| Feature | Units/range | Simulation |
| --- | --- | --- |
| `historical_rain_risk` | index 0–100 | Beta(2,2) × 100 |
| `historical_heat_risk` | index 0–100 | Beta(2,2) × 100 |
| `historical_flood_risk` | index 0–100 | 0.6 × rain + Normal(10,15) |
| `weather_forecast_risk` | index 0–100 | 0.5 × rain + monsoon 30 or summer 15 + Normal(10,15) |
| `season_factor` | winter/summer/monsoon/post_monsoon | Probabilities 0.25/0.25/0.30/0.20 |
| `location_density` | people/km², 500–40,000 | Lognormal(median 9,000, log-sigma 0.65) |
| `platform_volatility` | index 0–1 | Beta(2,5); no actual platform ranking |
| `experience_days` | integer 0–3,650 | Exponential(mean 450), clipped, truncated to integer |
| `average_daily_income` | INR 200–2,000 | 450 + 0.12 × min(experience,1500) + 0.008 × density + Normal(0,130) |
| `historical_claim_rate` | fraction 0–0.5 | 0.02 + 0.0012 × rain + 0.001 × flood + 0.08 × volatility + Normal(0,0.025) |
| `current_aqi` | index 0–500 | 40 + 0.004 × density + winter 70 − monsoon 30 + Normal(0,35) |
| `festival_season` | integer 0 or 1 | Bernoulli probability 0.45 in post-monsoon, otherwise 0.12 |

Continuous generated features are clipped to their listed ranges. Income is
rounded to paise. `Normal(mean, standard_deviation)` describes random noise.
The claim rate is a synthetic **prior-period feature**, not this row's generated
target or a copy of it. In future real data, it must be computed strictly from
information available before the prediction date.

Rows are hypothetical worker-weeks. Shared city identifiers, genuine historical
sequences, actual claims, and verified income distributions are not represented.
Thus the random split does not establish performance on new cities or future
weeks. Real deployment would need time/city-aware evaluation and real labels.

### Synthetic label recipe

Normalize rain, heat, flood, and forecast by 100; density as `(density−500)/39500`;
income as `(income−200)/1800`; claims by 0.5; AQI by 500. Use
`exp(−experience_days/180)` as the novice factor. Season scores are winter 0.35,
summer 0.65, monsoon 1, post-monsoon 0.45.

Multiply these normalized components by these weights and add them:

```text
rain 12 + heat 8 + flood 12 + forecast 18 + season 5 + density 5
+ volatility 8 + novice 5 + income 3 + claims 12 + AQI 8 + festival 4
+ 6 × normalized_rain × normalized_flood
+ 4 × normalized_heat × normalized_AQI
+ Normal(0, 3) noise
```

Clamp the sum to 0–100 and round to four decimal places. The positive income
coefficient is a small hypothetical exposure assumption, not a finding about
worker behavior. The model is learning this recipe, not discovering validated
actuarial relationships. Noise prevents perfectly deterministic targets.
There is no target feature, target encoding, or target-derived feature.

After labels are generated, independently hide 2% of each environmental/context
feature, including season. Income, experience, and festival flag remain observed.
The hidden observations exercise imputation; they do not change the label.

## Preprocessing and evaluation

The split is 80% training (16,000 rows) and 20% testing (4,000). Five-fold shuffled
cross-validation uses **only training rows**. Each fold clones the entire pipeline:
numeric median imputation, most-frequent season imputation, one-hot season
encoding, then RandomForestRegressor. This keeps preprocessing from seeing
validation/test values. Trees do not require feature scaling.

The forest has 120 trees, maximum depth 16, and minimum leaf size 3. These settings
are fixed beforehand, not chosen by repeated test-set experiments. Final fitting
uses all 16,000 training rows, not all 20,000; the 4,000 test rows remain held out.
DummyRegressor predicts the training mean and uses the same folds/split.

The report includes training metrics to inspect overfitting, validation means,
standard deviations and all five fold scores, and test R², MAE and RMSE for both
models. MAE and RMSE are in risk-score points; **R² is not percentage accuracy**.
The synopsis's R² = 0.92 remains an unverified proposed target, not a promised result.

Importance is shown two ways: forest impurity importance per encoded feature,
and three-repeat permutation importance per original feature on the training
split. Impurity importance can favor continuous features; correlated inputs can
share or mask importance. Training permutation importance is descriptive and
may be optimistic; neither measure establishes causation. No held-out importance
or test metric is used to tune the prototype.

## Prediction and loading

```python
from ml_models.predict import load_model, predict_risk

# Features must follow sample_worker.json; no database or external API is called.
score = predict_risk(worker_features)
artifact = load_model()  # Contains "pipeline" and "metadata".
```

All 12 keys are required. Unknown keys, booleans, numeric strings, nulls,
NaN/Infinity, unknown seasons, out-of-range numbers, and fractional experience or
festival flags are rejected with ValueError. A missing artifact raises a clear
FileNotFoundError with the training command. There are no silent inference
defaults. Training can impute explicit missing observations, but the public
prediction function deliberately requires complete supplied information.
Scores are bounded to 0–100; this is a numeric index, not calibrated probability.

Only load joblib artifacts you created or trust: loading pickle-based files can
execute code. The artifact records versions; loading rejects a different
scikit-learn version or feature/scoring contract. For repeatability, use the
recorded versions and seed; exact reproducibility across library/platform
changes is not guaranteed. Input bounds reflect this synthetic training domain;
valid backend workers outside these bounds are not supported by this ML prototype.

Floating-point calculations are standard here for statistical modeling. Monetary
premium calculations remain in the backend's Decimal service. Later an explicit
integration can collect and validate all 12 features, call `predict_risk`, convert
the numeric score using `Decimal(str(score))`, and pass it to `calculate_premium`.
That integration has **not** been added; the existing API still reports
`calculation_method: "simulated_risk_score"`.

## Beginner explanations

- **Random Forest:** many decision trees learn different rules from different
  samples and random feature choices; the forest averages their predictions.
- **Regression:** predicts a number (our 0–100 index), rather than a category.
- **Synthetic data:** artificial examples created from assumptions, useful for
  testing the workflow when real labeled records are unavailable.
- **Training/testing:** training teaches the model; testing checks predictions
  on examples it did not learn from.
- **Overfitting:** memorizing training details/noise and performing worse on
  unseen data. Compare training, validation and test performance.
- **Five-fold validation:** divide training data into five parts, train five
  models with a different part held out each time, and summarize the results.
- **R²:** measures improvement over a constant prediction relative to target
  variation. 1 is perfect, 0 matches a mean predictor, and negative can be worse.
- **MAE/RMSE:** average absolute error and root-mean-square error; RMSE penalizes
  large mistakes more strongly.
- **Feature importance:** describes which inputs this model relies on, not which
  real-world factors have been proven to cause losses.

References: [RandomForestRegressor](https://scikit-learn.org/stable/modules/generated/sklearn.ensemble.RandomForestRegressor.html),
[leakage prevention](https://scikit-learn.org/stable/common_pitfalls.html), and
[model persistence](https://scikit-learn.org/stable/model_persistence.html).

## Actual run: 25 October 2026

Generated **20,000** profiles with seed 42. Used 16,000 training rows and 4,000
held-out rows. No hyperparameter tuning or repeated test-driven optimization
was performed. The saved model contains 120 trees fitted only on training rows.

| Held-out test metric | Random Forest | Mean DummyRegressor |
| --- | ---: | ---: |
| R² | 0.870073 | -0.000360 |
| MAE (score points) | 2.985886 | 8.507531 |
| RMSE (score points) | 3.787366 | 10.509116 |

| Five-fold training CV (mean ± standard deviation) | Random Forest | Dummy |
| --- | ---: | ---: |
| R² | 0.875597 ± 0.002312 | -0.000313 ± 0.000222 |
| MAE | 2.978264 ± 0.063142 | 8.657082 ± 0.125068 |
| RMSE | 3.741866 ± 0.070168 | 10.610383 ± 0.121998 |

Training R² was 0.967782 and training MAE was 1.475454. The training/test gap
shows some overfitting to training data; it is not evidence of real-world
reliability. The CV and test results are similar under this synthetic distribution.
The reported R² is **not 0.92**, and is not an insurance accuracy percentage.

Top original features by **training permutation importance** (mean R² decrease
when shuffled, not percentages):

| Feature | Mean R² decrease |
| --- | ---: |
| Weather forecast risk | 0.397213 |
| Historical rain risk | 0.248652 |
| Historical flood risk | 0.145465 |
| Historical claim rate | 0.095355 |
| Historical heat risk | 0.084112 |

The JSON report contains all 12 feature results and encoded impurity importances.
Importance reflects the assumptions in the generator and correlations, not
validated causal relationships or real-world insurance evidence.

The saved artifact loaded successfully and the sample command returned:

```json
{
  "risk_score": 46.41845042342157,
  "method": "random_forest_synthetic_v1"
}
```

Verification commands above actually executed:

- ML tests: **38 passed in 33.81s**, exit code 0.
- Existing backend tests: **73 passed, 1 warning in 3.17s**, exit code 0.
- `python -m pip check`: **No broken requirements found**.
- Existing warning: Starlette's deprecated HTTPX test-client integration.
  No warnings were suppressed and no tests failed in these runs.
- Reproducibility tests compare datasets exactly and repeated small-model
  predictions/metrics with numerical tolerance; they do not promise identical
  results after changing dependencies or the data-generation recipe.
- Trained with Python 3.11.9, scikit-learn 1.9.1, pandas 2.3.3, NumPy 2.4.6,
  and joblib 1.6.0; versions and dataset SHA-256 are in the report.
- Model artifact is approximately 15.2 MB; CSV approximately 3.5 MB. Both are
  generated locally and ignored by Git. The small report remains reviewable.
- Backend source, pricing API, and worker records were not changed.
- No commits or pushes were made.
