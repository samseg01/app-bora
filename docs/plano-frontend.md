# Plano do frontend — as 8 telas hi-fi contra o backend real

Cruzamento tela a tela do design `Rolês - Telas hi-fi.dc.html` (`2a`–`2h`) com o que a API já
entrega hoje. O objetivo é separar três coisas que costumam se misturar: **o que dá pra construir
agora sem tocar no backend**, **o que exige uma mudança pequena e óbvia na API**, e **o que o
design pede mas o produto ainda não decidiu**.

Fonte do design: o hi-fi, não o wireframe — o hi-fi é posterior e já resolve as variantes que o
wireframe deixou abertas (home = `1a` empilhado, detalhe = `1e` dois gestos). O `README.md` do
bundle manda ler o wireframe primeiro; ignorar essa instrução é deliberado.

## Resumo executivo

As duas telas que carregam a tese do produto — **home (`2c`) e mapa (`2f`)** — estão praticamente
100% cobertas pela API atual e podem ser construídas hoje, sem uma linha de Python. As telas de
contribuição (`2d`, `2e`, `2g`) esbarram em lacunas reais, e três delas são decisões de produto,
não de código.

Os quatro pontos que precisam de decisão antes de codar estão na seção
[Contradições e decisões pendentes](#contradições-e-decisões-pendentes). O mais grave: **o CTA
principal do detalhe do rolê ("Tô indo") retorna 403 para o usuário comum**, por decisão de
arquitetura (ADR-0006). O design não sabe disso.

---

## Tela a tela

Legenda: ✅ a API já entrega · ⚠️ dá pra derivar/contornar no cliente · ❌ não existe no backend

### `2a` — Onboarding, escolha do bairro

| Elemento do design | Situação | Como resolver |
|---|---|---|
| Lista de bairros (Vila Madalena ativa; Pinheiros e Baixo Augusta "em breve") | ❌ não há `GET /bairros`; `bairro` é string livre em `Lugar` | **Hardcode no frontend.** O piloto é um bairro só — essa é a decisão pendente do `TODO.md` item 2, não um endpoint faltando |
| "14 lugares curados · 3 rolês hoje" | ⚠️ derivável de `GET /mapa?bairro=X` (conta pins) e `GET /descoberta?bairro=X` (conta rolês) | Duas chamadas públicas, sem auth. Ou hardcode até ter dado real |
| Bairro escolhido persiste | ❌ `Usuario` não tem campo de bairro | `localStorage`. Não vale migration pra um bairro só |
| "Avisar quando abrir meu bairro" | ❌ sem tabela de leads | Fora do MVP — deixar como texto inerte ou remover |

**Veredito:** construível hoje, inteiramente client-side.

### `2b` — Onboarding, gostos

| Elemento do design | Situação | Como resolver |
|---|---|---|
| Chips de gosto (samba, house, sarau, boteco, rooftop…) | ❌ não existe no schema; `/descoberta` só aceita `bairro` | `localStorage`, sem uso funcional na v1 |
| "Serve pra ordenar a descoberta, não pra filtrar" | ❌ a ordenação de `/descoberta` é fixa: `sinais_recentes DESC, data_inicio ASC` | **Não implementar ordenação por gosto agora** |
| Card "Léo, curador da Vila valida cada rolê a pé" | ❌ estático | Texto fixo — é copy de posicionamento, não dado |

**Veredito:** construir a tela, salvar a escolha local, **não usar pra nada ainda**. Com 3–5 rolês
por noite num bairro, ordenar por gosto é ruído estatístico, e implementar ranking por preferência
contraria a decisão registrada de `/descoberta` ser curatorial e não algorítmico. A tela existe pra
firmar expectativa e capturar sinal pra depois. Registrar como débito explícito, não fingir que
funciona.

### `2c` — Home, duas camadas ⭐ tela principal

| Elemento do design | Situação | Fonte |
|---|---|---|
| "Hoje à noite · 3 achados" | ✅ | `length` de `GET /descoberta?bairro=X` |
| Título do card | ✅ | `titulo` |
| Categoria em âmbar | ✅ | `categoria` |
| Badge "Bombando agora" / "Começando a encher" | ✅ | `frescor` = `live` / `warm` |
| Mini-mapa com pins coloridos por frescor | ✅ | `GET /mapa?bairro=X` → `lat`, `lng`, `role_ativo.frescor` |
| Navegação card → detalhe | ✅ | `id` do rolê → `/role/{id}` |
| **"8 min a pé"** | ❌ | `RoleDescoberta` não traz `lat`/`lng` nem `lugar_id`; e exige geolocalização do browser |
| **Card social "Marina e mais 4 sinalizaram: fila andando rápido"** | ❌ | ver contradição do anonimato abaixo |
| "· house" (estilo musical) | ❌ | só existe `categoria`; não há campo de estilo |

**Sobre o badge de frescor:** o backend devolve quatro estados (`live`, `warm`, `new`, `null`) e o
design só desenhou dois. Preencher os que faltam com o sistema de cor já definido: `new` → ciano
`#1fd0ff` "Novo por aqui"; `null` → sem badge (card sem pill, não um badge cinza — ausência de
sinal não é um estado a exibir).

**Sobre o subtítulo do card:** trocar "8 min a pé · house" por `lugar_nome` — que a API já entrega
e é informação melhor pra quem está decidindo ("Bar Aurora" diz mais que "8 min"). A distância
entra quando houver geolocalização e `lat`/`lng` no payload.

**Sobre o mapa:** o design usa um mapa abstrato (grid + faixas em `skew`), não tiles reais. Manter
assim na v1 — projetar os `lat`/`lng` reais dos pins numa bbox do bairro sobre o fundo estilizado.
Zero dependência externa, zero API key, fiel ao design, e já exercita a geo de verdade. Tiles
(MapLibre/Leaflet) entram quando o mapa precisar de zoom e pan reais.

**Veredito:** construível hoje sem tocar no backend, com dois recortes de copy.

### `2d` — Detalhe do rolê

Esta é a tela com mais lacunas, e são lacunas de conceito, não de encanamento.

| Elemento do design | Situação | Observação |
|---|---|---|
| Título, categoria, "termina 04h" | ✅ | `GET /roles/{id}` → `titulo`, `categoria`, `data_fim` |
| Badge de frescor | ✅ | `frescor` |
| Bloco do lugar (nome) | ✅ | `lugar_id` → `GET /lugares/{id}` |
| Botão "salvar" | ✅ | `POST /salvos` — exige auth |
| **Descrição / "motivo pra ir"** ("Entrada livre até meia-noite. Set de house às 23h30") | ❌ | **`Role` não tem campo `descricao`** |
| **Endereço** ("Rua Aspicuelta, 340") | ❌ | `Lugar` tem `geo` e `bairro`, não endereço |
| **Card do curador** ("Fui ontem: fila curta…" — LÉO · CURADOR · VALIDOU EM CAMPO) | ❌ | não há como marcar um comentário como validação de campo, nem o payload expõe o papel do autor |
| **"6 sinalizaram nas últimas 2h"** | ❌ | a contagem existe dentro de `frescor_de_role()` mas **não é exposta** — só o rótulo sai |
| **"R$ 30 depois da meia-noite"** | ❌ | sem campo de preço/couvert |
| **CTA "Tô indo — vale por 2h"** | ⚠️ | `POST /sinalizacoes` **restrito a curador/dono** — 403 pro usuário comum |
| "compartilhar" | ⚠️ | Web Share API nativa, sem backend |

**A ausência de `descricao` é o gap mais importante do projeto inteiro.** O wireframe dedicou três
telas (`1m` factual, `1n` voz do curador, `1o` sinal social) só a estudar o copy do "motivo pra ir",
e o schema não tem onde guardar esse texto. Sem ele, o detalhe do rolê é título + horário — não
convence ninguém a sair de casa, que é literalmente a tese do produto.

**Detalhe que casa bem:** o copy "vale por 2h" corresponde exatamente a
`FRESCOR_WARM_WINDOW_MINUTES=120` do `.env`. O design e o backend concordam sem terem se falado.

### `2e` — Sinal enviado

| Elemento do design | Situação | Observação |
|---|---|---|
| Confirmação "Tá marcado" | ✅ | resposta de `POST /sinalizacoes` |
| Contador "expira em 1h 58min" + barra | ⚠️ | derivável: `timestamp` + 120min (janela warm). Cuidado: é uma **convenção de UI**, não um prazo que o backend garante — o frescor decai por contagem, não por expiração de registro |
| "Contar como está lá dentro" | ✅ | `POST /comentarios {role_id, texto}` — qualquer usuário autenticado |
| "Avisar meus amigos" | — | já marcado "fase 2" no próprio design |
| **"Cancelar meu sinal"** | ❌ | não existe `DELETE /sinalizacoes/{id}` |

**Veredito:** tela só alcançável por curador/dono enquanto o ADR-0006 valer.

### `2f` — Mapa em tela cheia

| Elemento do design | Situação | Fonte |
|---|---|---|
| Pins com cor por frescor | ✅ | `GET /mapa?bairro=X` |
| Recorte por área visível | ✅ | parâmetro `bbox=minLng,minLat,maxLng,maxLat` já implementado |
| Bottom sheet: nome, categoria, coração | ✅ | `MapaPin.lugar` |
| Último comentário com autor e hora | ✅ | `GET /lugares/{id}` → `comentarios_recentes[]` com `autor_nome` |
| CTA "Ver o rolê de hoje" | ✅ | `MapaPin.role_ativo.id` |
| "Rota" | ✅ | link externo pro Google Maps com `lat`/`lng` |
| Filtro "Salvos" | ⚠️ | cruzar `GET /salvos` com os pins, client-side |
| Filtro "Novo" | ✅ | `frescor === "new"` |
| **"4 comentários na última hora"** | ⚠️ | `total_comentarios` é **total histórico, sem janela** |
| **Filtro "Comentado agora"** | ❌ | mesma limitação: não há janela de tempo nos comentários |
| **Tooltip "fila andando · 12 min"** | ⚠️ | exige `GET /lugares/{id}` por pin (N+1) — `/mapa` não devolve o texto do último comentário |

**Recomendação de copy:** trocar "4 comentários na última hora" por "4 comentários". Mudar o copy é
mais barato e mais honesto que fazer o backend filtrar por janela agora.

### `2g` — Salvos, o caderninho

| Elemento do design | Situação | Observação |
|---|---|---|
| Lista de lugares salvos | ⚠️ | **`GET /salvos` devolve só `lugar_id` e `created_at`** — nome, categoria e bairro exigem N chamadas a `/lugares/{id}` |
| Badge "tem rolê" | ⚠️ | `role_ativo` só aparece em `/mapa`, não em `/lugares/{id}` — cruzar client-side |
| Banner "1 salvo virou rolê hoje" | ⚠️ | derivável do mesmo cruzamento |
| **Estados "aberto" / "fechado"** | ❌ | **não existe horário de funcionamento no schema** |
| **Filtro "Abertos agora"** | ❌ | mesma causa |
| **Filtro "Nunca fui"** | ❌ | exigiria histórico de presença do usuário; não há rota de sinalizações próprias |

**`GET /salvos` é o endpoint mais claramente subdimensionado da API.** É o único caso em que a tela
não consegue se virar com uma ou duas chamadas.

### `2h` — Perfil

| Elemento do design | Situação | Observação |
|---|---|---|
| "7 lugares salvos" | ✅ | `length` de `GET /salvos` |
| Bairro atual + "trocar" | ✅ | `localStorage`, mesma fonte do `2a` |
| Card "para donos de casa" | ⚠️ | não há fluxo de criação de `Estabelecimento` (`TODO.md` item 3) — link inerte por ora |
| **Nome do usuário e "desde agosto"** | ❌ | **não existe `GET /auth/me`** — `UsuarioPublic` só é devolvido no signup |
| **"3 rolês que você foi"** | ❌ | sem rota de sinalizações próprias |
| **Toggle "Meus sinais são anônimos"** | ⚠️ | não há campo — mas as sinalizações **já são anônimas de fato**: nenhum endpoint expõe o autor |

**Sobre o toggle:** transformar em **texto informativo**, não em controle. Um toggle que não desliga
nada é pior que nenhum toggle — promete controle que não existe. O texto honesto é: "Seus sinais são
anônimos. Ninguém vê seu nome."

**Nota boa:** o papel do usuário (`papel`) vai **dentro do JWT**, então o frontend consegue decodificar
o payload client-side e decidir se mostra o CTA de sinalizar, sem precisar de `/auth/me` pra isso.
O `/auth/me` continua necessário só pro nome e a data de cadastro.

---

## Contradições e decisões pendentes

Quatro pontos que precisam de decisão sua antes de a implementação avançar além da fase 1.

### 1. O anonimato se contradiz dentro do próprio design

A home (`2c`) mostra **"Marina e mais 4 sinalizaram: fila andando rápido"** — com nome próprio.
O detalhe (`2d`) promete **"Ninguém vê seu nome"**. O perfil (`2h`) tem um toggle
**"Meus sinais são anônimos"**. As três telas não podem estar certas ao mesmo tempo.

O backend já decidiu na prática: nenhum endpoint expõe o autor de uma `Sinalizacao`. Só
`Comentario` carrega `autor_nome`.

**Recomendação:** o card social da home vem de **comentários**, não de sinalizações — aí "Marina"
é autora de um comentário público, e o anonimato do sinal fica intacto. Reescrever o copy para algo
como *"Marina comentou: fila andando rápido no bar da esquina"*. Custo: uma chamada extra a
`/lugares/{id}` do lugar com mais comentários, ou um `GET /comentarios/recentes?bairro=X` novo.

### 2. O CTA principal do `2d` dá 403 para o usuário comum

`POST /sinalizacoes` exige papel `curador` ou `dono_estabelecimento` (ADR-0006, e o sequenciamento
da arquitetura acordada: "sinalização começa restrita a curadores/engajados" porque é o motor mais
frágil do conceito). O design coloca "Tô indo" como ação principal da tela, para qualquer um.

A decisão de restringir está certa e é deliberada. O que falta é decidir **o que o usuário comum vê
naquele espaço**. Três saídas:

- **(a)** Esconder o CTA e deixar "salvar" como ação principal — mais limpo, mas esvazia a tela.
- **(b)** Mostrar o CTA desabilitado com uma linha honesta ("Sinalizar ainda está com os curadores
  da Vila") — preserva o layout e comunica o estágio do produto. **Recomendo esta.**
- **(c)** Liberar sinalização pra todos e reverter o ADR-0006 — contraria a ordem de construção do
  conceito. Não recomendo agora.

### 3. Não existe tela de login nem de cadastro no design

O hi-fi vai do onboarding direto pra home. Mas `salvar`, `sinalizar` e `comentar` exigem Bearer
token. As telas `2g` (salvos) e `2h` (perfil) pressupõem um usuário logado que o fluxo nunca cria.

**Recomendação: auth preguiçosa.** A v1 é pública e read-only — descoberta, mapa e detalhe não
pedem token e funcionam para quem chega por link (o que é exatamente o argumento do PWA sobre não
ter fricção de loja). O login só aparece quando a pessoa tenta **salvar** pela primeira vez. Isso
exige desenhar duas telas simples que não existem no bundle, no mesmo sistema visual.

### 4. O "motivo pra ir" não tem onde morar no schema

Detalhado em `2d` acima. É a lacuna que mais compromete a tese do produto e a que eu resolveria
primeiro no backend.

---

## Mudanças recomendadas no backend, por custo/benefício

Nenhuma delas bloqueia a fase 1. Ordenadas por retorno.

| # | Mudança | Custo | Destrava |
|---|---|---|---|
| 1 | `Role.descricao` (texto, nullable) + expor em `RolePublic` + aceitar no CRUD do curador | migration + ~10 linhas | O "motivo pra ir" — o coração do `2d` |
| 2 | `GET /salvos` devolver `LugarPublic` + `role_ativo` em vez de só `lugar_id` | ~15 linhas | A tela `2g` inteira, sem N+1 |
| 3 | Expor `sinais_recentes` em `RolePublic` | ~5 linhas | "6 sinalizaram nas últimas 2h" (`2d`) |
| 4 | `GET /auth/me` | ~5 linhas | Nome e "desde agosto" no `2h` |
| 5 | `lugar_id`, `lat`, `lng` em `RoleDescoberta` | ~5 linhas | Distância "a pé" e navegação direta card → lugar |
| 6 | `DELETE /sinalizacoes/{id}` | ~10 linhas | "Cancelar meu sinal" (`2e`) |
| 7 | `Lugar.endereco` (nullable) | migration + ~5 linhas | Endereço no `2d` |

**Não construir agora** (o design pede, mas o produto não precisa): preferências de gosto no
backend, horário de funcionamento, histórico de "rolês que você foi", captura de "avisar quando
abrir meu bairro". Todos custam schema e nenhum é testável antes de existir curadoria de campo num
bairro real.

---

## Arquitetura do frontend

Stack já decidida (`docs/arquitetura-backend-frontend.md`): Next.js App Router + React +
TypeScript + Tailwind, PWA. Nada disso existe ainda — começar pelo scaffold.

```
frontend/src/
├── app/
│   ├── layout.tsx              # Anton + Inter via next/font, metadata, manifest
│   ├── globals.css             # tokens do sistema visual em @theme inline (Tailwind v4)
│   ├── page.tsx                # 2c — home
│   ├── onboarding/page.tsx     # 2a + 2b (dois passos, um arquivo com estado local)
│   ├── role/[id]/page.tsx      # 2d + 2e (confirmação como estado, não rota nova)
│   ├── mapa/page.tsx           # 2f
│   ├── salvos/page.tsx         # 2g
│   └── perfil/page.tsx         # 2h
├── components/
│   ├── BottomNav.tsx           # aparece em 2c, 2e, 2f, 2g, 2h — não no 2d nem no onboarding
│   ├── FrescorPill.tsx         # o badge live/warm/new — usado em 4 telas, com o pulse do magenta
│   ├── RoleCard.tsx            # card do rail da home
│   ├── MapaEstilizado.tsx      # fundo em grid + projeção lat/lng → % dentro da bbox
│   └── LugarSheet.tsx          # bottom sheet do 2f
└── lib/
    ├── api.ts                  # fetch tipado com base URL + Bearer opcional
    ├── types.ts                # espelho dos schemas Pydantic
    ├── frescor.ts              # frescor → { label, cor, pulsa }
    └── bairro.ts               # bairro escolhido em localStorage
```

**Sistema visual** (extraído do hi-fi, para os tokens do `globals.css`):

| Token | Valor | Uso |
|---|---|---|
| `--color-bg` | `#08060f` | fundo da página |
| `--color-surface` | `#0d0a18` | fundo da tela dentro do device |
| `--color-card` | `#181227` / `#171223` | cards e blocos |
| `--color-magenta` | `#ff3d81` | estado "agora", CTA primário, aba ativa |
| `--color-amber` | `#ffb443` | categoria, avisos "em breve" |
| `--color-cyan` | `#1fd0ff` | "novo" |
| `--color-text` | `#f3eefc` | texto principal |
| `--color-muted` | `#9083ad` / `#8478a0` / `#6f6690` | três níveis de texto secundário |
| Títulos | Anton, uppercase, `letter-spacing:-.3px` | `font-display` |
| Corpo | Inter 400/500/600/700 | `font-sans` |

Detalhes do design fáceis de perder e que fazem a tela: o **pulse** do magenta
(`@keyframes pulse`, 1.8s, box-shadow expandindo) só no estado `live`; o **seam** entre as duas
camadas da home (linha com gradiente + "ou explore a região" em maiúsculas espaçadas); o
`prefers-reduced-motion` que desliga toda animação, já presente no design.

**Estratégia responsiva — revisada.** A versão original deste plano previa um shell único adaptando
por breakpoint. **Isso mudou:** o app tem duas partições de visualização, mobile e desktop, no mesmo
app e nas mesmas URLs, cortadas por CSS em `lg`. `lib/` e `components/ui/` são compartilhados; só
`views/mobile/` e `views/desktop/` divergem. A arquitetura, o custo (DOM duplicado) e as saídas
alternativas (`<Activity>` do React 19.2, `proxy.ts` por user-agent) estão em `frontend/CLAUDE.md`.

⚠️ **Não existe design para desktop** — as 8 artboards são de telefone. A composição desktop é
derivada da tese (as duas camadas mudando de eixo: descoberta à esquerda, mapa fixo à direita) e é
provisória. Vale a pergunta em aberto: o caso real de tela grande talvez seja o painel do curador,
não o app público ampliado.

As artboards são de 382×740, com moldura de telefone. **Não** replicar a moldura, o notch nem a
barra de status "22:58 ▪▪▪ ⌁ ▮": são cenografia da apresentação, não interface.

**Ressalva de altura (já registrada em `arquitetura-backend-frontend.md`):** as duas camadas da
home só convivem sem scroll por causa dos 740px da artboard. Num telefone real (~650px úteis), o
mapa vai pra baixo da dobra. Testar em device antes de assumir que funciona — e se não couber, a
resposta provavelmente é encolher o mini-mapa, não virar aba, porque a convivência vertical é a
tese da tela.

---

## Ordem de construção

### Fase 1 — as duas telas públicas, sem auth, sem backend novo
`2c` home + `2f` mapa + `2d` detalhe em modo leitura (sem CTA de sinalizar, sem descrição, sem card
do curador). Consome `/descoberta`, `/mapa`, `/roles/{id}`, `/lugares/{id}` — todos públicos.

É a fatia que prova a tese com dado real e não depende de nenhuma decisão pendente. Também é a que
valida a ressalva de altura da home num telefone de verdade.

Pré-requisito: escolher o bairro piloto (`TODO.md` item 1) e ter dado real no banco — senão isso
roda contra um banco vazio, que é exatamente o cenário que o `conceito.md` diz que o mapa trata mal.

### Fase 2 — onboarding e perfil
`2a` + `2b` + `2h` parcial. Tudo client-side com `localStorage`. Fecha o fluxo de primeira visita.

### Fase 3 — auth e salvar
Telas de login/cadastro (design novo, pequeno) + `2g` salvos + salvar/dessalvar no `2d` e no `2f`.
Depende da decisão 3 (auth preguiçosa) e, para o `2g` ficar bom, da mudança de backend nº 2.

### Fase 4 — contribuição
CTA de sinalizar no `2d` + confirmação `2e` + comentar. Depende da decisão 2 (o que o usuário comum
vê) e das mudanças de backend nº 3 e nº 6.

### Fase 5 — enriquecimento
`descricao` do rolê (backend nº 1), card do curador, endereço, distância a pé com geolocalização,
mapa com tiles reais.

---

## Riscos

- **Banco vazio.** Todas as telas foram desenhadas com a Vila Madalena cheia: 3 rolês, 14 lugares,
  comentários recentes, sinais das últimas 2h. Nenhum estado vazio foi desenhado. Vai ser preciso
  inventá-los — e o `conceito.md` avisa que é justamente aí que o mapa é cruel. Desenhar o estado
  vazio da home é trabalho de design que ainda não foi feito.
- **Sem seed.** Não há script de dados de exemplo no backend. Rodar a fase 1 exige criar usuário,
  promover a curador (`scripts/promote_role.py`), cadastrar lugares e rolês pelo painel do curador
  na mão. Um seed de desenvolvimento economizaria isso toda vez.
- **`Estabelecimento` sem fluxo de criação** (`TODO.md` item 3) — não bloqueia nenhuma das 8 telas
  públicas, mas bloqueia o card "para donos de casa" do `2h` virar algo real.
- **Fuso.** O backend trabalha em UTC timezone-aware; todo copy de horário ("termina 04h",
  "23h30", "12 min atrás") precisa ser formatado em `America/Sao_Paulo` no cliente.
