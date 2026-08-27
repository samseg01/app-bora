# ADR-005 — uv + ruff + mypy + pytest

## Status

Aceito.

## Contexto

Convenção já usada no plano de arquitetura do `pass-core` (outro projeto do mesmo usuário) e
alinhada com a preferência já registrada de sempre isolar dependências em `.venv` por projeto,
nunca instalar globalmente.

## Decisão

- Gerenciador de pacotes/venv: `uv` (`pyproject.toml` + `uv.lock`).
- Lint: `ruff` (`line-length = 110` — ajustado de 100 depois de rodar contra o código real: strings
  e identificadores em português com acento naturalmente correm mais longos).
- Types: `mypy` com `disallow_untyped_defs = true`. `Lugar.geo` é a única exceção deliberada
  (tipado como `Any`; GeoAlchemy2 não tem um tipo estático único e correto pra escrita vs leitura).
- Testes: `pytest` + `pytest-asyncio` (modo `auto`) + `httpx` (`ASGITransport`, sem subir servidor
  de verdade nos testes).

## Consequências

`uv run pytest`, `uv run ruff check .` e `uv run mypy src` são os três comandos de verificação
locais; todos rodam limpos no HEAD deste esqueleto.
