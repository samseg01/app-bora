from datetime import UTC, datetime, timedelta

from boraroles.services.frescor import FrescorEstado, classificar_frescor

AGORA = datetime(2026, 8, 26, 22, 0, tzinfo=UTC)


def test_live_quando_muitos_sinais_recentes() -> None:
    estado = classificar_frescor(
        sinais_recentes=3, sinais_medios=3, criado_em=AGORA - timedelta(hours=3), agora=AGORA
    )
    assert estado == FrescorEstado.LIVE


def test_warm_quando_poucos_sinais_recentes_mas_algum_medio() -> None:
    estado = classificar_frescor(
        sinais_recentes=1, sinais_medios=2, criado_em=AGORA - timedelta(hours=3), agora=AGORA
    )
    assert estado == FrescorEstado.WARM


def test_new_quando_sem_sinais_mas_criado_ha_pouco() -> None:
    estado = classificar_frescor(
        sinais_recentes=0, sinais_medios=0, criado_em=AGORA - timedelta(minutes=10), agora=AGORA
    )
    assert estado == FrescorEstado.NEW


def test_none_quando_sem_sinais_e_antigo() -> None:
    estado = classificar_frescor(
        sinais_recentes=0, sinais_medios=0, criado_em=AGORA - timedelta(hours=5), agora=AGORA
    )
    assert estado is None


def test_live_tem_prioridade_sobre_warm_e_new() -> None:
    estado = classificar_frescor(
        sinais_recentes=3, sinais_medios=3, criado_em=AGORA - timedelta(minutes=1), agora=AGORA
    )
    assert estado == FrescorEstado.LIVE
