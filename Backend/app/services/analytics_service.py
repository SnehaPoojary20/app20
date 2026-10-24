from math import sqrt
from app.schemas.forecast import ForecastMetrics, ForecastRecord



def calculate_metrics(records: list[ForecastRecord],)-> ForecastMetrics:
    """Calculate MAE, RMSE, and bias for matched records."""

    if not records:
        raise ValueError(
            "Cannot calculate accuracy without matched records."
        )

    errors = [record.error_mw for record in records]
    count = len(errors)

    mae = sum(abs(error) for error in errors) / count

    rmse = sqrt(
        sum(error ** 2 for error in errors) / count
    )

    bias = sum(errors) / count

    return ForecastMetrics(
        mae_mw=mae,
        rmse_mw=rmse,
        bias_mw=bias,
        matched_periods=count,
    )