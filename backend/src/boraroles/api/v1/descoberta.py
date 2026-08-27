import uuid

from fastapi import APIRouter, HTTPException, Query, status

from boraroles.api.deps import DbSession
from boraroles.db.models import Role
from boraroles.schemas.role import RoleDescoberta, RolePublic
from boraroles.services.descoberta import frescor_de_role, listar_descoberta
from boraroles.services.roles import role_to_public

router = APIRouter(tags=["descoberta"])


@router.get("/descoberta", response_model=list[RoleDescoberta])
async def descoberta(db: DbSession, bairro: str = Query(min_length=1)) -> list[RoleDescoberta]:
    itens = await listar_descoberta(db, bairro)
    return [
        RoleDescoberta(
            id=item.role.id,
            titulo=item.role.titulo,
            categoria=item.role.categoria,
            data_inicio=item.role.data_inicio,
            data_fim=item.role.data_fim,
            frescor=item.frescor.value if item.frescor else None,
            lugar_nome=item.lugar_nome,
            lugar_bairro=item.lugar_bairro,
        )
        for item in itens
    ]


@router.get("/roles/{role_id}", response_model=RolePublic)
async def obter_role(role_id: uuid.UUID, db: DbSession) -> RolePublic:
    role = await db.get(Role, role_id)
    if role is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rolê não encontrado")
    frescor = await frescor_de_role(db, role)
    return role_to_public(role, frescor)
