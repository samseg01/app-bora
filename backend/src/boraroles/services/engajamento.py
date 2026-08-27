import uuid
from collections import defaultdict

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from boraroles.db.models import Lugar, Role, Salvo, Sinalizacao
from boraroles.schemas.estabelecimento import EngajamentoEstabelecimento, EngajamentoPorLugar


async def engajamento_de_estabelecimento(
    db: AsyncSession, estabelecimento_id: uuid.UUID
) -> EngajamentoEstabelecimento:
    lugares = (
        (await db.execute(select(Lugar).where(Lugar.estabelecimento_id == estabelecimento_id)))
        .scalars()
        .all()
    )
    lugar_ids = [lugar.id for lugar in lugares]

    if not lugar_ids:
        return EngajamentoEstabelecimento(
            estabelecimento_id=estabelecimento_id, total_salvos=0, total_sinalizacoes=0, por_lugar=[]
        )

    salvos_rows = await db.execute(
        select(Salvo.lugar_id, func.count())
        .where(Salvo.lugar_id.in_(lugar_ids))
        .group_by(Salvo.lugar_id)
    )
    salvos_por_lugar: dict[uuid.UUID, int] = {lugar_id: total for lugar_id, total in salvos_rows}

    sinalizacoes_por_lugar: dict[uuid.UUID, int] = defaultdict(int)
    for lugar_id, total in (
        await db.execute(
            select(Sinalizacao.lugar_id, func.count())
            .where(Sinalizacao.lugar_id.in_(lugar_ids))
            .group_by(Sinalizacao.lugar_id)
        )
    ).all():
        sinalizacoes_por_lugar[lugar_id] += total

    for lugar_id, total in (
        await db.execute(
            select(Role.lugar_id, func.count())
            .join(Sinalizacao, Sinalizacao.role_id == Role.id)
            .where(Role.lugar_id.in_(lugar_ids))
            .group_by(Role.lugar_id)
        )
    ).all():
        sinalizacoes_por_lugar[lugar_id] += total

    por_lugar = [
        EngajamentoPorLugar(
            lugar_id=lugar.id,
            lugar_nome=lugar.nome,
            total_salvos=salvos_por_lugar.get(lugar.id, 0),
            total_sinalizacoes=sinalizacoes_por_lugar.get(lugar.id, 0),
        )
        for lugar in lugares
    ]

    return EngajamentoEstabelecimento(
        estabelecimento_id=estabelecimento_id,
        total_salvos=sum(item.total_salvos for item in por_lugar),
        total_sinalizacoes=sum(item.total_sinalizacoes for item in por_lugar),
        por_lugar=por_lugar,
    )
