# GIG-Guard

- My BTech CSE major project for income protection of gig delivery workers.
- It focuses on income loss caused by rain, heat and other disruptions.

## Work Done

- Built the FastAPI backend with authentication, worker registration and pricing APIs.
- Saved user credentials and worker profiles in SQLite using SQLAlchemy.
- Added a weekly premium calculator with a range of INR 49–99.
- Built the Next.js frontend with authentication (Login/Sign Up with password), landing, worker dashboard, premium calculator, policy & claims and admin console.
- Added role-based access control: visitors only see Home and Login; logged-in workers see Dashboard and Policy & Claims with profile icon and Logout; administrators see Admin console with default credentials.
- Connected registration, dashboard and pricing pages to the live API with typed Fetch API calls.
- Added a browser-local prototype flow for activating weekly policies, filing claims and reviewing them in the admin console.
- Tested the APIs through Swagger UI.
- Completed a separate Random Forest risk prediction prototype in `ml_models/`.
- Used 12 features and 20,000 synthetic worker-risk profiles.
- Held-out R² = 0.8701, MAE = 2.9859 and RMSE = 3.7874.
- Last verified tests: 77 backend tests and 38 ML tests passed.

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

- Install Node.js 20 or newer, then run these commands from the repository folder:

```powershell
cd frontend
npm install
npm run dev
```

- Open http://localhost:3000.
- Start the backend first so registration, dashboards and premium estimates can load real data.
- The frontend proxies `/api/backend/*` to `http://127.0.0.1:8001` through a Next.js rewrite. To use another API URL, copy `frontend/.env.example` to `frontend/.env.local` and change `BACKEND_URL`.
- Build and lint with `npm run build` and `npm run lint`.

## Frontend Pages

- `/` — Landing page with the GIG-Guard pitch, rain/heat/pollution cover and dynamic header according to login state.
- `/login` — Unified authentication page with **Log in** and **Sign up** tabs, password creation, validation, and admin quick-fill.
- `/dashboard` — Saved worker profile hub backed by `GET /workers` (requires worker/admin login).
- `/dashboard/{workerId}` — Worker profile backed by `GET /workers/{worker_id}`.
- `/dashboard/{workerId}/premium` — Premium calculator connected to `POST /pricing/estimate`, with the full breakdown and a ₹49–₹99 final range.
- `/policy` — Weekly policy activation, coverage details, claim filing and claim history (requires login).
- `/admin` — Admin portfolio and claim review queue (only visible and accessible to `admin`).
