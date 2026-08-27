from boraroles.core.geo import latlng_from_point
from boraroles.db.models import Lugar
from boraroles.schemas.lugar import LugarPublic


def lugar_to_public(lugar: Lugar) -> LugarPublic:
    lat, lng = latlng_from_point(lugar.geo)
    return LugarPublic(
        id=lugar.id,
        nome=lugar.nome,
        categoria=lugar.categoria,
        lat=lat,
        lng=lng,
        bairro=lugar.bairro,
        estabelecimento_id=lugar.estabelecimento_id,
        fotos=lugar.fotos,
        created_at=lugar.created_at,
    )
