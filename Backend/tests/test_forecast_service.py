from datetime import date

import pytest

from app.services import forecast_service


@pytest.mark.asyncio
async def test_selects_latest_eligible_forecast(monkeypatch):
    """Ignore forecasts published after the cutoff."""

    async def fake_actuals(start_date, end_date):
        return [
            {
                "startTime": "2026-01-15T10:00:00Z",
                "generation": 100.0,
                "fuelType": "WIND",
            }
        ]

    async def fake_forecasts(publish_from, publish_to):
        return [
            {
                "startTime": "2026-01-15T10:00:00Z",
                "publishTime": "2026-01-15T08:00:00Z",
                "generation": 90.0,
            },
            {
                "startTime": "2026-01-15T10:00:00Z",
                "publishTime": "2026-01-15T08:45:00Z",
                "generation": 95.0,
            },
            {
                "startTime": "2026-01-15T10:00:00Z",
                "publishTime": "2026-01-15T09:30:00Z",
                "generation": 110.0,
            },
        ]

    monkeypatch.setattr(
        forecast_service,
        "fetch_actual_wind_generation",
        fake_actuals,
    )
    monkeypatch.setattr(
        forecast_service,
        "fetch_wind_forecasts",
        fake_forecasts,
    )

    result = await forecast_service.build_forecast_comparison(
        start_date=date(2026, 1, 15),
        end_date=date(2026, 1, 15),
        cutoff_minutes=60,
    )

    assert len(result.records) == 1

    record = result.records[0]

    # Delivery starts at 10:00, so the cutoff is 09:00.
    # The 09:30 forecast must be excluded.
    assert record.forecast_mw == 95.0
    assert record.actual_mw == 100.0
    assert record.error_mw == -5.0
    assert record.publish_time.isoformat() == (
        "2026-01-15T08:45:00+00:00"
    )

    assert result.metrics.mae_mw == 5.0
    assert result.metrics.rmse_mw == 5.0
    assert result.metrics.bias_mw == -5.0


@pytest.mark.asyncio
async def test_missing_actual_is_not_replaced_with_zero(
    monkeypatch,
):
    """A forecast without an actual cannot be evaluated."""

    async def fake_actuals(start_date, end_date):
        return []

    async def fake_forecasts(publish_from, publish_to):
        return [
            {
                "startTime": "2026-01-15T10:00:00Z",
                "publishTime": "2026-01-15T08:45:00Z",
                "generation": 95.0,
            }
        ]

    monkeypatch.setattr(
        forecast_service,
        "fetch_actual_wind_generation",
        fake_actuals,
    )
    monkeypatch.setattr(
        forecast_service,
        "fetch_wind_forecasts",
        fake_forecasts,
    )

    with pytest.raises(forecast_service.NoMatchedDataError):
        await forecast_service.build_forecast_comparison(
            start_date=date(2026, 1, 15),
            end_date=date(2026, 1, 15),
            cutoff_minutes=60,
        )
