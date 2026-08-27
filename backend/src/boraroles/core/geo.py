from geoalchemy2 import WKBElement
from geoalchemy2.shape import from_shape, to_shape
from shapely.geometry import Point


def point_from_latlng(lat: float, lng: float) -> WKBElement:
    """PostGIS/Shapely usam ordem (x=lng, y=lat), não (lat, lng)."""
    return from_shape(Point(lng, lat), srid=4326)


def latlng_from_point(point: WKBElement) -> tuple[float, float]:
    shapely_point = to_shape(point)
    return shapely_point.y, shapely_point.x
