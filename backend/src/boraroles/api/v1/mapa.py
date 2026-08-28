import uuid

from fastapi import APIRouter, HTTPException, Query, status
from geoalchemy2 import Geography
from geoalchemy2 import functions as geo_func
from sqlalchemy import cast, func, select

from boraroles.api.deps import DbSession
from boraroles.db.models import Comentario, Lugar, Usuario
from boraroles.schemas.lugar import LugarDetalhe, LugarProximo, MapaPin, RolePin
from boraroles.services.descoberta import frescor_de_lugar, frescor_de_role, role_ativo_de_lugar
from boraroles.services.lugares import comentarios_do_lugar, lugar_to_public

router = APIRouter(tags=["mapa"])


def _parse_bbox(bbox: str | None) -> tuple[float, float, float, float] | None:
    if bbox is None:
        return None
    try:
        min_lng, min_lat, max_lng, max_lat = (float(v) for v in bbox.split(","))
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="bbox inválido, use minLng,minLat,maxLng,maxLat",
        ) from exc
    return min_lng, min_lat, max_lng, max_lat


@router.get("/mapa", response_model=list[MapaPin])
async def mapa(
    db: DbSession, bairro: str = Query(min_length=1), bbox: str | None = Query(default=None)
) -> list[MapaPin]:
    stmt = select(Lugar).where(Lugar.bairro == bairro)

    parsed_bbox = _parse_bbox(bbox)
    if parsed_bbox is not None:
        min_lng, min_lat, max_lng, max_lat = parsed_bbox
        envelope = geo_func.ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
        stmt = stmt.where(geo_func.ST_Intersects(Lugar.geo, envelope))

    lugares = (await db.execute(stmt)).scalars().all()

    pins = []
    for lugar in lugares:
        total_comentarios = await db.scalar(
            select(func.count(Comentario.id)).where(comentarios_do_lugar(lugar.id))
        )
        role_ativo = await role_ativo_de_lugar(db, lugar.id)
        role_pin = None
        if role_ativo is not None:
            frescor = await frescor_de_role(db, role_ativo)
            role_pin = RolePin(
                id=role_ativo.id,
                titulo=role_ativo.titulo,
                categoria=role_ativo.categoria,
                data_inicio=role_ativo.data_inicio,
                data_fim=role_ativo.data_fim,
                frescor=frescor.value if frescor else None,
            )
        pins.append(
            MapaPin(
                lugar=lugar_to_public(lugar),
                role_ativo=role_pin,
                total_comentarios=total_comentarios or 0,
            )
        )
    return pins


# Declarada ANTES de /lugares/{lugar_id}: o FastAPI casa as rotas na ordem, e ali
# "proximos" seria lido como UUID e devolveria 422.
@router.get("/lugares/proximos", response_model=list[LugarProximo])
async def lugares_proximos(
    db: DbSession,
    lat: float = Query(ge=-90, le=90),
    lng: float = Query(ge=-180, le=180),
    raio_m: int = Query(default=20_000, ge=100, le=100_000),
    limite: int = Query(default=6, ge=1, le=30),
) -> list[LugarProximo]:
    """Lugares curados mais próximos de um ponto, do mais perto para o mais longe.

    O PostGIS estava no projeto desde o começo e nenhuma consulta era por proximidade —
    tudo filtrava `bairro` como string. Esta é a primeira que usa a geometria para o que
    ela serve.

    O raio padrão é largo (20 km) de propósito. A pergunta que a tela de abertura faz não
    é só "o que tem perto": é "eu estou dentro de algum recorte que vocês conhecem?". Com
    raio curto, quem está longe recebe lista vazia e nada aprende; com raio largo, recebe
    o lugar mais próximo **com a distância**, e a tela pode dizer a verdade — "o mais
    perto que a gente andou fica a 12 km".

    Nada do ponto recebido é gravado ou registrado: é parâmetro de consulta e morre aqui.
    """
    ponto = cast(func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326), Geography)
    distancia = func.ST_Distance(cast(Lugar.geo, Geography), ponto)

    rows = (
        await db.execute(
            select(Lugar, distancia.label("distancia"))
            .where(distancia <= raio_m)
            .order_by(distancia)
            .limit(limite)
        )
    ).all()

    proximos = []
    for lugar, metros in rows:
        role = await role_ativo_de_lugar(db, lugar.id)
        pin = None
        if role is not None:
            frescor = await frescor_de_role(db, role)
            pin = RolePin(
                id=role.id,
                titulo=role.titulo,
                categoria=role.categoria,
                data_inicio=role.data_inicio,
                data_fim=role.data_fim,
                frescor=frescor.value if frescor else None,
            )
        proximos.append(
            LugarProximo(lugar=lugar_to_public(lugar), distancia_m=round(metros), role_ativo=pin)
        )
    return proximos


@router.get("/lugares/{lugar_id}", response_model=LugarDetalhe)
async def obter_lugar(lugar_id: uuid.UUID, db: DbSession) -> LugarDetalhe:
    lugar = await db.get(Lugar, lugar_id)
    if lugar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lugar não encontrado")

    comentarios_stmt = (
        select(Comentario.texto, Comentario.created_at, Usuario.nome)
        .join(Usuario, Usuario.id == Comentario.autor_id)
        .where(comentarios_do_lugar(lugar.id))
        .order_by(Comentario.created_at.desc())
        .limit(10)
    )
    comentarios = (await db.execute(comentarios_stmt)).all()
    frescor = await frescor_de_lugar(db, lugar)

    base = lugar_to_public(lugar)
    return LugarDetalhe(
        **base.model_dump(),
        frescor=frescor.value if frescor else None,
        comentarios_recentes=[
            {"texto": texto, "created_at": created_at, "autor_nome": autor_nome}
            for texto, created_at, autor_nome in comentarios
        ],
    )
