import enum
from datetime import UTC, datetime, timedelta

from boraroles.config import get_settings


class FrescorEstado(enum.StrEnum):
    LIVE = "live"
    WARM = "warm"
    NEW = "new"


def classificar_frescor(
    sinais_recentes: int,
    sinais_medios: int,
    criado_em: datetime,
    agora: datetime | None = None,
) -> FrescorEstado | None:
    """Frescor é sempre derivado na leitura, nunca uma coluna armazenada (ADR-001).

    sinais_recentes: contagem de Sinalizacao dentro da janela "live".
    sinais_medios: contagem de Sinalizacao dentro da janela "warm" (mais larga, inclui a live).
    """
    settings = get_settings()
    agora = agora or datetime.now(UTC)

    if sinais_recentes >= settings.frescor_live_min_sinais:
        return FrescorEstado.LIVE
    if sinais_medios >= 1:
        return FrescorEstado.WARM
    if criado_em >= agora - timedelta(minutes=settings.frescor_live_window_minutes):
        return FrescorEstado.NEW
    return None
