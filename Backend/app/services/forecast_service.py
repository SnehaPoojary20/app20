from datetime import date, timedelta
from math import isfinite

from app.config import settings
from app.schemas.forecast import (
    ForecastComparisonResponse,
    ForecastMetrics,
    ForecastRecord,
)
from app.services.analytics_service import calculate_metrics
from app.services.elexon_service import (
    fetch_actual_wind_generation,
    fetch_wind_forecasts,
)
from app.utils.datetime_utils import (
    date_to_utc_end_exclusive,
    date_to_utc_start,
    parse_timestamp,
)


class NoMatchedDataError(Exception):
    """Raised when no eligible forecast/actual pairs are found."""


def _get_generation(record: dict) -> float | None:
    """Read and validate a generation value."""

    try:
        value = float(record["generation"])
    except (KeyError, TypeError, ValueError):
        return None

    if not isfinite(value) or value < 0:
        return None

    return value


async def build_forecast_comparison(
    start_date: date,
    end_date: date,
    cutoff_minutes: int = 60,
) -> ForecastComparisonResponse:
    """
    Build forecast-versus-actual records for a date range.

    A forecast is eligible only if it was published at or before
    the delivery start time minus the requested cutoff.
    """

    range_start = date_to_utc_start(start_date)
    range_end = date_to_utc_end_exclusive(end_date)

    # Fetch forecasts published before and during the delivery window.
    publish_from = range_start - timedelta(
        days=settings.forecast_lookback_days
    )

    actual_records, forecast_records = await _fetch_datasets(
        start_date=start_date,
        end_date=end_date,
        publish_from=publish_from,
        publish_to=range_end,
    )

    # Map each actual delivery period to its generation value.
    actual_by_time = {}

    for record in actual_records:
        try:
            start_time = parse_timestamp(record["startTime"])
        except (KeyError, TypeError, ValueError):
            continue

        if not (range_start <= start_time < range_end):
            continue

        generation = _get_generation(record)

        if generation is not None:
            actual_by_time[start_time] = generation

    # Keep the latest eligible forecast for each delivery period.
    forecast_by_time = {}

    for record in forecast_records:
        try:
            delivery_time = parse_timestamp(record["startTime"])
            publish_time = parse_timestamp(record["publishTime"])
        except (KeyError, TypeError, ValueError):
            continue

        if not (range_start <= delivery_time < range_end):
            continue

        cutoff_time = delivery_time - timedelta(
            minutes=cutoff_minutes
        )

        if publish_time > cutoff_time:
            continue

        generation = _get_generation(record)

        if generation is None:
            continue

        previous = forecast_by_time.get(delivery_time)

        if (
            previous is None
            or publish_time > previous["publish_time"]
        ):
            forecast_by_time[delivery_time] = {
                "generation": generation,
                "publish_time": publish_time,
            }

    # Only evaluate periods with both a forecast and an actual.
    comparison_records = []

    for delivery_time in sorted(forecast_by_time):
        if delivery_time not in actual_by_time:
            continue

        selected_forecast = forecast_by_time[delivery_time]
        forecast_mw = selected_forecast["generation"]
        actual_mw = actual_by_time[delivery_time]

        comparison_records.append(
            ForecastRecord(
                start_time=delivery_time,
                forecast_mw=forecast_mw,
                actual_mw=actual_mw,
                error_mw=forecast_mw - actual_mw,
                publish_time=selected_forecast["publish_time"],
            )
        )

    if not comparison_records:
        raise NoMatchedDataError(
            "No eligible forecast and actual pairs were found. "
            "Check the date range, API data, and cutoff setting."
        )

    metrics: ForecastMetrics = calculate_metrics(
        comparison_records
    )

    return ForecastComparisonResponse(
        records=comparison_records,
        metrics=metrics,
    )


async def _fetch_datasets(
    start_date: date,
    end_date: date,
    publish_from,
    publish_to,
):
    """Fetch both datasets concurrently."""

    import asyncio

    actual_task = fetch_actual_wind_generation(
        start_date,
        end_date,
    )

    forecast_task = fetch_wind_forecasts(
        publish_from,
        publish_to,
    )

    return await asyncio.gather(actual_task, forecast_task)
