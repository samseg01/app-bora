import pytest

from boraroles.core.geo import latlng_from_point, point_from_latlng


def test_latlng_roundtrip() -> None:
    # Vila Madalena, SP
    lat, lng = -23.5475, -46.6906

    point = point_from_latlng(lat, lng)
    round_lat, round_lng = latlng_from_point(point)

    assert round_lat == pytest.approx(lat)
    assert round_lng == pytest.approx(lng)
