# TODO — bora-roles (visão geral)

Tasks de escopo do monorepo (produto, decisões cross-cutting). Para tasks internas de cada parte,
ver `backend/TODO.md` (esqueleto completo) e `frontend/TODO.md` (8 rotas no ar, faltam
onboarding, login e a confirmação de sinal).

## Roteiro até a primeira conversa com um estabelecimento

Plano ativo. O objetivo não é terminar o app — é ter algo palpável para mostrar a um dono de casa,
que é o **único motor do `conceito.md` que não depende de já ter usuários**. Itens marcados
`[campo]` e `[decisão]` não são código.

- [x] R1. **[decisão] Bairro piloto: recorte República.** Eixo **Largo do Arouche / Av. Vieira de
      Carvalho / Praça da República**. Decidido em 27/08/2026, depois de pesquisar onde fica o
      Bar do China. Por que aqui: é onde está a densidade noturna real do Centro (bares
      tradicionais, casas de música, cena LGBT+ com história desde os anos 70), atravessa-se a pé
      em ~10 min — o critério do `conceito.md` —, tem metrô República na porta e preços bem abaixo
      da Vila Madalena.
      **Por que não Anhangabaú/São Bento:** o Bar do China fica na Av. Prestes Maia, 78, colado no
      metrô São Bento (confirmar com o dono) — núcleo financeiro e histórico, cheio de dia e quase
      deserto à noite. Recorte ali cairia no cenário que o conceito chama de fatal: "fora do
      recorte, melhor o mapa nem existir do que existir vazio".
      **O Bar do China fica fora do recorte, e tudo bem:** ele é a primeira conversa (R9, ensaio),
      não a âncora do piloto. Se depois fizer sentido incluí-lo, esticar pela Vieira de Carvalho
      na direção do Largo do Paissandu — não até São Bento.
      Ressalva de campo: "validar a pé" pesa diferente no Centro à noite. Arouche tem a vantagem
      de ser movimentado, que é melhor que rua deserta.
- [x] R2. **Remote criado e push feito.** `https://github.com/samseg01/app-bora.git` (privado),
      14 commits na `master`, tracking configurado. Histórico varrido antes: nenhum `.env` real,
      chave ou token em nenhum commit. Destrava o R7 — Railway e Vercel publicam a partir do
      GitHub.
- [ ] R3. **[campo] Curar 10 a 15 lugares a pé no recorte República/Arouche.** Primeira noite
      serve também para fechar o recorte: andar de Praça da República até o Largo do Arouche pela
      Vieira de Carvalho e contar quantos lugares têm algo acontecendo. Se der 10+, o recorte está
      certo; se der 3, o problema é o Centro, não o desenho do recorte. O passo mais importante da
      lista e o único sem linha de código. Caderno ou planilha serve. O `conceito.md` diz que o
      campo não serve só pra popular o mapa — serve pra **descobrir qual é o processo antes de
      codificá-lo**. Efeito colateral que vale mais que o app: você chega na conversa como alguém
      que conhece o pedaço, não como alguém vendendo software.
- [x] R4. **`Role.descricao` no backend** (item 15). Coluna `Text` nullable, migration
      `0002_role_descricao.py` escrita à mão, propagada por `RoleCreate`/`RoleUpdate`/`RolePublic`/
      `RoleDescoberta`, pelo serializador e pelo CRUD do curador. Também entra em `/descoberta`,
      para a home não precisar de uma chamada por card.
      ⚠️ **Não verificado:** sem `uv` e sem Docker no ar nesta máquina, não rodaram ruff, mypy,
      pytest, nem a migration contra um banco. Só checagem de sintaxe. **Rodar antes de confiar.**
- [x] R5. **Seed** (item 22). `backend/scripts/seed.py` lê um JSON de curadoria e popula o banco,
      idempotente por nome. Dois arquivos em `backend/seed/`: `exemplo-ficticio.json` (Vila
      Madalena inventada, para desenvolvimento — o próprio arquivo avisa que não serve para demo) e
      `republica.json`, que nasce quase vazio de propósito: **só entra o que foi visto a pé**.
      Bar do China está lá sem coordenadas, esperando o R3.
      ⚠️ **Não executado** — depende do Docker no ar.
- [x] R6. **As quatro rotas com dado inventado agora dependem do ambiente.** Em produção
      `/salvos`, `/perfil`, `/curador` e `/conexoes` mostram "precisa entrar" em vez de dado de
      exemplo; em desenvolvimento seguem preenchidas. Verificado com o build de produção: zero
      vazamento de exemplo nas quatro. Ficaram na navegação de propósito — mostrar que a parte
      existe é melhor que escondê-la. Quando o login chegar, a condição vira "sem token".
- [x] R6b. **Mapa real (MapLibre + CARTO dark-matter, sem chave de API).** Feito nas 5 telas com
      mapa. Os dois contextos WebGL foram resolvidos travando a inicialização por tamanho do
      container (a partição escondida é 0×0 e nunca instancia). O mapa abstrato ficou como
      degradação para sinal ruim. Detalhes no item 37 do `frontend/TODO.md`.
      ✅ **Confirmado em navegador.** Levou uma caçada: o container `absolute inset-0` resolvia
      para altura 0 e o MapLibre caía num fallback interno de 400x300, sem emitir erro nenhum.
- [ ] R7. **Deploy** (item 12). Backend + Postgres gerenciado **com PostGIS** (essa extensão é o
      detalhe que costuma dar trabalho — nem todo provedor entrega), frontend na Vercel,
      `JWT_SECRET` vindo do ambiente e `CORS_ORIGINS` no domínio da Vercel.
- [ ] R8. **[campo] Testar no celular de verdade, no bairro, em 4G.** Resolve de uma vez a ressalva
      de altura das duas camadas na home, pendente desde o começo (item 19 do `frontend/TODO.md`).
- [ ] R9. **[decisão] Definir como um estabelecimento é cadastrado** (item 3). Não existe endpoint
      nenhum; hoje só dá pra inserir no Postgres na mão. É a primeira coisa necessária se o dono
      disser sim. **A conversa com o dono que você já conhece pode acontecer antes de tudo isso** —
      como ensaio, mostrando o canvas de design no celular. Não vira o bairro piloto por isso, e
      ensina como a conversa corre sem custar nenhuma semana.
- [ ] R10. **A conversa.** Mostrar a tela de descoberta com o bar dele e o pin aceso no mapa.
      O painel do estabelecimento **existe** desde 28/08 (`/estabelecimento`), mas o conselho não
      mudou: **não** abrir ele na conversa. Num bairro que ainda não foi curado ele mostra zeros
      honestos, e o `conceito.md` diz que esse painel só tem valor porque a comunidade existe.
      Ele é o que se mostra na *segunda* conversa, quando houver número.

## Concluído em 28/08/2026 — trabalho sem item prévio

Um dia inteiro de sessão, e a maior parte não estava na lista: quase tudo saiu de defeito
encontrado usando o app, não de tarefa planejada. Fica registrado aqui porque a numeração acima
não cobre, e porque vários desses achados são o tipo de coisa que se repete se ninguém escrever.

### Correções de honestidade do dado

- [x] **Frescor contava toques, não pessoas** (`55f5283`). `live` acende com 3 sinais e a contagem
      era de linhas: uma pessoa tocando "Tô indo" três vezes acendia o "Bombando agora" — a
      promessa central do produto, forjável com um dedo. O smoke test fazia exatamente isso e
      passava, ou seja, documentava a falha. Agora conta `distinct usuario_id`, o POST renova em
      vez de empilhar, e o DELETE leva junto os sinais irmãos.
- [x] **Comentário da tela 2e não aparecia em lugar nenhum** (`92f0f8b`). Gravado com `role_id`,
      e as duas únicas leituras filtravam por `lugar_id`. Era aceito, gravado, e invisível.
      Três comentários reais estavam nesse limbo.
- [x] **"Hoje" era contado em UTC** (`83e95bf`). O dia ia das 21h de ontem às 21h de hoje em São
      Paulo, então todo rolê que começava às 21h sumia da descoberta — o horário em que a noite
      começa. Confirmado com teste antes do conserto; o primeiro teste passava com o bug presente.
- [x] **O painel do curador dizia coisas falsas** (`0e4715e`). Sem filtro de bairro nem de data:
      mostrava lugares da Vila Madalena sob o rótulo "República" e contava como "no ar" rolês já
      encerrados.
- [x] **O círculo no canto da home não era nada** (`16530dd`). Avatar decorativo, sem link e sem
      dono. Junto: as duas telas de perfil ignoravam o componente `Avatar` (que deriva a cor do
      nome) e usavam um gradiente fixo, igual para todo mundo.

### O mapa, em três rodadas

- [x] **Bairro com um lugar só quebrava o mapa** (`541b59c`). `fitBounds` com área zero resolve
      para centro NaN: o MapLibre carregava, disparava `load` e não desenhava. É o estado NORMAL
      de um bairro piloto — o seed fictício, com seis lugares, escondia a falha no cenário real.
- [x] **O container tinha altura zero** (`fa46e1a`). E a culpa era do conserto anterior:
      `height:100%` num filho absoluto sobre-restringe a caixa e resolve para 0 dentro de um item
      de flex. O tamanho passou a vir em pixels do ResizeObserver.
- [x] **O diagnóstico se escondia justamente quando era preciso** (`f787eb5`). A caixa só aparecia
      com `!pronto`, e a falha era um mapa "pronto" desenhando fora da vista. Agora ela reaparece
      sozinha quando o canvas diverge do container.

### Estado que só existia no cliente

- [x] **"Tá marcado" não sobrevivia a sair da tela** (`033a1cb`). Vivia em `useState`; ao voltar, o
      app oferecia "Tô indo" a quem já tinha marcado. Criada `GET /sinalizacoes/minhas` para
      rehidratar do servidor.
- [x] **Salvar bloqueado e "Tô indo" sem memória na home** (`07c05f8`). `GET /descoberta` não
      devolvia `lugar_id`, e o botão estava `disabled` com um aviso sobre "a fase 3" que já tinha
      passado — parecia regra de produto e era lacuna de schema. Junto veio `lib/meus.ts`, que
      reduz dez chamadas idênticas a duas por tela.

### Superfícies e navegação

- [x] **Painel do estabelecimento** (`033a1cb`) — terceira superfície do produto, sem design
      prévio. Mostra só os dois totais que a agregação devolve, rotulados como "desde sempre".
      Junto, `GET /estabelecimento/meus`, sem a qual o painel era inalcançável.
- [x] **Cadastro de lugar era inalcançável no celular** (`951e044`) e o painel virou três etapas
      explícitas (`2b9ce67`), com a região trocável ali dentro — antes ela vinha em silêncio do
      cookie do app público.
- [x] **Categoria estava no rolê e foi para o lugar** (`9dfbb56`), com vocabulário fechado.
- [x] **A barra inferior flutuava no meio da tela** (`dfe71a9`) em salvos, perfil e conexões.

### Infraestrutura e decisões

- [x] **ADR-001: PWA agora, nativo depois** (`25e3645`). Nativo é destino declarado, com gatilhos
      concretos de reavaliação e as três regras que mantêm o código portável.
- [x] **`tests/` estava no `.dockerignore`** (`55f5283`): a suíte nunca entrava na imagem e o
      pytest respondia "no files were found in testpaths" — falhando com cara de sucesso.
- [x] **`tzdata` virou dependência declarada** (`83e95bf`). `zoneinfo` lê a base do sistema
      operacional, que imagens enxutas não têm — seria surpresa no deploy do R7.
- [x] **Procedimento de teste em celular documentado** (`f787eb5`): túnel `cloudflared`,
      `allowedDevOrigins`, e o que funciona e o que não funciona por ele.

## Correções críticas

- [x] 1. **Versionar o projeto.** Feito: repositório único na raiz, commit inicial `d44aa40` com
      161 arquivos. O `.git` vazio do backend foi retirado (não tinha commits nem remotes).
      Conferido que `.env` real, `node_modules`, `.next` e os canvas gerados ficaram de fora.
- [x] 1b. **Criar o remote e dar push.** Feito — ver R2.
- [x] 2. **Bairro piloto: Anhangabaú.** Pergunta 1 de `docs/conceito.md`, respondida. Ver R1.
- [ ] 3. **Decidir o fluxo de criação de `Estabelecimento`.** Hoje não existe endpoint — só rotas
      de leitura pro dono (`backend/CLAUDE.md`, seção "Gap conhecido"). Decisão de produto: curador
      cadastra em campo? Dono faz onboarding self-service (contraria ADR-0007 de promoção manual de
      papel, então provavelmente não)? Definir antes de implementar a rota.

## Diferenciais / features principais

- [x] 4. **Implementar o frontend público (PWA, Next.js).** App de pé (9 rotas, dado real) e PWA
       instalável desde 28/08 (item 11). Descrição original: A pasta `frontend/` já existe com
      `CLAUDE.md` (convenções, tokens, contratos da API) e `TODO.md` (**as 37 tasks detalhadas, em
      6 fases — é lá que o trabalho é acompanhado**). Análise que originou tudo:
      `docs/plano-frontend.md`. ⚠️ Em andamento: 8 rotas no ar nas duas visualizações. Faltam
      onboarding (`2a`/`2b`), login e a confirmação de sinal (`2e`).
- [x] 4a. **Os 3 pontos travados de design ↔ backend foram decididos e implementados.**
      (i) CTA desabilitado com o motivo honesto (`components/ui/acao-sinalizar.tsx`); (ii) o card
      social cita comentário, não sinalização; (iii) auth preguiçosa confirmada e construída.
      Enunciado original: antes da fase 4 do plano: (i) o que
      o usuário comum vê no lugar do CTA "Tô indo", já que `POST /sinalizacoes` dá 403 pra ele
      (recomendação no plano: CTA desabilitado com explicação honesta); (ii) o card social da home
      passa a citar **comentários** em vez de sinalizações, pra não quebrar o anonimato prometido
      no `2d`/`2h`; (iii) confirmar a "auth preguiçosa" — app público read-only, login só quando a
      pessoa tenta salvar. Detalhes em `docs/plano-frontend.md`.
- [x] 4b. **Estados vazios e telas de auth existem.** As telas de auth foram desenhadas
      (`docs/front-end-ideias/entrar/`) e implementadas. Os estados vazios foram escritos direto
      no código, sem artboard — decisão consciente: eles dizem por que a tela está vazia, e esse
      texto é argumento de produto, não composição visual. Enunciado original: O hi-fi pressupõe a Vila Madalena
      cheia e não tem login/cadastro; as duas coisas faltam antes de o app funcionar com banco
      vazio ou com usuário de verdade.
- [x] 5. **Conectar o frontend ao backend com dado real do bairro piloto** (depende das tasks 2 e
      4). Os tipos do front devem convergir com os schemas Pydantic de
      `backend/src/boraroles/schemas/`; a API já expõe tudo que as telas públicas precisam
      (`GET /descoberta`, `GET /mapa`, `GET /roles/{id}`, `GET /lugares/{id}`). Lembrar de incluir a
      origem do front em `CORS_ORIGINS` no `.env` do backend.
- [x] 6. **Painel do curador como UI real.** Feito: lista, publica rolê e cadastra lugar contra a
       API real, com filtro de bairro e "tirar do ar". Decidido que é a superfície
      desktop-native do produto, desenhado (`docs/front-end-ideias/desktop/Curador.dc.html`) e a
      tela existe em `/curador` nas duas visualizações. **Falta ligar no backend**: o CRUD em
      `backend/.../api/v1/curador.py` exige token e papel `curador`, então depende do login
      (fase 3 do `frontend/TODO.md`). Detalhes nos itens C3–C6 de lá.
- [x] 7. **Sinalização de presença na UI.** Começar restrito a curadores/usuários engajados
      (motor mais frágil do conceito — ver tabela de motores em `docs/conceito.md`). A API já
      existe e já é restrita (ADR-0006); falta o fluxo de UI (telas `2d` → `2e` do hi-fi).
- [x] 8. **Painel do estabelecimento como UI real** (28/08, `/estabelecimento`). A ressalva
       original — só vale com volume de Salvos/Sinalizações
      pra mostrar algo honesto (ordem de construção do conceito: comunidade antes de painel).
      Começar simples — dois números honestos, nada de dashboard corporativo cedo. Também sem
      design ainda.

## Conexões (feature nova — plano em `docs/plano-conexoes.md`)

Aba de Conexões: amigos, check-in ("tô indo pra X") avisando quem tem conexão, e os lugares salvos
por eles. **Ler o plano antes de começar** — ele traz o veredito contra a regra de ouro do
`conceito.md`, a colisão com a promessa de anonimato e o sequenciamento. Resumo: a peça que serve à
tese (salvos das conexões) vem antes da mais pedida (check-in), e o v1 é sem push.

Depende de duas coisas que ainda não existem: **login no frontend** (fase 3 do `frontend/TODO.md`)
e o **bairro piloto** (item 2 daqui) — sem concentração geográfica a rede de amigos não fecha.

- [x] 23. **Copy do anonimato — resolvido e verificado em 28/08.** A contradição era a home citar
       quem sinalizou enquanto o detalhe prometia anonimato. O card social da home passou a citar
       **comentário** (que é assinado, e por isso pode ser nomeado), e a promessa ficou coerente em
       todo o app: sinal é anônimo, comentário é assinado. O perfil diz isso como texto em vez de
       toggle, porque não há o que desligar — nenhum endpoint expõe autor de sinalização.

## UX / polish

- [ ] 9. **Selo de "promovido" separado do orgânico**, quando o destaque verificado (monetização)
      entrar em jogo — não pode ser ambíguo, é o que preserva a confiança no ranking curatorial.
      O schema já tem `Estabelecimento.plano` (`organico`/`destacado`), mas nada na API de leitura
      usa esse campo hoje.
- [ ] 10. **Distinção clara na interface entre "favoritar lugar" (permanente) e "sinalizar rolê"
       (efêmero)** — pergunta 4 em aberto no `docs/conceito.md`. O hi-fi aposta na hipótese `1e`
       (dois gestos, dois lugares na tela); validar em campo se isso resolve de fato na cabeça do
       usuário, ou se as hipóteses `1f`/`1g` do wireframe voltam à mesa.
- [x] 11. **Ícones do PWA e service worker** — feito em 28/08 (item 36 do frontend). O app agora
       é instalável de fato. A regra que vale registrar: o service worker cacheia a casca
       (JS/CSS/fontes/ícones) e **nunca o dado** — cache de rolê é cache de mentira num produto
       que responde "o que está rolando agora".

## Backend — lacunas que o design revelou

Nenhuma bloqueia a fase 1 do frontend. Ordem por custo/benefício, detalhada em
`docs/plano-frontend.md`.

- [x] 15. **`Role.descricao`** (texto, nullable) + expor em `RolePublic` + aceitar no CRUD do
       curador. É o "motivo pra ir" — o wireframe dedicou 3 telas (`1m`/`1n`/`1o`) a estudar esse
       copy e o schema não tem onde guardá-lo. Sem isso o detalhe do rolê é só título + horário.
       Lembrar do gotcha: migration à mão, no padrão do `0001_initial_schema.py`.
- [x] 16. **`GET /salvos` enriquecido** — feito em 28/08, e não por desempenho: por correção.
       A tela do caderninho montava o rolê de hoje cruzando com `GET /mapa`, que é **filtrado por
       bairro**, então lugar salvo fora do recorte selecionado aparecia como "sem rolê hoje" mesmo
       tendo rolê. O caderninho atravessa bairros por natureza — perguntar isso ao mapa de um
       bairro só era a pergunta errada. Agora a rota devolve `lugar` + `role_ativo`, e as N+1
       chamadas viraram uma. `POST /salvos` segue devolvendo só a confirmação.

### A escada bar simples → lugar com atração (refinamento de 27/08 no `conceito.md`)

O degrau mais simples — bar aberto e com movimento, sem nada programado — hoje é **estruturalmente
invisível** nas duas camadas, embora o backend já calcule o frescor dele.

- [ ] 31. **`/mapa` expor o frescor do próprio lugar.** `MapaPin` só tem `role_ativo.frescor`, então
       um bar cheio sem rolê fica com pin cinza para sempre. `frescor_de_lugar()` já existe e já é
       usado em `GET /lugares/{id}` — falta só incluir no pin. É a menor mudança com mais efeito:
       destrava a "camada social e de novidade" que o `conceito.md` diz ser o valor do mapa.
- [ ] 32. **Decidir se `/descoberta` pode devolver lugar sem rolê.** Hoje ela parte de `Role`, então
       um lugar sem nada publicado nunca aparece na descoberta. Duas saídas: (a) o curador escreve
       um rolê mesmo para oferta simples — mantém um conceito só e é o que o piloto deve fazer; ou
       (b) a descoberta passa a misturar lugares quentes sem rolê. Recomendo (a) agora e (b) só se
       o campo mostrar que faz falta.
- [x] 33. **Vocabulário de categoria cobrindo a base da escada.** Feito em 28/08, junto com a
       mudança que tirou os botões do rolê e os pôs no lugar. `frontend/src/lib/categorias.ts`
       fecha a lista em Boteco, Bar, Feira, Praça, Sarau, Galeria, Casa de show e Balada — nessa
       ordem de propósito: o design partia de Balada e Show ao vivo, e uma lista onde boteco e
       feira aparecem por último conta outra história para quem cadastra.
       **A conferir no R3:** se o campo encontrar lugar que não cabe em nenhuma, a resposta é
       discutir a lista, não reabrir texto livre.

- [x] 34. **A janela de "hoje" da descoberta era UTC, não São Paulo.** Confirmado com teste e
       corrigido em 28/08. O dia ia das 21h de ontem às 21h de hoje no fuso local, então um rolê
       que **começava às 21h** ficava fora do limite superior e sumia — para quem olhava às 20h
       decidindo se saía, a noite inteira estava invisível. Agora `services/descoberta._dia_local`
       calcula o dia em `settings.fuso_local` e converte para UTC; o banco segue todo em UTC.

- [ ] 35. **Não há autocadastro de estabelecimento, e agora dá pra ver isso na tela.** Com o
       painel do dono no ar, a lacuna do R9 deixou de ser abstrata: uma conta de dono sem casa
       vinculada cai num recado explicando que o vínculo é manual. Isso é honesto e sustentável
       enquanto forem poucas casas visitadas a pé — vira gargalo no dia em que não for.
- [ ] 36. **As métricas do painel do dono não têm janela de tempo.** `total_salvos` e
       `total_sinalizacoes` somam tudo desde sempre (`services/engajamento.py`). A tela diz isso
       com todas as letras em vez de fingir uma janela, mas "salvaram esta semana" é a pergunta
       que o dono realmente faz. Exige agregação por período — e provavelmente é o primeiro
       pedido dele depois da conversa.

- [ ] 37. **Decidir se o painel do dono deve contar pessoas ou eventos.** Hoje
       `services/engajamento.py` conta linhas de `Sinalizacao` e a tela rotula como "sinais de
       presença", o que é coerente. Mas a pergunta que o dono faz é "quantas pessoas", e
       provavelmente as duas respostas interessam. Anda junto com o item 36 (janela de tempo).

- [ ] 38. **A busca por localização infere a região dos lugares curados, não de geocodificação.**
       `GET /lugares/proximos` responde "o lugar curado mais próximo é X, a N metros", e a tela
       conclui o recorte a partir daí. É honesto e barato, mas tem um limite: o app **não sabe
       dizer em que bairro a pessoa está** — só a que distância ela está do que a gente curou.
       Enquanto forem dois recortes isso não incomoda. Se um dia a tela precisar dizer "você está
       no Bixiga", aí entra geocodificação reversa (Nominatim, ou os polígonos de bairro da
       Prefeitura), com o custo e a dependência externa que isso traz.
- [x] 39. **Limiar de proximidade calibrado em campo, no mesmo dia.** O chute de escritório era
       1500 m, e o primeiro teste no celular mostrou a tela dizendo "VOCÊ ESTÁ AQUI" para alguém
       a 1,4 km — 17 minutos de caminhada. Agora são três faixas: `aqui` até 700 m, `a-pe` até
       3 km (com o tempo de caminhada, que decide mais que a distância), e `longe` acima disso.
       Só a faixa apertada afirma "aqui", porque o que medimos é a distância até o lugar curado
       mais próximo e não até a fronteira do bairro (item 38) — alguém pode estar dentro da Vila
       Madalena e a 1 km do lugar mais próximo que a gente visitou.

- [~] 44. **[decisão] Agenda recorrente: "quinta é forró" sem alguém publicar toda quinta.**
       **Parte informativa feita** (migration 0005): `Lugar.programacao` é texto livre, aparece na
       ficha sob "toda semana", com a ressalva de que não quer dizer que está rolando agora. Isso
       entrega o valor de leitura — quem abre a página numa terça descobre que quinta tem forró —
       sem tocar em nada de arquitetura.
       **Falta a parte que gera rolê**, e é ela que tem o impedimento. Enunciado original:
       Levantado em 28/08. A ideia: casa com programação fixa não precisa de curador publicando
       semanalmente — a recorrência gera o rolê, e o curador entra só quando há algo **além** do
       calendário. Vale só para as casas que têm programação; a maioria não tem.
       **O impedimento é arquitetural, não de esforço.** O ADR-004 recusou cron/worker nesta fase,
       e o ADR-001 resolveu um problema desta mesma família derivando o frescor na leitura em vez
       de materializar. O caminho coerente seria o mesmo: guardar a regra de recorrência no
       `Lugar` e derivar o rolê de hoje em `listar_descoberta`.
       **Mas há um nó real:** rolê derivado não tem linha no banco, e `Sinalizacao.role_id` e
       `Comentario.role_id` são FK. Um forró de quinta que ninguém pode sinalizar nem comentar não
       acende — e acender é o ponto. As saídas: materializar preguiçosamente na primeira leitura
       do dia (escrita num GET, que é feio mas honesto), ou aceitar o cron e revisar o ADR-004.
       Decidir junto com o 42: se o dono publica (ADR-008), talvez a recorrência seja só um
       formulário que ele preenche uma vez, e o problema desaparece.
- [~] 45. **Foto do lugar, tirada pelo curador em campo.** A ficha já **exibe** a foto em primeiro
       plano (`views/lugar-ficha.tsx`, lendo `fotos[0]`), e o formulário de correção aceita a URL.
       Sem foto, cai no bloco de cor do design — que não é provisório, é a escolha visual do
       hi-fi. Falta o **upload**, e é aí que o impedimento continua de pé. Enunciado original: Decidido em 28/08 que a origem é a foto
       do curador — coerente com a tese e sem problema de direito de imagem. **Impedimento: não
       existe armazenamento de arquivo em lugar nenhum do projeto**, nem local nem em nuvem.
       `Lugar.fotos` existe como lista de URLs desde a migration inicial, nunca foi usada e nunca
       foi renderizada.
       Depende do R7: o destino do deploy decide onde os arquivos moram, e a maior parte dos PaaS
       tem disco efêmero — foto salva em disco some no próximo deploy. Ou entra armazenamento de
       objeto (S3/R2) desde o começo, o que pede conta e chave. **Não começar antes do R7.**

- [ ] 46. **Dropar `Lugar.horario_funcionamento`.** A migration 0006 adicionou `horarios`
       (estruturado) e **não** removeu o texto livre, de propósito: havia um registro real
       preenchido em campo ("segunda a sexta - 12:00 às 01:00", no Bar do China) e dropar junto
       perderia o dado. Ele foi convertido para faixa na mão e a interface já não lê mais a coluna
       antiga. Expandir, migrar, contrair — falta contrair. Conferir que nada lê antes de dropar.

### O motor de contribuição — quatro decisões que são a mesma (28/08)

Estavam soltas sob a subseção da "escada", que trata de outro assunto. Ficam juntas porque **não se
decidem separadas**: as quatro respondem quem pode afirmar o quê no app, e mexer numa move as
outras.

O nó é este. O `conceito.md` classifica o frescor como o motor de incentivo **mais fraco** ("começar
só com curadores e engajados — já, com cautela"), e o ADR-006 implementou essa cautela. A
consequência apareceu no uso: quem entra com conta comum acha um app onde entrar não muda nada
(item 40). Liberar sem mais nada devolveria o problema que o item 34 já mostrou ser real — sinal
forjável. As duas hipóteses registradas hoje (ADR-008 e ADR-009) são tentativas de sair desse
impasse por caminhos diferentes: uma tira a dependência do curador para a **oferta**, a outra
ancora o **sinal** em estar lá.

Ordem sugerida de decisão: 43 primeiro (ele destrava o 40 e resolve o 41 de graça), depois 42, que
depende do R9 e da conversa com o dono.

- [ ] 40. **[decisão] O que uma conta comum ganha ao entrar?** Hoje: salvar lugar e comentar. Não
       sinalizar (ADR-0006). Testado em 28/08 com conta comum de verdade — salvar 201, comentar
       201, sinalizar 403. Comentar acabou de ser destravado na interface, mas a pergunta de
       produto continua: **"Tô indo" é a ação-título do app e a conta comum não a tem**, o que faz
       entrar parecer não mudar nada.
       Três saídas, e nenhuma é óbvia: (a) manter restrito até haver comunidade, que é o que o
       ADR-0006 decidiu e continua defensável enquanto o frescor for o ativo mais frágil;
       (b) liberar para todos e aceitar que o sinal fica forjável — o item 34, hoje resolvido pela
       contagem por pessoa, mostra que isso não é hipotético; (c) o caminho do `plano-conexoes.md`
       (item 24): o check-in de conta comum aparece para as conexões dela e **não** alimenta o
       frescor público. A (c) resolve a sensação de app morto sem entregar o motor de confiança,
       mas depende do backend de Conexões (itens 27–30), que não existe.

- [ ] 41. **Frescor não devia ser calculável antes de o rolê começar.** Descoberto em 28/08,
       preparando a conversa com o dono: às 11h30 o card de um rolê marcado para as 21h dizia
       "Começando a encher", por causa de um sinal das 09h58. O frescor afirma "tem gente lá
       agora"; antes de `data_inicio` isso não pode ser verdade, e sinalizar às 10h para um rolê
       da noite é sinalizar o quê?
       Duas saídas: ignorar sinal anterior a `data_inicio` no cálculo (barato, resolve o sintoma),
       ou recusar a sinalização antes de o rolê começar (mais honesto, mas fecha a porta para o
       "tô indo" como intenção — que é justamente o que o item 40 tem em aberto). Decidir junto
       com o 40, porque são a mesma pergunta vista de dois lados.

- [ ] 42. **[hipótese] Estabelecimento publica o próprio rolê, com atribuição.** ADR-008 do
       backend, status **proposto** — depende do que a conversa com o dono responder. É o motor
       mais forte da tabela de incentivos do `conceito.md` ("bar quer público", fase "Já") e o
       único que não sofre de cold start; hoje não existe, e o painel do dono é só leitura.
       Trabalho previsto, se confirmado: (a) permitir `dono_estabelecimento` criar `Role` só em
       lugar da própria casa; (b) expor a origem derivada de `Role.criado_por`, que já existe no
       banco e nunca foi exposta — sem coluna nova; (c) mostrar a atribuição no card. Depende do
       R9, porque sem `estabelecimento_id` preenchido não há posse a verificar.

- [ ] 43. **[hipótese] "Tô aqui" — sinal de presença verificado por proximidade.** ADR-009 do
       backend, status **proposto**. `POST /sinalizacoes` passa a receber `lat`/`lng` e o servidor
       recusa fora do raio; a coordenada é conferida e descartada, nunca guardada. Resolve a
       incoerência de o botão dizer intenção e o dado gravar presença — e **destrava o item 40**,
       porque sinal verificado deixa de ser ruído quando qualquer um pode dar. Resolve o 41 de
       graça: não dá para marcar às 10h da manhã um rolê das 21h se você não está lá.
       Custos registrados no ADR: não prova nada (GPS de navegador se falsifica), não distingue
       bares vizinhos, e o erro de GPS é pior justamente dentro do bar. O raio começa em ~150 m e
       **precisa ser calibrado no R8** — o limiar da busca por bairro nasceu de um chute de 1500 m
       e caiu para 700 m no primeiro teste em aparelho real.
       Separa em duas ações: "Tô aqui" (no lugar, com GPS, alimenta o frescor) e "Tô indo" (de
       casa, sem GPS, avisa amigos — a fase 2 do `conceito.md`).

### Backend da feature de Conexões (ver `docs/plano-conexoes.md`, seções 5 e 6)

- [ ] 27. **Entidade `Conexao`** — `solicitante_id`, `destinatario_id`, `status`
       (`pendente`/`aceita`/`bloqueada`), `created_at`, `respondida_em`. Uma linha por par, com as
       consultas olhando as duas direções (não duplicar em duas linhas). `unique` no par, `check`
       impedindo auto-conexão, índice em `(destinatario_id, status)`. **Gotcha:** o enum novo
       precisa passar por `_pg_enum()` em `db/models.py`, não por `sa.Enum(...)` direto.
- [ ] 28. **Rotas de conexão** — `POST /conexoes/convite` (link de uso único),
       `POST /conexoes/aceitar`, `GET /conexoes`, `DELETE /conexoes/{id}`. Conexão é sempre
       **recíproca**, nunca unilateral: é segurança, não só simetria de produto.
- [ ] 29. **Check-in.** Provavelmente **não precisa de tabela nova** para o caso comum: um check-in
       é uma `Sinalizacao` de `tipo=presenca`, que já existe — o que falta é uma consulta com
       escopo (`GET /conexoes/agora`, presenças das minhas conexões nas últimas 2h) e
       `DELETE /checkins/{id}`, que resolve de quebra o "Cancelar meu sinal" desenhado no `2e` e
       sem rota até hoje. **Exceção:** o check-in por bairro (sem lugar exato, para quem quer
       avisar sem se localizar) não cabe na `Sinalizacao` — a constraint `ck_sinalizacao_um_alvo`
       exige um alvo. Modelar como entidade própria em vez de relaxar a constraint: a
       `Sinalizacao` é o motor de frescor e não deve ganhar semântica de presença difusa.
- [ ] 30. **Salvos visíveis para conexões** — campo `salvos_visiveis_para_conexoes` em `Usuario`
       (default **false**), `PATCH /usuarios/me/privacidade` e `GET /conexoes/salvos`. Opt-in
       explícito e desligado por padrão, como o `conceito.md` pede para o motor social.

## Técnico / infra / testes

- [ ] 12. **Deploy de produção.** Hoje só existe `docker compose up -d` local. Plano registrado em
       `docs/arquitetura-backend-frontend.md`: Railway/Fly.io/Render pro backend, Vercel pro
       Next.js, Postgres gerenciado com PostGIS. Pré-requisito: `JWT_SECRET` vindo do ambiente
       (o default em `config.py` é um placeholder).
- [ ] 13. **Decidir se o cron de expiração/decaimento é necessário.** A arquitetura acordada
       previa "cron simples pra expirar rolês e decair sinalizações"; o backend construído não tem
       nenhum — frescor é 100% calculado na leitura (`services/frescor.py`, ADR-0001). Provavelmente
       suficiente pro piloto; a decisão é só registrar isso (atualizar o doc de arquitetura) ou
       medir e concluir que precisa de job.
- [ ] 14. **Definir CI** (rodar `ruff check .`, `mypy src`, `pytest` do backend automaticamente) —
       hoje esses comandos só rodam manualmente, e dependem de um Postgres+PostGIS no ar. Depende da
       task 1 (sem commit não há o que rodar CI em cima).

## Fora de escopo por enquanto (decisão registrada, não esquecida)

- Fila/worker/Redis — ADR-0004, só entra se leitura em tempo real virar problema medido.
- Ranking algorítmico em `/descoberta` — hoje é curatorial + tiebreaker de frescor, de propósito.
- Refresh token / 2FA — ADR-0003, expiração longa (30 dias) é suficiente pro piloto.
- Social (compartilhar com amigos) — fase 2, ver `docs/conceito.md`.
- Pruning automático de `sinalizacao` — tabela pequena no piloto; deletar manualmente se crescer.
