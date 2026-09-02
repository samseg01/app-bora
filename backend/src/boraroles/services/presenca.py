"""Verificação de presença por proximidade — o núcleo do ADR-009.

Duas perguntas, e só duas: **qual é o raio deste alvo** e **este ponto está dentro
dele**. Tudo que decide se um "Tô aqui" é aceito passa por aqui.
"""

from geoalchemy2 import Geography
from sqlalchemy import cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from boraroles.config import get_settings
from boraroles.db.models import Lugar, Role


def raio_efetivo(lugar: Lugar, role: Role | None = None) -> int:
    """O perímetro que vale para este alvo, em metros.

    Cascata de três degraus, do mais específico para o mais genérico (ADR-009,
    emenda 1):

    1. `Role.raio_metros` — a exceção: a festa que transborda para a rua.
    2. `Lugar.raio_metros` — o padrão da casa, medido em campo pelo curador.
    3. `settings.presenca_raio_padrao_metros` — o piso, para o que ainda não foi medido.

    O degrau 3 existe para que a feature funcione com o banco de hoje, em que
    **nenhum** lugar tem raio: exigir a medida antes de aceitar qualquer sinal
    deixaria a verificação inerte até a curadoria inteira ser refeita.
    """
    if role is not None and role.raio_metros is not None:
        return role.raio_metros
    if lugar.raio_metros is not None:
        return lugar.raio_metros
    return get_settings().presenca_raio_padrao_metros


async def distancia_metros(db: AsyncSession, lugar: Lugar, lat: float, lng: float) -> float:
    """Quantos metros separam o ponto informado deste lugar.

    A conta é feita **no banco**, e não em Python, porque é o PostGIS que sabe fazer
    distância geodésica — a fórmula ingênua de Euclides sobre graus erra mais quanto
    mais longe do equador, e São Paulo não é o equador.

    O cast para `geography` é o que faz o PostGIS responder em metros em vez de graus:
    mesmo padrão de `GET /lugares/proximos`, e a razão de não dar para comparar
    `Geometry` com um raio em metros direto.
    """
    ponto = cast(func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326), Geography)
    distancia = func.ST_Distance(cast(Lugar.geo, Geography), ponto)
    metros = await db.scalar(select(distancia).where(Lugar.id == lugar.id))
    # Lugar inexistente devolveria None; infinito faz a checagem recusar, que é o certo.
    return float(metros) if metros is not None else float("inf")


async def esta_no_lugar(
    db: AsyncSession, lugar: Lugar, lat: float, lng: float, role: Role | None = None
) -> tuple[bool, float, int]:
    """`(dentro, distancia_m, raio_m)` — o suficiente para aceitar ou recusar **e explicar**.

    Devolve os três porque uma recusa muda precisa dizer à pessoa por que ela foi
    recusada. "Você está a 340 m e o limite é 150" é acionável; "não foi possível
    sinalizar" faz a pessoa achar que o app quebrou — e o ADR já avisa que o erro de
    GPS piora justamente dentro do bar, ou seja, a recusa vai acontecer com gente
    honesta que está mesmo lá.

    Nada do ponto recebido é gravado: entra como argumento, morre no fim da chamada.
    É a mesma regra de `GET /lugares/proximos`, e é o que mantém literal a promessa de
    que o app não guarda onde você esteve.
    """
    raio = raio_efetivo(lugar, role)
    distancia = await distancia_metros(db, lugar, lat, lng)
    return distancia <= raio, distancia, raio
