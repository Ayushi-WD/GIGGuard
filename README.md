# GIG-Guard

- My BTech CSE major project for income protection of gig delivery workers.
- It focuses on income loss caused by rain, heat and other disruptions.

## Work Done

- Built the FastAPI backend with authentication, worker registration and pricing APIs.
- Saved user credentials and worker profiles in SQLite using SQLAlchemy.
- Added a weekly premium calculator with a range of INR 49–99.
- Built the Next.js frontend as a six-page prototype: landing, worker registration, worker dashboard, premium estimate, disruptions/claims preview, and an About/FAQ page, plus login and a read-only admin console.
- Added role-based access control: visitors see Home, How It Works, Benefits, About Us and Login/Register; logged-in workers see Dashboard, My Profile, Premium Calculator and Help with a profile icon and Logout; administrators see the Admin console with default credentials.
- Connected registration, dashboard and pricing pages to the live API with typed Fetch API calls.
- Kept the disruption, claim and payout UI as a clearly labelled Coming Soon preview because those backend modules do not exist yet. Active pages only register workers and estimate premiums.
- Tested the APIs through Swagger UI.
- Integrated the trained Random Forest prototype with FastAPI and the premium calculator.
- Used 12 features and 20,000 synthetic worker-risk profiles.
- Held-out R² = 0.8701, MAE = 2.9859 and RMSE = 3.7874.
- The original manual-risk pricing endpoint is still available.
- Last verified tests: 151 backend tests (including 78 new integration cases) and 38 ML tests passed; none failed.

## Tech Used

- Backend: Python and FastAPI.
- Frontend: Next.js 16 (App Router), React 19, TypeScript and Tailwind CSS 4.
- Database: SQLite and SQLAlchemy.
- ML: pandas, NumPy, scikit-learn and joblib.
- Testing: pytest.

## Default Credentials
- **Admin account**:
  - Username: `admin`
  - Password: `admin123`
- **Worker accounts**:
  - Sign up via `/login?tab=signup` with your chosen username, password, and gig delivery profile.

## API Endpoints

- `GET /` — Welcome message.
- `GET /health` — Backend status.
- `POST /auth/login` — Login for workers and administrators.
- `POST /auth/signup` — Create a new user account with password and gig delivery profile.
- `GET /auth/users` — List registered users.
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

## Run the Frontend

- Install Node.js 20 or newer and pnpm 11, then run these commands from the repository folder:

```powershell
cd frontend
pnpm install
pnpm dev
```

- Open http://localhost:3000.
- Start the backend first so registration, dashboards and premium estimates can load real data.
- The frontend proxies `/api/backend/*` to `http://127.0.0.1:8001` through a Next.js rewrite. To use another API URL, copy `frontend/.env.example` to `frontend/.env.local` and change `BACKEND_URL`.
- Build, lint and type-check with `pnpm build`, `pnpm lint` and `pnpm exec tsc --noEmit`.
- pnpm settings (build approvals and security overrides) live in `frontend/pnpm-workspace.yaml`.

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

## Frontend Pages

- `/` — Landing page with the hero message, four benefit cards, the four-step workflow and supported platforms.
- `/login` — Unified authentication page with **Log in** and **Sign up** tabs, password creation, validation, and admin quick-fill.
- `/register` — Worker registration form (`POST /workers`) with name, city, platform, average daily income and experience.
- `/dashboard` — Saved worker profile chooser backed by `GET /workers`.
- `/dashboard/{workerId}` — Worker dashboard with overview cards, a premium CTA, profile summary and the four-step workflow.
- `/dashboard/{workerId}/premium` — Premium calculator connected to `POST /pricing/estimate`. The worker picks a risk zone; the app derives the risk score and shows the full breakdown capped at ₹49–₹99.
- `/policy` — Coming Soon preview of disruption alerts, claims and payouts. Nothing can be filed, approved or paid.
- `/about` — About GIG-Guard, How It Works and the FAQ.
- `/admin` — Read-only worker overview (only visible and accessible to `admin`).

## Notes

- The model uses synthetic data, not real insurance outcomes. Its scores do not prove real-world accuracy.
- ML pricing uses the predicted score with the existing Decimal-based formula and INR 49–99 limits.
- Environmental inputs are supplied manually; there is no live weather or AQI integration.
- The ML prototype only supports income INR 200–2,000 and experience 0–3,650 days. Workers outside that range receive 422 for ML pricing.
- Next steps include disruption trigger detection, claim verification, payout processing, fraud checks and PostgreSQL.
- Policies, payments and payouts are not implemented. Premiums shown in the UI are estimates only.
