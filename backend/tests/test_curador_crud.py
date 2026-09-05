from httpx import AsyncClient

from boraroles.db.models import PapelUsuario
from tests.conftest import UsuarioFactory, auth_headers


async def test_usuario_comum_nao_pode_criar_lugar(client: AsyncClient, criar_usuario: UsuarioFactory) -> None:
    comum = await criar_usuario("Comum CRUD", "comum-crud@exemplo.com")
    resp = await client.post(
        "/api/v1/curador/lugares",
        json={"nome": "X", "categoria": "bar", "lat": -23.5, "lng": -46.6, "bairro": "Pinheiros"},
        headers=auth_headers(comum),
    )
    assert resp.status_code == 403


async def test_curador_cria_le_atualiza_e_deleta_lugar(
    client: AsyncClient, criar_usuario: UsuarioFactory
) -> None:
    curador = await criar_usuario("Curador CRUD", "curador-crud@exemplo.com", papel=PapelUsuario.CURADOR)
    headers = auth_headers(curador)

    resp = await client.post(
        "/api/v1/curador/lugares",
        json={
            "nome": "Bar Original",
            "categoria": "bar",
            "lat": -23.55,
            "lng": -46.69,
            "bairro": "Vila Madalena",
        },
        headers=headers,
    )
    assert resp.status_code == 201
    lugar_id = resp.json()["id"]

    resp = await client.patch(
        f"/api/v1/curador/lugares/{lugar_id}", json={"nome": "Bar Renomeado"}, headers=headers
    )
    assert resp.status_code == 200
    assert resp.json()["nome"] == "Bar Renomeado"
    # lat/lng preservados após um PATCH que não mexeu em geo
    assert resp.json()["lat"] == -23.55
    assert resp.json()["lng"] == -46.69

    resp = await client.delete(f"/api/v1/curador/lugares/{lugar_id}", headers=headers)
    assert resp.status_code == 204

    resp = await client.get(f"/api/v1/curador/lugares/{lugar_id}", headers=headers)
    assert resp.status_code == 404


async def test_curador_cria_role_com_lugar_inexistente_404(
    client: AsyncClient, criar_usuario: UsuarioFactory
) -> None:
    curador = await criar_usuario("Curador CRUD2", "curador-crud2@exemplo.com", papel=PapelUsuario.CURADOR)
    resp = await client.post(
        "/api/v1/curador/roles",
        json={
            "lugar_id": "00000000-0000-0000-0000-000000000000",
            "titulo": "X",
            "categoria": "bar",
            "data_inicio": "2026-01-01T20:00:00Z",
            "data_fim": "2026-01-01T23:00:00Z",
        },
        headers=auth_headers(curador),
    )
    assert resp.status_code == 404


async def test_role_data_fim_antes_de_inicio_e_rejeitado(
    client: AsyncClient, criar_usuario: UsuarioFactory, criar_lugar
) -> None:
    curador = await criar_usuario("Curador CRUD3", "curador-crud3@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador)
    resp = await client.post(
        "/api/v1/curador/roles",
        json={
            "lugar_id": str(lugar.id),
            "titulo": "X",
            "categoria": "bar",
            "data_inicio": "2026-01-01T23:00:00Z",
            "data_fim": "2026-01-01T20:00:00Z",
        },
        headers=auth_headers(curador),
    )
    assert resp.status_code == 422


async def test_corrigir_lugar_com_horarios_e_o_que_o_curador_faz_na_calcada(
    client: AsyncClient, criar_usuario: UsuarioFactory
) -> None:
    """PATCH com `horarios` estourava 500 e ninguém sabia.

    `body.model_dump()` é recursivo, então `dados["horarios"]` já era lista de
    dicionários; a rota chamava `.model_dump()` de novo em cada item e levantava
    `AttributeError`. A tela mostrava "Não deu pra salvar. Tenta de novo.".

    Passou despercebido porque nenhum teste corrigia horário — só criava. E o efeito é
    grave no caminho que mais importa: **gravar o raio de presença de uma casa já
    cadastrada** (itens 57/58) manda o formulário inteiro, horários inclusive, então
    corrigir qualquer lugar com horário era impossível.
    """
    curador = await criar_usuario(
        "Curador Horario", "curador-horario@exemplo.com", papel=PapelUsuario.CURADOR
    )
    headers = auth_headers(curador)

    criado = await client.post(
        "/api/v1/curador/lugares",
        json={
            "nome": "Boteco do Horário",
            "categoria": "boteco",
            "lat": -23.5441,
            "lng": -46.6396,
            "bairro": "República",
            "horarios": [{"dias": [4, 5], "abre": "18:00", "fecha": "02:00"}],
        },
        headers=headers,
    )
    assert criado.status_code == 201
    lugar_id = criado.json()["id"]

    resp = await client.patch(
        f"/api/v1/curador/lugares/{lugar_id}",
        json={
            "horarios": [
                {"dias": [1, 2, 3], "abre": "17:00", "fecha": "23:00"},
                {"dias": [4, 5, 6], "abre": "17:00", "fecha": "04:00"},
            ],
            "raio_metros": 60,
        },
        headers=headers,
    )

    assert resp.status_code == 200
    corpo = resp.json()
    assert corpo["raio_metros"] == 60
    assert len(corpo["horarios"]) == 2
    # A faixa que atravessa a meia-noite tem de sobreviver ao ida e volta: é ela que faz
    # o "aberta agora" acertar às 00h30 de sábado.
    assert corpo["horarios"][1] == {"dias": [4, 5, 6], "abre": "17:00", "fecha": "04:00"}

    # E a leitura seguinte devolve o mesmo — o JSONB guardou dicionário, não repr de objeto.
    relido = await client.get(f"/api/v1/curador/lugares/{lugar_id}", headers=headers)
    assert relido.json()["horarios"] == corpo["horarios"]
