# UK Wind Forecast & Procurement Analysis

A full-stack web application that helps UK energy procurement teams analyze wind generation forecasts available before day-ahead purchasing decisions and evaluate forecast accuracy against actual generation.

## 1. Problem Statement

UK energy utilities must procure sufficient electricity to meet consumer demand. Since wind generation is weather-dependent, actual generation may differ from forecasts.

This application helps procurement teams:
- View wind generation forecasts available before the relevant day-ahead decision cutoff.
- Compare forecasts with actual wind generation.
- Quantify forecast errors to understand uncertainty when planning electricity procurement.

**Scope:** National-level wind generation data from Elexon BMRS for January 2026, using 30-minute delivery periods. No external generation, demand, weather, or market-price data is included.

## 2. Features

- **Forecast analysis:** Identify the latest eligible wind forecast for each delivery period based on its publication timestamp and the selected decision cutoff.
- **Actual vs. forecast comparison:** Match forecast and actual generation by `startTime`.
- **Accuracy metrics:** Calculate Mean Absolute Error (MAE), Root Mean Squared Error (RMSE), and forecast bias.
- **Data handling:** Account for timestamps, missing observations, and API errors.
- **Interactive dashboard:** Present forecast data and analysis through a React interface.

## 3. Data Sources

The application uses the [Elexon BMRS API](https://bmrs.elexon.co.uk/api-documentation).

| Dataset | Purpose | Relevant fields |
|---|---|---|
| [FUELHH](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream) | Actual half-hourly wind generation | `startTime`, `generation`, `fuelType=WIND` |
| [WINDFOR](https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream) | Wind generation forecasts | `startTime`, `publishTime`, `generation` |

`startTime` identifies the delivery period, while `publishTime` identifies when a forecast became available. Historical forecast publications are necessary to reconstruct what was known at the decision cutoff; the latest forecast available today is not a substitute.

## 4. Architecture

The project follows a **layered architecture with separation of concerns, MVC-inspired principles, and clean code practices**.

```text
React Frontend
      │ HTTP / JSON
      ▼
FastAPI Routes / Controllers
      ▼
Schemas and Validation
      ▼
Service Layer
  ├── Elexon Data Retrieval
  ├── Forecast Selection
  └── Accuracy Analytics
      ▼
Utilities and Timestamp Handling
      ▼
Elexon BMRS API
```

### Backend structure

```text
Backend/
├── src/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── api/
│   │   ├── __init__.py
│   │   └── routes.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── forecast.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── elexon_service.py
│   │   ├── forecast_service.py
│   │   └── analytics_service.py
│   └── utils/
│       ├── __init__.py
│       └── datetime_utils.py
├── tests/
├── requirements.txt
├── Dockerfile
└── .dockerignore

Frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── App.jsx
│   └── main.jsx
├── package.json
└── Dockerfile

docker-compose.yml
.gitignore
README.md
```

*The structure above describes the intended organization. Keep it synchronized with the files actually present in the repository.*

### Responsibilities

- **API routes:** Handle HTTP requests, validate parameters, and return responses.
- **Schemas:** Define and validate request and response data using Pydantic.
- **Elexon service:** Retrieves actual and forecast records from the external API.
- **Forecast service:** Selects the latest forecast published before the applicable decision cutoff for each delivery period.
- **Analytics service:** Matches actuals and forecasts and calculates accuracy metrics.
- **Utilities:** Handle reusable timestamp and timezone operations.
- **React frontend:** Displays forecasts, comparisons, and analytical results.

This separation keeps business logic independent of HTTP handling and presentation, improving maintainability and testability.

## 5. Forecast Evaluation

For each delivery period, the application should:

1. Determine the applicable procurement decision cutoff.
2. Select forecast records published at or before that cutoff.
3. Choose the latest eligible publication for each `startTime`.
4. Match the selected forecast with actual generation for the same delivery period.
5. Calculate error metrics using valid matched observations.

The error convention is:

`Error = Forecast − Actual`

- **MAE:** Average absolute forecast error.
- **RMSE:** Square root of the average squared forecast error; larger errors have more influence.
- **Bias:** Average signed error. Positive values indicate overforecasting and negative values indicate underforecasting.

Timestamps must be handled consistently across UTC and UK local time, including daylight-saving transitions. Missing records must not be silently treated as zero generation.

Forecast accuracy supports informed decisions but does not, by itself, determine the exact amount of electricity to procure. Demand and other supply sources are outside this project's scope.

## 6. Technology Stack

- **Frontend:** React
- **Backend:** Python, FastAPI, Uvicorn
- **HTTP client:** HTTPX
- **Validation and configuration:** Pydantic Settings
- **Analytics:** NumPy
- **Testing:** Pytest
- **Containerization:** Docker and Docker Compose
- **Data source:** Elexon BMRS API

## 7. Getting Started

### Prerequisites

Install Python, Node.js/npm, and Docker Desktop.

### Run the backend

```powershell
cd Backend
python -m venv venv
.\venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn src.main:app --reload
```

Backend URL: `http://127.0.0.1:8000`

Interactive API documentation: `http://127.0.0.1:8000/docs`

The Uvicorn command assumes `Backend/src/main.py` contains a FastAPI instance named `app`.

### Run the frontend

Open a second terminal:

```powershell
cd Frontend
npm install
npm run dev
```

Open the local URL printed by the frontend development server. Configure the frontend API base URL to point to the backend.

### Run with Docker

From the project root:

```bash
docker compose up --build
```

Stop the containers with:

```bash
docker compose down
```

Docker Compose requires a valid `docker-compose.yml` with correctly configured frontend and backend services.

### Run tests

From the `Backend` directory, with the virtual environment activated:

```powershell
python -m pytest -v
```

## 8. Deployment

Deploy the React frontend to [Vercel](https://vercel.com/) and the FastAPI backend to a Docker-compatible hosting provider.

Configure the deployed frontend with the backend API URL, and configure backend CORS to allow the deployed frontend origin.

- **Live application:** [Add deployed frontend URL]
- **Backend API:** [Add deployed backend URL]
- **GitHub repository:** [Add public repository URL]
- **Demo video:** [Add unlisted YouTube URL]

Verify all submitted links in an incognito browser window.

## 9. AI Tool Disclosure

AI tools, including **ChatGPT**, were used to assist with requirement analysis, architecture planning, code development, debugging, and documentation.

All generated code and suggestions should be reviewed and tested against the actual implementation and Elexon API behavior.

## 10. Limitations and Future Improvements

This pilot focuses exclusively on national wind generation forecasts and actuals for January 2026.

Potential future improvements include demand integration, additional generation sources, forecast-horizon comparisons, downloadable reports, and enhanced caching and monitoring.

## 11. Submission Checklist

- [ ] Public GitHub repository with an anonymous-style name.
- [ ] README and directory structure match the implementation.
- [ ] Frontend and backend deployed and accessible.
- [ ] Docker build and startup verified.
- [ ] Forecast selection and accuracy calculations tested.
- [ ] Unlisted YouTube demo uploaded, maximum 10 minutes.
- [ ] Customer pitch and technical review each within 5 minutes.
- [ ] Submission form completed.
- [ ] All submitted URLs verified in incognito mode.



