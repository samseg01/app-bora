"""Guardar a foto que o curador tirou do lugar, em disco.

**Por que disco e não S3/R2.** O item 45 previa que armazenamento de objeto seria
inevitável, porque a maior parte dos PaaS tem disco efêmero. O ADR de raiz 0001 escolheu
VPS justamente para não precisar: o box tem 100 GB de NVMe e um volume nomeado no
`docker-compose.prod.yml`. Sair para S3/R2 continua sendo possível — é trocar
`salvar_foto()` por um cliente — e nada acima desta camada conhece o sistema de arquivos.

**O que esta camada garante, e por quê:**

- **O tipo é decidido pelos primeiros bytes, não pelo `Content-Type`.** O cabeçalho é
  escrito pelo cliente e não custa nada mentir nele. Quem decide é a assinatura do
  arquivo.
- **O nome é sorteado, nunca vem do cliente.** Nome de upload é a via clássica de
  travessia de diretório (`../../etc/...`) e de sobrescrever arquivo de outra pessoa. Aqui
  o nome é um UUID e a extensão vem do tipo detectado — nenhum byte do cliente entra no
  caminho.
- **O tamanho é conferido enquanto lê, não depois.** Ler primeiro para medir depois é
  aceitar o arquivo inteiro antes de recusá-lo, o que num box de 8 GB é um jeito barato de
  derrubar a API.
- **O arquivo só ganha o nome final depois de completo.** Grava em `.parcial` e renomeia —
  a mesma disciplina do `deploy/backup.sh`, e pelo mesmo motivo: um arquivo truncado com
  nome final parece bom até alguém abrir.
"""

import uuid
from pathlib import Path
from typing import BinaryIO, Protocol

from boraroles.config import get_settings


class TipoDeFotoInvalido(Exception):
    """Os bytes não são de um formato de imagem aceito."""


class FotoGrandeDemais(Exception):
    """O upload passou do limite enquanto era lido."""


class _Fonte(Protocol):
    """O suficiente de `UploadFile` para esta camada não depender do FastAPI."""

    async def read(self, size: int = -1) -> bytes: ...


# Assinaturas de arquivo. WebP é RIFF com "WEBP" no offset 8, por isso o par de fatias.
_ASSINATURAS: list[tuple[str, list[tuple[int, bytes]]]] = [
    ("jpg", [(0, b"\xff\xd8\xff")]),
    ("png", [(0, b"\x89PNG\r\n\x1a\n")]),
    ("webp", [(0, b"RIFF"), (8, b"WEBP")]),
]

# 12 bytes bastam para todas as assinaturas acima (WebP precisa do offset 8 + 4).
_BYTES_PARA_DECIDIR = 12

_TAMANHO_DO_BLOCO = 64 * 1024


def extensao_de(cabecalho: bytes) -> str | None:
    """A extensão que os bytes dizem ser, ou None se não for imagem que aceitamos."""
    for extensao, pedacos in _ASSINATURAS:
        if all(cabecalho[inicio : inicio + len(esperado)] == esperado for inicio, esperado in pedacos):
            return extensao
    return None


def diretorio_das_fotos() -> Path:
    return Path(get_settings().fotos_dir)


async def salvar_foto(fonte: _Fonte) -> str:
    """Grava a foto e devolve o **caminho público** dela (`/fotos/<nome>`).

    Devolve caminho relativo de propósito: front e back são a mesma origem em produção
    (ADR de raiz 0001), então guardar o domínio no banco só criaria dado para migrar no
    dia em que ele mudar.
    """
    limite = get_settings().foto_max_bytes

    cabecalho = await fonte.read(_BYTES_PARA_DECIDIR)
    extensao = extensao_de(cabecalho)
    if extensao is None:
        raise TipoDeFotoInvalido

    destino = diretorio_das_fotos()
    destino.mkdir(parents=True, exist_ok=True)

    nome = f"{uuid.uuid4().hex}.{extensao}"
    caminho = destino / nome
    parcial = destino / f"{nome}.parcial"

    escritos = 0
    try:
        with parcial.open("wb") as saida:
            escritos += _escrever(saida, cabecalho, escritos, limite)
            while bloco := await fonte.read(_TAMANHO_DO_BLOCO):
                escritos += _escrever(saida, bloco, escritos, limite)
    except BaseException:
        parcial.unlink(missing_ok=True)
        raise

    parcial.rename(caminho)
    return f"/fotos/{nome}"


def _escrever(saida: BinaryIO, bloco: bytes, ja_escritos: int, limite: int) -> int:
    if ja_escritos + len(bloco) > limite:
        raise FotoGrandeDemais
    saida.write(bloco)
    return len(bloco)
