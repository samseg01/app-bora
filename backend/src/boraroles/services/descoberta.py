import uuid
from datetime import UTC, datetime, time, timedelta
from zoneinfo import ZoneInfo

from sqlalchemy import distinct, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from boraroles.config import get_settings
from boraroles.db.models import Lugar, Role, Sinalizacao
from boraroles.services.frescor import FrescorEstado, classificar_frescor

# Conta PESSOAS, não linhas. `classificar_frescor` acende "live" a partir de 3 sinais, e
# contando linhas uma pessoa sozinha tocando "Tô indo" três vezes acendia o "Bombando
# agora" — a promessa central do app forjável com um dedo. Nada impede alguém de
# sinalizar o mesmo rolê de novo mais tarde ("continuo aqui"), e isso é legítimo; o que
# não pode é a segunda vez valer como segunda pessoa.
_pessoas = func.count(distinct(Sinalizacao.usuario_id))


class RoleComFrescor:
    def __init__(self, role: Role, lugar_nome: str, lugar_bairro: str, frescor: FrescorEstado | None):
        self.role = role
        self.lugar_nome = lugar_nome
        self.lugar_bairro = lugar_bairro
        self.frescor = frescor


def _dia_local(agora: datetime) -> tuple[datetime, datetime]:
    """Começo e fim de "hoje" no fuso do bairro, devolvidos em UTC.

    O banco é todo UTC e continua sendo — o que precisa ser local é a pergunta "hoje".
    Antes isto era `agora.replace(hour=0, ...)`, e como a rota chama com
    `datetime.now(UTC)`, o dia ia das 21h de ontem às 21h de hoje em São Paulo. Efeito:
    **um rolê que começava às 21h ficava fora do limite superior e sumia da descoberta**
    — para alguém olhando às 20h, decidindo se sai, a noite inteira estava invisível.

    O cálculo não pode depender do fuso do `datetime` recebido. Era essa dependência que
    tornava o bug difícil de ver: com um `agora` já em São Paulo o `.replace` acertava a
    meia-noite local por acidente, e o teste passava enquanto produção falhava. Por isso
    converte-se explicitamente antes de qualquer coisa.
    """
    fuso = ZoneInfo(get_settings().fuso_local)
    hoje = agora.astimezone(fuso).date()
    inicio = datetime.combine(hoje, time.min, tzinfo=fuso)
    fim = datetime.combine(hoje + timedelta(days=1), time.min, tzinfo=fuso)
    return inicio.astimezone(UTC), fim.astimezone(UTC)


def _janelas(agora: datetime) -> tuple[datetime, datetime]:
    settings = get_settings()
    live_since = agora - timedelta(minutes=settings.frescor_live_window_minutes)
    warm_since = agora - timedelta(minutes=settings.frescor_warm_window_minutes)
    return live_since, warm_since


async def listar_descoberta(
    db: AsyncSession, bairro: str, limite: int = 5, agora: datetime | None = None
) -> list[RoleComFrescor]:
    """Rolês "de hoje" no bairro, curatoriais (todo Role já passou por um curador na criação —
    ver services/curador). ORDER BY sinais_recentes é tiebreaker de frescor, não ranking de
    popularidade: ver ADR sobre /descoberta não ser algorítmico."""
    agora = agora or datetime.now(UTC)
    live_since, warm_since = _janelas(agora)
    _, fim_hoje = _dia_local(agora)

    sinais_recentes = _pessoas.filter(Sinalizacao.timestamp >= live_since)
    sinais_medios = _pessoas.filter(Sinalizacao.timestamp >= warm_since)

    stmt = (
        select(Role, Lugar.nome, Lugar.bairro, sinais_recentes, sinais_medios)
        .join(Lugar, Lugar.id == Role.lugar_id)
        .outerjoin(
            Sinalizacao,
            (Sinalizacao.role_id == Role.id) & (Sinalizacao.timestamp >= warm_since),
        )
        .where(Lugar.bairro == bairro, Role.data_fim >= agora, Role.data_inicio < fim_hoje)
        .group_by(Role.id, Lugar.nome, Lugar.bairro)
        .order_by(sinais_recentes.desc(), Role.data_inicio.asc())
        .limit(limite)
    )

    rows = (await db.execute(stmt)).all()
    resultado = []
    for role, lugar_nome, lugar_bairro, recentes, medios in rows:
        frescor = classificar_frescor(recentes, medios, role.created_at, agora)
        resultado.append(RoleComFrescor(role, lugar_nome, lugar_bairro, frescor))
    return resultado


async def frescor_de_role(
    db: AsyncSession, role: Role, agora: datetime | None = None
) -> FrescorEstado | None:
    agora = agora or datetime.now(UTC)
    live_since, warm_since = _janelas(agora)

    stmt = select(
        _pessoas.filter(Sinalizacao.timestamp >= live_since),
        _pessoas.filter(Sinalizacao.timestamp >= warm_since),
    ).where(Sinalizacao.role_id == role.id, Sinalizacao.timestamp >= warm_since)
    recentes, medios = (await db.execute(stmt)).one()
    return classificar_frescor(recentes, medios, role.created_at, agora)


async def contar_sinais_de_role(
    db: AsyncSession, role: Role, agora: datetime | None = None
) -> int:
    """Quantas PESSOAS distintas sinalizaram este rolê dentro da janela warm.

    Existe separado de `frescor_de_role` porque só a tela de detalhe precisa do número —
    obrigar os outros seis pontos de chamada a carregar uma contagem que descartam sairia
    mais caro que a consulta a mais aqui.

    A janela é a warm (2h) e não a live (30min), porque é a que o hi-fi desenhou:
    "6 sinalizaram nas últimas 2h". Contar na janela curta daria um número menor que o
    frescor que a mesma tela exibe, e as duas coisas ficariam se contradizendo.
    """
    agora = agora or datetime.now(UTC)
    _, warm_since = _janelas(agora)
    total = await db.scalar(
        select(_pessoas).where(Sinalizacao.role_id == role.id, Sinalizacao.timestamp >= warm_since)
    )
    return total or 0


async def frescor_de_lugar(
    db: AsyncSession, lugar: Lugar, agora: datetime | None = None
) -> FrescorEstado | None:
    """Sinalização direta no Lugar (ex: "lotado agora"), independente de qualquer Role.
    Sinalização amarrada a um Role específico só conta pro frescor daquele Role
    (ver frescor_de_role) — mantém as duas camadas de conteúdo do conceito separadas."""
    agora = agora or datetime.now(UTC)
    live_since, warm_since = _janelas(agora)

    stmt = select(
        _pessoas.filter(Sinalizacao.timestamp >= live_since),
        _pessoas.filter(Sinalizacao.timestamp >= warm_since),
    ).where(Sinalizacao.lugar_id == lugar.id, Sinalizacao.timestamp >= warm_since)
    recentes, medios = (await db.execute(stmt)).one()
    return classificar_frescor(recentes, medios, lugar.created_at, agora)


async def role_ativo_de_lugar(
    db: AsyncSession, lugar_id: uuid.UUID, agora: datetime | None = None
) -> Role | None:
    agora = agora or datetime.now(UTC)
    _, fim_hoje = _dia_local(agora)

    stmt = (
        select(Role)
        .where(Role.lugar_id == lugar_id, Role.data_fim >= agora, Role.data_inicio < fim_hoje)
        .order_by(Role.data_inicio.asc())
        .limit(1)
    )
    return (await db.execute(stmt)).scalar_one_or_none()
