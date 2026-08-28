from httpx import AsyncClient

from boraroles.db.models import PapelUsuario
from tests.conftest import LugarFactory, RoleFactory, UsuarioFactory, auth_headers


async def test_salvo_de_outro_bairro_traz_o_role_de_hoje(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """O bug relatado: o caderninho atravessa bairros, e a tela dizia "sem rolê hoje"
    para lugar salvo fora do recorte selecionado — porque perguntava ao `GET /mapa`,
    que é filtrado por um bairro só."""
    curador = await criar_usuario(
        "Curador", "curador.cadern@exemplo.com", papel=PapelUsuario.CURADOR
    )
    daqui = await criar_lugar(curador, nome="Boteco Daqui", bairro="Recorte A")
    dali = await criar_lugar(curador, nome="Sarau Dali", bairro="Recorte B")
    await criar_role(daqui, curador, titulo="Samba no Daqui")
    await criar_role(dali, curador, titulo="Sarau no Dali")

    pessoa = await criar_usuario("Pessoa", "pessoa.cadern@exemplo.com")
    for lugar in (daqui, dali):
        r = await client.post(
            "/api/v1/salvos", json={"lugar_id": str(lugar.id)}, headers=auth_headers(pessoa)
        )
        assert r.status_code == 201

    resp = await client.get("/api/v1/salvos", headers=auth_headers(pessoa))
    assert resp.status_code == 200
    por_nome = {i["lugar"]["nome"]: i for i in resp.json()}

    # Os dois têm rolê hoje, e nenhum depende do bairro que o cliente escolheu.
    assert por_nome["Boteco Daqui"]["role_ativo"]["titulo"] == "Samba no Daqui"
    assert por_nome["Sarau Dali"]["role_ativo"]["titulo"] == "Sarau no Dali"
    assert por_nome["Sarau Dali"]["lugar"]["bairro"] == "Recorte B"


async def test_salvo_sem_role_devolve_nulo(
    client: AsyncClient, criar_usuario: UsuarioFactory, criar_lugar: LugarFactory
) -> None:
    """"Sem rolê hoje" tem de continuar sendo dito quando é verdade."""
    curador = await criar_usuario(
        "Curador", "curador.semrole@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador, nome="Bar Parado", bairro="Recorte C")
    pessoa = await criar_usuario("Pessoa", "pessoa.semrole@exemplo.com")
    await client.post(
        "/api/v1/salvos", json={"lugar_id": str(lugar.id)}, headers=auth_headers(pessoa)
    )

    resp = await client.get("/api/v1/salvos", headers=auth_headers(pessoa))
    item = next(i for i in resp.json() if i["lugar"]["nome"] == "Bar Parado")
    assert item["role_ativo"] is None
