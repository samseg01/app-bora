# CLAUDE.md — bora-roles (visão geral do monorepo)

Leia este arquivo e `TODO.md` no início de cada sessão que toque mais de uma parte do projeto.
Para trabalho **dentro do backend**, leia `backend/CLAUDE.md` e `backend/TODO.md`; para trabalho
**dentro do frontend**, leia `frontend/CLAUDE.md` e `docs/plano-frontend.md`. As tarefas de todo o
projeto ficam num `TODO.md` só, na raiz — a seção **Frontend** cobre as telas.
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
│   ├── conceito.md                  # tese de produto, motores de incentivo, monetização (135 linhas)
│   ├── arquitetura-backend-frontend.md  # arquitetura acordada (schema, stack, sequenciamento)
│   ├── plano-frontend.md            # as 8 telas hi-fi cruzadas com a API real
│   ├── plano-conexoes.md            # check-in social e a colisão com a promessa de anonimato
│   ├── features/                    # um .md por feature construída — obrigatório desde 01/09,
│   │                                # ver "Fluxo de trabalho"; não confundir com os ADRs
│   ├── front-end-ideias/desktop/    # 5 artboards da partição de tela grande
│   ├── front-end-ideias/conexoes/   # design da aba de Conexões (sem backend ainda)
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
│   ├── CLAUDE.md                    # fonte da verdade pro backend — ler antes de mexer aqui
│   ├── TODO.md                      # só o registro do esqueleto inicial; as tasks vivas do
│   │                                # backend estão no TODO.md da raiz
│   ├── alembic/versions/0001..0007  # migrations, escritas à mão (ver tabela de status)
│   ├── seed/                        # exemplo-ficticio.json (dev) + republica.json (campo)
│   └── docs/adr/0001..0010-*.md     # decisões de design do backend, uma por arquivo
└── frontend/                        # Next 16 + React 19 + Tailwind v4 — 14 rotas no ar
    ├── CLAUDE.md                    # convenções, partição, contratos da API
    │                                # (não há frontend/TODO.md: unificado na raiz em 28/08)
    ├── docs/adr/0001-pwa-agora-nativo-depois.md
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
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (async) + asyncpg, Postgres + PostGIS (GeoAlchemy2), Alembic, JWT caseiro (PyJWT + pwdlib/argon2), uv + ruff + mypy + pytest | ✅ esqueleto completo, **49 testes** |
| Frontend | Next 16.3.3 + React 19.2.8 + Tailwind v4 + MapLibre GL 5 (CARTO dark-matter, sem chave) + PWA instalável (manifest, ícones, service worker) | ✅ 14 rotas |
| Infra | Docker Compose local (api + postgres/postgis); produção planejada: Railway/Fly.io/Render (backend) + Vercel (Next.js) | ⚠️ só local, nada de produção configurado |

## Modelo de dados (resumo — schema completo em `backend/src/boraroles/db/models.py`)

Eixo central do produto: separar **Lugar** (permanente) de **Rolê** (efêmero, expira). O estado
`live/warm/new` de um card nunca é uma coluna — é sempre **derivado na leitura** a partir do volume
e recência de `Sinalizacao` (ver ADR-0001 no backend). As 7 entidades: `Usuario` (papel: comum/
curador/dono_estabelecimento), `Estabelecimento` (plano: organico/destacado), `Lugar` (com
`Geometry(POINT, 4326)`), `Role` ("rolê" — tabela sem acento de propósito), `Sinalizacao`
(presenca/fila/lotado — o sinal de frescor), `Salvo` (curtir reenquadrado como "salvar pra si"),
`Comentario`.

`Lugar` cresceu bastante desde a migration inicial e hoje carrega a ficha inteira: `endereco`
(0003), `descricao`/`instagram`/`preco_longneck`/`preco_visto_em` (0004), `programacao` (0005),
`horarios` — JSONB de faixas dia+hora, o que destravou "aberta agora" (0006) — e `tags` (0007).
`horario_funcionamento` (texto livre) sobrevive como legado que o 0006 substituiu; ver item 46.

## Superfície da API (backend, tudo sob `/api/v1`)

27 rotas, todas implementadas e cobertas por teste:

| Grupo | Rotas |
|---|---|
| Auth | `POST /auth/signup`, `POST /auth/login`, `GET /auth/me` |
| Descoberta | `GET /descoberta`, `GET /roles/{id}` |
| Mapa | `GET /mapa`, `GET /lugares/{id}`, `GET /lugares/proximos` |
| Contribuição | `POST/GET /salvos`, `DELETE /salvos/{lugar_id}`, `POST /sinalizacoes`, `GET /sinalizacoes/minhas`, `DELETE /sinalizacoes/{id}`, `POST /comentarios` |
| Curador (papel=curador) | CRUD completo de `/curador/lugares` (5) e `/curador/roles` (4) |
| Estabelecimento (dono) | `GET /meus`, `GET /{id}/lugares`, `GET /{id}/engajamento` — só leitura |

`GET /sinalizacoes/minhas` é o que faz o "Tá marcado" sobreviver a sair da tela e voltar; sem ele
o botão esquecia o próprio estado a cada navegação.

Mais `GET /health` fora do prefixo versionado.

## Status de implementação

| Área | Status | Nota |
|---|---|---|
| Backend: modelo de dados + 7 migrations | ✅ | todas escritas à mão, `0001_initial_schema` a `0007_lugar_tags` |
| Backend: auth (signup/login/me JWT) | ✅ | ADR-0003; `GET /auth/me` adicionado junto com o login do frontend |
| Backend: API de leitura (`/descoberta`, `/mapa`) | ✅ | curatorial, sem ranking algorítmico (decisão registrada) |
| Backend: API de contribuição (salvar, sinalizar, comentar, cancelar sinal) | ✅ | sinalização restrita (ADR-0006); `DELETE /sinalizacoes/{id}` adicionado |
| Backend: painel do curador (CRUD lugar/role) | ✅ | API e UI prontas, ligadas ao backend com token |
| Backend: painel do estabelecimento (leitura agregada) | ✅ | inclui `GET /estabelecimento/meus`, que diz ao cliente qual casa é dele |
| Frontend: painel do estabelecimento (`/estabelecimento`) | ✅ | terceira superfície do produto; sem design prévio — não havia no hi-fi |
| Backend: serviço de frescor | ✅ | ADR-0001; conta **pessoas distintas**, não linhas (ver issues) |
| Backend: testes (49, contra Postgres/PostGIS real) + ruff/mypy | ✅ | **verificado em 31/08: 49 passam, ruff e mypy limpos**; exige Docker — ver "Como rodar" |
| Código versionado em git | ✅ | repositório único na raiz, remote em `github.com/samseg01/app-bora` (privado) |
| Backend: vínculo de `Estabelecimento` | ⚠️ | decidido (ADR-010: curador vincula, sem endpoint isolado); falta o script — hoje só direto no banco |
| Frontend — plano de implementação | ✅ | `docs/plano-frontend.md` + `frontend/CLAUDE.md` + seção Frontend do `TODO.md` |
| Frontend — scaffold, sistema visual e camada de dados | ✅ | Next 16.3.3 + React 19 + Tailwind v4; `npm run build` e `lint` limpos |
| Frontend — partição mobile/desktop | ✅ | mesmo app e mesmas URLs, composições separadas cortadas por CSS em `lg` |
| Frontend — todas as telas do hi-fi menos o `2b` | ✅ | **14 rotas**, cada uma nas duas visualizações; `npm run build` e `lint` limpos em 31/08 |
| Frontend — painel do curador | ✅ | lista real, publica rolê e cadastra lugar — substitui a planilha |
| Frontend — salvar lugar | ✅ | coração no detalhe do rolê, com 409 tratado como sucesso |
| Frontend — sair da conta | ✅ | no perfil; JWT é sem estado, então sair é apagar o token local |
| Frontend — login e criar conta | ✅ | `/entrar` e `/criar-conta`, desenhados e implementados; sessão em `localStorage` |
| Frontend — abertura com escolha de bairro (`2a`) | ✅ | `/abertura` + seletor no cabeçalho da home |
| Frontend — sinalizar e confirmação (`2e`) | ✅ | curador sinaliza, comenta e cancela de verdade; papel comum vê o porquê |
| Frontend — salvos com dado real | ✅ | `GET /salvos` + N chamadas a `/lugares/{id}` (item 16 melhora isso) |
| Frontend — indicar um lugar | ✅ | link para WhatsApp/email do curador, sem backend por decisão |
| Frontend — onboarding de gostos (`2b`) | ❌ | segue sem uso funcional por decisão; o `2e` foi feito |
| Frontend — design de desktop | ✅ | 5 artboards em `docs/front-end-ideias/desktop/` |
| Frontend — ficha do lugar (`/lugar/[id]`) | ✅ | foto, descrição, programação, preço datado, Instagram, tags |
| Frontend — tags do lugar | ✅ | migration 0007; vocabulário em `lib/tags.ts`, editor no painel do curador |
| Backend — funcionamento estruturado (`Lugar.horarios`) | ✅ | faixas dia+hora; destrava "aberta agora" |
| Frontend — busca de bairro por localização | ✅ | `GET /lugares/proximos`; primeira consulta espacial do projeto |
| Frontend — PWA instalável (manifest, ícones, service worker) | ✅ | o SW cacheia a casca, nunca o dado |
| Bairro piloto | ✅ | **recorte República** (Arouche / Vieira de Carvalho / Pça. da República); Pinheiros como segundo recorte |
| Curadoria de campo no piloto | ⚠️ | **2 de 10–15 lugares** no banco (Bar do China, Tokyo); o resto é o R3, e é o gargalo |
| Roteiro até a primeira conversa com um estabelecimento | ⚠️ | **plano ativo** — 10 passos no topo do `TODO.md` (R1–R10) |
| Deploy de produção | ❌ | só `docker compose` local hoje |
| Cron de expiração de rolê / decaimento de sinalização | ❌ | previsto na arquitetura acordada, não construído — frescor hoje é 100% on-read |
| Social — aba de Conexões: UI | ⚠️ | design pronto, mas a rota mostra "em construção": sem backend não há o que exibir sem inventar |
| Social — aba de Conexões: backend | ❌ | `Conexao`, check-in com escopo e salvos compartilhados — itens 27–30 do `TODO.md` |
| Fila/worker/Redis | ❌ | fora de escopo por decisão (ADR-0004) — só entra se leitura em tempo real virar problema medido |

## Como rodar

- **Backend:** `cd backend && cp .env.example .env && docker compose up -d` → API em
  `http://localhost:8000`, `/health` responde. O entrypoint roda `alembic upgrade head` antes do
  uvicorn. Testes: `docker compose exec api uv run pytest` (ou `uv run pytest` com o Postgres do compose
  no ar — os testes batem em Postgres+PostGIS real, sem mock).
- **Atenção:** o daemon do Docker Desktop precisa estar ligado. Sem ele, nada do backend
  (incluindo os 49 testes) roda. Em 31/08 estava no ar e a suíte inteira foi executada.
- **Gotcha do `docker compose exec api`: o código é assado na imagem, não montado.** O serviço
  `api` do `docker-compose.yml` não tem bind mount — só o Postgres tem volume. Então
  `docker compose exec api uv run pytest` testa **o código de quando a imagem foi construída**,
  não a árvore de trabalho: em 31/08 o container estava de pé havia 22 horas e rodou a suíte
  contra código velho, alegremente verde. Depois de qualquer edição em `backend/`, rode
  `docker compose up -d --build api` antes de confiar no resultado. É o tipo de erro que não
  aparece: os testes passam, só que não são os seus.
- **Frontend:** `cd frontend && npm run dev` → `http://localhost:3000`.
- **Atenção nos testes:** a suíte roda contra o **mesmo banco** do desenvolvimento, e os
  fixtures usam e-mails fixos (`dono@exemplo.com` e afins). Uma conta de teste criada à mão
  com um desses e-mails faz o teste falhar por violação de unicidade — foi o que aconteceu ao
  criar o dono do Bar do China. Use domínio `@local.dev` para contas manuais.

## Fluxo de trabalho: branch de feature, e o regressivo como portão

**Regra, decidida em 01/09/2026: nenhum trabalho vai direto na `master`.** Toda mudança nasce
numa branch de feature, e só volta para a `master` depois de passar nos testes — em particular
no **regressivo**, que aqui significa a suíte inteira, não só o teste da coisa que você mexeu —
e, se for feature, de ter documentação em `docs/features/`.

Vale para código e para documento. Commit direto na `master` deixa de ser o normal do projeto
(os 16 primeiros commits foram assim; daqui pra frente, não).

### O ciclo

1. **Sair da `master` atualizada** e abrir a branch:
   `git switch master && git pull && git switch -c feat/nome-curto`
   Prefixos seguem os do commit: `feat/`, `fix/`, `docs/`, `refactor/`.
2. **Trabalhar e commitar na branch**, quantos commits fizerem sentido.
3. **Escrever a documentação da feature** em `docs/features/` (abaixo). Faz parte da branch, não
   é tarefa de depois — feature sem doc não merga.
4. **Rodar o portão inteiro** (abaixo). Vermelho não merga — nem "só o lint", nem "só um teste
   que já estava quebrado".
5. **Merge na `master`** com `--no-ff`, para o histórico mostrar que houve uma feature:
   `git switch master && git merge --no-ff feat/nome-curto`
6. **Push** da `master`, e apagar a branch (`git branch -d`).

### Toda feature precisa de documentação em `docs/`

**Regra, decidida em 01/09/2026: nenhuma feature merga sem um documento em `docs/features/`.**
Um arquivo por feature, `docs/features/<nome-curto>.md`, criado na mesma branch da feature.

**Não confundir com ADR, que já existe neste projeto e continua valendo.** São coisas diferentes,
e duplicar uma na outra é como isto apodrece:

| | O que registra | Onde mora |
|---|---|---|
| **ADR** | a **decisão** e por que ela venceu a alternativa | `backend/docs/adr/`, `frontend/docs/adr/` |
| **Doc de feature** | o que foi **construído** e como se comporta | `docs/features/` |

O doc de feature responde ao próximo que abrir o código sem ter estado aqui:

- **O que a feature faz**, em uma frase, do ponto de vista de quem usa o app.
- **Por onde ela passa** — rotas de API, telas, tabelas/migrations, serviços tocados. É o mapa
  que evita ter que caçar no `git log`.
- **Como verificar que está de pé** — o caminho manual, não só o nome dos testes.
- **O que ela deliberadamente não faz**, e por quê. Esta é a seção que mais economiza tempo
  depois: sem ela, todo limite vira suspeita de bug e alguém "conserta" uma decisão.
- **Link para o ADR**, quando a feature nasceu de uma decisão registrada.

Se a mudança não é feature — correção de bug, ajuste de texto, refatoração sem efeito visível —
não force um documento; o commit é o registro. A regra existe para o que muda o que o app faz.

### O portão — o que "passar no regressivo" quer dizer aqui

Não existe um alvo `npm test` nem um `make check` que rode tudo. O regressivo deste projeto,
hoje, são estes quatro comandos, e **todos os quatro** precisam estar verdes:

| Onde | Comando | O que cobre |
|---|---|---|
| backend | `docker compose up -d --build api` | **obrigatório antes de testar** — sem `--build` você testa a imagem velha |
| backend | `docker compose exec api uv run pytest` | **os 49 testes**, contra Postgres+PostGIS real |
| backend | `docker compose exec api uv run ruff check . && docker compose exec api uv run mypy src` | lint e tipos |
| frontend | `cd frontend && npm run build && npm run lint` | build de produção e lint |

Se a mudança foi só de documento (`.md`), o portão é dispensável — mas diga isso em voz alta ao
mergear, em vez de deixar subentendido.

### Onde este portão é frágil, e é bom saber

- **Ele é manual, e não há nada que o imponha.** Não existe CI (item 14 do `TODO.md`) nem
  proteção de branch no GitHub: a `master` aceita push direto hoje. A regra vale por disciplina,
  não por mecanismo — o que a torna exatamente o tipo de regra que se perde num dia corrido.
  **CI é o que transforma isto em portão de verdade**, e por isso o item 14 subiu de prioridade.
- **Ele depende do Docker Desktop ligado.** Com o daemon parado, nada do backend roda e o
  regressivo simplesmente não pode ser executado. Nesse caso o certo é **não mergear** e dizer
  que não foi verificado — não mergear alegando que "só mudou uma linha".
- **A suíte usa o mesmo banco do desenvolvimento** (ver "Como rodar"): um teste pode falhar por
  dado que você criou à mão, não por regressão. Ler a falha antes de culpar a branch.

## Decisões de arquitetura (fora do backend)

- **Duas camadas na tela** (descoberta empurra no topo, mapa puxa embaixo) em vez de abrir no mapa
  — mapa é cruel com vazio e pressupõe intenção que quem "decide se sair" ainda não tem. Ver
  `docs/conceito.md`.
- **O sinal de presença deve custar estar lá** (ADR-009 do backend, **proposto**). Hoje o botão
  diz intenção ("Tô indo") e o dado grava presença, e as duas só coincidem para quem sinaliza de
  dentro do lugar — origem da restrição do ADR-006. Verificar proximidade no servidor separa as
  duas ações e é o caminho para o frescor sair do "com cautela" do `conceito.md`.
- **PWA agora, nativo depois** — descoberta espontânea não pode ter fricção de "baixar da loja",
  e sem base instalada o link compartilhado *é* o canal de distribuição. Mas **nativo é o destino
  declarado**, não uma possibilidade remota: a decisão é de ordem, não de permanência. Gatilhos
  de reavaliação, caminho de migração (Capacitor vs. RN) e as três regras que mantêm o código
  portável estão em `frontend/docs/adr/0001-pwa-agora-nativo-depois.md`.
- **A oferta pode vir da casa; a curadoria é que é garantida** (ADR-008 do backend, **proposto**).
  Duas afirmações de fontes diferentes: "este lugar presta" é o curador que esteve lá, "hoje tem
  forró às 21h" é a casa. O app garante a primeira e **atribui** a segunda — sem fila de
  aprovação, que travaria um produto cuja tese é "hoje à noite".
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

- **Sem fluxo de vínculo de `Estabelecimento`** — a decisão saiu (ADR-010: o curador vincula em
  campo, num ato só; o dono cria a própria conta), falta o script. `Estabelecimento` não é a casa:
  é a conta comercial do dono, e a casa já entra como `Lugar`. Ver `backend/CLAUDE.md`.
- **A curadoria de campo mal começou: 2 lugares de 10–15.** O banco tem Bar do China e Tokyo em
  República, mais 5 lugares fictícios de Vila Madalena — fictícios de propósito, para não serem
  confundidos com real. `backend/seed/republica.json` ainda tem só o Bar do China, e sem bairro
  nem coordenada: quem entrou no banco entrou pelo painel do curador, não pelo seed. **Os dois
  estão fora de sincronia**, e o seed é que está atrás. É o R3, e segue sendo o gargalo.
- **Do hi-fi, só o `2b` (onboarding de gostos) não foi construído** — e por decisão, não por
  falta de tempo: chips de gosto sem uso funcional não filtram nada hoje. Onboarding de bairro
  (`2a`), login/cadastro e a confirmação de sinal (`2e`) estão no ar desde 29/08. Ao construir
  tela nova, seguir o hi-fi (`Rolês - Telas hi-fi.dc.html`), não o wireframe, apesar de o
  `README.md` do bundle mandar ler o wireframe primeiro: o hi-fi é posterior e já resolve as
  variantes que o wireframe deixou abertas. Cruzamento tela-a-tela com a API em
  `docs/plano-frontend.md`; progresso na seção Frontend do `TODO.md`.
- **O painel do curador é a superfície desktop-native do produto** — decisão tomada, desenhada e
  **ligada ao backend** desde que o login existe: publica rolê, cadastra e corrige lugar com token
  e papel `curador`. A nav tem duas rotas, `/curador` e `/curador/lugares`, e as duas existem —
  não há página `/curador/roles` (esse caminho é só chamada de API em `lib/api.ts`).
- **`fixtures.ts` é fallback de desenvolvimento, e só isso** — desde o R6, `/salvos`, `/perfil`,
  `/curador` e `/conexoes` mostram "precisa entrar" em build de produção; as fixtures só aparecem
  em dev. `/`, `/mapa`, `/role/[id]` e `/lugar/[id]` usam a API pública de verdade, caindo em
  exemplo só com o backend fora do ar em dev. Verificado contra o build de produção: zero
  vazamento de exemplo.
- **O schema alcançou o design.** O que faltava foi entrando: `Role.descricao` (0002),
  `Lugar.endereco` (0003), preço datado + descrição + Instagram (0004), `programacao` (0005),
  `horarios` estruturados (0006) e `tags` (0007). O que o design ainda pede e não existe é
  **foto de verdade** — `Lugar.fotos` guarda URL, mas não há armazenamento de arquivo em lugar
  nenhum do projeto (item 45, travado no R7).
- **As três contradições design ↔ backend foram decididas e implementadas** (item 4a do
  `TODO.md`): (i) o CTA "Tô indo" fica desabilitado com o motivo dito em voz alta, em vez de dar
  403 mudo (`components/ui/acao-sinalizar.tsx`); (ii) o card social cita comentário, não
  sinalização, então o anonimato do sinal não é quebrado na home; (iii) a auth é preguiçosa —
  entra-se quando a ação exige, não na porta. O enunciado original segue em
  `docs/plano-frontend.md`, que **não foi reescrito** e ainda descreve o estado antigo.
- **Nenhum estado vazio foi desenhado** — as 8 telas hi-fi pressupõem a Vila Madalena cheia. Com
  República tendo 2 lugares e poucos rolês, é exatamente o estado que a demo do R10 vai mostrar,
  e não há design pra seguir.
- **O seed existe (`scripts/seed.py`, idempotente por nome) mas nunca foi a via principal** — os
  lugares de República entraram pelo painel do curador, e `seed/republica.json` ficou para trás.
  Promover alguém a curador segue manual, por `scripts/promote_role.py` (ADR-0007).
- **Comentário aceita dois alvos e só um era lido.** `Comentario` guarda `lugar_id` ou
  `role_id`; a tela 2e grava com `role_id`, e as leituras filtravam só por `lugar_id` — o
  comentário existia no banco e nenhuma tela o mostrava. Corrigido com
  `services/lugares.comentarios_do_lugar()`. Toda leitura nova de comentário precisa passar
  por ele.
- **A localização do usuário não é guardada em lugar nenhum.** "Buscar pela minha localização"
  na abertura manda lat/lng como parâmetro de consulta para `GET /lugares/proximos`, recebe a
  resposta e esquece — sem cookie, sem `localStorage`, sem coluna, sem log no backend. Num app
  que promete anonimato no sinal de presença, pedir localização e guardá-la seria contradizer a
  promessa no primeiro toque. Ver `frontend/src/lib/localizacao.ts`.
- **"Hoje" é uma pergunta local, não UTC.** A janela de `/descoberta` é recortada em
  `settings.fuso_local` e convertida para UTC (`services/descoberta._dia_local`). Calculada em
  UTC, ela ia das 21h de ontem às 21h de hoje e escondia todo rolê que começasse às 21h.
- **Frescor conta gente, não toques.** `services/descoberta.py` usa
  `count(distinct usuario_id)` e `POST /sinalizacoes` renova o sinal da pessoa em vez de
  empilhar outra linha. Até 28/08 contava linhas: como `live` exige 3 sinais, uma pessoa
  sozinha tocando "Tô indo" três vezes acendia o "Bombando agora" — a promessa central do
  app forjável com um dedo. O smoke test da época fazia exatamente isso e passava, ou seja,
  documentava a falha. Qualquer contagem nova de sinal precisa decidir explicitamente se é
  de eventos ou de pessoas.
- **`services/engajamento.py` ainda conta linhas**, de propósito: o painel do dono rotula o
  número como "sinais de presença" (eventos, somados desde sempre), e a mesma pessoa voltando
  em noites diferentes é informação real para ele. Não confundir com a contagem de frescor.
- **Gotcha de enum no backend**: qualquer novo enum de coluna precisa passar por `_pg_enum()` em
  `db/models.py`, não por `sa.Enum(...)` direto — sem isso, o SQLAlchemy grava `.name` em vez de
  `.value` e quebra em runtime, não em teste de schema.
- **`jwt_secret` tem default fraco em `config.py`** (`"change-me-to-a-long-random-string"`) — ok
  em dev, mas precisa vir do ambiente antes de qualquer deploy.
- **O vocabulário de `categoria` não é imposto por nada.** A coluna é `String(60)` livre, e o
  banco já mostra a deriva: `"forró"` (Bar do China, que é gênero musical, não categoria) e
  `"Bar"` com maiúscula no Tokyo, contra `"bar"` minúsculo nos fictícios. A UI colore e filtra
  por categoria, então divergência de caixa vira card sem cor. Item 48 do `TODO.md`.
- **`docs/plano-frontend.md` e `docs/arquitetura-backend-frontend.md` estão datados.** Os dois
  descrevem o projeto antes das telas de auth, do painel do estabelecimento e das migrations
  0004–0007. Continuam valendo como registro do raciocínio e do cruzamento tela-a-tela; **não**
  como retrato do estado atual. Em conflito, mandam este arquivo e os ADRs.

## Mapa de arquivos-chave

- Tese de produto: `docs/conceito.md` (perguntas em aberto no fim do arquivo)
- Arquitetura acordada (schema, stack, sequenciamento): `docs/arquitetura-backend-frontend.md`
- **Plano do frontend** (as 8 telas hi-fi cruzadas com a API real, lacunas e ordem de
  construção): `docs/plano-frontend.md` — ler antes de escrever qualquer código de frontend,
  lembrando que ele descreve o projeto de antes das telas de auth (ver issues)
- **Plano da aba de Conexões** (check-in social, salvos dos amigos, e a colisão com a promessa de
  anonimato): `docs/plano-conexoes.md`; design em `docs/front-end-ideias/conexoes/`
- Design de desktop das telas do app: `docs/front-end-ideias/desktop/`
- Frontend — convenções, tokens e contratos da API: `frontend/CLAUDE.md`
- **Por que ainda não é nativo, e o que dispara a migração:**
  `frontend/docs/adr/0001-pwa-agora-nativo-depois.md`
- Frontend — as tasks das telas, em fases: seção **Frontend** do `TODO.md` (itens com prefixo `F`)
- Design hi-fi do frontend: `docs/front-end-ideias/seguir-ideia-da-documenta-o/project/Rolês - Telas hi-fi.dc.html`
- Backend — árvore completa e ADRs: `backend/CLAUDE.md`
- Backend — como rodar: `backend/README.md`
- Schema real: `backend/src/boraroles/db/models.py`
- Motor de frescor: `backend/src/boraroles/services/frescor.py` (+ `services/descoberta.py`)
- ADRs do backend, os 3 mais recentes e ainda **propostos**: `0008` (a casa publica, o app
  atribui), `0009` (sinal verificado por proximidade), `0010` (vínculo é ato de curadoria —
  este **aceito**) em `backend/docs/adr/`
- Vocabulário de tags e categorias do frontend: `frontend/src/lib/tags.ts` e `lib/categorias.ts`
- Horários estruturados (leitura de `Lugar.horarios`, "aberta agora"): `frontend/src/lib/horarios.ts`
