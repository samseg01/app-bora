from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select

from boraroles.api.deps import DbSession, require_estabelecimento_owner
from boraroles.db.models import Estabelecimento, Lugar
from boraroles.schemas.estabelecimento import EngajamentoEstabelecimento
from boraroles.schemas.lugar import LugarPublic
from boraroles.services.engajamento import engajamento_de_estabelecimento
from boraroles.services.lugares import lugar_to_public

router = APIRouter(prefix="/estabelecimento", tags=["estabelecimento"])

DonoEstabelecimento = Annotated[Estabelecimento, Depends(require_estabelecimento_owner)]


@router.get("/{estabelecimento_id}/lugares", response_model=list[LugarPublic])
async def lugares_do_estabelecimento(
    db: DbSession, estabelecimento: DonoEstabelecimento
) -> list[LugarPublic]:
    lugares = (
        (await db.execute(select(Lugar).where(Lugar.estabelecimento_id == estabelecimento.id)))
        .scalars()
        .all()
    )
    return [lugar_to_public(lugar) for lugar in lugares]


@router.get("/{estabelecimento_id}/engajamento", response_model=EngajamentoEstabelecimento)
async def engajamento(db: DbSession, estabelecimento: DonoEstabelecimento) -> EngajamentoEstabelecimento:
    return await engajamento_de_estabelecimento(db, estabelecimento.id)
