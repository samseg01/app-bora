from datetime import UTC, datetime
from zoneinfo import ZoneInfo

from boraroles.db.models import PapelUsuario
from boraroles.services.descoberta import listar_descoberta, role_ativo_de_lugar
from tests.conftest import LugarFactory, RoleFactory, UsuarioFactory

SP = ZoneInfo("America/Sao_Paulo")


def em_utc(*args: int) -> datetime:
    """Um horário de São Paulo, entregue em UTC — como a rota realmente chama o serviço.

    Passar `agora` já no fuso local esconderia o bug: `.replace(hour=0)` sobre um
    datetime de São Paulo acerta a meia-noite local por acidente. Em produção o
    padrão é `datetime.now(UTC)`, e é esse o caminho que precisa estar certo.
    """
    return datetime(*args, tzinfo=SP).astimezone(UTC)  # type: ignore[arg-type]


async def test_role_das_21h_aparece_pra_quem_olha_as_20h(
    db_session,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """O momento de uso do produto inteiro: são 20h, você decide se sai, e quer ver o
    que começa às 21h.

    A janela de "hoje" era calculada sobre um datetime UTC, então o dia ia das 21h de
    ontem às 21h de hoje no fuso de São Paulo. Um rolê começando 21h fica exatamente no
    limite superior e some — e 21h é quando a noite começa.
    """
    curador = await criar_usuario(
        "Curador", "curador.janela21@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador, bairro="Bairro das 21h")
    role = await criar_role(
        lugar,
        curador,
        titulo="Show que começa às 21h",
        data_inicio=datetime(2026, 8, 28, 21, 0, tzinfo=SP),
        data_fim=datetime(2026, 8, 29, 2, 0, tzinfo=SP),
    )

    olhando_as_20h = em_utc(2026, 8, 28, 20, 0)
    itens = await listar_descoberta(db_session, "Bairro das 21h", agora=olhando_as_20h)

    assert [i.role.id for i in itens] == [role.id]


async def test_role_da_madrugada_conta_como_a_noite_de_hoje(
    db_session,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """Rolê que atravessa a meia-noite continua sendo o de hoje para quem já está na rua."""
    curador = await criar_usuario(
        "Curador", "curador.madrugada@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador, bairro="Bairro da Madrugada")
    role = await criar_role(
        lugar,
        curador,
        data_inicio=datetime(2026, 8, 28, 23, 0, tzinfo=SP),
        data_fim=datetime(2026, 8, 29, 4, 0, tzinfo=SP),
    )

    uma_da_manha = em_utc(2026, 8, 29, 1, 0)
    itens = await listar_descoberta(db_session, "Bairro da Madrugada", agora=uma_da_manha)
    assert [i.role.id for i in itens] == [role.id]

    ativo = await role_ativo_de_lugar(db_session, lugar.id, agora=uma_da_manha)
    assert ativo is not None and ativo.id == role.id


async def test_role_de_amanha_nao_aparece_hoje(
    db_session,
    criar_usuario: UsuarioFactory,
    criar_lugar: LugarFactory,
    criar_role: RoleFactory,
) -> None:
    """O limite superior tem de continuar existindo: /descoberta é sobre hoje."""
    curador = await criar_usuario(
        "Curador", "curador.amanha@exemplo.com", papel=PapelUsuario.CURADOR
    )
    lugar = await criar_lugar(curador, bairro="Bairro de Amanhã")
    await criar_role(
        lugar,
        curador,
        data_inicio=datetime(2026, 8, 29, 21, 0, tzinfo=SP),
        data_fim=datetime(2026, 8, 30, 2, 0, tzinfo=SP),
    )

    olhando_hoje = em_utc(2026, 8, 28, 20, 0)
    itens = await listar_descoberta(db_session, "Bairro de Amanhã", agora=olhando_hoje)
    assert itens == []
