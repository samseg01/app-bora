# TODO

Esqueleto do backend, seguindo o plano em `C:\Users\User\.claude\plans\vamos-come-ar-a-fazer-eager-bonbon.md`.

- [x] 1. Bootstrap (uv, pyproject, Docker, .env.example, docs raiz)
- [x] 2. Modelo de dados + migration inicial
- [x] 3. Núcleo transversal (config, db/session, security, geo)
- [x] 4. Auth + rotas API v1
- [x] 5. Serviço de frescor
- [x] 6. Testes de integração + smoke E2E (28 testes, contra Postgres+PostGIS real)
- [x] 7. Docs: ADRs + CLAUDE.md final

Esqueleto completo. `docker compose up -d` sobe api+postgres, aplica migrations automaticamente e
responde em `/health`; `uv run pytest`, `uv run ruff check .` e `uv run mypy src` rodam limpos.

## Próximos passos reais (não técnicos, de produto)

- **Endpoint/fluxo pra criar `Estabelecimento`** — não existe hoje (só leitura pro dono). Ver nota
  em `CLAUDE.md`. Provavelmente depende de decidir quem cadastra (curador? o próprio dono?).
- **Bairro piloto** — pergunta 1 do `../docs/conceito.md`, ainda em aberto; destrava testar o fluxo
  de curadoria de campo de verdade.

## Fora de escopo por enquanto (decisão registrada, não esquecida)

- Frontend (Next.js) — plano separado.
- Fila/worker/Redis — ver ADR-004, só entra se leitura em tempo real virar problema medido.
- Ranking algorítmico em `/descoberta` — ver services/descoberta.py, hoje é curatorial + tiebreaker de frescor.
- Pruning automático de `sinalizacao` — tabela é pequena no piloto; deletar manualmente se crescer.
- Refresh token / 2FA — ver ADR-003, expiração longa é suficiente pro piloto.
