from httpx import AsyncClient

from boraroles.db.models import PapelUsuario
from tests.conftest import UsuarioFactory


async def test_signup_cria_usuario_comum(client: AsyncClient) -> None:
    resp = await client.post(
        "/api/v1/auth/signup",
        json={"nome": "Nova Pessoa", "email": "nova@exemplo.com", "senha": "senha12345"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["papel"] == PapelUsuario.COMUM.value
    assert "senha" not in body
    assert "senha_hash" not in body


async def test_signup_email_duplicado_409(client: AsyncClient, criar_usuario: UsuarioFactory) -> None:
    await criar_usuario("Alguém", "duplicado@exemplo.com")
    resp = await client.post(
        "/api/v1/auth/signup",
        json={"nome": "Outra Pessoa", "email": "duplicado@exemplo.com", "senha": "senha12345"},
    )
    assert resp.status_code == 409


async def test_login_sucesso(client: AsyncClient, criar_usuario: UsuarioFactory) -> None:
    await criar_usuario("Login Ok", "login-ok@exemplo.com", senha="minhasenha123")
    resp = await client.post(
        "/api/v1/auth/login", json={"email": "login-ok@exemplo.com", "senha": "minhasenha123"}
    )
    assert resp.status_code == 200
    assert resp.json()["token_type"] == "bearer"
    assert resp.json()["access_token"]


async def test_login_senha_errada_401(client: AsyncClient, criar_usuario: UsuarioFactory) -> None:
    await criar_usuario("Login Errado", "login-errado@exemplo.com", senha="senhacerta123")
    resp = await client.post(
        "/api/v1/auth/login", json={"email": "login-errado@exemplo.com", "senha": "senhaerrada"}
    )
    assert resp.status_code == 401
