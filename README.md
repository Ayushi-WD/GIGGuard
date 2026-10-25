# GIG-Guard

- My BTech CSE major project for income protection of gig delivery workers.
- It focuses on income loss caused by rain, heat and other disruptions.

## Work Done

- Built the FastAPI backend and worker registration APIs.
- Saved worker profiles in SQLite using SQLAlchemy.
- Added a weekly premium calculator with a range of INR 49–99.
- Tested the APIs through Swagger UI.
- Completed a separate Random Forest risk prediction prototype in `ml_models/`.
- Used 12 features and 20,000 synthetic worker-risk profiles.
- Used an 80/20 train-test split and five-fold cross-validation on training data.
- Held-out R² = 0.8701, MAE = 2.9859 and RMSE = 3.7874.
- Last verified tests: 73 backend tests and 38 ML tests passed.

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

## Run the ML Prototype

- Run these commands from the repository folder:

```powershell
.\backend\.venv\Scripts\python.exe -m pip install -r ml_models\requirements.txt
.\backend\.venv\Scripts\python.exe -m ml_models.generate_data
.\backend\.venv\Scripts\python.exe -m ml_models.train_model
.\backend\.venv\Scripts\python.exe -m ml_models.predict --input ml_models\sample_worker.json
.\backend\.venv\Scripts\python.exe -m pytest ml_models\tests -q
```

- Training saves the model and an evaluation report locally.
- See [ML notes](ml_models/README.md) for the feature details and scoring assumptions.

## Current Limits and Next Steps

- The model uses synthetic data, not real insurance outcomes. Its scores do not prove real-world accuracy.
- The model is not yet integrated into FastAPI. The pricing API still accepts a manually simulated risk score.
- Next steps are model integration, the Next.js dashboard, weather triggers, payout calculations, fraud checks and PostgreSQL.
- Real insurance payments are not implemented.
