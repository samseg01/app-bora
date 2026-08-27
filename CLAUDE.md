# CLAUDE.md — bora-roles (visão geral do monorepo)

Leia este arquivo e `TODO.md` no início de cada sessão que toque mais de uma parte do projeto.
Para trabalho **dentro do backend**, leia `backend/CLAUDE.md` e `backend/TODO.md`; para trabalho
**dentro do frontend**, leia `frontend/CLAUDE.md`, `frontend/TODO.md` e `docs/plano-frontend.md`.
Esses arquivos são mais detalhados e têm precedência sobre este em qualquer conflito de escopo.
Este arquivo cobre o que amarra as partes: produto, arquitetura acordada e status geral.

## O que é o projeto

App de comunidade para descoberta de "rolês" (eventos/lugares) em SP — foco no que está
acontecendo **hoje, perto de você**, não em busca de lugares já conhecidos (isso o Google já faz).
Tese completa, motores de incentivo e monetização em `docs/conceito.md` — leitura obrigatória antes
de propor qualquer feature nova, porque a "regra de ouro" de lá (toda feature serve à descoberta do
desconhecido de hoje) é o filtro de escopo do produto inteiro.

## Estrutura do repositório

```
bora-roles/                          # repositório git único na raiz (backend + frontend + docs)
├── CLAUDE.md, TODO.md               # este arquivo — visão geral do monorepo
├── docs/
│   ├── conceito.md                  # tese de produto, motores de incentivo, monetização (118 linhas)
│   ├── arquitetura-backend-frontend.md  # arquitetura acordada (schema, stack, sequenciamento)
│   └── front-end-ideias/seguir-ideia-da-documenta-o/
│       ├── README.md                # handoff do Claude Design: "recriar pixel-perfect, não copiar
│       │                            # a estrutura interna do HTML"; manda ler o wireframe primeiro,
│       │                            # mas o hi-fi é mais recente e já decide as variantes dele
│       └── project/
│           ├── Rolês - Fluxo em wireframe.dc.html   # 12 telas em wireframe, variantes em aberto (ver abaixo)
│           ├── Rolês - Telas hi-fi.dc.html          # 8 telas hi-fi — decisões já tomadas, fonte principal
│           ├── Tela.dc.html         # canvas vazio (`<x-dc></x-dc>` sem conteúdo) — ignorar
│           ├── support.js           # runtime gerado do Claude Design (~69 KB), "do not edit" — ignorar
│           ├── .thumbnail           # artefato do bundle — ignorar
│           └── uploads/conceito-app-role.md, previa-tela.jsx.txt  # cópias de docs/conceito.md e
│                                     # mvp/preview-tela.jsx enviadas como contexto pro Claude Design —
│                                     # mesmo conteúdo, não ler de novo
├── mvp/
│   └── preview-tela.jsx             # mockup React solto, 282 linhas (rail de descoberta + mapa),
│                                     # ANTERIOR ao bundle de design acima; ver nota de escopo abaixo
├── backend/                         # FastAPI + Postgres/PostGIS — esqueleto completo e testado
│   ├── CLAUDE.md, TODO.md           # fonte da verdade pro backend — ler antes de mexer aqui
│   └── docs/adr/0001..0007-*.md     # decisões de design do backend, uma por arquivo
└── frontend/                        # Next 16 + React 19 + Tailwind v4 — Home implementada
    ├── CLAUDE.md, TODO.md           # convenções, partição, contratos da API, progresso
    └── src/
        ├── app/                     # layout, tokens, page.tsx (busca uma vez, alimenta as duas)
        ├── components/              # viewport.tsx (o corte) + ui/ compartilhado
        ├── views/mobile/            # composição de telefone
        ├── views/desktop/           # composição de tela grande
        └── lib/                     # api, types, frescor, tempo, fixtures — compartilhado
```

**Arquitetura do frontend: duas partições de visualização, um app.** Mesmas URLs e mesmos dados;
só a composição muda, cortada por CSS em `lg` (1024px). `lib/` e `components/ui/` são
compartilhados — se regra de negócio for parar dentro de `views/`, viram dois apps para manter em
sincronia. Detalhes e alternativas em `frontend/CLAUDE.md`.

**Nota sobre `mvp/preview-tela.jsx` vs. `docs/front-end-ideias/`:** são duas iterações de design
diferentes, não a mesma coisa duas vezes. O `.jsx` foi a primeira prévia do conceito de duas
camadas; o bundle em `front-end-ideias/` é um handoff posterior do Claude Design, mais completo, e é
o que a implementação do frontend real deve seguir. Também há uma ressalva de layout em
`arquitetura-backend-frontend.md`: no `.jsx`, a convivência vertical de descoberta+mapa só cabe sem
scroll por causa da altura artificial do frame de prévia (720px) — vale testar em device real antes
de assumir que funciona como desenhado.

**O que tem dentro dos dois `.dc.html` de design** (já lidos, não são só nomes de arquivo):

- **Wireframe** (`Rolês - Fluxo em wireframe.dc.html`, 12 telas com IDs `1a`–`1o`) explora
  **variantes alternativas ainda não decididas**, agrupadas em: (A) 4 layouts possíveis pra
  home — `1a` empilhado, `1b` gaveta (mapa sobe por gesto), `1c` baralho de rolês (um por vez),
  `1d` linha do tempo da noite; (B) 3 hipóteses pra distinguir "favoritar lugar" de "sinalizar
  rolê" (pergunta 4 em aberto do `conceito.md`) — `1e` dois gestos/dois lugares na tela, `1f` uma
  ação só contextual, `1g` sinalizar como ação principal e salvar como rodapé; (C) resto do fluxo —
  onboarding (`1h`), mapa em tela cheia (`1i`), salvos/"caderninho" (`1j`), confirmação de
  sinalização (`1k`), perfil (`1l`); (D) 3 estudos de copy pro "motivo pra ir" do card (`1m`
  factual, `1n` voz do curador, `1o` sinal social).
- **Hi-fi** (`Rolês - Telas hi-fi.dc.html`, 8 telas com IDs `2a`–`2h`) **já resolve** essas
  variantes: home segue `1a` (empilhado), detalhe do rolê segue `1e` (dois gestos). Fluxo
  completo: `2a` onboarding-bairro → `2b` onboarding-gostos → `2c` home (duas camadas) → `2d`
  detalhe do rolê → `2e` confirmação de sinalização → `2f` mapa em tela cheia → `2g` salvos →
  `2h` perfil. **Não há painel do curador nem painel do estabelecimento no design ainda** — só o
  app público.
- **Sistema visual do hi-fi** (útil pra reimplementar fiel): fundo quase-preto roxo (`#08060f`/
  `#0d0a18`), títulos em Anton condensado maiúsculo, corpo em Inter; **magenta `#ff3d81`** =
  estado "agora"/frescor, **âmbar `#ffb443`** = categoria, **ciano `#1fd0ff`** = "novo"; blocos de
  cor no lugar de fotos reais (fotos de campo entram depois, de propósito).

## Stack

| Camada | Tecnologia | Status |
|---|---|---|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (async) + asyncpg, Postgres + PostGIS (GeoAlchemy2), Alembic, JWT caseiro (PyJWT + pwdlib/argon2), uv + ruff + mypy + pytest | ✅ esqueleto completo, 28 testes |
| Frontend | Next.js + React + PWA — **decisão de stack, nada escrito ainda** | ❌ não iniciado |
| Infra | Docker Compose local (api + postgres/postgis); produção planejada: Railway/Fly.io/Render (backend) + Vercel (Next.js) | ⚠️ só local, nada de produção configurado |

## Modelo de dados (resumo — schema completo em `backend/src/boraroles/db/models.py`)

Eixo central do produto: separar **Lugar** (permanente) de **Rolê** (efêmero, expira). O estado
`live/warm/new` de um card nunca é uma coluna — é sempre **derivado na leitura** a partir do volume
e recência de `Sinalizacao` (ver ADR-0001 no backend). As 7 entidades: `Usuario` (papel: comum/
curador/dono_estabelecimento), `Estabelecimento` (plano: organico/destacado), `Lugar` (com
`Geometry(POINT, 4326)`), `Role` ("rolê" — tabela sem acento de propósito), `Sinalizacao`
(presenca/fila/lotado — o sinal de frescor), `Salvo` (curtir reenquadrado como "salvar pra si"),
`Comentario`.

## Superfície da API (backend, tudo sob `/api/v1`)

22 rotas, todas implementadas e cobertas por teste:

| Grupo | Rotas |
|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login` |
| Descoberta | `GET /descoberta`, `GET /roles/{id}` |
| Mapa | `GET /mapa`, `GET /lugares/{id}` |
| Contribuição | `POST/GET /salvos`, `DELETE /salvos/{lugar_id}`, `POST /sinalizacoes`, `POST /comentarios` |
| Curador (papel=curador) | CRUD completo de `/curador/lugares` e `/curador/roles` |
| Estabelecimento (dono) | `GET /{id}/lugares`, `GET /{id}/engajamento` — só leitura |

Mais `GET /health` fora do prefixo versionado.

## Status de implementação

| Área | Status | Nota |
|---|---|---|
| Backend: modelo de dados + migration inicial | ✅ | `backend/alembic/versions/0001_initial_schema.py`, escrita à mão |
| Backend: auth (signup/login JWT) | ✅ | ADR-0003 |
| Backend: API de leitura (`/descoberta`, `/mapa`) | ✅ | curatorial, sem ranking algorítmico (decisão registrada) |
| Backend: API de contribuição (salvar, sinalizar, comentar) | ✅ | sinalização restrita — ver ADR-0006/backend TODO |
| Backend: painel do curador (CRUD lugar/role) | ✅ | API pronta; UI não existe |
| Backend: painel do estabelecimento (leitura agregada) | ✅ | API pronta; UI não existe |
| Backend: serviço de frescor | ✅ | ADR-0001 — a aposta técnica central do produto |
| Backend: testes (28, contra Postgres/PostGIS real) + ruff/mypy | ✅ | exige Docker rodando; ver "Como rodar" |
| Código versionado em git | ✅ | repositório único na raiz; commit inicial `d44aa40`. Sem remote ainda |
| Backend: criação de `Estabelecimento` via API | ❌ | não existe endpoint — só leitura pro dono; hoje só dá pra inserir direto no banco |
| Frontend — plano de implementação | ✅ | `docs/plano-frontend.md` + `frontend/CLAUDE.md` + `frontend/TODO.md` |
| Frontend — scaffold, sistema visual e camada de dados | ✅ | Next 16.3.3 + React 19 + Tailwind v4; `npm run build` e `lint` limpos |
| Frontend — partição mobile/desktop | ✅ | mesmo app e mesmas URLs, composições separadas cortadas por CSS em `lg` |
| Frontend — `2c` home, `2d` detalhe, `2f` mapa, `2g` salvos, `2h` perfil | ✅ | 6 rotas, cada uma nas duas visualizações |
| Frontend — painel do curador (UI) | ⚠️ | tela pronta nas duas visualizações, **sem backend ligado** (precisa de login) |
| Frontend — onboarding (`2a`,`2b`), login, confirmação de sinal (`2e`) | ❌ | |
| Frontend — design de desktop | ✅ | 5 artboards em `docs/front-end-ideias/desktop/` |
| Frontend — painel do estabelecimento | ❌ | sem design e sem tela; só depois de haver comunidade |
| Bairro piloto | ✅ | **recorte República** (Arouche / Vieira de Carvalho / Pça. da República) — ver R1 no `TODO.md` |
| Roteiro até a primeira conversa com um estabelecimento | ⚠️ | **plano ativo** — 10 passos no topo do `TODO.md` (R1–R10) |
| Deploy de produção | ❌ | só `docker compose` local hoje |
| Cron de expiração de rolê / decaimento de sinalização | ❌ | previsto na arquitetura acordada, não construído — frescor hoje é 100% on-read |
| Social — aba de Conexões: UI | ⚠️ | telas prontas nas duas visualizações (`/conexoes`, `/conexoes/convite`), **nenhuma rota no backend** |
| Social — aba de Conexões: backend | ❌ | `Conexao`, check-in com escopo e salvos compartilhados — itens 27–30 do `TODO.md` |
| Fila/worker/Redis | ❌ | fora de escopo por decisão (ADR-0004) — só entra se leitura em tempo real virar problema medido |

## Como rodar

- **Backend:** `cd backend && cp .env.example .env && docker compose up -d` → API em
  `http://localhost:8000`, `/health` responde. O entrypoint roda `alembic upgrade head` antes do
  uvicorn. Testes: `docker compose exec api pytest` (ou `uv run pytest` com o Postgres do compose
  no ar — os testes batem em Postgres+PostGIS real, sem mock).
- **Atenção:** o daemon do Docker Desktop precisa estar ligado. Na última verificação ele estava
  parado, então nada do backend (incluindo os 28 testes) podia ser executado sem subir o Docker
  antes.
- **Frontend:** não existe ainda.

## Decisões de arquitetura (fora do backend)

- **Duas camadas na tela** (descoberta empurra no topo, mapa puxa embaixo) em vez de abrir no mapa
  — mapa é cruel com vazio e pressupõe intenção que quem "decide se sair" ainda não tem. Ver
  `docs/conceito.md`.
- **PWA em vez de app nativo** — descoberta espontânea não pode ter fricção de "baixar da loja".
- **Monetização por destaque verificado, não ranking pago** — no minuto em que o topo parece pago,
  a confiança (único ativo do app) morre. Destaque exige validação de curador em campo.
- **Ordem de construção deliberada**: manual antes de sistema, comunidade antes de painel do
  estabelecimento, um bairro antes de escala. Ver "Alerta pra perfil técnico" em `conceito.md` —
  o risco nomeado é construir cedo demais a coisa errada, bonita e escalável, que ninguém validou.
- **Painel do curador mora dentro do mesmo Next.js**, atrás de login por papel — não é produto
  separado (`docs/arquitetura-backend-frontend.md`).
- Decisões técnicas do backend (Postgres autogerenciado vs. Supabase, JWT caseiro vs. Auth
  gerenciado, RBAC por enum simples, etc.) estão nos ADRs em `backend/docs/adr/` — não duplicadas
  aqui.

**Onde a implementação divergiu da arquitetura acordada** (divergência consciente, registrada em
ADR, mas o doc de arquitetura não foi atualizado): `docs/arquitetura-backend-frontend.md` sugeria
"auth com solução pronta (Supabase Auth, Clerk ou JWT simples)" e um "cron simples pra expirar rolês
e decair sinalizações". O que foi construído: JWT caseiro (ADR-0003) e **nenhum cron** — expiração e
decaimento são consequência do cálculo on-read do frescor. Se o ADR e o doc de arquitetura se
contradisserem, o ADR ganha.

## Issues conhecidos / débitos

- **Sem remote.** O repositório existe só na máquina local — um HD ruim ainda leva tudo. Criar o
  remote (GitHub) e dar push é o passo que falta para o trabalho estar de fato salvo.
- **Sem fluxo de criação de `Estabelecimento`** — decisão de produto em aberto (curador cria? dono
  faz onboarding próprio?), não lacuna técnica a preencher às pressas. Ver `backend/CLAUDE.md`.
- **Nenhuma curadoria de campo feita ainda** — o bairro está escolhido (República), mas nenhum
  lugar foi visitado. `backend/seed/republica.json` está esperando; enquanto isso o app só tem
  dado fictício de Vila Madalena, que é fictício de propósito para não ser confundido com real.
- **Faltam onboarding, login e a confirmação de sinal (`2e`)** no frontend. Seguir o hi-fi
  (`Rolês - Telas hi-fi.dc.html`), não o wireframe, apesar de o `README.md` do bundle mandar ler o
  wireframe primeiro: o hi-fi é posterior e já resolve as variantes que o wireframe deixou
  abertas. Cruzamento tela-a-tela com a API em `docs/plano-frontend.md`; progresso em
  `frontend/TODO.md`.
- **O painel do curador é a superfície desktop-native do produto** — decisão tomada e desenhada.
  A tela existe nas duas visualizações, mas **não está ligada ao backend**: o CRUD de
  `/curador/*` exige token e papel `curador`, e o login ainda não existe no frontend. A nav dele
  aponta para `/curador/lugares` e `/curador/roles`, que ainda dão 404.
- **Telas com dado de exemplo, não real** — `/salvos`, `/perfil` e `/curador` dependem de
  autenticação e hoje rodam de `frontend/src/lib/fixtures.ts`. `/`, `/mapa` e `/role/[id]` usam a
  API pública de verdade, caindo em exemplo só quando o backend está fora do ar em dev.
- **O design pede coisas que o schema não tem**: `Role.descricao` (o "motivo pra ir", que o
  wireframe estudou em 3 telas), endereço do lugar, preço/couvert, horário de funcionamento. Ver a
  tabela de mudanças recomendadas em `docs/plano-frontend.md`.
- **Três contradições design ↔ backend ainda sem decisão**: o CTA "Tô indo" do detalhe dá 403 pro
  usuário comum (ADR-0006); a home mostra nome de quem sinalizou enquanto o detalhe promete
  anonimato; e não há tela de login/cadastro no design, embora salvar/sinalizar/comentar exijam
  token. Detalhadas em `docs/plano-frontend.md`.
- **Nenhum estado vazio foi desenhado** — as 8 telas hi-fi pressupõem a Vila Madalena cheia. Com o
  banco vazio (situação de hoje) não há design pra seguir.
- **Não há seed de desenvolvimento no backend** — popular dados exige criar usuário, promover a
  curador via `scripts/promote_role.py` e cadastrar lugares/rolês na mão pelo painel do curador.
- **Gotcha de enum no backend**: qualquer novo enum de coluna precisa passar por `_pg_enum()` em
  `db/models.py`, não por `sa.Enum(...)` direto — sem isso, o SQLAlchemy grava `.name` em vez de
  `.value` e quebra em runtime, não em teste de schema.
- **`jwt_secret` tem default fraco em `config.py`** (`"change-me-to-a-long-random-string"`) — ok
  em dev, mas precisa vir do ambiente antes de qualquer deploy.

## Mapa de arquivos-chave

- Tese de produto: `docs/conceito.md` (perguntas em aberto no fim do arquivo)
- Arquitetura acordada (schema, stack, sequenciamento): `docs/arquitetura-backend-frontend.md`
- **Plano do frontend** (as 8 telas hi-fi cruzadas com a API real, lacunas e ordem de
  construção): `docs/plano-frontend.md` — ler antes de escrever qualquer código de frontend
- **Plano da aba de Conexões** (check-in social, salvos dos amigos, e a colisão com a promessa de
  anonimato): `docs/plano-conexoes.md`; design em `docs/front-end-ideias/conexoes/`
- Design de desktop das telas do app: `docs/front-end-ideias/desktop/`
- Frontend — convenções, tokens e contratos da API: `frontend/CLAUDE.md`
- Frontend — as 37 tasks em 6 fases: `frontend/TODO.md`
- Design hi-fi do frontend: `docs/front-end-ideias/seguir-ideia-da-documenta-o/project/Rolês - Telas hi-fi.dc.html`
- Backend — árvore completa e ADRs: `backend/CLAUDE.md`
- Backend — como rodar: `backend/README.md`
- Schema real: `backend/src/boraroles/db/models.py`
- Motor de frescor: `backend/src/boraroles/services/frescor.py` (+ `services/descoberta.py`)
