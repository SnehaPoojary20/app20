from datetime import date, datetime, timezone

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.api import routes
from app.schemas.forecast import (
    ForecastComparisonResponse,
    ForecastMetrics,
    ForecastRecord,
)
from app.services.elexon_service import ElexonAPIError
from app.services.forecast_service import NoMatchedDataError


client = TestClient(app)


@pytest.fixture
def sample_response():
    """Create predictable data for route tests."""

    record = ForecastRecord(
        start_time=datetime(
            2026, 1, 15, 10, 0, tzinfo=timezone.utc
        ),
        forecast_mw=950.0,
        actual_mw=1000.0,
        error_mw=-50.0,
        publish_time=datetime(
            2026, 1, 15, 8, 45, tzinfo=timezone.utc
        ),
    )

    metrics = ForecastMetrics(
        mae_mw=50.0,
        rmse_mw=50.0,
        bias_mw=-50.0,
        matched_periods=1,
    )

    return ForecastComparisonResponse(
        records=[record],
        metrics=metrics,
    )


def test_health_endpoint():
    response = client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_comparison_success(monkeypatch, sample_response):
    """A valid request returns records and metrics."""

    async def fake_build_forecast_comparison(
        start_date,
        end_date,
        cutoff_minutes,
    ):
        assert start_date == date(2026, 1, 1)
        assert end_date == date(2026, 1, 31)
        assert cutoff_minutes == 60

        return sample_response

    monkeypatch.setattr(
        routes,
        "build_forecast_comparison",
        fake_build_forecast_comparison,
    )

    response = client.get(
        "/api/forecast/comparison",
        params={
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
            "cutoff_minutes": 60,
        },
    )

    assert response.status_code == 200

    body = response.json()

    assert len(body["records"]) == 1
    assert body["records"][0]["forecast_mw"] == 950.0
    assert body["records"][0]["actual_mw"] == 1000.0
    assert body["records"][0]["error_mw"] == -50.0

    assert body["metrics"]["mae_mw"] == 50.0
    assert body["metrics"]["rmse_mw"] == 50.0
    assert body["metrics"]["bias_mw"] == -50.0
    assert body["metrics"]["matched_periods"] == 1


def test_start_date_after_end_date(monkeypatch):
    """An inverted date range is rejected."""

    async def should_not_run(**kwargs):
        pytest.fail("Forecast service should not be called")

    monkeypatch.setattr(
        routes,
        "build_forecast_comparison",
        should_not_run,
    )

    response = client.get(
        "/api/forecast/comparison",
        params={
            "start_date": "2026-01-31",
            "end_date": "2026-01-01",
        },
    )

    assert response.status_code == 400
    assert "start_date" in response.json()["detail"]


def test_invalid_date_format():
    response = client.get(
        "/api/forecast/comparison",
        params={
            "start_date": "not-a-date",
            "end_date": "2026-01-31",
        },
    )

    assert response.status_code == 422


def test_cutoff_out_of_range():
    response = client.get(
        "/api/forecast/comparison",
        params={
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
            "cutoff_minutes": 20000,
        },
    )

    assert response.status_code == 422


def test_elexon_error_becomes_502(monkeypatch):
    async def fake_build_forecast_comparison(**kwargs):
        raise ElexonAPIError("Elexon is unavailable.")

    monkeypatch.setattr(
        routes,
        "build_forecast_comparison",
        fake_build_forecast_comparison,
    )

    response = client.get(
        "/api/forecast/comparison",
        params={
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
        },
    )

    assert response.status_code == 502
    assert response.json()["detail"] == "Elexon is unavailable."


def test_no_matched_data_becomes_404(monkeypatch):
    async def fake_build_forecast_comparison(**kwargs):
        raise NoMatchedDataError("No matched records.")

    monkeypatch.setattr(
        routes,
        "build_forecast_comparison",
        fake_build_forecast_comparison,
    )

    response = client.get(
        "/api/forecast/comparison",
        params={
            "start_date": "2026-01-01",
            "end_date": "2026-01-31",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "No matched records."
