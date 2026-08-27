import uuid

from fastapi import APIRouter, HTTPException, Query, status
from geoalchemy2 import functions as geo_func
from sqlalchemy import func, select

from boraroles.api.deps import DbSession
from boraroles.db.models import Comentario, Lugar, Usuario
from boraroles.schemas.lugar import LugarDetalhe, MapaPin, RolePin
from boraroles.services.descoberta import frescor_de_lugar, frescor_de_role, role_ativo_de_lugar
from boraroles.services.lugares import lugar_to_public

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
            select(func.count(Comentario.id)).where(Comentario.lugar_id == lugar.id)
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


@router.get("/lugares/{lugar_id}", response_model=LugarDetalhe)
async def obter_lugar(lugar_id: uuid.UUID, db: DbSession) -> LugarDetalhe:
    lugar = await db.get(Lugar, lugar_id)
    if lugar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lugar não encontrado")

    comentarios_stmt = (
        select(Comentario.texto, Comentario.created_at, Usuario.nome)
        .join(Usuario, Usuario.id == Comentario.autor_id)
        .where(Comentario.lugar_id == lugar.id)
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
