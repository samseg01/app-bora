from httpx import AsyncClient

from boraroles.db.models import PapelUsuario, Sinalizacao, TipoSinalizacao
from tests.conftest import LugarFactory, RoleFactory, UsuarioFactory, auth_headers


async def test_role_expoe_quantas_pessoas_sinalizaram(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
    db_session,
) -> None:
    """O "6 sinalizaram nas últimas 2h" do hi-fi. Conta PESSOAS: a mesma pessoa
    sinalizando duas vezes não vira duas."""
    curador = await criar_usuario(
        "Curador", "curador.conta@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador, bairro="Bairro da Contagem")
    role = await criar_role(lugar, curador)

    zerado = await client.get(f"/api/v1/roles/{role.id}")
    assert zerado.json()["sinais_recentes"] == 0

    for i in range(2):
        pessoa = await criar_usuario(f"P{i}", f"p{i}.conta@exemplo.com")
        db_session.add(
            Sinalizacao(usuario_id=pessoa.id, role_id=role.id, tipo=TipoSinalizacao.PRESENCA)
        )
    # Segunda linha da mesma pessoa não conta de novo.
    db_session.add(
        Sinalizacao(usuario_id=curador.id, role_id=role.id, tipo=TipoSinalizacao.PRESENCA)
    )
    db_session.add(
        Sinalizacao(usuario_id=curador.id, role_id=role.id, tipo=TipoSinalizacao.PRESENCA)
    )
    await db_session.flush()

    resp = await client.get(f"/api/v1/roles/{role.id}")
    assert resp.json()["sinais_recentes"] == 3


async def test_mapa_expoe_frescor_do_proprio_lugar(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    db_session,
) -> None:
    """Um bar cheio sem rolê programado tem de acender — é o degrau de baixo da escada."""
    curador = await criar_usuario(
        "Curador", "curador.pinlugar@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador, nome="Boteco Sem Agenda", bairro="Bairro do Pin")

    # Sinalização amarrada ao LUGAR, não a um rolê.
    pessoa = await criar_usuario("Pessoa", "pessoa.pinlugar@exemplo.com")
    db_session.add(
        Sinalizacao(usuario_id=pessoa.id, lugar_id=lugar.id, tipo=TipoSinalizacao.PRESENCA)
    )
    await db_session.flush()

    resp = await client.get("/api/v1/mapa", params={"bairro": "Bairro do Pin"})
    pin = next(p for p in resp.json() if p["lugar"]["nome"] == "Boteco Sem Agenda")
    assert pin["role_ativo"] is None
    assert pin["frescor"] == "warm"
