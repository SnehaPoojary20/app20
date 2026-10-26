# UK Day-Ahead Wind Forecast & Accuracy Portal

A full-stack decision-support prototype for a UK energy utility’s day-ahead power procurement team.

The application helps the team:

1. Review the latest available national wind-generation forecasts before making day-ahead purchase decisions.
2. Quantify forecast error against actual wind generation for January 2026.
3. Understand when forecasts are likely to be uncertain, so procurement decisions can account for forecast risk.

Built with **React**, **Python/FastAPI**, and **Docker**.

- **Live application:** https://app20-jup1jvx35-sneha-poojarys-projects.vercel.app/
- **Challenge time spent:** 10 hours

---

## Product overview

A UK utility must procure additional electricity beyond expected renewable generation to meet consumer demand. Wind generation is weather-dependent, and day-ahead market decisions must be made before delivery day. Therefore, the team needs a clear view of the latest wind forecast and a quantitative understanding of historical forecast accuracy.

This portal focuses on **national-level wind generation** using only Elexon BMRS data:

- **Actual wind generation:** `FUELHH`, filtered to `fuelType = WIND`
- **Wind generation forecasts:** `WINDFOR`
- **Decision window:** January 2026
- **Resolution:** 30-minute settlement periods

The application does not make trading recommendations. Its purpose is to make the available forecast and its historical reliability easier to understand before a human procurement decision is made.

---

## Key features

### 1. Latest forecast view

- Displays the latest available `WINDFOR` forecast for the selected delivery period.
- Shows forecast generation in MW at 30-minute resolution.
- Clearly indicates the forecast `publishTime`, so users know when the forecast was created.
- Allows users to inspect the forecast across the selected day.

### 2. Forecast-versus-actual comparison

- Aligns actual `FUELHH` wind generation with forecasted generation by `startTime`.
- Shows both series on a time-series chart.
- Highlights periods where the forecast overestimated or underestimated actual wind generation.

### 3. Forecast accuracy metrics

For January 2026, the application calculates forecast accuracy using standard error metrics:

| Metric | Meaning | Why it matters |
|---|---|---|
| MAE | Mean absolute error | Average size of forecast error in MW |
| RMSE | Root mean squared error | Penalises larger errors more heavily |
| MAPE | Mean absolute percentage error | Relative error, useful for comparing periods |
| Bias | Mean signed error | Shows whether forecasts tend to over- or under-predict |

<If implemented, keep this section. Otherwise remove it.>

- Metrics are calculated only where both forecast and actual values are available.
- The application separates missing data from zero generation.
- Users can view overall monthly accuracy and daily breakdowns.

### 4. Decision-support view

<Only include if implemented.>

- Shows the latest forecast alongside historical forecast error.
- Helps the user distinguish between a high-confidence forecast and one where recent forecasts have shown larger deviations.
- Presents uncertainty as a supporting signal, not as an automated procurement recommendation.

---

## Architecture

```text
React frontend
        |
        | HTTP / JSON
        v
FastAPI backend
        |
        |-- Elexon BMRS API client
        |-- Forecast / actual data service
        |-- Accuracy calculation service
        |-- Pydantic schemas and validation
        |
        v
Elexon BMRS APIs
        |-- /datasets/FUELHH/stream
        |-- /datasets/WINDFOR/stream
```

### Backend

- **Framework:** FastAPI
- **Language:** Python
- **Data validation:** Pydantic
- **External API client:** `httpx`
- **Testing:** `pytest`
- **Containerisation:** Docker

The backend is organised so that API routes remain thin and business logic is separated into services:

```text
backend/
├── app/
│   ├── main.py                  # FastAPI application entry point
│   ├── core/
│   │   └── config.py            # Environment and application settings
│   ├── api/
│   │   └── routes/
│   │       ├── forecasts.py     # Latest forecast endpoints
│   │       └── accuracy.py      # Forecast accuracy endpoints
│   ├── services/
│   │   ├── elexon_client.py     # Elexon API integration
│   │   ├── forecast_service.py  # Forecast retrieval and transformation
│   │   └── accuracy_service.py  # Error metric calculations
│   ├── schemas/
│   │   └── models.py            # Request and response models
│   └── tests/
│       ├── test_forecast_service.py
│       └── test_accuracy_service.py
├── requirements.txt
├── Dockerfile
└── .env.example
```

### Frontend

- **Framework:** React
- **Build tool:** Vite
- **Charts:** <Recharts / Chart.js / other — use only what you actually used>
- **HTTP client:** Axios / Fetch
- **Containerisation:** Docker

```text
frontend/
├── src/
│   ├── api/
│   │   └── client.js            # Backend API client
│   ├── components/
│   │   ├── ForecastChart.jsx
│   │   ├── ForecastTable.jsx
│   │   ├── AccuracySummary.jsx
│   │   └── ErrorState.jsx
│   ├── pages/
│   │   ├── Dashboard.jsx
│   │   └── ForecastAccuracy.jsx
│   ├── hooks/
│   │   └── useForecastData.js
│   ├── App.jsx
│   └── main.jsx
├── package.json
├── Dockerfile
└── .env.example
```

---

## Data sources

### Actual wind generation — `FUELHH`

The application uses Elexon’s half-hourly generation-outturn dataset and filters records where:

```text
fuelType = "WIND"
```

Relevant fields:

- `startTime`: target half-hour period
- `generation`: actual wind generation in MW
- `publishTime`: publication timestamp
- `settlementDate` and `settlementPeriod`: UK settlement identifiers

Elexon describes `FUELHH` as half-hourly generation outturn by fuel type, with values representing average MW over each 30-minute period. [15]

### Forecast wind generation — `WINDFOR`

The application uses Elexon’s wind-generation forecast dataset.

Relevant fields:

- `startTime`: target half-hour period
- `publishTime`: time the forecast was published
- `generation`: forecast wind generation in MW

The `WINDFOR` endpoint supports filtering by forecast publication time; when no publication-time filter is supplied, it returns the latest published forecast. [12]

---

## API design

### `GET /api/v1/health`

Returns service health information.

**Response**

```json
{
  "status": "ok"
}
```

### `GET /api/v1/forecasts/latest`

Returns the latest available wind forecast for a requested date.

**Query parameters**

| Parameter | Type | Description |
|---|---|---|
| `date` | string | Delivery date in `YYYY-MM-DD` format |

**Example response**

```json
{
  "date": "2026-01-15",
  "publishTime": "2026-01-14T17:30:00Z",
  "points": [
    {
      "startTime": "2026-01-15T00:00:00Z",
      "generation": 8420.0
    }
  ]
}
```

### `GET /api/v1/accuracy/summary`

Returns forecast-accuracy metrics for January 2026.

**Example response**

```json
{
  "period": "2026-01",
  "matchedPoints": 1428,
  "mae": 1832.4,
  "rmse": 2510.7,
  "mape": 21.8,
  "bias": -412.3
}
```

<Update the endpoint names, parameters, and response examples to match your actual implementation.>

---

## Accuracy methodology

The application aligns forecast and actual records using `startTime`.

For each matched half-hour:

```text
error = forecast - actual
absolute_error = abs(error)
```

Then:

```text
MAE  = mean(abs(error))
RMSE = sqrt(mean(error^2))
MAPE = mean(abs(error) / abs(actual)) * 100
Bias = mean(error)
```

### Interpretation

- A positive bias means forecasts tended to overestimate wind generation.
- A negative bias means forecasts tended to underestimate wind generation.
- RMSE greater than MAE indicates the presence of larger individual errors.
- MAPE can be unstable when actual generation is close to zero, so the application excludes or separately handles near-zero actual values.

<Adjust this only if your implementation handles zero or missing values differently.>

---

## Assumptions and scope decisions

The challenge specification intentionally leaves some product decisions open. The following assumptions were made:

1. **“Latest forecast” means the most recent `publishTime` available for each target `startTime`.**
2. **Accuracy is evaluated only where both forecast and actual values exist for the same `startTime`.**
3. **January 2026 is treated as the analysis window for both datasets.**
4. **The application uses national wind generation only**, as requested; it does not incorporate demand, prices, interconnectors, or regional wind data.
5. **The product supports decision-making but does not automate procurement decisions.**

---

## Known limitations

- The application depends on the availability and response shape of the public Elexon BMRS APIs.
- Forecast availability may vary by delivery period and publication time.
- MAPE is less meaningful when actual generation is near zero.
- This is a first-version prototype; it does not include authentication, role-based access, persistent user preferences, or automated alerting.
- The application focuses on national wind generation and does not model demand, thermal procurement cost, market prices, or portfolio optimisation.

---

## What I would build next

With additional time, I would prioritise:

1. **Forecast vintage comparison:** Compare forecasts published at different times for the same delivery period to understand how accuracy improves closer to delivery.
2. **Daily and hourly error patterns:** Identify whether forecast errors are concentrated at particular times of day.
3. **Confidence bands:** Convert historical error distributions into forecast uncertainty ranges.
4. **Procurement scenario view:** Show potential additional procurement requirement under low, median, and high wind-generation scenarios.
5. **Caching and background refresh:** Cache Elexon responses and schedule periodic refreshes to reduce API load and improve responsiveness.
6. **More extensive integration tests:** Add contract tests for Elexon response variations and frontend end-to-end tests.

---

## Getting started

### Prerequisites

- Docker and Docker Compose
- Git

### Run with Docker

```bash
git clone [https://github.com/](https://github.com/)<your-username>/<anonymous-repo-name>.git
cd <anonymous-repo-name>

docker compose up --build
```

Then open:

```text
http://localhost:5173
```

The frontend is configured to call the backend at:

```text
http://localhost:8000
```

### Environment variables

Copy the example environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**Backend — `backend/.env.example`**

```env
ELEXON_BASE_URL=[https://data.elexon.co.uk/bmrs/api/v1](https://data.elexon.co.uk/bmrs/api/v1)
CORS_ORIGINS=http://localhost:5173
```

**Frontend — `frontend/.env.example`**

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

<Use the exact base URL, variable names, and ports implemented in your code.>

---

## Running locally without Docker

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## Running tests

```bash
cd backend
pytest
```

<Only include frontend test instructions if you implemented tests.>

---

## Docker services

| Service | Description | Local URL |
|---|---|---|
| `frontend` | React application served by Vite / Nginx | `http://localhost:5173` |
| `backend` | FastAPI application | `http://localhost:8000` |

---

## Deployment

The sample application is deployed at:

```text
https://app20-jup1jvx35-sneha-poojarys-projects.vercel.app/
```

<Explain only what you actually deployed. For example: “The React frontend is deployed on Vercel, and the FastAPI backend is deployed on Render.”>

---

## AI tools used

AI tools were used to assist with development, as permitted by the challenge instructions.

Specifically, AI was used for:

- Researching the Elexon BMRS API documentation
- Drafting and refining implementation code
- Reviewing API design and error handling
- Preparing documentation and this README

All implementation decisions, testing, debugging, and final review were performed by me.

<Update this section to accurately reflect the tools you used and the extent of assistance.>

---

## Demo video

The demo video is available here:

```text
<UNLISTED_YOUTUBE_URL>
```

### Part 1 — Client presentation

- Business problem and user need
- How the portal supports day-ahead wind procurement
- Latest forecast view
- Forecast-versus-actual comparison
- Quantified forecast accuracy
- Product limitations and next steps

### Part 2 — Technical review

- System architecture
- Backend and frontend structure
- Elexon API integration
- Data alignment and accuracy calculations
- Error handling and validation
- Docker setup
- Testing approach
- Trade-offs and future improvements

---

## Repository structure

```text
.
├── backend/
│   ├── app/
│   ├── tests/
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── src/
│   ├── package.json
│   ├── Dockerfile
│   └── .env.example
├── docker-compose.yml
├── README.md
└── .gitignore
```



