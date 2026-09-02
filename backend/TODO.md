# TODO — backend

> `- [ ]` backlog · `- [~]` fazendo · `- [!]` bloqueado · `- [x]` feito
> Lido pelo app Kanban; o marcador é o que aparece na coluna.

**As tasks vivas do backend não estão aqui — estão no `TODO.md` da raiz**, que é um arquivo só
para o monorepo desde 28/08. Este arquivo é o registro do esqueleto inicial, mantido porque o
`CLAUDE.md` da raiz o cita como "esqueleto completo". Itens sem prefixo lá são de produto,
backend ou infra.

## Esqueleto inicial (concluído em 26/08)

Seguiu o plano em `C:\Users\User\.claude\plans\vamos-come-ar-a-fazer-eager-bonbon.md`.

- [x] 1. Bootstrap (uv, pyproject, Docker, .env.example, docs raiz)
- [x] 2. Modelo de dados + migration inicial
- [x] 3. Núcleo transversal (config, db/session, security, geo)
- [x] 4. Auth + rotas API v1
- [x] 5. Serviço de frescor
- [x] 6. Testes de integração + smoke E2E (28 testes à época, contra Postgres+PostGIS real)
- [x] 7. Docs: ADRs + CLAUDE.md final

`docker compose up -d` sobe api+postgres, aplica migrations automaticamente e responde em
`/health`; `uv run pytest`, `uv run ruff check .` e `uv run mypy src` rodam limpos.

**O que cresceu desde então** (verificado em 01/09 contra a árvore): 7 migrations
(`0001_initial_schema` a `0007_lugar_tags`), 27 rotas sob `/api/v1`, **49 testes**, 10 ADRs.
`seed.py` e `promote_role.py` em `scripts/`.

⚠️ **Gotcha ao rodar a suíte:** o serviço `api` do compose não tem bind mount — o código é assado
na imagem. `docker compose exec api uv run pytest` testa o código de quando a imagem foi
construída, não a árvore de trabalho. Rode `docker compose up -d --build api` depois de qualquer
edição em `backend/`. É o item 49 do `TODO.md` da raiz.

## As duas perguntas que este arquivo deixava em aberto — respondidas

- ~~**Endpoint/fluxo pra criar `Estabelecimento`**~~ — decidido pelo **ADR-010** (29/08): não
  existe autocadastro, e não vai existir. `Estabelecimento` é a conta comercial do dono, não a
  casa; quem vincula é o curador, em campo, num ato transacional. Falta escrever o script — é o
  **R9** do `TODO.md` da raiz.
- ~~**Bairro piloto**~~ — decidido em 27/08: **recorte República** (Largo do Arouche / Av. Vieira
  de Carvalho / Praça da República). É o **R1** da raiz.

## Fora de escopo por enquanto (decisão registrada, não esquecida)

- Frontend (Next.js) — plano separado.
- Fila/worker/Redis — ver ADR-004, só entra se leitura em tempo real virar problema medido.
- Ranking algorítmico em `/descoberta` — ver services/descoberta.py, hoje é curatorial + tiebreaker de frescor.
- Pruning automático de `sinalizacao` — tabela é pequena no piloto; deletar manualmente se crescer.
- Refresh token / 2FA — ver ADR-003, expiração longa é suficiente pro piloto.
