from datetime import date, datetime

import httpx

from app.config import settings
from app.utils.datetime_utils import to_elexon_timestamp


class ElexonAPIError(Exception):
    """Raised when the Elexon API request fails."""


def _extract_records(payload: object) -> list[dict]:
    """Extract records from a list or a wrapped API response."""

    if isinstance(payload, list):
        records = payload
    elif isinstance(payload, dict):
        records = payload.get("data", [])
    else:
        raise ElexonAPIError("Unexpected response format from Elexon.")

    if not isinstance(records, list):
        raise ElexonAPIError("Elexon returned an invalid data collection.")

    return [record for record in records if isinstance(record, dict)]


async def _get_records(
    endpoint: str,
    params: dict,
) -> list[dict]:
    """Request records from an Elexon dataset endpoint."""

    url = f"{settings.elexon_base_url.rstrip('/')}/{endpoint.lstrip('/')}"

    try:
        async with httpx.AsyncClient(
            timeout=settings.elexon_timeout_seconds
        ) as client:
            response = await client.get(url, params=params)
            response.raise_for_status()

    except httpx.TimeoutException as exc:
        raise ElexonAPIError(
            "The Elexon API request timed out."
        ) from exc

    except httpx.HTTPStatusError as exc:
        raise ElexonAPIError(
            f"Elexon returned HTTP {exc.response.status_code}."
        ) from exc

    except httpx.RequestError as exc:
        raise ElexonAPIError(
            "Could not connect to the Elexon API."
        ) from exc

    try:
        payload = response.json()
    except ValueError as exc:
        raise ElexonAPIError(
            "Elexon returned an invalid JSON response."
        ) from exc

    return _extract_records(payload)


async def fetch_actual_wind_generation(
    start_date: date,
    end_date: date,
) -> list[dict]:
    """Fetch actual half-hourly wind generation."""

    params = {
        "settlementDateFrom": start_date.isoformat(),
        "settlementDateTo": end_date.isoformat(),
        "fuelType": "WIND",
    }

    return await _get_records(
        endpoint="/datasets/FUELHH/stream",
        params=params,
    )


async def fetch_wind_forecasts(
    publish_from: datetime,
    publish_to: datetime,
) -> list[dict]:
    """Fetch wind forecasts published during a time window."""

    params = {
        "publishDateTimeFrom": to_elexon_timestamp(publish_from),
        "publishDateTimeTo": to_elexon_timestamp(publish_to),
    }

    return await _get_records(
        endpoint="/datasets/WINDFOR/stream",
        params=params,
    )


        
