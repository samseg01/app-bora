# CLAUDE.md — frontend do bora-roles

Leia este arquivo e o `../TODO.md` da raiz no início de cada sessão de frontend — as tarefas
de todo o projeto vivem num arquivo só, e as das telas estão na seção **Frontend** (prefixo `F`). Antes de escrever a primeira
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

**Nunca desabilitar um CTA primário por regra de negócio.** Um botão cinza com a explicação em
letra miúda embaixo lê como app quebrado, não como decisão — e ainda provoca uma ação que não
existe. Quando o papel não permite (conta comum e `POST /sinalizacoes`, ADR-0006), a tela diz a
regra como regra e oferece a ação que a pessoa **tem**. `disabled` fica para estado transitório:
enviando, carregando, campo vazio.

**E a regra se explica pelo que a pessoa ganha, não pelo que o produto teme.** A primeira versão
desse texto dizia que o sinal "é a coisa mais frágil que o app tem" — verdadeiro, e conversa de
bastidor: quem está decidindo aonde ir não precisa saber onde o produto é vulnerável. O texto fala
de quem são os curadores e do que dá pra fazer agora. Vale para todo estado vazio e toda recusa: o
`conceito.md` justifica as decisões para nós, não para a tela.

**O pin do mapa abre um balão que leva à ficha da casa.** Popup do MapLibre com o nome e o rolê de
hoje (ou a categoria), o balão inteiro sendo âncora para `/lugar/{id}` — com `router.push` no clique
para navegação do cliente, mantendo o `<a>` de verdade para abrir em nova aba. Importa porque a home
e o detalhe do rolê não têm gaveta: sem o balão, o pin ali era um ponto colorido sem nome e sem
destino. O estilo está em `globals.css` (`.popup-bora`, `.balao-pin`) porque o popup do MapLibre
nasce branco e brigaria com o dark-matter. **O nome vem do banco e vira HTML — escapar sempre.**

**Funcionamento é estruturado, não texto.** `Lugar.horarios` é uma lista de faixas
(`{dias: [0..6], abre, fecha}`, 0 = domingo), editada por `components/ui/editor-horarios.tsx` —
botões de dia e `input type="time"`, que no telefone abre a roleta nativa. É lista porque
"ter a qui até 2h, sex e sáb até 4h" é o caso comum num bar.

O que a estrutura destrava e o texto não dava: **"aberta agora?"**. `lib/horarios.abertaAgora()`
responde, e cuida do caso que erra fácil — faixa que fecha antes de abrir atravessa a meia-noite,
e às 00h30 de sábado quem está aberto é a faixa de **sexta**. Errar isso faria o app dizer
"fechado" na hora em que o bar está cheio. O selo só aparece quando há horário cadastrado: sem
faixa não dá para afirmar "fechado" sem inventar.

**Categoria é do LUGAR, não do rolê.** Lista fechada em `lib/categorias.ts`; o formulário de rolê
não pergunta categoria e herda a do lugar escolhido (o seletor mostra `nome · categoria` para a
herança ficar visível). Antes os botões estavam no rolê e o lugar tinha texto livre, o que produzia
o que está no banco: Bar do China cadastrado como "forró" publicando rolê como "Bar". `Role.categoria`
segue existindo no schema e na API — só o formulário parou de perguntar.

**Tag é o que a casa TEM; categoria é o que ela É.** `lib/tags.ts` fecha o vocabulário (21 tags,
máximo 6 por lugar), pelo mesmo motivo de `categorias.ts`: sem normalização, "forró", "Forró" e
"forro" viram três tags. A coluna `lugar.tags` (migration 0007) é `ARRAY(String)` livre de
propósito — a lista cresce sem migration. **Só exibem, não filtram**: com dois lugares curados não
há o que filtrar, e quando houver o passo é um índice GIN na mesma coluna, sem mudar o dado.

A ordem da lista é deliberada, como a de categoria: preço e mesa na calçada vêm antes do gênero
musical, porque decidem mais — e uma lista que começa em "Forró" conta para quem cadastra que o app
é sobre programação, que é o topo da escada do `conceito.md` e não a base que ele quer atender.

`TagsLugar` **não renderiza nada** sem tag — nem rótulo, nem caixa vazia, mesma regra do frescor
`null`. E é **cinza, nunca branco**: no sistema monocromático branco quer dizer "está acontecendo
agora", e tag é permanente — tag branca faria a ficha de uma casa vazia parecer acesa. É a mesma
regra de antes, quando o proibido era magenta; o que mudou foi qual cor carrega o significado.

**Painel do curador — três etapas, nesta ordem: região → lugar → rolê.**
`components/ui/passos-curador.tsx` mostra a sequência nas duas visualizações. A ordem é dependência
real, não enfeite: um rolê acontece num lugar, e um lugar pertence a um recorte.

A etapa 1 tem o seletor de bairro porque a região do painel vinha em silêncio do cookie do app
público — de dentro do painel, "Publicar em República" parecia imutável, e trocar de recorte exigia
sair, ir à tela de leitura e voltar. É o **mesmo cookie** de propósito: são duas leituras do mesmo
"onde estou agora", e quem acabou de publicar quer conferir o resultado no app público, no mesmo
bairro.

A barra inferior não aparece aqui (`nav={false}`: painel é superfície de trabalho, não o app
público), então sem as etapas o cadastro de lugar ficava inalcançável no telefone — justamente onde
o curador está quando volta da rua.

### Localização

`lib/localizacao.ts` embrulha `navigator.geolocation` e traduz "onde estou" em "que recorte é
esse", consultando `GET /lugares/proximos`. Fica em `lib/` por ser regra de negócio e porque é
exatamente o que atravessa a migração para nativo do ADR-001 — lá o `navigator.geolocation` vira a
API do dispositivo e o resto não muda.

**A coordenada não é guardada.** Vai como parâmetro de consulta, responde e morre: sem cookie, sem
`localStorage`, sem coluna. Não introduzir cache dela sem decidir antes o que a tela diria sobre
isso.

Exige contexto seguro (HTTPS ou localhost) — em HTTP de rede local o `navigator.geolocation` nem
existe, e o código trata isso como `sem-suporte` em vez de erro genérico.

### PWA

`app/manifest.ts` + `public/icons/` + `public/sw.js` + `public/offline.html`.

**A regra do service worker: cacheia a casca, nunca o dado.** JS, CSS, fontes e ícones entram no
cache; resposta de API e página renderizada, não — o app responde "o que está rolando agora", e
servir de cache um rolê de ontem rotulado "bombando agora" é pior que não abrir. Navegação sem
rede cai em `/offline.html`, que não finge ter conteúdo. Não adicionar cache de dados aqui sem
resolver antes como a tela diria que aquilo é velho.

O SW só é registrado em produção (`components/ui/registrar-sw.tsx`): em dev ele interceptaria os
assets do Turbopack e transformaria hot reload em depuração de cache.

### Testar num celular de verdade (o R8)

O `next.config.ts` libera `*.trycloudflare.com` em `allowedDevOrigins` — sem isso o Next 16
recusa as requisições cross-origin ao servidor de dev e a página carrega só o HTML, parecendo
app quebrado. Com o dev no ar: `cloudflared tunnel --url http://localhost:3000` devolve uma URL
pública temporária.

**O que funciona por esse túnel:** home, mapa, detalhe, abertura — são server components, então
a busca à API acontece na máquina de desenvolvimento. **O que não funciona:** login, salvar,
sinalizar e os painéis, porque saem do navegador para `NEXT_PUBLIC_API_URL`, que aponta para
`localhost:8000` — no telefone, o próprio telefone.

#### O segundo túnel, para exercitar login/salvar/sinalizar

Verificado ponta a ponta em 29/08/2026 (signup 201, login 200 pelo telefone). São quatro passos, e
os dois últimos são onde se perde tempo:

1. `cloudflared tunnel --url http://localhost:8000` — o túnel da API.
2. `frontend/.env.local` com `NEXT_PUBLIC_API_URL=https://<tunel-api>/api/v1`. **O arquivo não
   existe no repositório** (só o `.env.local.example`), então sem criá-lo o `lib/api.ts` cai no
   default `http://localhost:8000/api/v1` e a chamada morre no próprio telefone. O `next dev`
   relê o arquivo sozinho — não precisa reiniciar.
3. `CORS_ORIGINS` no `backend/.env` recebe o domínio do **front** (não o da API), separado por
   vírgula. Sem isso o preflight volta `400 Disallowed CORS origin`, **sem** cabeçalho
   `access-control-allow-origin` — e o navegador só diz "erro de rede".
4. **`docker compose up -d api`, não `restart`.** `docker compose restart` **não relê o
   `env_file`**: o container sobe com o CORS antigo e o sintoma do passo 3 continua igual,
   apontando para o lugar errado. Só `up -d` recria o container.

Para conferir sem o telefone na mão, o preflight direto responde tudo:

```
curl -i -X OPTIONS "$API/api/v1/auth/signup" -H "Origin: $FRONT" \
  -H "Access-Control-Request-Method: POST" -H "Access-Control-Request-Headers: content-type"
```

As URLs são **públicas** enquanto os túneis viverem, e a da API aceita signup de qualquer um.
Fechar ao terminar — e **reverter o `.env.local` e o `CORS_ORIGINS`**, senão os dois arquivos
ficam apontando para túneis mortos e o app quebra em `localhost` sem dizer por quê.

Conta manual de teste: usar domínio `@local.dev`. Os fixtures da suíte usam e-mails fixos em
`@exemplo.com` e uma conta manual com esses e-mails faz o teste falhar por unicidade.

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

**A mesma regra tem um segundo motivo desde 28/08:** o destino declarado do produto é um app
nativo (ADR-001 em `docs/adr/`), e `lib/` é *exatamente o que sobrevive* a essa migração.
Regra de negócio dentro de `views/` é regra que será reescrita duas vezes. Corolário prático:
**nada de `localStorage`, `document.cookie` ou `window` fora de `lib/`** — hoje isso está
restrito a `lib/auth.ts` (token) e `lib/bairros.ts` (bairro), e são os dois únicos pontos que um
cliente nativo precisaria trocar.

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

**O sistema visual é o monocromático de 02/09/2026, não o hi-fi.** Os tokens vivem em
`app/globals.css` (`@theme`) e o cabeçalho de lá é a fonte da verdade — leia antes de mexer, porque
ele explica as três regras que sustentam o resto.

O hi-fi (`../docs/front-end-ideias/.../Rolês - Telas hi-fi.dc.html`, 8 telas `2a`–`2h`) **continua
valendo como registro do FLUXO** — quais telas existem, o que cada uma faz, quais variantes do
wireframe foram resolvidas (home = `1a` empilhado, detalhe = `1e` dois gestos). Como referência de
**estilo**, não vale mais: o quase-preto arroxeado, o Anton maiúsculo e as quatro cores saturadas
foram substituídos. Não "voltar ao design" copiando cor de lá.

### As três regras do sistema

1. **Os nomes dos tokens são de PAPEL, não de matiz.** `--color-agora`, nunca `--color-magenta`.
   O hue no nome foi o que travou a mudança anterior: 143 arquivos diziam "magenta" quando queriam
   dizer "agora", e não dava para trocar a cor sem reescrever o significado junto.
2. **O branco é o acento, e por isso é escasso.** O texto corrente é **cinza**
   (`--color-text-dim`, e é o que o `body` herda). Branco puro fica para título e para "agora" —
   27 e ~6 lugares. Branco em tudo é o mesmo erro que magenta em tudo, sem a cor.
3. **Não há card.** Conteúdo solto entre réguas de 1px, não em caixas com fundo e raio. É a
   diferença estrutural entre este sistema e os anteriores, e é ela que produz o "ar".

### Tokens (`app/globals.css`, em `@theme`)

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` / `--color-surface` / `--color-nav` | `#000000` | preto de verdade: em OLED apaga o pixel |
| `--color-sunken` | `#0a0a0a` | fundo de mapa, áreas rebaixadas |
| `--color-card` / `--color-card-alt` | `#0d0d0d` / `#0a0a0a` | **caso raro** — campo de formulário, chip ativo. Não usar para agrupar: agrupar é trabalho da régua |
| `--color-linha` / `--color-linha-forte` | `#1f1f1f` / `#333333` | **a régua** — o elemento estrutural, no lugar do card |
| `--color-text` | `#ffffff` | título e ênfase. Escasso |
| `--color-text-soft` / `--color-text-dim` | `#d4d4d4` / `#a3a3a3` | **`text-dim` é o texto corrente** |
| `--color-text-faint` / `--color-muted` | `#8a8a8a` / `#737373` | secundário e terciário |
| `--color-muted-2` / `--color-muted-3` | `#525252` / `#404040` | rótulos, desabilitado |
| `--color-agora` | `#ffffff` | **só o estado "agora"**, sempre com o pulso |
| `--color-pin-off` | `#737373` | pin de lugar curado sem frescor |
| `--color-pedra` / `--color-pedra-funda` | `#1a1a1a` / `#0a0a0a` | bloco no lugar de foto |

**Raios: nenhum.** Só `rounded-full` sobrevive, em ponto e pill. Se aparecer um `rounded-[10px]`
novo, é regressão ao sistema anterior.

**Tipografia: Inter, uma família só.** `--font-display` e `--font-sans` apontam para ela. Título usa
a utility `titulo` (peso 700, `letter-spacing: -0.03em`) — o tracking negativo é metade do efeito,
sem ele a Inter pesada fica larga e datada. **Nunca caixa alta em título:** o `uppercase` do Anton
era o grito do sistema antigo, e foi removido de 42 lugares.

Passaram pela escolha em 02/09 e saíram: Instrument Serif (serifa briga com a régua), Space Grotesk
e Archivo (personalidade a mais), Anton (o grito). A decisão foi tomada comparando as cinco no
telefone, não no nome.

Rótulo de seção (`rotulo`): `500 10px`, `letter-spacing: 2px`, caixa alta. O tracking largo voltou,
mas por outro motivo que no hi-fi — aqui é elemento suíço, e funciona porque quase tudo à volta é
cinza e sem ornamento.

### A armadilha que a varredura de classes não pega

**Cor fixa em hex dentro de JSX.** `stroke="#fff"`, `fill="#ff6fa0"` — não são classes Tailwind,
então nenhuma busca por `bg-magenta` os encontra. Em 02/09 sobreviveram **17 deles** à troca de
sistema, e o pior produziu um ✓ branco dentro de um círculo branco: um disco liso, que passou por
`lint`, `build` e pelos 56 testes e só apareceu num screenshot de telefone.

Todos viraram `currentColor`, que herda do elemento. **Se aparecer um `stroke="#..."` ou
`fill="#..."` novo, é regressão** — dê a cor pela classe do SVG (`className="text-bg"`), nunca pelo
atributo.

E a segunda metade da mesma armadilha: **trocar token mecanicamente propaga o significado errado.**
`text-magenta-soft` virou `text-agora-soft` em 34 lugares, e de repente link, aba ativa e coração
de salvar diziam "agora" — o erro do magenta com nome novo, no mesmo dia em que a regra contra ele
foi escrita. Daí `--color-selecao` existir separado, com a mesma cor: seleção e frescor são coisas
diferentes.

Conferência rápida de regressão: `grep -rn "\-agora" frontend/src --include=*.tsx --include=*.ts
| grep -v pulse-agora` deve devolver **6 linhas** — três em `lib/frescor.ts`, a legenda do mapa e a
barra de expiração do sinal.

### Detalhes que fazem a tela (fáceis de perder)

- **`@keyframes pulse-agora`** — `box-shadow` **branco** expandindo de 0 a 7px em 1.8s, infinito.
  Só no estado `live`. Sem cor no sistema, o pulso é o que sobrou de movimento, e é ele que faz o
  "agora" ser visto de longe.
- **`@media (prefers-reduced-motion:reduce){*{animation:none!important}}`** — manter. E note a
  consequência: para quem tem isso ligado, o "agora" perde o pulso e sobra só o branco. É o limite
  conhecido de um sistema que gasta movimento no lugar de cor.
- **Blocos de cinza no lugar de fotos** — propositais, não provisórios. O item 45 é que traz foto
  de verdade.

## Convenções

**Barra inferior (mobile):** o `<nav>` é filho direto da coluna flex do `MobileShell` e leva
`mt-auto sticky bottom-0`. Sem `mt-auto` ela para logo abaixo do conteúdo em vez de ir ao rodapé —
home e mapa escondem isso porque têm um filho `flex-1`, mas salvos, perfil e conexões deixavam a
barra flutuando no meio da tela. O padding de baixo soma `env(safe-area-inset-bottom)`: instalado
como PWA não há barra de navegador, e a barra de gestos do sistema fica em cima dos rótulos.

**Shell:** na visualização mobile, container `mx-auto w-full max-w-md` — ocupa a largura toda no
celular e vira coluna central em tablet. Na desktop, sidebar fixa de 15rem + área de conteúdo. Ver
"Partição mobile / desktop" acima.

**Ressalva de altura:** as duas camadas da home só convivem sem scroll por causa dos 740px da
artboard; num telefone real (~650px úteis) o mapa cai abaixo da dobra. Testar em device. Se não
couber, encolher o mini-mapa — **não** transformar em abas, porque a convivência vertical é a tese
da tela.

**Fuso:** o backend é UTC timezone-aware. Todo horário exibido ("termina 04h", "23h30", "12 min
atrás") formata em `America/Sao_Paulo` no cliente.

**Frescor → UI** (mapeamento único, em `lib/frescor.ts`). Reescrito em 02/09, e a mudança é de
sistema, não de cor: antes eram três cores saturadas competindo, e o resultado é que **nenhuma
significava nada** — a tela ficava colorida inteira e o olho não tinha para onde ir primeiro.

Agora **só `live` tem cor** (branco, o acento). Os outros dois se distinguem por **peso e forma**,
que é como hierarquia funciona quando não se pode gastar cor:

| `frescor` | Rótulo | Cor | Forma | Pulsa |
|---|---|---|---|---|
| `"live"` | "Bombando agora" | branco (`text-agora`) | ponto cheio | **sim** |
| `"warm"` | "Começando a encher" | `text-dim` | ponto cheio | não |
| `"new"` | "Novo por aqui" | `muted` | **anel vazado** | não |
| `null` | sem badge | — | — | — |

O anel vazado do `new` não é enfeite: ele diz "ainda não tem ninguém" **pela própria forma** — um
contorno sem preenchimento —, o que a cor sozinha nunca conseguiu dizer quando ciano parecia tão
vivo quanto magenta.

`null` é **ausência de badge**, não um badge cinza — não há sinal a exibir.

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
| `GET /salvos` | devolve `lugar` + `role_ativo` — uma chamada monta o caderninho |
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
- **A caixa de diagnóstico do mapa** (era âmbar; no sistema monocromático é cinza clara) aparece em dev enquanto ele não está pronto, quando
  houve erro, e — o caso que importa — quando a sonda vê o canvas fora de sincronia com o
  container. Um mapa "pronto" desenhando num canvas de 400x300 fora da vista é invisível na
  tela e custou três rodadas de depuração; agora ele se denuncia. Mapa saudável não mostra nada.
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
- **Nunca resolver "tem rolê hoje?" pelo `GET /mapa`.** Ele é filtrado por bairro, e telas que
  atravessam recortes — o caderninho é a óbvia — passam a afirmar "sem rolê hoje" para lugar de
  outro bairro. Quem responde isso é a rota do próprio recurso (`GET /salvos` já traz
  `role_ativo`).
- **O comentário da 2e é gravado no rolê, não no lugar** (`POST /comentarios` com `role_id`),
  mas aparece em `GET /lugares/{id}` — o backend junta os dois alvos. A tela `/role/[id]` lê
  `lugar.comentarios_recentes`, e é por isso que funciona. Não existe leitura de comentário
  por rolê.
- **`total_comentarios` é histórico total**, sem janela de tempo. O copy do design diz "4
  comentários na última hora" — usar "4 comentários".
- **Não há preço nem horário de funcionamento** — o `2d` e o `2g` pedem os dois e não há fonte.
  `Role.descricao` e `Lugar.endereco` já existem (migrations 0002 e 0003); `endereco` é nullable,
  então a tela precisa continuar tratando a ausência (`lugar.endereco ?? lugar.bairro`).
- **Nenhum estado vazio foi desenhado.** As 8 telas pressupõem a Vila Madalena cheia. Com o banco
  vazio — situação de hoje — não há design para seguir.
- **Não há seed no backend.** Popular dados exige criar usuário, promover a curador com
  `../backend/scripts/promote_role.py` e cadastrar lugares/rolês na mão pelo painel do curador.
  Enquanto isso, `lib/fixtures.ts` alimenta a tela **só** quando a API não responde e **só** fora de
  produção, com uma faixa cinza avisando. Quando o seed existir, apagar o arquivo — dois lugares
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
