import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select

from boraroles.api.deps import DbSession, require_role
from boraroles.core.geo import latlng_from_point, point_from_latlng
from boraroles.db.models import Lugar, PapelUsuario, Role, Usuario
from boraroles.schemas.lugar import LugarCreate, LugarPublic, LugarUpdate
from boraroles.schemas.role import RoleCreate, RolePublic, RoleUpdate
from boraroles.services.descoberta import frescor_de_role
from boraroles.services.lugares import lugar_to_public
from boraroles.services.roles import role_to_public

router = APIRouter(prefix="/curador", tags=["curador"])

CuradorUser = Annotated[Usuario, Depends(require_role(PapelUsuario.CURADOR))]


# ---- Lugares ----


@router.post("/lugares", response_model=LugarPublic, status_code=status.HTTP_201_CREATED)
async def criar_lugar(body: LugarCreate, usuario: CuradorUser, db: DbSession) -> LugarPublic:
    lugar = Lugar(
        nome=body.nome,
        categoria=body.categoria,
        geo=point_from_latlng(body.lat, body.lng),
        bairro=body.bairro,
        estabelecimento_id=body.estabelecimento_id,
        fotos=body.fotos,
        criado_por=usuario.id,
    )
    db.add(lugar)
    await db.commit()
    await db.refresh(lugar)
    return lugar_to_public(lugar)


@router.get("/lugares", response_model=list[LugarPublic])
async def listar_lugares(usuario: CuradorUser, db: DbSession) -> list[LugarPublic]:
    lugares = (await db.execute(select(Lugar))).scalars().all()
    return [lugar_to_public(lugar) for lugar in lugares]


@router.get("/lugares/{lugar_id}", response_model=LugarPublic)
async def obter_lugar_admin(lugar_id: uuid.UUID, usuario: CuradorUser, db: DbSession) -> LugarPublic:
    lugar = await db.get(Lugar, lugar_id)
    if lugar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lugar não encontrado")
    return lugar_to_public(lugar)


@router.patch("/lugares/{lugar_id}", response_model=LugarPublic)
async def atualizar_lugar(
    lugar_id: uuid.UUID, body: LugarUpdate, usuario: CuradorUser, db: DbSession
) -> LugarPublic:
    lugar = await db.get(Lugar, lugar_id)
    if lugar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lugar não encontrado")

    dados = body.model_dump(exclude_unset=True)
    if "lat" in dados or "lng" in dados:
        lat = dados.pop("lat", None)
        lng = dados.pop("lng", None)
        current_lat, current_lng = latlng_from_point(lugar.geo)
        lugar.geo = point_from_latlng(
            lat if lat is not None else current_lat, lng if lng is not None else current_lng
        )
    for campo, valor in dados.items():
        setattr(lugar, campo, valor)

    await db.commit()
    await db.refresh(lugar)
    return lugar_to_public(lugar)


@router.delete("/lugares/{lugar_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_lugar(lugar_id: uuid.UUID, usuario: CuradorUser, db: DbSession) -> None:
    lugar = await db.get(Lugar, lugar_id)
    if lugar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lugar não encontrado")
    await db.delete(lugar)
    await db.commit()


# ---- Rolês ----


@router.post("/roles", response_model=RolePublic, status_code=status.HTTP_201_CREATED)
async def criar_role(body: RoleCreate, usuario: CuradorUser, db: DbSession) -> RolePublic:
    lugar = await db.get(Lugar, body.lugar_id)
    if lugar is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lugar não encontrado")

    role = Role(
        lugar_id=body.lugar_id,
        titulo=body.titulo,
        categoria=body.categoria,
        data_inicio=body.data_inicio,
        data_fim=body.data_fim,
        criado_por=usuario.id,
    )
    db.add(role)
    await db.commit()
    await db.refresh(role)
    return role_to_public(role, None)


@router.get("/roles", response_model=list[RolePublic])
async def listar_roles(usuario: CuradorUser, db: DbSession) -> list[RolePublic]:
    roles = (await db.execute(select(Role))).scalars().all()
    resultado = []
    for role in roles:
        frescor = await frescor_de_role(db, role)
        resultado.append(role_to_public(role, frescor))
    return resultado


@router.patch("/roles/{role_id}", response_model=RolePublic)
async def atualizar_role(
    role_id: uuid.UUID, body: RoleUpdate, usuario: CuradorUser, db: DbSession
) -> RolePublic:
    role = await db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rolê não encontrado")
    for campo, valor in body.model_dump(exclude_unset=True).items():
        setattr(role, campo, valor)
    await db.commit()
    await db.refresh(role)
    frescor = await frescor_de_role(db, role)
    return role_to_public(role, frescor)


@router.delete("/roles/{role_id}", status_code=status.HTTP_204_NO_CONTENT)
async def deletar_role(role_id: uuid.UUID, usuario: CuradorUser, db: DbSession) -> None:
    role = await db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rolê não encontrado")
    await db.delete(role)
    await db.commit()
