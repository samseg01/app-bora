from datetime import UTC, datetime, timedelta

from httpx import AsyncClient

from boraroles.config import get_settings
from boraroles.db.models import PapelUsuario, Sinalizacao, TipoSinalizacao
from tests.conftest import (
    NO_LUGAR,
    LugarFactory,
    RoleFactory,
    UsuarioFactory,
    auth_headers,
)


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
        json={"role_id": str(role.id), "tipo": "presenca", **NO_LUGAR},
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


async def test_sinalizar_duas_vezes_renova_em_vez_de_empilhar(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """Uma segunda linha da mesma pessoa não é uma segunda pessoa."""
    curador = await criar_usuario(
        "Curador", "curador.renova@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador)
    role = await criar_role(lugar, curador)
    corpo = {"role_id": str(role.id), "tipo": "presenca", **NO_LUGAR}

    um = await client.post("/api/v1/sinalizacoes", json=corpo, headers=auth_headers(curador))
    dois = await client.post("/api/v1/sinalizacoes", json=corpo, headers=auth_headers(curador))
    assert um.status_code == 201 and dois.status_code == 201
    assert um.json()["id"] == dois.json()["id"]

    resp = await client.get("/api/v1/sinalizacoes/minhas", headers=auth_headers(curador))
    assert len(resp.json()) == 1


async def test_tres_toques_de_uma_pessoa_nao_acendem_o_live(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """A regressão que motivou tudo: `live` exige 3 sinais, e contando linhas um dedo só
    bastava para acender "Bombando agora" — a promessa central do produto."""
    curador = await criar_usuario(
        "Curador", "curador.live@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador, bairro="Bairro do Live")
    role = await criar_role(lugar, curador)
    corpo = {"role_id": str(role.id), "tipo": "presenca", **NO_LUGAR}

    for _ in range(3):
        await client.post("/api/v1/sinalizacoes", json=corpo, headers=auth_headers(curador))

    resp = await client.get(f"/api/v1/roles/{role.id}")
    assert resp.status_code == 200
    assert resp.json()["frescor"] == "warm"


async def test_cancelar_apaga_os_sinais_ativos_da_pessoa_no_alvo(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
    db_session,
) -> None:
    """Cancelar quer dizer "não vou" — não pode sobrar linha sua dizendo que vai."""
    curador = await criar_usuario(
        "Curador", "curador.cancela@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador)
    role = await criar_role(lugar, curador)

    # Duplicatas como as que existiam antes da regra de renovação.
    agora = datetime.now(UTC)
    for minutos in (1, 20, 40):
        db_session.add(
            Sinalizacao(
                usuario_id=curador.id,
                role_id=role.id,
                tipo=TipoSinalizacao.PRESENCA,
                timestamp=agora - timedelta(minutes=minutos),
            )
        )
    await db_session.flush()

    antes = await client.get("/api/v1/sinalizacoes/minhas", headers=auth_headers(curador))
    assert len(antes.json()) == 3

    alvo = antes.json()[0]["id"]
    apagou = await client.delete(f"/api/v1/sinalizacoes/{alvo}", headers=auth_headers(curador))
    assert apagou.status_code == 204

    depois = await client.get("/api/v1/sinalizacoes/minhas", headers=auth_headers(curador))
    assert depois.json() == []
