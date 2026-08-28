# CLAUDE.md — frontend do bora-roles

Leia este arquivo e `TODO.md` no início de cada sessão de frontend. Antes de escrever a primeira
linha de código, leia também **`../docs/plano-frontend.md`** — é a especificação: traz o cruzamento
tela a tela do design com a API real, as lacunas de cada tela e as decisões pendentes. Este arquivo
é a referência de trabalho (o que já existe, convenções, contratos); o plano é o porquê.

Contexto de produto: `../docs/conceito.md`. Backend: `../backend/CLAUDE.md`.

## Status

**Seis rotas no ar, cada uma nas duas visualizações**, com `build` e `lint` limpos:

| Rota | Telas | Dado |
|---|---|---|
| `/` | home `2c` | API pública (`/descoberta` + `/mapa`) |
| `/mapa` | `2f` | API pública (`/mapa`) |
| `/role/[id]` | `2d` | API pública (`/roles/{id}` + `/lugares/{id}`) |
| `/salvos` | `2g` | só exemplo — `GET /salvos` exige token (fase 3) |
| `/perfil` | `2h` | só exemplo — idem |
| `/curador` | painel do curador | só exemplo — CRUD exige papel curador |
| `/conexoes` | aba de Conexões + estado vazio | só exemplo — **nenhuma rota existe no backend** |
| `/conexoes/convite` | convite por link | idem; o link fica pendente |
| `/entrar`, `/criar-conta` | login e cadastro | **API real** — cria conta, entra e guarda o token |
| `/estabelecimento` | painel do dono (sem design prévio) | **API real** — `/estabelecimento/meus` + `/engajamento` |

**Sessão:** token em `localStorage` (`lib/auth.ts`). O `papel` vem dentro do JWT e é lido sem
verificar assinatura — é só gating de UI, quem autoriza é o backend. As telas protegidas passam
por `components/ui/porta.tsx` — a prop `exige` (`"curador"` | `"dono_estabelecimento"`) pede também
o papel, e cada papel tem seu texto de recusa. Ela usa `useSyncExternalStore` porque ler `localStorage` durante o
render é impuro e num efeito com `setState` o React Compiler recusa.

Falta o passo 2 do onboarding (`2b`, gostos), adiado de propósito. O login e a confirmação de
sinalização (`2e`) já existem. Detalhe em `TODO.md`.

**Sinalizar de novo renova, não empilha**, e cancelar apaga todos os sinais ativos da pessoa
naquele rolê — foi o que fez o "Cancelar meu sinal" voltar a funcionar: ele apagava uma linha
e a tela recarregava e achava a seguinte.

**O "Tá marcado" é rehidratado do servidor**, não guardado em estado de componente: ao montar,
`components/ui/acao-sinalizar.tsx` chama `GET /sinalizacoes/minhas` e recupera o sinal ativo. Sem
isso, sair do detalhe e voltar oferecia "Tô indo" a quem já tinha marcado — dizendo que o sinal não
existe enquanto ele estava no banco alimentando o frescor.

Instalado: Next 16.3.3, React 19.2.8, Tailwind v4, TypeScript, ESLint, Turbopack. Node v24.14.1,
npm 11.11.0.

```
npm run dev     # http://localhost:3000
npm run build   # valida tipos e prerender
npm run lint
```

## Stack

Next.js 16 (App Router + Turbopack) + React 19 + TypeScript + Tailwind v4 + PWA. Tailwind v4
configura tema por `@theme` no CSS, **não** por `tailwind.config.js`.

### O que mudou no Next 16 e contraria o que se costuma assumir

O scaffold gera um `AGENTS.md` avisando que esta versão tem quebras em relação ao que os modelos
aprenderam, e ele é **reescrito a cada `next dev`** — commitar junto mantém a árvore limpa. Os
docs da versão instalada ficam em `node_modules/next/dist/docs/`; a lista de quebras está em
`02-guides/upgrading/version-16.md`. Duas que afetam este projeto:

- **`middleware.ts` foi deprecado e renomeado para `proxy.ts`** (função exportada `proxy`, runtime
  sempre Node, sem edge). Codemod: `npx @next/codemod@canary middleware-to-proxy .`
- **React 19.2 traz `<Activity mode="hidden">`**, que esconde UI mantendo estado e desmontando
  efeitos — o primitivo certo para a partição quando as visualizações virarem client-side.

Também: `params` e `searchParams` são Promises (Next 15+), e `LayoutProps<"/">` / `PageProps` são
tipos globais gerados — usar em vez de escrever a tipagem à mão.

## Partição mobile / desktop

**Mesmo app, mesmas URLs, mesmos dados — só a composição muda.** É a decisão central da arquitetura
do frontend, e substitui a estratégia anterior de shell único adaptando por breakpoint.

```
src/
├── app/page.tsx           # busca os dados UMA vez e entrega às duas visualizações
├── components/
│   ├── viewport.tsx       # <Mobile> e <Desktop> — o corte
│   ├── nav-items.tsx      # os 4 destinos e ícones, fonte única das duas navs
│   └── ui/                # compartilhado e agnóstico de visualização
└── views/
    ├── mobile/            # composição de telefone
    └── desktop/           # composição de tela grande
```

**A regra que mantém isso barato:** `lib/` e `components/ui/` são compartilhados; só `views/`
diverge. No minuto em que uma regra de negócio for parar dentro de `views/`, viram dois apps para
manter em sincronia — que é exatamente o custo que essa arquitetura precisa não pagar.

**Como o corte é feito:** por CSS, em `lg` (1024px). O servidor renderiza as duas árvores e o
breakpoint decide qual aparece. Custa DOM duplicado (verificado: exatamente 2× cada card, nada
além disso) e compra três coisas: nada de detecção de user-agent — que erra com tablet e com "modo
desktop" no celular —, nada de cache por variante, e a visualização acompanha o usuário
redimensionando a janela.

**Quando isso não bastar:** se o DOM duplicado virar custo medido, a saída é `proxy.ts` reescrevendo
por user-agent para `/m` e `/d` — e aí voltam cache por variante e erro de detecção. Não antecipar.
Se as visualizações virarem client-side com estado (mapa com pan e zoom), trocar `hidden` por
`<Activity mode="hidden">`. Route groups **não** resolvem isto: `(mobile)/page.tsx` e
`(desktop)/page.tsx` resolvem para a mesma URL e o build falha.

**O desktop tem design próprio** desde a sessão de agosto/2026:
`../docs/front-end-ideias/desktop/` — 5 artboards de 1440×900 (`Main` home, `Mapa`, `Role`,
`Salvos`, `Curador`), fonte editável em `.dc.html` mais o canvas publicado. Mesmo sistema visual
do hi-fi de telefone. O que muda em tela grande: a barra inferior vira coluna lateral; as duas
camadas deixam de ser empilhadas e passam a conviver lado a lado; e o card do rail vira linha
larga (`components/ui/role-row.tsx`), com espaço para o motivo pra ir.

## O design

Fonte única: `../docs/front-end-ideias/seguir-ideia-da-documenta-o/project/Rolês - Telas hi-fi.dc.html`
— 8 telas, IDs `2a` a `2h`. **Seguir o hi-fi, não o wireframe**, apesar de o `README.md` do bundle
mandar ler o wireframe primeiro: o hi-fi é posterior e já resolve as variantes que o wireframe
deixou em aberto (home = `1a` empilhado, detalhe = `1e` dois gestos).

Recriar o **resultado visual** pixel-perfect, sem copiar a estrutura interna do HTML do protótipo —
é protótipo de design, não código de produção.

**Não replicar** a moldura de telefone (`382px`, `border-radius:44px`), o notch preto, nem a barra
de status ("22:58 ▪▪▪ ⌁ ▮"). É cenografia da artboard, não interface.

### Tokens (para `app/globals.css`, em `@theme inline`)

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#08060f` | fundo da página |
| `--color-surface` | `#0d0a18` | fundo da tela |
| `--color-card` | `#181227` | cards do rail, itens de lista |
| `--color-card-alt` | `#171223` | blocos de conteúdo, chips inativos |
| `--color-sunken` | `#141024` | stats, fundo do mapa |
| `--color-nav` | `#0f0b1c` | barra de navegação inferior |
| `--color-magenta` | `#ff3d81` | estado "agora", CTA primário, aba ativa |
| `--color-magenta-soft` | `#ff6fa0` | links, ícones secundários |
| `--color-amber` | `#ffb443` | categoria, avisos "em breve" |
| `--color-cyan` | `#1fd0ff` | estado "novo" |
| `--color-violet` | `#7a1fff` | gradientes de bloco de foto |
| `--color-text` | `#f3eefc` | texto principal |
| `--color-text-soft` | `#e8dfff` / `#cfc6e2` / `#b4a9cc` | texto em superfície |
| `--color-muted` | `#9083ad` | secundário |
| `--color-muted-2` | `#8478a0` | terciário |
| `--color-muted-3` | `#6f6690` | rótulos, desabilitado |

Bordas: `1px solid rgba(255,255,255,.06–.09)` em cards; `1.5px solid #ff3d81` no item selecionado.
Raios: 44px moldura (não usar), 34px tela (não usar), 22px painéis, 18–20px cards, 16px botões,
20–24px pills.

Tipografia: **Anton** nos títulos (`font-display`, uppercase, `letter-spacing:-.3px` nos grandes),
**Inter** 400/500/600/700 no corpo (`font-sans`). Ambas via `next/font/google`.

Rótulos de seção: `600 10px`, `letter-spacing:1.6px`, `text-transform:uppercase`, cor `--color-muted-3`.

### Detalhes que fazem a tela (fáceis de perder)

- **`@keyframes pulse`** — `box-shadow` magenta expandindo de 0 a 9px em 1.8s, infinito. Só no
  estado `live`. Está no `<style>` do topo do hi-fi.
- **`@media (prefers-reduced-motion:reduce){*{animation:none!important}}`** — já vem no design.
  Manter.
- **O seam da home** entre as duas camadas: duas linhas de 1px com gradiente magenta→âmbar saindo
  dos lados e o rótulo "ou explore a região" no meio.
- **Blocos de cor no lugar de fotos** — gradientes de 135°, propositais. Fotos reais de campo
  entram muito depois.

## Convenções

**Shell:** na visualização mobile, container `mx-auto w-full max-w-md` — ocupa a largura toda no
celular e vira coluna central em tablet. Na desktop, sidebar fixa de 15rem + área de conteúdo. Ver
"Partição mobile / desktop" acima.

**Ressalva de altura:** as duas camadas da home só convivem sem scroll por causa dos 740px da
artboard; num telefone real (~650px úteis) o mapa cai abaixo da dobra. Testar em device. Se não
couber, encolher o mini-mapa — **não** transformar em abas, porque a convivência vertical é a tese
da tela.

**Fuso:** o backend é UTC timezone-aware. Todo horário exibido ("termina 04h", "23h30", "12 min
atrás") formata em `America/Sao_Paulo` no cliente.

**Frescor → UI** (mapeamento único, em `lib/frescor.ts`):

| `frescor` da API | Rótulo | Cor | Pulsa |
|---|---|---|---|
| `"live"` | "Bombando agora" | magenta | sim |
| `"warm"` | "Começando a encher" | âmbar | não |
| `"new"` | "Novo por aqui" | ciano | não |
| `null` | sem badge | — | — |

O design só desenhou `live` e `warm`; os outros dois seguem o sistema de cor já definido. `null` é
**ausência de badge**, não um badge cinza — não há sinal a exibir.

**Bairro:** em `localStorage`. Não existe endpoint de bairros nem campo de bairro no `Usuario`, e
não vale migration para um bairro só. O piloto ainda nem foi escolhido (`../TODO.md` item 1).

## API que o frontend consome

Base: `http://localhost:8000/api/v1`. O backend já libera `http://localhost:3000` em
`CORS_ORIGINS`. Subir com `cd ../backend && docker compose up -d` (precisa do Docker Desktop
ligado).

**Públicas, sem token** — cobrem a fase 1 inteira:

| Rota | Devolve |
|---|---|
| `GET /descoberta?bairro=X` | até 5 rolês: `id, titulo, categoria, data_inicio, data_fim, frescor, lugar_nome, lugar_bairro` |
| `GET /roles/{id}` | `id, lugar_id, titulo, categoria, data_inicio, data_fim, frescor, created_at` |
| `GET /mapa?bairro=X&bbox=minLng,minLat,maxLng,maxLat` | pins: `lugar{id,nome,categoria,lat,lng,bairro,fotos,...}, role_ativo{id,titulo,categoria,data_inicio,data_fim,frescor}\|null, total_comentarios` |
| `GET /lugares/{id}` | o lugar + `frescor` + `comentarios_recentes[{autor_nome,texto,created_at}]` (até 10) |

**Com token** (`Authorization: Bearer <jwt>`):

| Rota | Nota |
|---|---|
| `POST /auth/signup` → `UsuarioPublic` | cria sempre `papel=comum` |
| `POST /auth/login` → `{access_token}` | validade 30 dias |
| `GET /salvos` | ⚠️ devolve só `lugar_id` e `created_at` — sem nome/categoria |
| `POST /salvos {lugar_id}` / `DELETE /salvos/{lugar_id}` | 409 se já salvo |
| `POST /comentarios {lugar_id\|role_id, texto}` | qualquer usuário autenticado |
| `POST /sinalizacoes {role_id\|lugar_id, tipo}` | ⚠️ **403 para `papel=comum`** — só curador/dono (ADR-0006) |

`tipo` de sinalização: `"presenca"`, `"fila"`, `"lotado"`.

**O `papel` viaja dentro do JWT** (claim `papel`). Decodificar o payload client-side (sem verificar
assinatura — é só gating de UI, a autoridade é o backend) evita depender de um `GET /auth/me`, que
ainda não existe.

## Armadilhas conhecidas

- **`RoleDescoberta` traz `lugar_id` desde 28/08**, mas ainda não `lat`/`lng` — calcular distância
  "a pé" continua dependendo da mudança 19 do `../TODO.md`.
- **Um pin só quebrava o mapa.** `fitBounds` com bounds de área zero (um lugar, ou vários no
  mesmo ponto) resolve para zoom infinito / centro NaN: o MapLibre dispara `load`, se declara
  pronto e desenha nada. `MapaReal` detecta o caso e usa `setCenter` + zoom fixo. Importa
  porque **é o estado normal de um bairro piloto** — República começou com um lugar; a Vila
  Madalena fictícia, com seis, nunca expôs a falha.
- **A caixa âmbar de diagnóstico aparece SEMPRE em dev**, inclusive com o mapa pronto. Antes
  ela só aparecia com `!pronto`, e a falha acima era exatamente um mapa "pronto" e vazio — o
  sintoma apagava a própria pista. Ela mostra canvas, caixa, centro, zoom e estilo.
- **O container do MapLibre é dimensionado em pixels pelo ResizeObserver, não por CSS.**
  Duas tentativas por CSS falharam: `absolute inset-0` sozinho e depois `absolute inset-0
  h-full w-full`. A segunda é pior do que parece — `height:100%` num filho absoluto
  sobre-restringe a caixa (o `bottom:0` é ignorado) e resolve para 0 quando a altura do bloco
  contêiner não é definida, que é o caso de um item de flex. Medido em campo:
  `caixa 366x0` com a raiz visivelmente alta. O MapLibre não reclama — cai num fallback
  interno de 400x300, dispara `load` e desenha fora da vista. Não reintroduzir classe de
  altura nesse div.
- **O que é *meu* (salvos e sinais) vem de `lib/meus.ts`, não de `api.*` direto.** Cada botão
  buscando a própria lista viraria dez chamadas na home de desktop. Quem escreve chama
  `invalidarMeus()`.
- **`GET /salvos` é cru.** Montar a tela `2g` com a API atual custa uma chamada a `/lugares/{id}`
  por item salvo. Ver mudança 16 do `../TODO.md`.
- **O comentário da 2e é gravado no rolê, não no lugar** (`POST /comentarios` com `role_id`),
  mas aparece em `GET /lugares/{id}` — o backend junta os dois alvos. A tela `/role/[id]` lê
  `lugar.comentarios_recentes`, e é por isso que funciona. Não existe leitura de comentário
  por rolê.
- **`total_comentarios` é histórico total**, sem janela de tempo. O copy do design diz "4
  comentários na última hora" — usar "4 comentários".
- **`Role` não tem `descricao`, `Lugar` não tem `endereco`, não há preço nem horário de
  funcionamento.** Várias coisas do `2d` e do `2g` simplesmente não têm fonte de dado hoje.
- **Nenhum estado vazio foi desenhado.** As 8 telas pressupõem a Vila Madalena cheia. Com o banco
  vazio — situação de hoje — não há design para seguir.
- **Não há seed no backend.** Popular dados exige criar usuário, promover a curador com
  `../backend/scripts/promote_role.py` e cadastrar lugares/rolês na mão pelo painel do curador.
  Enquanto isso, `lib/fixtures.ts` alimenta a tela **só** quando a API não responde e **só** fora de
  produção, com uma faixa âmbar avisando. Quando o seed existir, apagar o arquivo — dois lugares
  inventando dado é um a mais.
- **Nunca engolir exceção de `fetch` em Server Component.** O Next sinaliza controle de fluxo por
  `throw` (rota dinâmica, `redirect()`, `notFound()`) e esses erros carregam `digest`. O
  `try/catch` de `lib/api.ts` os re-lança; capturá-los quebra o framework de forma silenciosa —
  custou um build vermelho com `DYNAMIC_SERVER_USAGE` disfarçado de "API inacessível".
- **Rotas que leem dado de agora precisam de `export const dynamic = "force-dynamic"`**, senão o
  build tenta pré-renderizar e falha ao alcançar a API.
- **Nunca ler o relógio dentro de um componente.** `Date.now()` no corpo de qualquer componente —
  inclusive o de uma página — é recusado pelo React Compiler (`react-hooks/purity`) e diverge na
  hidratação. Ler numa função fora do componente (o `carregar()` das páginas) e passar por prop;
  `lib/tempo.ts` já recebe `agora` por parâmetro pelo mesmo motivo.
- **`PageProps<"/rota">` só existe depois de um build.** O Next gera os tipos de rota em
  `next build`/`next dev`, então uma rota recém-criada faz `tsc --noEmit` falhar com
  `does not satisfy the constraint '"/"'` até rodar um dos dois. Não é erro de código.
