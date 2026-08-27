from httpx import AsyncClient

from boraroles.db.models import PapelUsuario
from tests.conftest import LugarFactory, RoleFactory, UsuarioFactory, token_for


async def test_mapa_lista_pin_do_bairro(
    client: AsyncClient, criar_usuario: UsuarioFactory, criar_lugar: LugarFactory
) -> None:
    curador = await criar_usuario("Curador Mapa", "curador-mapa@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador, nome="Rooftop X", bairro="Vila Madalena")

    resp = await client.get("/api/v1/mapa", params={"bairro": "Vila Madalena"})
    assert resp.status_code == 200
    nomes = [pin["lugar"]["nome"] for pin in resp.json()]
    assert "Rooftop X" in nomes
    pin = next(p for p in resp.json() if p["lugar"]["id"] == str(lugar.id))
    assert pin["role_ativo"] is None
    assert pin["total_comentarios"] == 0


async def test_mapa_mostra_role_ativo_no_pin(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    curador = await criar_usuario("Curador Mapa2", "curador-mapa2@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador, nome="Bar Y", bairro="Pinheiros")
    await criar_role(lugar, curador, titulo="Rolê ativo")

    resp = await client.get("/api/v1/mapa", params={"bairro": "Pinheiros"})
    pin = next(p for p in resp.json() if p["lugar"]["id"] == str(lugar.id))
    assert pin["role_ativo"]["titulo"] == "Rolê ativo"


async def test_lugar_detalhe_traz_comentarios_e_frescor(
    client: AsyncClient, criar_usuario: UsuarioFactory, criar_lugar: LugarFactory
) -> None:
    curador = await criar_usuario("Curador Mapa3", "curador-mapa3@exemplo.com", papel=PapelUsuario.CURADOR)
    comum = await criar_usuario("Comum Mapa", "comum-mapa@exemplo.com")
    lugar = await criar_lugar(curador, nome="Bar Z", bairro="Itaim")

    resp = await client.post(
        "/api/v1/comentarios",
        json={"lugar_id": str(lugar.id), "texto": "Tá bom hoje"},
        headers={"Authorization": f"Bearer {token_for(comum)}"},
    )
    assert resp.status_code == 201

    resp = await client.get(f"/api/v1/lugares/{lugar.id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["comentarios_recentes"][0]["texto"] == "Tá bom hoje"
    assert body["comentarios_recentes"][0]["autor_nome"] == "Comum Mapa"
