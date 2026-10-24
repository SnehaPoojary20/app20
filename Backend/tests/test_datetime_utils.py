from datetime import date, datetime, timezone

import pytest

from app.utils.datetime_utils import (
    date_to_utc_end_exclusive,
    date_to_utc_start,
    parse_timestamp,
    to_elexon_timestamp,
)


def test_parse_utc_timestamp():
    result = parse_timestamp("2026-01-15T10:00:00Z")

    assert result == datetime(
        2026, 1, 15, 10, 0, tzinfo=timezone.utc
    )


def test_parse_timestamp_with_offset():
    result = parse_timestamp("2026-01-15T11:00:00+01:00")

    assert result == datetime(
        2026, 1, 15, 10, 0, tzinfo=timezone.utc
    )


def test_naive_timestamp_is_treated_as_utc():
    result = parse_timestamp("2026-01-15T10:00:00")

    assert result == datetime(
        2026, 1, 15, 10, 0, tzinfo=timezone.utc
    )


def test_invalid_timestamp_raises_error():
    with pytest.raises(ValueError):
        parse_timestamp("not-a-timestamp")


def test_date_boundaries():
    start = date_to_utc_start(date(2026, 1, 31))
    end = date_to_utc_end_exclusive(date(2026, 1, 31))

    assert start == datetime(
        2026, 1, 31, 0, 0, tzinfo=timezone.utc
    )
    assert end == datetime(
        2026, 2, 1, 0, 0, tzinfo=timezone.utc
    )


def test_format_elexon_timestamp():
    result = to_elexon_timestamp(
        datetime(2026, 1, 15, 10, 0, tzinfo=timezone.utc)
    )

    assert result == "2026-01-15T10:00:00Z"
