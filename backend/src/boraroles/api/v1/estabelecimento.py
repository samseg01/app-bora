from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import select

from boraroles.api.deps import CurrentUser, DbSession, require_estabelecimento_owner
from boraroles.db.models import Estabelecimento, Lugar
from boraroles.schemas.estabelecimento import EngajamentoEstabelecimento, EstabelecimentoPublic
from boraroles.schemas.lugar import LugarPublic
from boraroles.services.engajamento import engajamento_de_estabelecimento
from boraroles.services.lugares import lugar_to_public

router = APIRouter(prefix="/estabelecimento", tags=["estabelecimento"])

DonoEstabelecimento = Annotated[Estabelecimento, Depends(require_estabelecimento_owner)]


@router.get("/meus", response_model=list[EstabelecimentoPublic])
async def meus_estabelecimentos(usuario: CurrentUser, db: DbSession) -> list[Estabelecimento]:
    """Os estabelecimentos de quem está pedindo.

    As outras duas rotas daqui exigem o `estabelecimento_id` na URL, e nada dizia ao
    cliente qual é o dele: o `papel` viaja no JWT, o vínculo não. Sem esta rota o
    painel do dono é inalcançável a não ser copiando um uuid do banco à mão.

    Devolve lista, não objeto único, porque o modelo já permite mais de um
    estabelecimento por dono (`dono_usuario_id` é FK comum, não única) — uma rede
    pequena com duas casas é caso previsto, e devolver o primeiro esconderia o resto.
    """
    result = await db.execute(
        select(Estabelecimento)
        .where(Estabelecimento.dono_usuario_id == usuario.id)
        .order_by(Estabelecimento.created_at)
    )
    return list(result.scalars().all())


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
