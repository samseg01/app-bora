from datetime import UTC, datetime, timedelta

from httpx import AsyncClient

from boraroles.db.models import PapelUsuario
from tests.conftest import LugarFactory, RoleFactory, UsuarioFactory


async def test_descoberta_retorna_role_de_hoje_no_bairro(
    client: AsyncClient, criar_usuario: UsuarioFactory, criar_lugar: LugarFactory, criar_role: RoleFactory
) -> None:
    curador = await criar_usuario("Curador", "curador-desc@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador, bairro="Pinheiros")
    await criar_role(lugar, curador, titulo="Sarau de hoje")

    resp = await client.get("/api/v1/descoberta", params={"bairro": "Pinheiros"})
    assert resp.status_code == 200
    titulos = [item["titulo"] for item in resp.json()]
    assert "Sarau de hoje" in titulos


async def test_descoberta_nao_mistura_bairros(
    client: AsyncClient, criar_usuario: UsuarioFactory, criar_lugar: LugarFactory, criar_role: RoleFactory
) -> None:
    curador = await criar_usuario("Curador2", "curador-desc2@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador, bairro="Baixo Augusta")
    await criar_role(lugar, curador, titulo="Só no Baixo Augusta")

    resp = await client.get("/api/v1/descoberta", params={"bairro": "Vila Madalena"})
    assert resp.status_code == 200
    titulos = [item["titulo"] for item in resp.json()]
    assert "Só no Baixo Augusta" not in titulos


async def test_descoberta_ignora_role_que_ja_acabou(
    client: AsyncClient, criar_usuario: UsuarioFactory, criar_lugar: LugarFactory, criar_role: RoleFactory
) -> None:
    curador = await criar_usuario("Curador3", "curador-desc3@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador, bairro="Itaim")
    ontem = datetime.now(UTC) - timedelta(days=1)
    await criar_role(
        lugar, curador, titulo="Já acabou", data_inicio=ontem, data_fim=ontem + timedelta(hours=2)
    )

    resp = await client.get("/api/v1/descoberta", params={"bairro": "Itaim"})
    assert resp.status_code == 200
    titulos = [item["titulo"] for item in resp.json()]
    assert "Já acabou" not in titulos
