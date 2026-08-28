# TODO — frontend

Tasks de implementação das 8 telas hi-fi. A análise que originou esta lista (cruzamento tela a tela
com a API, lacunas, decisões pendentes) está em `../docs/plano-frontend.md` — ler antes de começar.
Tasks de escopo do monorepo e as mudanças de backend que algumas telas pedem estão em `../TODO.md`.

Convenções, tokens de cor e contratos da API: `CLAUDE.md` desta pasta.

---

## Fase 0 — scaffold e sistema visual ✅

- [x] 1. **Criar o projeto Next.js.** Feito: Next 16.3.3, React 19.2.8, Tailwind v4, TypeScript,
      ESLint, Turbopack, `src/`, alias `@/*`.
- [x] 2. **Fontes e metadata em `app/layout.tsx`.** Anton 400 e Inter 400/500/600/700 via
      `next/font/google` (`--font-anton`, `--font-inter`), `lang="pt-BR"`, `themeColor` `#08060f`,
      `colorScheme: dark`.
- [x] 3. **Tokens em `app/globals.css`.** Todos os tokens em `@theme`, mais os utilitários
      `pulse-agora` e `rotulo` (o rótulo de seção repete em 6 das 8 telas) e o bloco
      `prefers-reduced-motion`. Dark-only, sem troca de tema.
- [x] 4. **Shell.** Mobile: `mx-auto w-full max-w-md`. Desktop: sidebar + conteúdo. Sem moldura de
      telefone, notch ou barra de status falsa.
- [x] 5. **`lib/types.ts`** — espelho dos schemas Pydantic, datas como `string` ISO.
- [x] 6. **`lib/api.ts`** — fetch tipado, `ApiError` com status (401/403/409) e `ApiOffline`
      separado. `.env.local.example` criado.
- [x] 7. **`lib/frescor.ts`** — mapeamento único, `null` → sem badge.
- [x] 8. **`lib/tempo.ts`** — `America/Sao_Paulo` fixo (também evita divergência de hidratação).
- [x] 9. **Nav das duas visualizações** — `components/nav-items.tsx` (destinos e ícones, fonte
      única), `views/mobile/bottom-nav.tsx` e `views/desktop/sidebar.tsx`.
- [x] 10. **`components/ui/frescor-pill.tsx`** — ponto de 7px, pulse só no `live`.

## Partição mobile / desktop ✅ infraestrutura

Decisão registrada em `CLAUDE.md`: mesmo app, mesmas URLs, mesmos dados; só a composição muda,
cortada por CSS em `lg`. `lib/` e `components/ui/` compartilhados, `views/` diverge.

- [x] P1. `components/viewport.tsx` — `<Mobile>` e `<Desktop>`.
- [x] P2. `app/page.tsx` busca uma vez e alimenta as duas visualizações. Verificado no HTML
      servido: exatamente 2× cada card e cada pin, um por partição.
- [x] P3. **Partição em todas as rotas existentes** (`/`, `/mapa`, `/role/[id]`, `/salvos`,
      `/perfil`, `/curador`). Verificado no HTML servido: 6/6 respondem 200 com as duas árvores.
      Toda tela nova continua precisando das duas composições.
- [x] P4. **Design de desktop feito** — 5 artboards em `../docs/front-end-ideias/desktop/`. A
      pergunta "o desktop é o app público ampliado ou o painel do curador?" foi respondida com
      **os dois**: 4 telas do app público + o painel, que ganhou nav própria por ser outra
      superfície.
- [ ] P5. Reavaliar o custo do DOM duplicado quando o mapa virar client-side com pan e zoom. Saídas
      registradas em `CLAUDE.md`: `<Activity mode="hidden">` do React 19.2, ou `proxy.ts` por
      user-agent.

## Fase 1 — as duas telas públicas (sem auth, sem backend novo)

Fatia que prova a tese com dado real. Consome só rotas públicas — nenhuma mudança no backend.

- [x] 11. **Tela `2c` — Home**, nas duas visualizações. Mobile (`views/mobile/home.tsx`): header,
       "Hoje à noite" + contagem, rail horizontal de cards de 206px, seam "ou explore a região",
       mini-mapa, bottom nav. Desktop (`views/desktop/home.tsx`): sidebar, grade de cards de 2–3
       colunas e mapa fixo à direita ocupando a altura da tela. Card compartilhado em
       `components/ui/role-card.tsx`. **Subtítulo usa `lugar_nome`**, não "8 min a pé".
       ⚠️ Bairro ainda fixo no código — vira `localStorage` na fase 2.
- [x] 12. **`components/ui/mapa-estilizado.tsx`** — grid, faixas inclinadas e pins reais
       projetados na bbox dos `lat`/`lng`, com margem para não colar nas bordas e fallback para
       centro quando há um pin só. Cor pelo `frescor` do `role_ativo`; sem rolê fica menor e em
       `--color-pin-off`. Sem tiles e sem dependência externa.
- [ ] 12b. **Verificar contra a artboard.** A home foi construída lendo o hi-fi, mas não foi
       comparada lado a lado com ele. Conferir espaçamentos, pesos e tamanhos antes de considerar
       a tela fechada.
- [x] 13. **Card social da home** (só desktop). Cita **comentário**, não sinalização — decisão (ii)
       do item 4a de `../TODO.md`, tomada. Só aparece com dado de exemplo: com a API real seria
       preciso um `GET /comentarios/recentes?bairro=X` que não existe, e citar quem sinalizou
       quebraria o anonimato prometido no `2d`.
- [x] 14. **Tela `2f` — Mapa.** Pins selecionáveis, filtro Todos/Com rolê, cartão do lugar com
       último comentário e CTA. Desktop: lista do bairro vira coluna permanente ao lado do mapa,
       em vez de gaveta. **"Comentado agora" não foi implementado** — `total_comentarios` não tem
       janela de tempo. Copy usa "4 comentários", não "na última hora".
- [x] 15. **"Rota"** — link externo pro Google Maps, nas duas visualizações.
- [x] 16. **Tela `2d` — Detalhe do rolê.** Hero, badges, título, lugar, comentários e stats. O
       bloco de descrição renderiza **quando** `descricao` existir e mostra uma linha honesta
       quando não existir (o campo não está no backend — item 15 de `../TODO.md`). O CTA "Tô indo"
       aparece **desabilitado com explicação** ("Sinalizar ainda está com os curadores da Vila") —
       decisão (i) do item 4a, tomada, alinhada ao ADR-0006.
- [ ] 16b. **"Compartilhar" no `2d`** — Web Share API com fallback de copiar link. Não implementado.
- [ ] 17. **Estados de carregamento e erro:** falta o skeleton no formato dos cards (não spinner)
       via `loading.tsx`. O caso de API fora do ar já está coberto (`AvisoOffline` + `lib/fixtures`),
       e `/role/[id]` já trata 404 com `notFound()`.
- [x] 18. **Estados vazios.** Feitos: home sem rolê, caderninho vazio, painel do curador sem nada
      no ar, painel do dono sem casa vinculada e busca por localização fora de área. Enunciado
      original: ⚠️ Não existem no design (item 4b de `../TODO.md`). Sem bairro
       piloto e sem seed, é o estado que mais vai aparecer. Precisa de design antes de codar, mas
       precisa de *algo* para a tela não quebrar: no mínimo um texto centrado no tom do produto.
- [x] 19. **Testado em device real em 28/08**, por túnel, num Android em 4G: o card do rolê, o
      seam e o mapa couberam na dobra com a barra inferior visível. A ressalva de altura que
      vinha do começo do projeto está resolvida — e o mesmo teste revelou três bugs que só
      apareciam no aparelho (mapa em branco, barra flutuando, "você está aqui" a 1,4 km).
      Enunciado original: A ressalva de
       `../docs/arquitetura-backend-frontend.md`: na artboard de 740px as duas camadas cabem sem
       scroll; num telefone real (~650px úteis) provavelmente não. Se não couber, encolher o
       mini-mapa — não virar abas.

## Sugerir um lugar — o começo da rotina de curadoria

- [x] S1. **Convite para indicar lugar**, nos estados vazios (bloco) e ao pé da lista (linha).
      **Sem backend de propósito:** abre WhatsApp ou email do curador com o bairro já no texto.
      O `conceito.md` manda ir o mais longe possível no manual antes da primeira linha de
      sistema — e há uma razão de produto junto: **sugestão não é conteúdo, é pista.** Ela não
      pode virar lugar no app, senão entra coisa que ninguém visitou.
      O copy diz que alguém vai **a pé conferir antes** — sem isso a pessoa espera ver o lugar
      publicado no dia seguinte e some quando não vê.
      Contato em `NEXT_PUBLIC_CURADOR_WHATSAPP` ou `NEXT_PUBLIC_CURADOR_EMAIL`; sem nenhum dos
      dois o convite não aparece.
- [ ] S2. **Virar entidade `Sugestao` + fila no painel do curador** — só quando o volume
      justificar. Antes disso é automatizar processo que ninguém rodou.

## Fase 2 — onboarding e perfil (client-side)

- [x] 20. **Abertura — escolha de bairro** (`/abertura`, era a tela `2a`). Duas diferenças
       deliberadas em relação ao hi-fi: **não há etiqueta "em breve"**, porque prometer bairro
       futuro é afirmar roadmap que ninguém decidiu; e **as contagens vêm da API**, então quando
       não há curadoria a tela diz "curadoria começando" em vez de número inventado.
       Recortes reais: República (piloto) e Pinheiros.
       **A escolha vive em cookie, não `localStorage`** — a home e o mapa renderizam no servidor e
       precisam do bairro antes de mandar HTML. Sem cookie, `/` e `/mapa` redirecionam para cá.
       Não implementei o passo 2 (gostos): ver item 21, que segue sem uso funcional.
- [ ] 21. **Tela `2b` — Onboarding, gostos.** Chips selecionáveis, passo 2 de 2, card do curador,
       "Ver a noite de hoje" e "Pular por agora". Salvar em `localStorage` e **não usar para nada
       ainda**: `/descoberta` não aceita filtro nem ordenação por gosto, e implementar ranking por
       preferência contraria a decisão de a descoberta ser curatorial. Débito consciente, descrito
       em `../docs/plano-frontend.md`.
- [x] 22. **`lib/bairros.ts` + guarda de rota.** Feito com cookie (ver item 20). `bairro-servidor.ts`
       lê no servidor e valida contra a lista — cookie é entrada do usuário.
- [ ] 23. **Tela `2h` — Perfil, parcial.** Avatar, "Você", stats, bloco "meu bairro" com "trocar",
       bloco de privacidade e card "para donos de casa". **Nome e "desde agosto" ficam de fora até
       existir `GET /auth/me`** (item 18 de `../TODO.md`); "rolês que você foi" não tem rota e sai
       do escopo. O toggle "Meus sinais são anônimos" vira **texto informativo, não controle** — um
       toggle que não desliga nada promete um controle que não existe.

## Painel do curador ⚠️ casca pronta, sem backend ligado

Decisão tomada: **o painel do curador é a superfície mais desktop-native do produto** — é onde
alguém trabalha sentado, depois de andar pelo bairro. Por isso tem nav própria
(`views/desktop/sidebar-curador.tsx`), e não é o app público esticado. Design:
`../docs/front-end-ideias/desktop/Curador.dc.html`.

- [x] C1. Rota `/curador` nas duas visualizações. Desktop: números da noite, lista do que está no
      ar com ações, formulário de publicar à direita. Mobile: **inverte a prioridade** — publicar
      primeiro (o curador está na rua, acabou de sair do lugar), lista depois; editar e tirar do ar
      ficam só no desktop.
- [x] C2. O campo "motivo pra ir" é o maior do formulário, de propósito.
- [x] C3. **Ligado no backend.** O painel lista os rolês reais e o formulário publica de verdade. As rotas já existem inteiras (`POST/PATCH/DELETE /curador/lugares`
      e `/curador/roles`), mas exigem token e papel `curador` — depende da fase 3. Hoje o
      formulário não envia e a lista vem de exemplo.
- [x] C4. **`Role.descricao` no backend** — feito (migration 0002). Enunciado original: sem ela o campo principal do
      formulário não tem onde ser gravado.
- [x] C5. **`/curador/lugares` existe** (cadastro com categoria, endereço e coordenadas), e as duas
      telas do painel são ligadas pelas três etapas (`components/ui/passos-curador.tsx`).
      `/curador/roles` **não** foi criada e não deve ser: a lista do que está no ar vive no
      próprio `/curador`, e uma terceira tela só para repetir isso seria navegação sem conteúdo.
      Enunciado original: a nav já aponta para elas e **elas não
      existem** (404). Ou criar, ou tirar da nav.
- [ ] C6. Seleção de ponto no mapa ao cadastrar lugar — hoje as coordenadas são coladas do Google
      Maps. Melhora quando o gargalo for esse, não a curadoria em si.

## Fase 3 — auth e salvar

- [x] 24. **Login e cadastro desenhados e implementados.** Design em
       `../docs/front-end-ideias/entrar/` (telefone e desktop). A auth preguiçosa aparece no
       layout: a tela mostra o que a pessoa estava salvando, e no desktop isso vira a coluna da
       esquerda inteira.
- [x] 25. **`lib/auth.ts`** — token em `localStorage`, decodificação client-side do payload do JWT
       para ler `papel` e `exp` (sem verificar assinatura: é gating de UI, a autoridade é o
       backend), e limpeza do token em 401.
- [x] 26. **Auth preguiçosa** (decisão (iii) do item 4a de `../TODO.md`): o app é público e
       read-only; o login só aparece quando a pessoa tenta salvar pela primeira vez, preservando a
       intenção para depois do login.
- [x] 27. **Salvar e dessalvar** no `2d` e no `2f`, com atualização otimista e reversão em erro.
       `POST /salvos` devolve 409 se já salvo — tratar como sucesso idempotente, não como falha.
- [x] 28. **Tela `2g` — Salvos, com dado real.** `GET /salvos` + uma chamada a `/lugares/{id}` por item (o N+1 do item 16). Estado vazio honesto.
- [x] 28b. **Salvar/dessalvar de fato** — feito no detalhe do rolê, nas duas visualizações. "Meu caderninho", contagem, filtros e lista. ⚠️ Com a API atual
       custa uma chamada a `/lugares/{id}` por item — fazer a mudança 16 de `../TODO.md` antes, ou
       aceitar o N+1 conscientemente. Os filtros "Abertos agora" e "Nunca fui" e os estados
       "aberto"/"fechado" **não são implementáveis**: não há horário de funcionamento no schema nem
       histórico de presença. Implementar só "Todos" e "Tem rolê" (derivável de `role_ativo`).

## Fase 4 — contribuição

- [x] 29. **CTA de sinalizar no `2d`.** Três comportamentos: deslogado leva para entrar guardando o destino; papel comum vê desabilitado com o motivo; curador sinaliza de verdade. Depende da decisão (i) do item 4a de `../TODO.md`.
       Recomendação registrada: mostrar desabilitado com explicação honesta para `papel=comum`,
       porque `POST /sinalizacoes` responde **403** para quem não é curador ou dono (ADR-0006).
       Tratar o 403 de verdade — não assumir que a UI sempre acerta o gating.
- [x] 30. **Tela `2e` — Sinal enviado.** Feita como estado do `2d`. Confirmação, contador "expira em" com barra de progresso
       (`timestamp` + 120min, a janela warm do backend — deixar claro no código que é **convenção
       de UI**, não prazo garantido pela API), "Contar como está lá dentro" (`POST /comentarios`) e
       "Cancelar meu sinal" (⚠️ sem rota: item 20 de `../TODO.md`). Implementar como estado do
       `2d`, não como rota nova.
- [x] 31. **Comentar** — feito, e desde 28/08 **fora** do `2e`, em `components/ui/contar-como-esta.tsx`.
      Estava dentro da confirmação de sinalização, que só aparece depois de marcar presença — e
      sinalizar é restrito a curador e dono (ADR-0006). A única contribuição que uma conta comum
      tem permissão de dar estava trancada atrás da ação que ela não pode executar.
- [ ] 31b. **Comentar do `LugarSheet` do `2f`** — ainda não.

## Conexões — feature nova (plano em `../docs/plano-conexoes.md`)

Aba de Conexões: amigos, check-in e os salvos deles. **Ler o plano antes** — ele decide a ordem
(salvos das conexões antes do check-in) e por que o v1 é sem push. Depende da fase 3 (login) e do
bairro piloto. Backend: itens 27–30 de `../TODO.md`.

**Design pronto:** `../docs/front-end-ideias/conexoes/` — 5 artboards (aba em desktop e telefone,
estado vazio, convite, confirmação de check-in). Seguir esses arquivos, como o resto do frontend
segue o hi-fi.

- [x] X1. **Quinto item na barra de navegação** — feito em `components/nav-items.tsx`, que serve as
      duas navs de uma vez.
- [x] X2. **Rota `/conexoes`** nas duas visualizações: quem está fora agora (incluindo o check-in
      de bairro, sem lugar exato), salvos por quem você confia, e a coluna de conexões com o
      pedido pendente. Componentes novos: `ui/avatar.tsx` (gradiente derivado do nome, mesma
      pessoa sempre da mesma cor sem guardar nada) e `ui/lista-privacidade.tsx`.
- [x] X3. **Estado vazio da aba** — implementado nas duas visualizações, com os salvos do curador
      no lugar para a aba nunca nascer morta. Alcançável em `/conexoes?vazio=1` enquanto não há
      API (com dado de exemplo seria inalcançável de outro jeito); esse parâmetro sai quando as
      rotas existirem.
- [x] X3b. **Rota `/conexoes/convite`** nas duas visualizações, com a lista do que a pessoa passa
      **e não passa** a ver. O link em si fica pendente do backend — renderizar um link falso e
      deixar copiar seria pior que mostrar o estado pendente.
- [ ] X4. **Ligar o botão "Tô indo" do `2d`.** Ele já existe e está desabilitado com a explicação
      de que sinalizar é restrito a curadores (`views/*/role.tsx`). Para usuário comum ele passa a
      significar check-in visível às conexões. **Atualizar também o copy** "Ninguém vê seu nome",
      que deixa de ser verdade como está escrito (item 23 de `../TODO.md`).
- [ ] X5. **Tela `2e` — confirmação de check-in.** Já está desenhada no hi-fi e nunca foi
      implementada: "Tá marcado", contador de expiração com barra, "Contar como está lá dentro" e
      "Cancelar meu sinal". Implementar como estado do `2d`, não como rota nova.
- [ ] X6. **Check-in por bairro** ("estou na Vila", sem lugar exato) — para quem quer avisar sem se
      localizar. O plano recomenda ter isso **no v1**, não depois: é vida noturna, e transmitir
      posição exata à noite não pode ser a única opção.
- [ ] X7. **Selo "N conexões salvaram"** nos cards de descoberta. **Sem reordenar o feed** — a
      descoberta é curatorial por decisão registrada, e reordenar por popularidade é exatamente o
      que o `conceito.md` rejeita.
- [ ] X8. **Ajustar o copy de privacidade** em `2g` ("só seus, ninguém mais vê") e `2h` ("seus
      sinais são anônimos") para refletir a visibilidade opt-in. Hoje as duas frases ficam falsas
      no minuto em que a feature entra.

## Fase 5 — enriquecimento (depende do backend)

- [x] 32. **Descrição do rolê no `2d`** — feito, nas duas visualizações. Era
      o "motivo pra ir", a peça que mais falta para o `2d` cumprir a tese do produto.
- [~] 33. **Endereço do lugar: feito** (migration 0003; aparece no `2d` nas duas visualizações).
      **Card do curador ("VALIDOU EM CAMPO"): não.** Falta decidir o que ele afirma — assinar
      com nome do curador é promessa de responsabilidade que ninguém combinou ainda.
- [ ] 34. "N sinalizaram nas últimas 2h" no `2d`, quando `RolePublic` expuser a contagem (item 17).
- [ ] 35. Distância "a pé" com geolocalização do browser, quando `RoleDescoberta` trouxer
      `lat`/`lng` (item 19).
- [x] 36. **PWA de verdade** — feito em 28/08. `app/manifest.ts`, ícones reais gerados
      (`public/icons/`, o pin magenta pulsando — sem palavra escrita, porque rasterizar uma
      fonte do sistema no lugar de Anton daria um logotipo que não é o nosso), `public/sw.js`
      e `public/offline.html`.
      **A regra do service worker: cacheia a casca, nunca o dado.** JS, CSS, fontes e ícones
      entram no cache; resposta de API e página renderizada, não. Servir de cache um rolê de
      ontem rotulado "bombando agora" seria pior que não abrir. Navegação sem rede cai em
      `/offline.html`, que não finge ter conteúdo. Registrado só em produção — em dev o SW
      interceptaria os assets do Turbopack e viraria depuração de cache.