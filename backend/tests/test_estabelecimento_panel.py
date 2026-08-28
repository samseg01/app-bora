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


async def test_meus_estabelecimentos_devolve_so_os_do_dono(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_estabelecimento: EstabelecimentoFactory,
) -> None:
    """Sem esta rota o painel do dono é inalcançável: o vínculo não viaja no JWT."""
    dono = await criar_usuario(
        "Dona", "dona.meus@exemplo.com", papel=PapelUsuario.DONO_ESTABELECIMENTO
    )
    alheio = await criar_usuario(
        "Alheio", "alheio.meus@exemplo.com", papel=PapelUsuario.DONO_ESTABELECIMENTO
    )
    minha = await criar_estabelecimento(dono, nome="Casa da Dona")
    await criar_estabelecimento(alheio, nome="Casa Alheia")

    resp = await client.get("/api/v1/estabelecimento/meus", headers=auth_headers(dono))
    assert resp.status_code == 200
    corpo = resp.json()
    assert [e["id"] for e in corpo] == [str(minha.id)]
    assert corpo[0]["nome"] == "Casa da Dona"


async def test_meus_estabelecimentos_vazio_pra_quem_nao_tem_casa(
    client: AsyncClient, criar_usuario: UsuarioFactory
) -> None:
    """Lista vazia, não 403: a conta é válida, ela só não tem casa vinculada — e a tela
    precisa distinguir isso de "você não pode entrar aqui"."""
    comum = await criar_usuario("Comum", "comum.meus@exemplo.com")
    resp = await client.get("/api/v1/estabelecimento/meus", headers=auth_headers(comum))
    assert resp.status_code == 200
    assert resp.json() == []
