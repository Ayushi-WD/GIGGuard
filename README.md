# GIG-Guard

- My BTech CSE major project for income protection of gig delivery workers.
- It focuses on income loss caused by rain, heat and other disruptions.

## Work Done

- Built the FastAPI backend and worker registration APIs.
- Saved worker profiles in SQLite using SQLAlchemy.
- Added a weekly premium calculator with a range of INR 49–99.
- Tested the APIs through Swagger UI.
- Integrated the trained Random Forest prototype with FastAPI and the premium calculator.
- Used 12 features and 20,000 synthetic worker-risk profiles.
- Used an 80/20 train-test split and five-fold cross-validation on training data.
- Held-out R² = 0.8701, MAE = 2.9859 and RMSE = 3.7874.
- The original manual-risk pricing endpoint is still available.
- Verified tests: 151 backend tests (including 78 new integration cases) and 38 ML tests passed; none failed.

## Tech Used

- Backend: Python and FastAPI.
- Database: SQLite and SQLAlchemy.
- ML: pandas, NumPy, scikit-learn and joblib.
- Testing: pytest.

## API Endpoints

- `GET /` — Welcome message.
- `GET /health` — Backend status.
- `POST /workers` — Register a worker.
- `GET /workers` — List workers.
- `GET /workers/{worker_id}` — Get one worker's profile.
- `POST /pricing/estimate` — Estimate the weekly premium.
- `POST /risk/predict` — Predict risk from all 12 supplied features.
- `POST /pricing/estimate-ml` — Predict risk and calculate a premium using saved worker details.

## Run the Backend

- Open PowerShell in the repository folder.
- Use the existing environment, or create it with `python -m venv backend/.venv` if needed.

```powershell
cd backend
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

- Open http://127.0.0.1:8001/docs to try the APIs.
- From `backend`, run tests with `.\.venv\Scripts\python.exe -m pytest -q`.

## Prepare the Model

- The existing local model is reused; API requests never train it.
- Only if the artifact is missing, run these commands from the repository folder:

```powershell
.\backend\.venv\Scripts\python.exe -m pip install -r ml_models\requirements.txt
.\backend\.venv\Scripts\python.exe -m ml_models.generate_data
.\backend\.venv\Scripts\python.exe -m ml_models.train_model
```

- This creates the ignored local artifact `ml_models/artifacts/risk_model.joblib`.
- Use the recorded ML dependency versions when loading an existing model.
- The backend loads the saved pipeline on the first ML request and caches it until restart.
- Missing or unusable models return 503. Invalid input returns 422; unknown workers return 404.

## Try the New APIs

- Open http://127.0.0.1:8001/docs and use **Try it out**.
- For `/risk/predict`, paste [sample_worker.json](ml_models/sample_worker.json), containing all 12 features.
- For `/pricing/estimate-ml`, use a worker ID from `GET /workers` and supply the 10 environmental/history features.
- Add `location_risk` and optional `work_days_per_week` (default 6).
- Do not send income or experience: the backend reads them from SQLite and rejects overrides.
- Copy the complete [example requests and response](ml_models/README.md#fastapi-integration).
- Test integration from `backend`: `.\.venv\Scripts\python.exe -m pytest tests/test_ml_integration.py -q`.
- Test ML from the repository folder: `.\backend\.venv\Scripts\python.exe -m pytest ml_models/tests -q`.

## Current Limits and Next Steps

- The model uses synthetic data, not real insurance outcomes. Its scores do not prove real-world accuracy.
- ML pricing uses the predicted score with the existing Decimal-based formula and INR 49–99 limits.
- Environmental inputs are supplied manually; there is no live weather or AQI integration.
- The ML prototype only supports income INR 200–2,000 and experience 0–3,650 days. Workers outside that range receive 422 for ML pricing.
- Next steps include the Next.js dashboard, weather triggers, payout calculations, fraud checks and PostgreSQL.
- Real insurance payments are not implemented.
