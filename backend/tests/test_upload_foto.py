"""A foto do lugar, tirada pelo curador em campo (item 45).

O que estes testes protegem é menos "o upload funciona" e mais **as recusas**: o caminho
feliz quebra alto e na hora, e as recusas quebram calado. Um upload que aceita qualquer
byte, ou que deixa o cliente escolher o nome do arquivo, funciona perfeitamente até o dia
em que não funciona mais.
"""

from pathlib import Path

import pytest
from httpx import AsyncClient

from boraroles.config import get_settings
from boraroles.db.models import PapelUsuario
from tests.conftest import UsuarioFactory, auth_headers

# Menor JPEG e PNG que ainda têm assinatura válida. Não precisam ser imagens abríveis:
# o que está sob teste é a decisão pelos primeiros bytes, não decodificação.
JPEG = b"\xff\xd8\xff\xe0" + b"\x00" * 64
PNG = b"\x89PNG\r\n\x1a\n" + b"\x00" * 64
WEBP = b"RIFF" + b"\x00\x00\x00\x00" + b"WEBP" + b"\x00" * 64


@pytest.fixture
def fotos_em(tmp_path: Path) -> Path:
    """Aponta o diretório de fotos para um temporário do pytest.

    `get_settings` é `lru_cache`, então mexer no atributo da instância cacheada atinge o
    processo inteiro — por isso o valor original é devolvido no fim. Sem isso, um teste
    contaminaria a suíte com um diretório que já foi apagado.
    """
    settings = get_settings()
    original = settings.fotos_dir
    settings.fotos_dir = str(tmp_path)
    yield tmp_path
    settings.fotos_dir = original


async def test_curador_envia_foto_e_recebe_o_caminho(
    client: AsyncClient, criar_usuario: UsuarioFactory, fotos_em: Path
) -> None:
    curador = await criar_usuario("Curador Foto", "curador-foto@exemplo.com", papel=PapelUsuario.CURADOR)

    resp = await client.post(
        "/api/v1/curador/fotos",
        files={"arquivo": ("bar.jpg", JPEG, "image/jpeg")},
        headers=auth_headers(curador),
    )

    assert resp.status_code == 201
    url = resp.json()["url"]
    # Caminho relativo: front e back são a mesma origem (ADR de raiz 0001), e guardar
    # domínio no banco só criaria dado para migrar quando ele mudar.
    assert url.startswith("/fotos/")
    assert url.endswith(".jpg")

    gravado = fotos_em / Path(url).name
    assert gravado.read_bytes() == JPEG
    # Nada de `.parcial` sobrando: o arquivo só ganha o nome final depois de completo.
    assert list(fotos_em.glob("*.parcial")) == []


async def test_nome_do_arquivo_do_cliente_nao_vira_caminho_no_disco(
    client: AsyncClient, criar_usuario: UsuarioFactory, fotos_em: Path
) -> None:
    """Travessia de diretório é a falha clássica de upload, e é silenciosa: funciona.

    O cliente manda `../../etc/passwd` como nome; o servidor tem de ignorar o nome inteiro
    e sortear o seu. Se um dia alguém "melhorar" isto preservando o nome original, é aqui
    que vai estourar.
    """
    curador = await criar_usuario("Curador Path", "curador-path@exemplo.com", papel=PapelUsuario.CURADOR)

    resp = await client.post(
        "/api/v1/curador/fotos",
        files={"arquivo": ("../../etc/passwd.jpg", PNG, "image/png")},
        headers=auth_headers(curador),
    )

    assert resp.status_code == 201
    nome = Path(resp.json()["url"]).name
    assert "passwd" not in nome
    assert ".." not in nome
    # Um nome, no diretório certo, e é o único arquivo que existe.
    assert [p.name for p in fotos_em.iterdir()] == [nome]


async def test_content_type_mentiroso_nao_engana(
    client: AsyncClient, criar_usuario: UsuarioFactory, fotos_em: Path
) -> None:
    """`Content-Type` é escrito pelo cliente. Quem decide são os primeiros bytes."""
    curador = await criar_usuario("Curador Tipo", "curador-tipo@exemplo.com", papel=PapelUsuario.CURADOR)

    resp = await client.post(
        "/api/v1/curador/fotos",
        files={"arquivo": ("script.jpg", b"#!/bin/sh\nrm -rf /\n", "image/jpeg")},
        headers=auth_headers(curador),
    )

    assert resp.status_code == 415
    assert list(fotos_em.iterdir()) == []


async def test_foto_grande_demais_e_recusada_e_nao_deixa_lixo(
    client: AsyncClient, criar_usuario: UsuarioFactory, fotos_em: Path
) -> None:
    curador = await criar_usuario("Curador Peso", "curador-peso@exemplo.com", papel=PapelUsuario.CURADOR)
    settings = get_settings()
    original = settings.foto_max_bytes
    settings.foto_max_bytes = 1024
    try:
        resp = await client.post(
            "/api/v1/curador/fotos",
            files={"arquivo": ("enorme.png", PNG + b"\x00" * 4096, "image/png")},
            headers=auth_headers(curador),
        )
    finally:
        settings.foto_max_bytes = original

    assert resp.status_code == 413
    # O parcial é apagado: recusa não pode deixar arquivo meio escrito no disco.
    assert list(fotos_em.iterdir()) == []


async def test_webp_e_aceito(
    client: AsyncClient, criar_usuario: UsuarioFactory, fotos_em: Path
) -> None:
    """Câmera de Android moderno entrega WebP com frequência; recusá-lo seria recusar o
    formato mais comum do próprio aparelho que o curador tem na mão."""
    curador = await criar_usuario("Curador Webp", "curador-webp@exemplo.com", papel=PapelUsuario.CURADOR)

    resp = await client.post(
        "/api/v1/curador/fotos",
        files={"arquivo": ("foto.webp", WEBP, "image/webp")},
        headers=auth_headers(curador),
    )

    assert resp.status_code == 201
    assert resp.json()["url"].endswith(".webp")


async def test_usuario_comum_nao_envia_foto(
    client: AsyncClient, criar_usuario: UsuarioFactory, fotos_em: Path
) -> None:
    """A foto é a afirmação 'eu estive aqui e é assim que é' — a mesma que sustenta a
    curadoria. Não é conteúdo de usuário."""
    comum = await criar_usuario("Comum Foto", "comum-foto@exemplo.com")

    resp = await client.post(
        "/api/v1/curador/fotos",
        files={"arquivo": ("bar.jpg", JPEG, "image/jpeg")},
        headers=auth_headers(comum),
    )

    assert resp.status_code == 403
    assert list(fotos_em.iterdir()) == []


async def test_sem_token_nao_envia(client: AsyncClient, fotos_em: Path) -> None:
    resp = await client.post("/api/v1/curador/fotos", files={"arquivo": ("bar.jpg", JPEG, "image/jpeg")})
    assert resp.status_code == 401
