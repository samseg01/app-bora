from httpx import AsyncClient

from boraroles.db.models import PapelUsuario
from tests.conftest import LugarFactory, RoleFactory, UsuarioFactory, auth_headers


async def test_comentario_em_role_aparece_no_lugar(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """O "Contar como está lá dentro" da 2e grava com role_id. Enquanto as leituras
    filtravam só por lugar_id, esses comentários ficavam gravados e invisíveis."""
    curador = await criar_usuario(
        "Curador", "curador.coment@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador, bairro="Bairro do Comentário")
    role = await criar_role(lugar, curador)

    resp = await client.post(
        "/api/v1/comentarios",
        json={"role_id": str(role.id), "texto": "fila andando, som bom"},
        headers=auth_headers(curador),
    )
    assert resp.status_code == 201

    detalhe = await client.get(f"/api/v1/lugares/{lugar.id}")
    assert detalhe.status_code == 200
    textos = [c["texto"] for c in detalhe.json()["comentarios_recentes"]]
    assert "fila andando, som bom" in textos

    mapa = await client.get("/api/v1/mapa", params={"bairro": "Bairro do Comentário"})
    pin = next(p for p in mapa.json() if p["lugar"]["id"] == str(lugar.id))
    assert pin["total_comentarios"] == 1


async def test_comentario_de_role_nao_vaza_pra_outro_lugar(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    curador = await criar_usuario(
        "Curador", "curador.coment2@exemplo.com", papel=PapelUsuario.CURADOR
    )
    daqui = await criar_lugar(curador, nome="Daqui", bairro="Bairro Vizinho")
    dali = await criar_lugar(curador, nome="Dali", bairro="Bairro Vizinho")
    role = await criar_role(daqui, curador)

    await client.post(
        "/api/v1/comentarios",
        json={"role_id": str(role.id), "texto": "só daqui"},
        headers=auth_headers(curador),
    )

    outro = await client.get(f"/api/v1/lugares/{dali.id}")
    assert outro.json()["comentarios_recentes"] == []
