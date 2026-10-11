# GIG-Guard

- BTech CSE major project.
- Aim: Build an income protection system for gig delivery workers affected by rain, heat and other disruptions.
- Currently working on the backend and premium calculation.

## Work Done

- Set up the backend using FastAPI.
- Added worker registration and profile details.
- Stored worker data in SQLite using SQLAlchemy.
- Built a weekly premium calculator (₹49–₹99) using a simulated risk score.
- Tested the APIs using Swagger UI.
- 73 automated tests passed in the latest run.

## Tech Used

- **Backend:** Python, FastAPI
- **Database:** SQLite, SQLAlchemy
- **Testing:** Pytest

## API Endpoints

| Endpoint | Purpose |
|---|---|
| `GET /` | Welcome message |
| `GET /health` | Check backend status |
| `POST /workers` | Register a worker |
| `GET /workers` | View all workers |
| `GET /workers/{worker_id}` | Get worker details |
| `POST /pricing/estimate` | Calculate weekly premium |

## How to Run

Open the terminal in the project folder.

1. Go to backend: `cd backend`
2. Create virtual environment if needed: `python -m venv .venv`
3. Install dependencies: `.\.venv\Scripts\python.exe -m pip install -r requirements.txt`
4. Run server: `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001`
5. Open `http://127.0.0.1:8001/docs`

## Run Tests

- From the backend folder, run:
- `.\.venv\Scripts\python.exe -m pytest -q`

## Next Steps

- Build the worker dashboard using Next.js.
- Train a Random Forest model for risk prediction.
- Add weather-based triggers and payout calculations.
- Implement fraud detection.
- Integrate PostgreSQL.

**Note:** Risk scores are currently simulated. Machine learning prediction and actual insurance payments are not implemented yet.
