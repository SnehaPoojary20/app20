from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ForecastRecord(BaseModel):
    """One matched forecast and actual generation record."""

    model_config = ConfigDict(extra="forbid")

    start_time: datetime = Field(
        description="Start of the delivery period, with timezone information."
    )
    forecast_mw: float = Field(
        ge=0,
        description="Selected wind generation forecast in MW.",
    )
    actual_mw: float = Field(
        ge=0,
        description="Actual wind generation in MW.",
    )
    error_mw: float = Field(
        description="Forecast minus actual generation, in MW.",
    )
    publish_time: datetime = Field(
        description="Publication time of the selected forecast.",
    )


class ForecastMetrics(BaseModel):
    """Summary of forecast accuracy for matched periods."""

    model_config = ConfigDict(extra="forbid")

    mae_mw: float = Field(
        ge=0,
        description="Mean absolute error in MW.",
    )
    rmse_mw: float = Field(
        ge=0,
        description="Root mean squared error in MW.",
    )
    bias_mw: float = Field(
        description="Mean signed error in MW; forecast minus actual.",
    )
    matched_periods: int = Field(
        ge=0,
        description="Number of periods used in metric calculations.",
    )


class ForecastComparisonResponse(BaseModel):
    """Forecast comparison records and summary metrics."""

    records: list[ForecastRecord]
    metrics: ForecastMetrics

