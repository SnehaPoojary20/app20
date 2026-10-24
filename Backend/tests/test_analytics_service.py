from datetime import datetime, timezone

import pytest

from app.schemas.forecast import ForecastRecord
from app.services.analytics_service import calculate_metrics


def make_record(error: float) -> ForecastRecord:
    """Create a record with the specified signed error."""

    return ForecastRecord(
        start_time=datetime(
            2026, 1, 15, 10, 0, tzinfo=timezone.utc
        ),
        forecast_mw=1000.0 + error,
        actual_mw=1000.0,
        error_mw=error,
        publish_time=datetime(
            2026, 1, 15, 8, 0, tzinfo=timezone.utc
        ),
    )


def test_calculate_metrics():
    records = [
        make_record(100.0),
        make_record(-50.0),
        make_record(200.0),
    ]

    metrics = calculate_metrics(records)

    assert metrics.mae_mw == pytest.approx(350 / 3)
    assert metrics.rmse_mw == pytest.approx(
        (52500 / 3) ** 0.5
    )
    assert metrics.bias_mw == pytest.approx(250 / 3)
    assert metrics.matched_periods == 3


def test_negative_bias_means_underforecasting():
    records = [
        make_record(-100.0),
        make_record(-200.0),
    ]

    metrics = calculate_metrics(records)

    assert metrics.mae_mw == pytest.approx(150.0)
    assert metrics.rmse_mw == pytest.approx(
        (25000) ** 0.5
    )
    assert metrics.bias_mw == pytest.approx(-150.0)


def test_empty_records_raise_error():
    with pytest.raises(ValueError):
        calculate_metrics([])
