from datetime import date, datetime, time, timedelta, timezone


UTC = timezone.utc


def parse_timestamp(value: str | datetime) -> datetime:
    """Parse a timestamp and return a timezone-aware UTC datetime."""

    if isinstance(value, datetime):
        parsed = value
    elif isinstance(value, str):
        normalized = value.strip()

        if normalized.endswith("Z"):
            normalized = normalized[:-1] + "+00:00"

        parsed = datetime.fromisoformat(normalized)
    else:
        raise ValueError("Timestamp must be a string or datetime.")

    # Elexon timestamps should include timezone information.
    # If a timestamp is naive, treat it as UTC explicitly.
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=UTC)

    return parsed.astimezone(UTC)


def date_to_utc_start(value: date) -> datetime:
    """Return midnight UTC at the start of a date."""

    return datetime.combine(value, time.min, tzinfo=UTC)


def date_to_utc_end_exclusive(value: date) -> datetime:
    """Return midnight UTC after the requested end date."""

    return date_to_utc_start(value + timedelta(days=1))


def to_elexon_timestamp(value: datetime) -> str:
    """Format a datetime as an ISO-8601 UTC timestamp."""

    utc_value = parse_timestamp(value)
    return utc_value.isoformat(timespec="seconds").replace("+00:00", "Z")
