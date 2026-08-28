from httpx import AsyncClient

from boraroles.db.models import PapelUsuario
from tests.conftest import LugarFactory, UsuarioFactory

# Pontos reais, para as distâncias serem conferíveis num mapa.
#
# A suíte roda contra o MESMO banco do desenvolvimento (ver conftest), então há lugares
# de verdade por perto — o Bar do China fica a ~700 m da Praça da República. As
# asserções falam só dos lugares criados aqui, nunca do conteúdo total da resposta.
PRACA_REPUBLICA = (-23.5434, -46.6425)
LARGO_AROUCHE = (-23.5455, -46.6432)  # ~250 m da praça
LARGO_BATATA = (-23.5665, -46.6952)  # Pinheiros, ~6 km


async def test_proximos_ordena_do_mais_perto_pro_mais_longe(
    client: AsyncClient, criar_usuario: UsuarioFactory, criar_lugar: LugarFactory
) -> None:
    curador = await criar_usuario(
        "Curador", "curador.prox@exemplo.com", papel=PapelUsuario.CURADOR
    )
    await criar_lugar(
        curador, nome="Perto", bairro="República", lat=LARGO_AROUCHE[0], lng=LARGO_AROUCHE[1]
    )
    await criar_lugar(
        curador, nome="Longe", bairro="Pinheiros", lat=LARGO_BATATA[0], lng=LARGO_BATATA[1]
    )

    resp = await client.get(
        "/api/v1/lugares/proximos",
        params={"lat": PRACA_REPUBLICA[0], "lng": PRACA_REPUBLICA[1], "limite": 30},
    )
    assert resp.status_code == 200
    corpo = resp.json()

    distancias = [p["distancia_m"] for p in corpo]
    assert distancias == sorted(distancias), "a resposta precisa vir ordenada por distância"

    nomes = [p["lugar"]["nome"] for p in corpo]
    assert nomes.index("Perto") < nomes.index("Longe")

    perto = next(p for p in corpo if p["lugar"]["nome"] == "Perto")
    # ~250 m da praça ao Largo do Arouche; margem folgada para não virar teste frágil.
    assert 100 < perto["distancia_m"] < 600
    assert perto["lugar"]["bairro"] == "República"


async def test_proximos_respeita_o_raio(
    client: AsyncClient, criar_usuario: UsuarioFactory, criar_lugar: LugarFactory
) -> None:
    """O raio existe para a tela poder perguntar "estou dentro de algum recorte?"."""
    curador = await criar_usuario(
        "Curador", "curador.raio@exemplo.com", papel=PapelUsuario.CURADOR
    )
    await criar_lugar(
        curador, nome="Só de longe", bairro="Pinheiros", lat=LARGO_BATATA[0], lng=LARGO_BATATA[1]
    )

    params = {"lat": PRACA_REPUBLICA[0], "lng": PRACA_REPUBLICA[1], "limite": 30}
    apertado = await client.get("/api/v1/lugares/proximos", params={**params, "raio_m": 1000})
    assert "Só de longe" not in [p["lugar"]["nome"] for p in apertado.json()]
    assert all(p["distancia_m"] <= 1000 for p in apertado.json())

    largo = await client.get("/api/v1/lugares/proximos", params={**params, "raio_m": 20000})
    assert "Só de longe" in [p["lugar"]["nome"] for p in largo.json()]


async def test_proximos_e_publico_e_valida_coordenada(client: AsyncClient) -> None:
    """Descoberta é pública — pedir login para "o que tem perto de mim" seria fricção
    exatamente no primeiro toque de quem nunca usou o app."""
    ok = await client.get("/api/v1/lugares/proximos", params={"lat": -23.5, "lng": -46.6})
    assert ok.status_code == 200

    ruim = await client.get("/api/v1/lugares/proximos", params={"lat": 200, "lng": -46.6})
    assert ruim.status_code == 422
