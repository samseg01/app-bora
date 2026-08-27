from httpx import AsyncClient

from boraroles.db.models import PapelUsuario, Salvo, Sinalizacao, TipoSinalizacao
from tests.conftest import (
    EstabelecimentoFactory,
    LugarFactory,
    UsuarioFactory,
    auth_headers,
)


async def test_engajamento_reflete_salvos_e_sinalizacoes(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_estabelecimento: EstabelecimentoFactory,
    db_session,
) -> None:
    dono = await criar_usuario("Dono", "dono@exemplo.com", papel=PapelUsuario.DONO_ESTABELECIMENTO)
    estabelecimento = await criar_estabelecimento(dono)
    lugar = await criar_lugar(dono, estabelecimento_id=estabelecimento.id)

    fã = await criar_usuario("Fã", "fa@exemplo.com")
    db_session.add(Salvo(usuario_id=fã.id, lugar_id=lugar.id))
    db_session.add(
        Sinalizacao(usuario_id=fã.id, lugar_id=lugar.id, tipo=TipoSinalizacao.PRESENCA)
    )
    await db_session.flush()

    resp = await client.get(
        f"/api/v1/estabelecimento/{estabelecimento.id}/engajamento", headers=auth_headers(dono)
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_salvos"] == 1
    assert body["total_sinalizacoes"] == 1
    assert body["por_lugar"][0]["lugar_nome"] == lugar.nome


async def test_engajamento_bloqueado_pra_outro_dono(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_estabelecimento: EstabelecimentoFactory,
) -> None:
    dono1 = await criar_usuario("Dono1", "dono1@exemplo.com", papel=PapelUsuario.DONO_ESTABELECIMENTO)
    dono2 = await criar_usuario("Dono2", "dono2@exemplo.com", papel=PapelUsuario.DONO_ESTABELECIMENTO)
    estabelecimento = await criar_estabelecimento(dono1)

    resp = await client.get(
        f"/api/v1/estabelecimento/{estabelecimento.id}/engajamento", headers=auth_headers(dono2)
    )
    assert resp.status_code == 403


async def test_engajamento_estabelecimento_inexistente_404(
    client: AsyncClient, criar_usuario: UsuarioFactory
) -> None:
    dono = await criar_usuario("Dono3", "dono3@exemplo.com", papel=PapelUsuario.DONO_ESTABELECIMENTO)
    resp = await client.get(
        "/api/v1/estabelecimento/00000000-0000-0000-0000-000000000000/engajamento",
        headers=auth_headers(dono),
    )
    assert resp.status_code == 404
