from collections.abc import AsyncIterator, Callable, Coroutine
from datetime import UTC, datetime, timedelta
from typing import Any

import pytest
import pytest_asyncio
from alembic.config import Config
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from alembic import command
from boraroles.api.deps import get_db
from boraroles.config import get_settings
from boraroles.core.geo import point_from_latlng
from boraroles.core.security import create_access_token, hash_password
from boraroles.db.models import Estabelecimento, Lugar, PapelUsuario, Role, Usuario
from boraroles.main import app

settings = get_settings()


@pytest.fixture(scope="session", autouse=True)
def _apply_migrations() -> None:
    """Testes rodam contra um Postgres+PostGIS real (docker-compose), nunca mockado."""
    cfg = Config("alembic.ini")
    command.upgrade(cfg, "head")


@pytest_asyncio.fixture
async def db_session() -> AsyncIterator[AsyncSession]:
    """Cada teste roda numa transação (com savepoint) que é revertida no final —
    isolamento sem precisar truncar tabelas entre testes."""
    engine = create_async_engine(settings.database_url)
    async with engine.connect() as conn:
        trans = await conn.begin()
        session_maker = async_sessionmaker(
            bind=conn, expire_on_commit=False, join_transaction_mode="create_savepoint"
        )
        async with session_maker() as session:
            yield session
        await trans.rollback()
    await engine.dispose()


@pytest_asyncio.fixture
async def client(db_session: AsyncSession) -> AsyncIterator[AsyncClient]:
    async def _get_db_override() -> AsyncIterator[AsyncSession]:
        yield db_session

    app.dependency_overrides[get_db] = _get_db_override
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac
    app.dependency_overrides.clear()


UsuarioFactory = Callable[..., Coroutine[Any, Any, Usuario]]


@pytest_asyncio.fixture
async def criar_usuario(db_session: AsyncSession) -> UsuarioFactory:
    async def _criar(
        nome: str, email: str, papel: PapelUsuario = PapelUsuario.COMUM, senha: str = "senha12345"
    ) -> Usuario:
        usuario = Usuario(nome=nome, email=email, senha_hash=hash_password(senha), papel=papel)
        db_session.add(usuario)
        await db_session.flush()
        return usuario

    return _criar


LugarFactory = Callable[..., Coroutine[Any, Any, Lugar]]
RoleFactory = Callable[..., Coroutine[Any, Any, Role]]
EstabelecimentoFactory = Callable[..., Coroutine[Any, Any, Estabelecimento]]

# Coordenada padrão de `criar_lugar`. Desde o ADR-009, sinalizar presença exige dizer
# onde você está e o servidor confere — então todo teste que sinaliza precisa mandar um
# ponto dentro do raio. Espalhar os números pelos testes faria de cada um deles um teste
# de geografia por acidente; aqui eles têm nome.
NO_LUGAR = {"lat": -23.5475, "lng": -46.6906}
# ~1,3 km ao norte: fora de qualquer raio plausível de um bar.
LONGE_DO_LUGAR = {"lat": -23.5355, "lng": -46.6906}


@pytest_asyncio.fixture
async def criar_lugar(db_session: AsyncSession) -> LugarFactory:
    async def _criar(
        criado_por: Usuario,
        nome: str = "Lugar de Teste",
        categoria: str = "bar",
        bairro: str = "Vila Madalena",
        lat: float = -23.5475,
        lng: float = -46.6906,
        estabelecimento_id: Any = None,
    ) -> Lugar:
        lugar = Lugar(
            nome=nome,
            categoria=categoria,
            geo=point_from_latlng(lat, lng),
            bairro=bairro,
            estabelecimento_id=estabelecimento_id,
            criado_por=criado_por.id,
        )
        db_session.add(lugar)
        await db_session.flush()
        return lugar

    return _criar


@pytest_asyncio.fixture
async def criar_role(db_session: AsyncSession) -> RoleFactory:
    async def _criar(
        lugar: Lugar,
        criado_por: Usuario,
        titulo: str = "Rolê de Teste",
        categoria: str = "bar",
        data_inicio: datetime | None = None,
        data_fim: datetime | None = None,
    ) -> Role:
        agora = datetime.now(UTC)
        role = Role(
            lugar_id=lugar.id,
            titulo=titulo,
            categoria=categoria,
            data_inicio=data_inicio or agora,
            data_fim=data_fim or (agora + timedelta(hours=4)),
            criado_por=criado_por.id,
        )
        db_session.add(role)
        await db_session.flush()
        return role

    return _criar


@pytest_asyncio.fixture
async def criar_estabelecimento(db_session: AsyncSession) -> EstabelecimentoFactory:
    async def _criar(dono: Usuario, nome: str = "Estabelecimento de Teste") -> Estabelecimento:
        estabelecimento = Estabelecimento(dono_usuario_id=dono.id, nome=nome)
        db_session.add(estabelecimento)
        await db_session.flush()
        return estabelecimento

    return _criar


def token_for(usuario: Usuario) -> str:
    return create_access_token(usuario.id, usuario.papel)


def auth_headers(usuario: Usuario) -> dict[str, str]:
    return {"Authorization": f"Bearer {token_for(usuario)}"}
