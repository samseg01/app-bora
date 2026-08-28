from datetime import UTC, datetime, timedelta

from httpx import AsyncClient

from boraroles.config import get_settings
from boraroles.db.models import PapelUsuario, Sinalizacao, TipoSinalizacao
from tests.conftest import LugarFactory, RoleFactory, UsuarioFactory, auth_headers


async def test_meus_sinais_devolve_o_que_acabei_de_criar(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """O caso que o painel precisa: marquei presença, saí da tela, voltei."""
    curador = await criar_usuario(
        "Curadora", "curadora.sinais@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador)
    role = await criar_role(lugar, curador)

    criado = await client.post(
        "/api/v1/sinalizacoes",
        json={"role_id": str(role.id), "tipo": "presenca"},
        headers=auth_headers(curador),
    )
    assert criado.status_code == 201

    resp = await client.get("/api/v1/sinalizacoes/minhas", headers=auth_headers(curador))
    assert resp.status_code == 200
    corpo = resp.json()
    assert [s["role_id"] for s in corpo] == [str(role.id)]
    assert corpo[0]["id"] == criado.json()["id"]


async def test_meus_sinais_nao_mostra_sinal_de_outra_pessoa(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
    db_session,
) -> None:
    """Sinalização é anônima por promessa do produto — nem por esta rota vaza."""
    curador = await criar_usuario(
        "Curador", "curador.sinais@exemplo.com", papel=PapelUsuario.CURADOR
    )
    outro = await criar_usuario("Outro", "outro.sinais@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador)
    role = await criar_role(lugar, curador)

    db_session.add(
        Sinalizacao(usuario_id=outro.id, role_id=role.id, tipo=TipoSinalizacao.PRESENCA)
    )
    await db_session.flush()

    resp = await client.get("/api/v1/sinalizacoes/minhas", headers=auth_headers(curador))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_meus_sinais_ignora_o_que_saiu_da_janela(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
    db_session,
) -> None:
    """Fora da janela warm o sinal não conta pra ninguém — exibi-lo como ativo mentiria."""
    curador = await criar_usuario(
        "Curador", "curador.janela@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador)
    role = await criar_role(lugar, curador)

    janela = get_settings().frescor_warm_window_minutes
    velho = Sinalizacao(
        usuario_id=curador.id,
        role_id=role.id,
        tipo=TipoSinalizacao.PRESENCA,
        timestamp=datetime.now(UTC) - timedelta(minutes=janela + 5),
    )
    db_session.add(velho)
    await db_session.flush()

    resp = await client.get("/api/v1/sinalizacoes/minhas", headers=auth_headers(curador))
    assert resp.status_code == 200
    assert resp.json() == []


async def test_meus_sinais_exige_autenticacao(client: AsyncClient) -> None:
    resp = await client.get("/api/v1/sinalizacoes/minhas")
    assert resp.status_code == 401
