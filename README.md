# GIG-Guard

GIG-Guard is a BTech CSE major project exploring AI-powered parametric income
insurance for gig delivery workers in India.

The backend includes the foundation, persistent worker registration and profile
retrieval with SQLite and SQLAlchemy, and a simulated-risk weekly premium calculator.
Frontend, authentication, ML, fraud detection, insurance policy issuance, and
PostgreSQL integration are not implemented.
No Docker or paid services are required.

## Files explained

```text
GIGGuard/
|-- .gitignore
|-- README.md
`-- backend/
    |-- requirements.txt
    |-- pytest.ini
    |-- app/
    |   |-- __init__.py
    |   `-- main.py
    `-- tests/
        `-- test_health.py
```

- `backend/app/__init__.py`: marks `app` as a Python package so it can be imported.
- `backend/app/main.py`: creates the FastAPI application, defines the two URLs,
  and configures CORS. CORS lets a browser page at `http://localhost:3000`
  read this API's responses. It is not authentication.
- `backend/tests/test_health.py`: contains four automated tests for health,
  the welcome response, allowed CORS origin, and rejected CORS origin.
  FastAPI's test client makes requests in memory; no running server is needed.
- `backend/requirements.txt`: lists FastAPI (API framework), Uvicorn (web server),
  pytest (test runner), and HTTPX (used by the test client). Version ranges
  constrain installation; this is not an exact dependency lock file.
- `backend/pytest.ini`: tells pytest where tests live and makes `app` importable
  when tests run from the backend folder.
- `.gitignore`: keeps virtual environments, caches, local secrets, and editor
  files out of future Git commits. It does not delete files.
- `README.md`: explains this foundation and how to run it.

## Windows PowerShell setup

Install Python 3.11 or newer from https://www.python.org/downloads/windows/ if
needed. Enable the installer's Python PATH option. Open a new PowerShell window
after installation and check the launcher:

```powershell
py --version
```

Go to this repository's backend folder:

```powershell
cd "C:\Users\HP\OneDrive\Desktop\code\majorproject\GIGGuard\backend"
```

Create a virtual environment (a separate folder for this project's Python and
packages), then install dependencies into it:

```powershell
py -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

`-m` runs a Python module. `pip install -r` reads the package list from the file.
Using the environment's Python directly avoids PowerShell activation-policy
issues; activation is not required. If only `python --version` works on your
machine, use `python -m venv .venv` instead of `py -m venv .venv`.

## Run the API

From the same backend folder:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

`app.main:app` means "use the `app` object in `app/main.py`." `--reload`
restarts the development server when code changes. Stop it with `Ctrl+C`.

Open these URLs in your browser:

| URL | Expected response |
| --- | --- |
| http://127.0.0.1:8000/ | `{"message":"Welcome to GIG-Guard API"}` |
| http://127.0.0.1:8000/health | `{"status":"ok"}` |
| http://127.0.0.1:8000/docs | FastAPI's interactive API documentation |

The health endpoint only checks whether the API can respond. It does not check
a database, ML model, or external service.

For a PowerShell request, open a second terminal and run:

```powershell
Invoke-RestMethod -Uri "http://127.0.0.1:8000/health"
```

`Invoke-RestMethod` sends an HTTP request and displays the returned JSON as a
PowerShell object.

## Run automated tests

From the backend folder, after installing dependencies:

```powershell
.\.venv\Scripts\python.exe -m pytest -q
```

`pytest` discovers and runs the test functions; `-q` keeps output short.
The tests create their own temporary SQLite database files. They need no external
database service, internet connection, or running Uvicorn server once dependencies
are installed. They never use the development database.

### Actual verification result (11 October 2026)

Test execution was attempted from `backend` with `py -m pytest -q`.
The command exited with code 1 and printed `No installed Python found!`.
No tests executed, so no passing test result or working runtime is claimed.
Install Python and follow the setup steps above, then run the virtual
environment's pytest command to verify the implementation.

### Task 2 verification (11 October 2026)

A usable Python **3.11.9** was found at
`C:\Users\HP\AppData\Local\Programs\Python\Python311\python.exe`.
The `py` launcher did not discover it, and the `python` command resolved to a
WindowsApps alias that failed to launch. No usable Python 3.12 was found in
the checked installation locations. Reinstalling Python was not necessary.

The existing backend files were preserved. The virtual environment was created
using the working interpreter's full path:

```powershell
cd "C:\Users\HP\OneDrive\Desktop\code\majorproject\GIGGuard\backend"
& "C:\Users\HP\AppData\Local\Programs\Python\Python311\python.exe" -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m pip check
```

The `&` operator runs an executable whose quoted path is provided. The first
command creates an isolated Python environment; the later commands use that
environment directly, without relying on PATH or the launcher.

Actual results:

- Dependencies installed successfully after retrying with network permission.
  The initial attempt failed with `WinError 10013` because network access was
  blocked, not because a package was unavailable.
- pytest: **4 passed, 1 warning in 1.32s**, exit code 0.
- Warning: Starlette's test client deprecated its HTTPX integration and suggested
  HTTPX2. This third-party warning did not fail any test. No warning was hidden,
  and no application code or dependency changes were needed for these checks.
- `pip check`: **No broken requirements found**, exit code 0.
- Uvicorn started successfully with the virtual environment command documented
  above, including `--reload`.
- Live HTTP requests: `/` returned 200 with the welcome JSON, `/health` returned
  200 with `{"status":"ok"}`, and `/docs` returned 200 with Swagger UI HTML.
  The docs HTML was checked by HTTP request; browser rendering was not tested.
- `.venv` is excluded by `.gitignore`.

To start the server again, run this from `backend`:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

## Task 3: Worker registration and saved profiles

### New files in simple language

| File | What it does |
| --- | --- |
| `backend/app/database.py` | Chooses the database URL, connects to it, and gives each request a separate database session. A session is the workspace for reading and saving rows. |
| `backend/app/models.py` | Describes the `workers` table, generates UUIDs and UTC timestamps, and stores income accurately. |
| `backend/app/schemas.py` | Checks incoming JSON and defines the JSON returned to the caller. |
| `backend/app/routers/__init__.py` | Marks the routers folder as a Python package. |
| `backend/app/routers/workers.py` | Handles registration, listing, and looking up one worker. |
| `backend/tests/conftest.py` | Gives every test a separate temporary database, including the original health tests. |
| `backend/tests/test_workers.py` | Checks worker requests, validation, CORS, exact income storage, and persistence after replacing the database engine. |

`main.py` still owns the same FastAPI app and original endpoints. It now attaches
the worker router and creates missing tables on startup. CORS still allows only
`http://localhost:3000`; it now allows POST as well as GET. `requirements.txt`
adds SQLAlchemy 2.x. `.gitignore` also excludes SQLite files and their journals.

**SQLAlchemy** is a Python library for talking to databases. **ORM** means
Object-Relational Mapping: it connects a Python object such as `Worker` to a row
in a database table. You can work with Python objects instead of writing SQL
for every operation.

Registration follows these steps: Pydantic checks the JSON, the router creates
a Worker object, SQLAlchemy inserts a row, and `commit()` saves it to the
database file. Reading workers queries that file; it does not use a Python list
as storage. Restarting the server keeps the saved workers.

### Run on Windows PowerShell

Reuse the existing environment (do not recreate it):

```powershell
cd "C:\Users\HP\OneDrive\Desktop\code\majorproject\GIGGuard\backend"
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

The default database is `backend/gig_guard.db`, created automatically when the
app starts. Its default absolute location is based on the source folder, so it
does not change when your terminal's working directory changes.

To use another SQLite file, set an environment variable **before** starting the
server (the relative example below assumes you are in `backend`):

```powershell
$env:DATABASE_URL = "sqlite:///./mentor_demo.db"
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload
```

`$env:DATABASE_URL` sets configuration for this terminal and programs started
from it. To return to the default, stop the server and run:

```powershell
Remove-Item Env:DATABASE_URL -ErrorAction SilentlyContinue
```

There is no automatic `.env` file loader; use PowerShell environment variables.
Later, a PostgreSQL URL such as `postgresql+psycopg://user:password@localhost/gig_guard`
can use the same configuration. A PostgreSQL server and driver would still need
to be installed and verified then; neither is included in this task.
Startup creates missing tables, but does not migrate existing table definitions.

### Endpoints and validation

| Method and path | Result |
| --- | --- |
| `POST /workers` | 201 with the saved profile, generated UUID, and timestamp |
| `GET /workers` | 200 with a JSON array; empty array when no workers exist |
| `GET /workers/{worker_id}` | 200 with a profile, or 404 for an unknown valid UUID |

Invalid input returns 422. Name and city must contain non-whitespace text.
Platform must be exactly `Swiggy`, `Zomato`, or `Zepto`. Income must be positive,
with at most two decimal places and ten whole-number digits. Experience must
be a non-negative integer. An incorrectly formatted UUID also returns 422.
Editing and deleting profiles are not included in these three endpoints.

Money is a Python `Decimal`, returned as a JSON string to preserve its decimal
representation. Send it as a string too. SQLite's ordinary NUMERIC affinity can
use floating-point storage, so the custom money type saves integer paise locally:
`"850.50"` rupees becomes `85050` paise. With PostgreSQL the type uses
`NUMERIC(12,2)`. No floating-point database column is used for income.

Sample request:

```json
{
  "full_name": "Aarav Sharma",
  "city": "Bengaluru",
  "platform": "Swiggy",
  "average_daily_income": "850.50",
  "experience_days": 120
}
```

Actual 201 response from the isolated TestClient demonstration:

```json
{
  "full_name": "Aarav Sharma",
  "city": "Bengaluru",
  "platform": "Swiggy",
  "average_daily_income": "850.50",
  "experience_days": 120,
  "id": "9af19da4-5c95-46a0-83ca-94256668ce40",
  "created_at": "2026-10-11T07:20:43.393395Z"
}
```

This example worker was saved in a temporary demonstration database, not the
development database. Your requests generate new IDs and timestamps.
The timestamp's `Z` means UTC.

For your mentor demo, open `http://127.0.0.1:8000/docs`, expand `POST /workers`,
click **Try it out**, paste the sample request, and click **Execute**. Copy the
returned ID into `GET /workers/{worker_id}`. You can also use a second PowerShell
window while the server runs:

```powershell
$workerBody = @{
    full_name = "Aarav Sharma"
    city = "Bengaluru"
    platform = "Swiggy"
    average_daily_income = "850.50"
    experience_days = 120
} | ConvertTo-Json
$savedWorker = Invoke-RestMethod -Method Post -Uri "http://127.0.0.1:8000/workers" -ContentType "application/json" -Body $workerBody
$savedWorker | ConvertTo-Json
Invoke-RestMethod -Uri "http://127.0.0.1:8000/workers"
Invoke-RestMethod -Uri "http://127.0.0.1:8000/workers/$($savedWorker.id)"
```

`ConvertTo-Json` turns the PowerShell fields into JSON. `Invoke-RestMethod`
sends the request. `$savedWorker` keeps the actual response, allowing its ID to
be used in the final URL. Each POST creates a new worker.

### Actual Task 3 verification (11 October 2026)

- Installed SQLAlchemy **2.0.54** in the existing Python 3.11.9 environment.
- pytest: **30 passed, 1 warning in 1.20s**, exit code 0, including all four
  original tests. Temporary file databases isolate every test from development data.
- Verified valid registrations for all three platforms; listing; retrieval;
  invalid platform, income, experience, missing fields, and malformed IDs;
  unknown worker 404; POST CORS; and exact income storage.
- Persistence test disposed the first engine, created a new engine for the same
  temporary file, and successfully retrieved the saved worker.
- `pip check`: **No broken requirements found**, exit code 0.
- Separate TestClient demonstration: POST returned 201; listing, retrieval,
  `/`, `/health`, and `/docs` returned 200. The saved profile was read again
  after a lifespan restart. This was in-process HTTP verification, not a browser test.
- One existing third-party `StarletteDeprecationWarning` remains about HTTPX
  test-client integration. It was not hidden and did not fail tests.
- No application errors occurred in this test run. No commits or pushes made.

References: [SQLAlchemy SQLite documentation](https://docs.sqlalchemy.org/en/20/dialects/sqlite.html)
and [FastAPI TestClient documentation](https://fastapi.tiangolo.com/reference/testclient/).

## Task 4: Risk-based weekly premium calculator

`POST /pricing/estimate` calculates a weekly premium using a manually supplied
simulated risk score. **Random Forest is not implemented or trained.** The
implementation follows the Task 4 formula and the subsequently supplied
Section 4.2 requirements. The synopsis does not specify the percentage
adjustment base, so both adjustments use the subtotal as explicitly requested.
Fewer than 30 experience days means a new worker, and 180 or more means an
experienced worker; these are the agreed prototype thresholds.

Section 4.2 proposes a future Random Forest using these 12 features:
historical city rain risk, historical heat risk, historical flood risk, coming
week's weather forecast risk, season factor, location density, platform
volatility, worker experience days, average daily income, historical claim
rate, current AQI, and festival season. None of this feature collection or model
training is implemented. The proposed 20,000 synthetic worker profiles and
five-fold cross-validation have not been generated or run. **R² = 0.92 is an
unverified target/proposed result, not a measured result.** The current endpoint
accepts a manually simulated score between 0 and 100; the pricing service can
later accept a model prediction without changing the premium arithmetic.

### New files

| File | Simple explanation |
| --- | --- |
| `backend/app/services/__init__.py` | Marks the services folder as a Python package. |
| `backend/app/services/pricing.py` | Performs the premium arithmetic without knowing about FastAPI or SQLite. It defines location categories and a result containing the calculation breakdown. |
| `backend/app/pricing_schemas.py` | Checks the estimate request and defines the response fields. |
| `backend/app/routers/pricing.py` | Looks up the worker by UUID, passes saved income and experience to the service, and returns the result. |
| `backend/tests/test_pricing.py` | Tests formulas, boundaries, rounding, invalid requests, database integration, and Swagger registration. |

`main.py` attaches the new router to the existing app. Worker tables, records,
registration routes, original endpoints, and CORS settings are preserved.
No new dependency was required; the existing virtual environment was used.

### Formula

1. Weekly income = saved daily income × working days (default 6; allowed 1–7).
2. Base premium = weekly income × 0.02.
3. Risk loading = weekly income × (simulated risk score / 100) × 0.03.
4. Subtotal = base premium + risk loading.
5. Location adjustment = subtotal × location rate: high +10%, medium 0%, low −10%.
6. Experience adjustment = subtotal × experience rate: 180 days or more −8%,
   fewer than 30 days +5%, otherwise 0%.
7. Raw premium = subtotal + location adjustment + experience adjustment.
8. Clamp the raw premium to **INR 49–99**, then round to two decimal places.

Both adjustments use the same subtotal, so they are not compounded.
All arithmetic uses Python `Decimal`, which avoids binary floating-point money
errors. Calculations keep full precision; displayed monetary fields are rounded
with `ROUND_HALF_UP` at the end (a half-paise rounds away from zero). Independently
rounded breakdown fields can differ from their rounded total by a paise.
Monetary values are returned as JSON strings, as in worker responses.

For Rahul's daily income of INR 600, 180 experience days, 6 working days,
risk score 10, and high location risk:

| Component | INR |
| --- | ---: |
| Weekly income | 3600.00 |
| Base premium | 72.00 |
| Risk loading | 10.80 |
| Subtotal | 82.80 |
| Location adjustment | +8.28 |
| Experience adjustment | −6.62 |
| Raw premium | 84.46 |
| Final weekly premium | **84.46** |

The exact experience adjustment is −6.624 and exact raw premium is 84.456.
The table shows rounded results, not intermediate inputs.

### Request and actual response

The request sends only the worker UUID, simulated risk score, location risk,
and optional working days. The backend reads income and experience directly
from the saved SQLite worker row using SQLAlchemy's `db.get(Worker, worker_id)`.
Pricing does not update the worker or save a quote.

Actual request from an isolated temporary-database demonstration:

```json
{
  "worker_id": "7a5d9136-9141-48ec-aa1f-cc0483cfd440",
  "risk_score": 10,
  "location_risk": "high",
  "work_days_per_week": 6
}
```

Actual HTTP 200 response:

```json
{
  "worker_id": "7a5d9136-9141-48ec-aa1f-cc0483cfd440",
  "weekly_income": "3600.00",
  "risk_score": "10",
  "base_premium": "72.00",
  "risk_loading": "10.80",
  "subtotal": "82.80",
  "location_adjustment": "8.28",
  "experience_adjustment": "-6.62",
  "raw_premium": "84.46",
  "final_weekly_premium": "84.46",
  "calculation_method": "simulated_risk_score"
}
```

This ID belongs to the temporary demonstration, not your development database.
Use an ID returned by your own `GET /workers` when demonstrating the live server.
`risk_score` must be a JSON number on input; its Decimal response is a string.

### Validation

- Unknown valid worker UUID: HTTP 404, `Worker not found`.
- Malformed UUID, missing required fields, invalid location, or wrong types: 422.
- Risk score: a finite JSON number from 0 through 100, at most 12 decimal places.
  Numeric strings and booleans are rejected. Excess precision is rejected rather
  than silently rounded. Non-standard NaN/Infinity input also returns 422.
- Working days: integer from 1 through 7; omitted means 6. Strings, fractions,
  booleans, and null are rejected.
- Location: exactly `low`, `medium`, or `high`.
- Extra request fields, including income and experience, are rejected.

### Run and demonstrate in Swagger

From PowerShell:

```powershell
cd "C:\Users\HP\OneDrive\Desktop\code\majorproject\GIGGuard\backend"
.\.venv\Scripts\python.exe -m pytest -q
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

If the backend is already running on 8001, use that server. Do not start a
duplicate. If it has stale routes, stop it with `Ctrl+C` in its terminal and
start it again using the command above.

1. Open **http://127.0.0.1:8001/docs**.
2. Execute `GET /workers` and copy an existing worker's `id`. For the exact Rahul
   example, register a worker named Rahul Sharma with daily income `"600.00"`,
   experience `180`, city `Bengaluru`, and platform `Swiggy`, then copy its ID.
   Registering through the live API intentionally saves a new development row.
3. Expand `POST /pricing/estimate`, click **Try it out**, paste the request above,
   replace `worker_id` with your saved ID, and click **Execute**.
4. Explain the breakdown and the `simulated_risk_score` label. With Rahul's
   saved values, the result is `"84.46"`.
5. Change the score or location to show the effect. Use a random valid UUID to
   demonstrate 404, or working days 8 to demonstrate validation (422).

### Actual Task 4 verification (11 October 2026)

- Complete suite: **73 passed, 1 warning in 2.68s**; exit code 0. All 30 existing
  tests remain passing. Tests use isolated temporary SQLite databases.
- Added 43 cases covering normal pricing, score boundaries, location categories,
  experience thresholds, clamping, rounding, missing/invalid input, precision,
  database retrieval, unchanged worker data, and OpenAPI registration.
- An initial run exposed three failures for non-finite JSON numbers: the default
  validation response tried to echo NaN/Infinity, which JSON cannot serialize.
  A safe 422 response fixed this; all three regression cases now pass.
- The isolated Rahul demonstration returned 200 and **INR 84.46**, without
  changing development worker records.
- `pip check`: **No broken requirements found**. No dependency installation needed.
- Reused port 8001. Its existing reload process did not complete a refresh, so it
  was stopped, the port checked, and one replacement server started.
- Live `/docs`: **200**, Swagger UI HTML present. Live `/openapi.json` includes
  `POST /pricing/estimate`. Browser rendering was not separately automated.
- One existing third-party Starlette/HTTPX deprecation warning remains; no test
  warnings were suppressed.

### Current limitations and mentor explanation

This is a deterministic prototype calculator, not a trained insurance pricing
model. Risk score and location category are manually supplied. No weather data,
12-feature extraction, Random Forest, authentication, policy issuance, payments,
or quote storage is implemented. The INR 49–99 cap and adjustment rates follow
the supplied project formula, not validated commercial pricing.

Suggested explanation: “My worker module stores income and experience in SQLite.
The new pricing endpoint retrieves those saved values and applies a separate,
tested Decimal-based calculation. I can show every component of the quote and
why the result is capped between INR 49 and INR 99. The risk score is simulated
today; a future Random Forest prediction can supply it without mixing model
code with the pricing arithmetic. The full automated suite passes 73 tests.”
