# CLAUDE.md — backend do bora-roles

Leia este arquivo e `TODO.md` no início de cada sessão. Contexto de produto está em
`../docs/conceito.md`; arquitetura acordada em `../docs/arquitetura-backend-frontend.md`; plano de
implementação original do esqueleto em
`C:\Users\User\.claude\plans\vamos-come-ar-a-fazer-eager-bonbon.md`.

## Rodando

Ver `README.md`. Resumo: `cp .env.example .env && docker compose up -d`.

## Árvore de diretórios

```
backend/
├── CLAUDE.md, TODO.md, README.md
├── docs/adr/0001..0007-*.md          # decisões de design, uma por arquivo (ver seção ADRs abaixo)
├── pyproject.toml, uv.lock           # deps + ruff + mypy + pytest, gerenciado por uv
├── Dockerfile, docker-entrypoint.sh  # entrypoint roda alembic upgrade head, depois uvicorn
├── docker-compose.yml                # api + postgres(postgis) — sem redis/worker (ADR-004)
├── .env.example                      # DATABASE_URL, JWT_*, CORS_ORIGINS, FRESCOR_*
├── alembic.ini, alembic/
│   ├── env.py                        # lê DATABASE_URL de Settings, não do .ini; target_metadata = Base.metadata
│   └── versions/0001_initial_schema.py  # migration inicial ESCRITA À MÃO (ver ADR-002 + docstring do arquivo)
├── scripts/promote_role.py           # único jeito de promover usuário a curador/dono_estabelecimento (ADR-007)
├── src/boraroles/
│   ├── main.py                       # app factory (CORS + router + /health)
│   ├── config.py                     # Settings (pydantic-settings), lê .env
│   ├── db/
│   │   ├── base.py                   # DeclarativeBase
│   │   ├── session.py                # engine async + get_session (usado como api.deps.get_db)
│   │   └── models.py                 # as 7 entidades + 3 enums + _pg_enum() (ver nota abaixo)
│   ├── core/
│   │   ├── security.py               # hash de senha (pwdlib/argon2) + JWT (PyJWT) — ADR-003
│   │   └── geo.py                    # lat/lng <-> Point (Shapely + GeoAlchemy2)
│   ├── schemas/                      # DTOs Pydantic, um arquivo por recurso
│   ├── api/
│   │   ├── deps.py                   # get_db, get_current_user, require_role, require_estabelecimento_owner
│   │   └── v1/
│   │       ├── router.py             # agrega todos os sub-routers sob /api/v1
│   │       ├── auth.py               # POST /auth/signup, /auth/login
│   │       ├── descoberta.py         # GET /descoberta, GET /roles/{id}
│   │       ├── mapa.py                # GET /mapa, GET /lugares/{id}
│   │       ├── contribuicao.py       # /salvos, /sinalizacoes (restrito, ver ADR-006), /comentarios
│   │       │                          # + GET /sinalizacoes/minhas: sinais ativos do próprio usuário
│   │       ├── curador.py            # CRUD /curador/lugares, /curador/roles (papel=curador)
│   │       └── estabelecimento.py    # GET /meus (qual casa é minha), GET .../lugares, GET .../engajamento
│   └── services/
│       ├── frescor.py                # classificar_frescor() — a aposta técnica central (ADR-001)
│       ├── descoberta.py             # queries agregadas: listar_descoberta, frescor_de_role, frescor_de_lugar
│       │                             # conta PESSOAS (count distinct usuario_id), não linhas — ver nota abaixo
│       ├── lugares.py, roles.py      # serializadores ORM -> schema (evitam duplicar Geometry->lat/lng em 3 rotas)
│       │                             # lugares.comentarios_do_lugar(): comentários do lugar E dos rolês dele
│       └── engajamento.py            # agregação pro painel do estabelecimento
└── tests/
    ├── conftest.py                   # Postgres+PostGIS real via docker-compose local, sem mock; isolamento por
    │                                 # transação+savepoint revertida a cada teste (ver fixture db_session).
    │                                 # ATENÇÃO: é o MESMO banco do dev, e os fixtures usam e-mails
    │                                 # fixos — conta manual com @exemplo.com colide (use @local.dev)
    ├── test_security.py, test_geo.py, test_frescor.py   # unitários, sem banco
    └── test_auth_api.py, test_descoberta_api.py, test_mapa_api.py, test_curador_crud.py,
        test_estabelecimento_panel.py, test_smoke_e2e.py  # via httpx.AsyncClient + ASGITransport
```

**Nota sobre `_pg_enum()` em `db/models.py`:** sem `values_callable`, o SQLAlchemy grava o `.name`
do enum Python (`"COMUM"`) em vez do `.value` (`"comum"`), que é o que o tipo `ENUM` do Postgres
realmente tem — isso quebra em runtime, não em teste de schema. Todo novo enum de coluna precisa
passar por `_pg_enum()`, não por `sa.Enum(...)` direto.

## Decisões de design (ADRs)

| # | Decisão |
|---|---|
| [0001](docs/adr/0001-frescor-derivado-nao-armazenado.md) | Frescor é sempre calculado na leitura, nunca armazenado |
| [0002](docs/adr/0002-postgres-autogerenciado-postgis.md) | Postgres autogerenciado + PostGIS, não Supabase |
| [0003](docs/adr/0003-auth-jwt-caseira.md) | Auth JWT caseira (pwdlib + PyJWT), não Supabase Auth/Clerk |
| [0004](docs/adr/0004-sem-fila-worker-nesta-fase.md) | Sem fila/worker/Redis nesta fase |
| [0005](docs/adr/0005-uv-ruff-mypy-pytest.md) | uv + ruff (line-length 110) + mypy + pytest |
| [0006](docs/adr/0006-rbac-por-enum-simples.md) | RBAC por enum de 3 papéis fixos, sem tabela de permissões |
| [0007](docs/adr/0007-promocao-de-papel-manual.md) | Promoção de papel é sempre manual (script), nunca self-service |

## Status

| Etapa | Status |
|---|---|
| Bootstrap (uv, Docker, docs raiz) | ✅ |
| Modelo de dados + migration inicial | ✅ |
| Núcleo transversal (config, db/session, security, geo) | ✅ |
| Auth + rotas API v1 | ✅ |
| Serviço de frescor | ✅ |
| Testes de integração + smoke E2E (39 testes) | ✅ |
| Docs: ADRs + este arquivo | ✅ |
| `ruff check .` / `mypy src` | ✅ limpos |
| Frontend | ❌ fora de escopo desta rodada — ver `../docs/arquitetura-backend-frontend.md` |
| Criação de `Estabelecimento` via API | ❌ não existe endpoint ainda — hoje só é possível inserir direto no banco; ver `TODO.md` |

## Nota sobre a contagem de frescor

`services/descoberta.py` conta `count(distinct Sinalizacao.usuario_id)`, e
`POST /sinalizacoes` **renova** o sinal da pessoa naquele alvo em vez de inserir outra linha.
Até 28/08/2026 contava linhas: como `live` exige 3 sinais, uma pessoa sozinha tocando
"Tô indo" três vezes acendia o "Bombando agora". O smoke test fazia exatamente isso e
passava — documentava a falha em vez de pegá-la. `DELETE /sinalizacoes/{id}` também apaga os
outros sinais ativos da mesma pessoa no mesmo alvo, senão cancelar não cancelava nada.

`services/engajamento.py` continua contando linhas de propósito: o painel do dono fala de
eventos ("sinais de presença", somados desde sempre), não de pessoas únicas.

## Nota sobre comentários

`Comentario` aceita `lugar_id` **ou** `role_id`, e a tela 2e ("Contar como está lá dentro")
grava com `role_id`. Até 28/08/2026 as duas únicas leituras — `GET /lugares/{id}` e o
`total_comentarios` do `GET /mapa` — filtravam só por `lugar_id`, então todo comentário feito
pela 2e ficava gravado e **invisível em todas as telas**. Agora as duas usam
`services/lugares.comentarios_do_lugar()`, que junta os dois alvos. Qualquer leitura nova de
comentário precisa usar esse predicado, não `Comentario.lugar_id ==` direto.

## Rodar os testes

`docker compose exec api uv run pytest`. Até agosto/2026 isso não funcionava: `tests/` estava
no `.dockerignore`, então a suíte nunca entrava na imagem e o pytest respondia "no files were
found in testpaths" — parecendo sucesso. A linha foi removida.

## Gap conhecido: criação de Estabelecimento

Não há rota para criar um `Estabelecimento` — só rotas de leitura pro dono (`GET .../lugares`,
`GET .../engajamento`). Isso não estava no escopo de rotas do plano original. Pra testar o painel
manualmente, insira a linha direto no Postgres (ver o smoke test em `tests/test_smoke_e2e.py` e
`tests/test_estabelecimento_panel.py` pra ver os testes usando a fixture `criar_estabelecimento`,
que insere direto via `db_session`). Decidir o fluxo real (curador cria? Onboarding próprio?) é
trabalho de produto ainda em aberto, não uma lacuna técnica a preencher às pressas.
