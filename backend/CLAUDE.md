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
│   │       ├── curador.py            # CRUD /curador/lugares, /curador/roles + POST /curador/fotos (papel=curador)
│   │       └── estabelecimento.py    # GET /meus (qual casa é minha), GET .../lugares, GET .../engajamento
│   └── services/
│       ├── frescor.py                # classificar_frescor() — a aposta técnica central (ADR-001)
│       ├── descoberta.py             # queries agregadas: listar_descoberta, frescor_de_role, frescor_de_lugar
│       │                             # conta PESSOAS (count distinct usuario_id), não linhas — ver nota abaixo
│       ├── fotos.py                  # grava a foto do curador em disco (item 45): assinatura dos bytes,
│       │                             # nome sorteado, teto conferido enquanto lê. Ver ../docs/features/foto-do-lugar.md
│       ├── lugares.py, roles.py      # serializadores ORM -> schema (evitam duplicar Geometry->lat/lng em 3 rotas)
│       │                             # lugares.comentarios_do_lugar(): comentários do lugar E dos rolês dele
│       └── engajamento.py            # agregação pro painel do estabelecimento
└── tests/
    ├── conftest.py                   # Postgres+PostGIS real via docker-compose local, sem mock; isolamento por
    │                                 # transação+savepoint revertida a cada teste (ver fixture db_session).
    │                                 # Lê a URL de settings.database_url, então o banco é escolhido
    │                                 # por DATABASE_URL: o regressivo aponta pra boraroles_test.
    │                                 # `pytest` na mão, sem sobrescrever, cai no banco do dev — e aí
    │                                 # conta manual com @exemplo.com colide (use @local.dev)
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
| [0008](docs/adr/0008-estabelecimento-publica-com-atribuicao.md) | **Proposto** — dono publica o próprio rolê, com atribuição em vez de fila de aprovação |
| [0009](docs/adr/0009-sinal-de-presenca-verificado-por-proximidade.md) | **Aceito 01/09** — sinalizar exige estar perto, verificado no servidor; separa "Tô aqui" de "Tô indo". Duas emendas: raio definido na criação do rolê (não constante global) e as duas ações são normativas |
| [0010](docs/adr/0010-vinculo-de-estabelecimento-e-ato-de-curadoria.md) | Vincular estabelecimento é ato de curadoria, num ato só — sem autocadastro do dono |
| [0011](docs/adr/0011-anonimato-tem-escopo.md) | **Aceito 01/09** — o anonimato tem escopo: público anônimo, chat identificado. Emenda ao item 23 |

## Status

| Etapa | Status |
|---|---|
| Bootstrap (uv, Docker, docs raiz) | ✅ |
| Modelo de dados + migration inicial | ✅ |
| Núcleo transversal (config, db/session, security, geo) | ✅ |
| Auth + rotas API v1 | ✅ |
| Serviço de frescor | ✅ |
| Testes de integração + smoke E2E (**63 testes**) | ✅ |
| Docs: ADRs + este arquivo | ✅ |
| `ruff check .` / `mypy src` | ✅ limpos |
| Frontend | ❌ fora de escopo desta rodada — ver `../docs/arquitetura-backend-frontend.md` |
| Vínculo de `Estabelecimento` | ⚠️ decidido (ADR-010: curador vincula, sem endpoint isolado); falta `scripts/vincular_estabelecimento.py` |

## Nota sobre a janela de "hoje"

`/descoberta` e `role_ativo_de_lugar` respondem sobre **hoje**, e "hoje" é uma pergunta local.
O banco é todo UTC e continua sendo; `services/descoberta._dia_local()` converte para
`settings.fuso_local` (`America/Sao_Paulo`), recorta o dia lá e devolve os limites em UTC.

Até 28/08/2026 era `agora.replace(hour=0, ...)` sobre um `datetime.now(UTC)`: o dia ia das 21h de
ontem às 21h de hoje, e **um rolê começando às 21h caía fora do limite superior e sumia da
descoberta** — o horário em que a noite começa, num app cuja tese é a noite de hoje.

Cuidado ao testar: o cálculo não pode depender do fuso do `datetime` recebido. Um teste que passa
`agora` já em horário de São Paulo acerta a meia-noite local por acidente e **passa mesmo com o
bug presente** — foi o que aconteceu na primeira tentativa. Testes deste recorte precisam passar
`agora` em UTC, como a rota faz. Ver `tests/test_janela_do_dia.py`.

`tzdata` é dependência declarada de propósito: `zoneinfo` lê a base do sistema operacional, que
imagens enxutas e Windows podem não ter, e a falta levanta `ZoneInfoNotFoundError` em runtime.

## Nota sobre a contagem de frescor

`services/descoberta.py` conta `count(distinct Sinalizacao.usuario_id)`, e
`POST /sinalizacoes` **renova** o sinal da pessoa naquele alvo em vez de inserir outra linha.
Até 28/08/2026 contava linhas: como `live` exige 3 sinais, uma pessoa sozinha tocando
"Tô indo" três vezes acendia o "Bombando agora". O smoke test fazia exatamente isso e
passava — documentava a falha em vez de pegá-la. `DELETE /sinalizacoes/{id}` também apaga os
outros sinais ativos da mesma pessoa no mesmo alvo, senão cancelar não cancelava nada.

`services/engajamento.py` continua contando linhas de propósito: o painel do dono fala de
eventos ("sinais de presença", somados desde sempre), não de pessoas únicas.

## Nota sobre as fotos

`POST /curador/fotos` recebe multipart e devolve `{"url": "/fotos/<uuid>.<ext>"}`. Ele **não
escreve no banco** de propósito: quem grava em `Lugar.fotos` é o `POST`/`PATCH /curador/lugares`,
para não existirem dois caminhos de escrita no mesmo campo.

O arquivo vai para `settings.fotos_dir` (`/dados/fotos`, volume nomeado nos dois composes) e é
servido por `StaticFiles` montado em `/fotos` no `main.py` — não pelo `file_server` do Caddy, que
faz só `reverse_proxy`. É paridade: o caminho resolve igual em dev, teste e produção.

Três coisas que parecem detalhe e são a feature: o tipo vem da **assinatura dos bytes** (o
`Content-Type` é escrito pelo cliente), o nome vem de `uuid4` (nome de upload é travessia de
diretório esperando acontecer) e o tamanho é conferido **enquanto lê** (medir depois é aceitar o
arquivo inteiro antes de recusá-lo). `tests/test_upload_foto.py` guarda as três.

⚠️ O `pg_dump` não cobre o volume. `deploy/backup.sh` arquiva as fotos à parte.

## Nota sobre comentários

`Comentario` aceita `lugar_id` **ou** `role_id`, e a tela 2e ("Contar como está lá dentro")
grava com `role_id`. Até 28/08/2026 as duas únicas leituras — `GET /lugares/{id}` e o
`total_comentarios` do `GET /mapa` — filtravam só por `lugar_id`, então todo comentário feito
pela 2e ficava gravado e **invisível em todas as telas**. Agora as duas usam
`services/lugares.comentarios_do_lugar()`, que junta os dois alvos. Qualquer leitura nova de
comentário precisa usar esse predicado, não `Comentario.lugar_id ==` direto.

## Rodar os testes

**O jeito certo é `..\scripts\regressivo.ps1`** (ou `scripts/regressivo.sh`), da raiz: ele
constrói a imagem antes, usa o banco `boraroles_test` e roda ruff, mypy e pytest de uma vez.
Ver `../docs/features/regressivo.md`.

Na mão é `docker compose exec api uv run pytest`, com duas armadilhas que já morderam:

- **Sem `docker compose up -d --build api` antes, você testa a imagem, não o disco.** O serviço
  `api` não tem bind mount; o código entra no `COPY . .` e congela. Em 31/08 a suíte passou verde
  contra código de 22 horas atrás. Para o dia a dia existe `docker-compose.dev.yml`, override
  opt-in que monta `./src` e `./tests` (verificado em 01/09).
- **Sem sobrescrever `DATABASE_URL`, a suíte roda no banco de desenvolvimento** e pode ficar
  vermelha por dado que você criou à mão.

Até agosto/2026 nem isso funcionava: `tests/` estava no `.dockerignore`, então a suíte nunca
entrava na imagem e o pytest respondia "no files were found in testpaths" — parecendo sucesso.
A linha foi removida.

## Vínculo de Estabelecimento — decidido no ADR-010, falta o script

`Estabelecimento` **não é a casa**: não tem geografia, bairro nem endereço. É a conta comercial do
dono (`dono_usuario_id` NOT NULL, `nome`, `plano`), e a casa entra no app como `Lugar`, curada a pé.
O app inteiro funciona sem ela — o que ela destrava é o painel do dono, o `plano` e (se o ADR-008 for
aceito) o direito de publicar rolê na própria casa.

Não há rota para criar um `Estabelecimento`, e **não deve haver uma isolada**: `Estabelecimento` não
tem FK para `Lugar` (o elo é `Lugar.estabelecimento_id`, nullable, do outro lado), então o banco
aceita um órfão sem lugar nenhum, e o painel responde `[]` e zeros. A cardinalidade "pelo menos um
lugar" não é expressável em FK — quem a garante é o ato ser único e transacional.

O ADR-010 decidiu: **o curador cria e vincula, num ato só; o dono cria a própria conta** por signup
normal. Falta implementar `scripts/vincular_estabelecimento.py`, no molde do `promote_role.py`.

Pra testar o painel manualmente enquanto isso, insira a linha direto no Postgres (ver o smoke test em
`tests/test_smoke_e2e.py` e `tests/test_estabelecimento_panel.py` usando a fixture
`criar_estabelecimento`, que insere via `db_session`).
