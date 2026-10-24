from datetime import date

from fastapi import APIRouter, HTTPException, Query

from app.schemas.forecast import ForecastComparisonResponse
from app.services.elexon_service import ElexonAPIError
from app.services.forecast_service import (
    NoMatchedDataError,
    build_forecast_comparison,
)


router = APIRouter()


@router.get(
    "/forecast/comparison",
    response_model=ForecastComparisonResponse,
    tags=["Forecast"],
)
async def get_forecast_comparison(
    start_date: date = Query(
        ...,
        description="First delivery date, inclusive (YYYY-MM-DD).",
    ),
    end_date: date = Query(
        ...,
        description="Last delivery date, inclusive (YYYY-MM-DD).",
    ),
    cutoff_minutes: int = Query(
        60,
        ge=0,
        le=10080,
        description="Minutes before delivery when the forecast cutoff applies.",
    ),
) -> ForecastComparisonResponse:
    """Return matched wind forecasts, actuals, and accuracy metrics."""

    if start_date > end_date:
        raise HTTPException(
            status_code=400,
            detail="start_date must be on or before end_date.",
        )

    try:
        return await build_forecast_comparison(
            start_date=start_date,
            end_date=end_date,
            cutoff_minutes=cutoff_minutes,
        )

    except ElexonAPIError as exc:
        raise HTTPException(
            status_code=502,
            detail=str(exc),
        ) from exc

    except NoMatchedDataError as exc:
        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc
