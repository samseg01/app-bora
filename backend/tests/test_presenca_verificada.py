"""O ADR-009 em teste: só sinaliza presença quem está no lugar.

O que estes testes protegem, e por que cada um existe, está dito em cada função. O fio
comum é que a verificação vale zero se qualquer uma das metades cair: aceitar quem está
perto **e** recusar quem está longe. Um teste que só afirma a primeira passaria com a
verificação inteira comentada.
"""

from httpx import AsyncClient

from boraroles.config import get_settings
from boraroles.db.models import PapelUsuario
from boraroles.services.presenca import raio_efetivo
from tests.conftest import (
    LONGE_DO_LUGAR,
    NO_LUGAR,
    LugarFactory,
    RoleFactory,
    UsuarioFactory,
    auth_headers,
)


async def test_conta_comum_sinaliza_quando_esta_no_lugar(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """O item 40, destravado: entrar no app passou a mudar alguma coisa.

    Até o ADR-009, "Tô indo" era a ação-título do app e a conta comum levava 403 — o que
    fazia criar conta não mudar nada. A restrição existia porque o sinal era forjável;
    com a coordenada conferida no servidor, o motivo dela deixou de existir.
    """
    curador = await criar_usuario("C", "c.presenca@exemplo.com", papel=PapelUsuario.CURADOR)
    comum = await criar_usuario("Comum", "comum.presenca@exemplo.com")
    lugar = await criar_lugar(curador)
    role = await criar_role(lugar, curador)

    resp = await client.post(
        "/api/v1/sinalizacoes",
        json={"role_id": str(role.id), "tipo": "presenca", **NO_LUGAR},
        headers=auth_headers(comum),
    )
    assert resp.status_code == 201


async def test_recusa_quem_esta_longe_e_diz_o_porque(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """A outra metade — sem ela, a de cima é só "qualquer um sinaliza" com passos a mais.

    A recusa precisa dizer distância e limite. O próprio ADR-009 registra que o erro de
    GPS piora dentro do bar, entre prédios altos: esta recusa vai acontecer com gente que
    está mesmo lá, e "não foi possível sinalizar" faria a pessoa achar que o app quebrou.
    """
    curador = await criar_usuario("C", "c.longe@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador)
    role = await criar_role(lugar, curador)

    resp = await client.post(
        "/api/v1/sinalizacoes",
        json={"role_id": str(role.id), "tipo": "presenca", **LONGE_DO_LUGAR},
        headers=auth_headers(curador),
    )
    assert resp.status_code == 403
    detalhe = resp.json()["detail"]
    # O `detail` é OBJETO, e isso é contrato — não conveniência. O cliente monta a
    # explicação a partir dos números; se ele tivesse que extraí-los da frase, bastaria
    # alguém reescrever a mensagem para a distância sumir da tela em silêncio. Foi o que
    # aconteceu até 02/09, com um `match()` no frontend.
    assert isinstance(detalhe, dict)
    assert isinstance(detalhe["distancia_m"], int)
    assert detalhe["raio_m"] == 150  # o padrão do config, já que o lugar não tem medida
    assert detalhe["distancia_m"] > detalhe["raio_m"]  # senão não teria sido recusado
    # A frase continua, para cliente que não conhece o formato (curl, um app futuro).
    assert "limite" in detalhe["mensagem"]


async def test_presenca_sem_coordenada_e_recusada(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """Sem permissão de localização, sem sinal (ADR-009, regra 4).

    Não existe "não consegui te localizar, marca assim mesmo": qualquer fallback reabre o
    buraco inteiro e o motor volta a não valer nada.
    """
    curador = await criar_usuario("C", "c.semgps@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador)
    role = await criar_role(lugar, curador)

    resp = await client.post(
        "/api/v1/sinalizacoes",
        json={"role_id": str(role.id), "tipo": "presenca"},
        headers=auth_headers(curador),
    )
    assert resp.status_code == 422


async def test_intencao_dispensa_gps_e_nao_acende_frescor(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """"Tô indo" é o oposto de presença: afirma que a pessoa NÃO está lá.

    Por isso dispensa GPS — e por isso não pode acender o frescor, que afirma "tem gente
    nesse lugar agora". Três pessoas dizendo que vêm não é um lugar cheio; é um lugar
    vazio com três pessoas a caminho. Contar isso como presença seria reconstruir, com
    nome novo, a incoerência que o ADR-009 desfez.
    """
    curador = await criar_usuario("C", "c.intencao@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador, bairro="Bairro da Intencao")
    role = await criar_role(lugar, curador)

    for i in range(3):
        quem = await criar_usuario(f"Vou {i}", f"vou{i}.intencao@exemplo.com")
        resp = await client.post(
            "/api/v1/sinalizacoes",
            json={"role_id": str(role.id), "tipo": "intencao"},
            headers=auth_headers(quem),
        )
        assert resp.status_code == 201

    detalhe = await client.get(f"/api/v1/roles/{role.id}")
    assert detalhe.status_code == 200
    # Três sinais seria "live" se fossem presença. Como são intenção, o rolê continua
    # apenas "new" (recém-criado) e o contador público segue zerado.
    assert detalhe.json()["frescor"] != "live"
    assert detalhe.json()["sinais_recentes"] == 0


async def test_intencao_vira_presenca_quando_a_pessoa_chega(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """O ciclo: quem disse que ia e chegou vira presença, na MESMA linha.

    É o refinamento que impede "Tô indo" de ser beco sem saída. A transição cai no
    caminho de renovação que `POST /sinalizacoes` já tinha — sem máquina de estados —, e
    o `timestamp` volta a valer a partir da chegada, que é quando o frescor deve começar
    a contar.
    """
    curador = await criar_usuario("C", "c.chegada@exemplo.com", papel=PapelUsuario.CURADOR)
    quem = await criar_usuario("Quem vai", "quemvai.chegada@exemplo.com")
    lugar = await criar_lugar(curador, bairro="Bairro da Chegada")
    role = await criar_role(lugar, curador)

    indo = await client.post(
        "/api/v1/sinalizacoes",
        json={"role_id": str(role.id), "tipo": "intencao"},
        headers=auth_headers(quem),
    )
    assert indo.status_code == 201
    assert (await client.get(f"/api/v1/roles/{role.id}")).json()["sinais_recentes"] == 0

    chegou = await client.post(
        "/api/v1/sinalizacoes",
        json={"role_id": str(role.id), "tipo": "presenca", **NO_LUGAR},
        headers=auth_headers(quem),
    )
    assert chegou.status_code == 201
    # Mesma linha: chegar não cria um segundo sinal, senão a pessoa contaria duas vezes.
    assert chegou.json()["id"] == indo.json()["id"]
    assert (await client.get(f"/api/v1/roles/{role.id}")).json()["sinais_recentes"] == 1


async def test_raio_do_role_ganha_do_lugar_que_ganha_do_padrao(
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """A cascata da emenda 1: rolê → lugar → padrão do config.

    Unitário de propósito: é regra de resolução, não de banco, e testá-la por HTTP
    esconderia qual degrau falhou.
    """
    curador = await criar_usuario("C", "c.raio@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador)
    role = await criar_role(lugar, curador)

    # Nenhum dos dois medido: cai no padrão.
    assert raio_efetivo(lugar, role) == get_settings().presenca_raio_padrao_metros

    # Medido no lugar pelo curador em campo: ganha do padrão.
    lugar.raio_metros = 80
    assert raio_efetivo(lugar, role) == 80

    # A exceção — a festa que transborda para a rua: ganha do lugar.
    role.raio_metros = 600
    assert raio_efetivo(lugar, role) == 600

    # Sem rolê (sinal direto no lugar), o lugar continua mandando.
    assert raio_efetivo(lugar) == 80


async def test_raio_do_lugar_muda_quem_e_aceito(
    client: AsyncClient,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
    db_session: object,
) -> None:
    """O raio medido em campo não é decoração: ele decide de verdade quem entra.

    Com o padrão de 150 m, um ponto a ~1,3 km é recusado. Abrindo o raio da casa para
    2 km — uma festa de rua, digamos — o mesmo ponto passa a ser aceito. Se este teste
    passar com a coluna ignorada, a emenda 1 do ADR-009 não existe na prática.
    """
    curador = await criar_usuario("C", "c.raioaceite@exemplo.com", papel=PapelUsuario.CURADOR)
    lugar = await criar_lugar(curador, bairro="Bairro do Raio")
    role = await criar_role(lugar, curador)
    corpo = {"role_id": str(role.id), "tipo": "presenca", **LONGE_DO_LUGAR}

    recusado = await client.post(
        "/api/v1/sinalizacoes", json=corpo, headers=auth_headers(curador)
    )
    assert recusado.status_code == 403

    lugar.raio_metros = 2000
    await db_session.flush()  # type: ignore[attr-defined]

    aceito = await client.post("/api/v1/sinalizacoes", json=corpo, headers=auth_headers(curador))
    assert aceito.status_code == 201
