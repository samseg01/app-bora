from datetime import UTC, datetime, timedelta

from httpx import AsyncClient

from tests.conftest import UsuarioFactory, auth_headers


async def test_fluxo_completo_emitir_descobrir_sinalizar_salvar_comentar(
    client: AsyncClient, criar_usuario: UsuarioFactory
) -> None:
    from boraroles.db.models import PapelUsuario

    curador = await criar_usuario("Curador E2E", "curador-e2e@exemplo.com", papel=PapelUsuario.CURADOR)
    comum = await criar_usuario("Comum E2E", "comum-e2e@exemplo.com")

    # 1. curador cria lugar
    resp = await client.post(
        "/api/v1/curador/lugares",
        json={
            "nome": "Bar da Esquina E2E",
            "categoria": "bar",
            "lat": -23.5475,
            "lng": -46.6906,
            "bairro": "Vila Madalena E2E",
        },
        headers=auth_headers(curador),
    )
    assert resp.status_code == 201
    lugar_id = resp.json()["id"]

    # 2. curador cria rolê "de hoje"
    agora = datetime.now(UTC)
    resp = await client.post(
        "/api/v1/curador/roles",
        json={
            "lugar_id": lugar_id,
            "titulo": "Samba de hoje E2E",
            "categoria": "bar",
            "data_inicio": agora.isoformat(),
            "data_fim": (agora + timedelta(hours=4)).isoformat(),
        },
        headers=auth_headers(curador),
    )
    assert resp.status_code == 201
    role = resp.json()
    role_id = role["id"]
    assert role["frescor"] is None  # recém-criado, ainda sem sinalização nem no início da janela "new"

    # 3. aparece em /descoberta
    resp = await client.get("/api/v1/descoberta", params={"bairro": "Vila Madalena E2E"})
    assert resp.status_code == 200
    assert any(item["id"] == role_id for item in resp.json())

    # 4. aparece em /mapa
    resp = await client.get("/api/v1/mapa", params={"bairro": "Vila Madalena E2E"})
    assert resp.status_code == 200
    pin = next(p for p in resp.json() if p["lugar"]["id"] == lugar_id)
    assert pin["role_ativo"]["id"] == role_id

    # 5. 3 PESSOAS sinalizando -> frescor vira "live" (o núcleo técnico da aposta do produto).
    #    Este teste antes mandava o mesmo curador sinalizar 3 vezes e exigia "live": ele
    #    documentava a falha em vez de pegá-la. Três toques de um dedo só não são três
    #    pessoas, e "Bombando agora" precisa significar gente.
    sinalizadores = [curador]
    for i in (2, 3):
        sinalizadores.append(
            await criar_usuario(
                f"Curador E2E {i}", f"curador-e2e-{i}@exemplo.com", papel=PapelUsuario.CURADOR
            )
        )
    for quem in sinalizadores:
        resp = await client.post(
            "/api/v1/sinalizacoes",
            json={"role_id": role_id, "tipo": "presenca"},
            headers=auth_headers(quem),
        )
        assert resp.status_code == 201

    resp = await client.get(f"/api/v1/roles/{role_id}")
    assert resp.status_code == 200
    assert resp.json()["frescor"] == "live"

    # 6. usuário comum NÃO pode sinalizar (ainda restrito a curador/dono_estabelecimento)
    resp = await client.post(
        "/api/v1/sinalizacoes",
        json={"role_id": role_id, "tipo": "presenca"},
        headers=auth_headers(comum),
    )
    assert resp.status_code == 403

    # 7. usuário comum salva o lugar e comenta
    resp = await client.post(
        "/api/v1/salvos", json={"lugar_id": lugar_id}, headers=auth_headers(comum)
    )
    assert resp.status_code == 201

    resp = await client.post(
        "/api/v1/comentarios",
        json={"lugar_id": lugar_id, "texto": "Fila andando rápido"},
        headers=auth_headers(comum),
    )
    assert resp.status_code == 201

    # 8. GET /lugares/{id} reflete o comentário e o frescor do lugar
    resp = await client.get(f"/api/v1/lugares/{lugar_id}")
    assert resp.status_code == 200
    body = resp.json()
    assert body["comentarios_recentes"][0]["texto"] == "Fila andando rápido"
