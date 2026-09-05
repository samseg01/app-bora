# TODO — bora-roles (visão geral)

> `- [ ]` backlog · `- [~]` fazendo · `- [!]` bloqueado · `- [?]` em teste · `- [x]` feito
> Lido pelo app Kanban; o marcador é o que aparece na coluna.

Tasks de escopo do monorepo (produto, decisões cross-cutting). Para tasks internas de cada parte,
ver `backend/TODO.md` (esqueleto completo) e a seção **Frontend** deste arquivo — das telas do
hi-fi só falta o `2b` (onboarding de gostos), e por decisão.

**Um arquivo só.** As tarefas do frontend viviam em `frontend/TODO.md` e foram trazidas para cá em
28/08. Os itens de tela levam o prefixo **F** (`F17`, `F21`) porque a numeração colidia — existia
"item 15" nos dois arquivos, querendo dizer coisas diferentes. Itens sem prefixo são de produto,
backend ou infra; `P`, `C`, `S` e `X` são partição, curador, sugestão e conexões.

## Por onde começar (revisto em 02/09)

Em 01 e 02/09 saiu bastante código: o regressivo virou um comando, o ADR-009 foi aceito e a
presença verificada foi construída (itens 40, 41, 43, 57, 58). O que **não** saiu continua sendo o
mesmo de 31/08 — e ficou mais urgente, porque agora existe uma feature inteira cuja validação
depende de alguém ir à rua:

1. **R3 + R8, na mesma noite — curadoria a pé, agora com o telefone na mão.** É seu, e é o
   gargalo. **Dois lugares em República** hoje (Bar do China e Tokyo); a meta são 10 a 15. Nada
   que se construa substitui isso, e o app já está pronto o bastante para que construir mais seja
   fuga.
   Desde 02/09 os dois viraram a mesma caminhada: o curador anda o recorte, cadastra o lugar,
   **mede o raio de pé na porta** (itens 57 e 58) e **testa o "Tô aqui" lá dentro** — que é a
   única coisa capaz de dizer se a feature de presença funciona ou se ela recusa quem está mesmo
   lá. Fazer em duas viagens seria andar o bairro duas vezes.
2. **R7 — deploy.** O app só existe nesta máquina, e um dia inteiro já dependeu de túnel — três
   quedas e quatro URLs. Precisa de contas suas. O detalhe que decide o provedor é o **PostGIS**,
   que nem todo Postgres gerenciado entrega. Destrava também o item 45 (foto), parado à espera de
   onde os arquivos vão morar.
3. **R9 — escrever o script do vínculo.** A decisão está fechada (ADR-010: o curador vincula em
   campo, num ato transacional); hoje o vínculo do Bar do China foi feito **direto no banco**.
   Vira urgente no minuto em que a conversa do R10 der certo.
4. **Item 48 — categoria dos dois lugares reais.** Dez minutos de painel, e é o que faz a demo do
   R10 não abrir com card sem cor.

Depois disso, o bloco de decisões 40–43, que só se resolvem juntas (o 44 saiu em 29/08).

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
      degradação para sinal ruim. A caçada está contada no registro de 28/08 mais abaixo.
      ✅ **Confirmado em navegador.** Levou uma caçada: o container `absolute inset-0` resolvia
      para altura 0 e o MapLibre caía num fallback interno de 400x300, sem emitir erro nenhum.
- [~] R7. **Deploy** (item 12). **Provedor decidido em 03/09** (ADR de raiz 0001) e **a VPS foi
      assinada em 05/09**. Uma VPS só em São Paulo (Hostinger KVM 2) rodando os quatro serviços:
      Postgres+PostGIS, FastAPI, Next SSR e Caddy à frente. Front e back na mesma origem, sem CORS.
      **O que era "falta executar" virou código em 05/09** e está em `docs/features/deploy.md`:
      `docker-compose.prod.yml` na raiz, `deploy/Caddyfile`, `frontend/Dockerfile` +
      `output: "standalone"`, `.env.producao.example` (o compose recusa subir sem `JWT_SECRET`,
      `POSTGRES_PASSWORD`, `DOMINIO` e `ACME_EMAIL`), a **5432 fora** da host, `deploy/backup.sh`
      (cron no servidor) e `scripts/puxar-backup.ps1` (tira o dump da máquina — é este que fecha o
      requisito do ADR). O stack inteiro foi **exercitado localmente**: Caddy roteando, SSR
      chegando na api pela rede interna, signup/login e `pg_dump` íntegro.
      **O app subiu em 05/09: `https://179-199-145-189.sslip.io`** (VPS em Campinas, TLS do
      Let's Encrypt). Verificado de fora: `/health`, redirecionamento para a abertura, home
      renderizando por SSR — o que prova o fetch interno até a api — e latência de **18 ms de
      conexão**, que encerra a ressalva de Campinas do ADR.
      **Falta para fechar:** (a) levar a curadoria para o banco de produção, que está vazio — os
      dois lugares de República só existem no banco desta máquina; (b) promover um curador lá
      (`scripts/promote_role.py`); (c) **ligar o backup dos dois lados** — cron no servidor mais
      `scripts/puxar-backup.ps1` aqui. O (c) não é opcional: o ADR diz que sem `pg_dump` saindo
      da máquina o R7 não está concluído.
- [ ] R8. **[campo] Testar no celular de verdade, no bairro, em 4G.** Cresceu muito em 02/09: era
      só a ressalva de altura, e virou o único juiz da feature de presença. **Cinco perguntas, e a
      segunda é a que decide se a feature presta:**
      1. **Altura das duas camadas na home** (item F19) — a pergunta original, pendente desde o
         começo: o mini-mapa cabe sem scroll num telefone real (~650px úteis) ou fica abaixo da
         dobra? Se não couber, encolher o mapa; **não** virar abas, porque a convivência vertical
         é a tese da tela.
      2. **"Tô aqui" aceita quem está mesmo lá?** O modo de falha que a suíte não consegue
         reproduzir: coordenada de teste não é GPS, e o erro real piora justamente **dentro** do
         bar, entre prédios altos — 50 a 200 m, segundo o ADR-009. Punir o honesto é a pior falha
         possível desta feature, e só este teste a revela. Entrar no bar, tocar, ver o que
         acontece.
      3. **Calibrar o padrão de 150 m** (`presenca_raio_padrao_metros`). É chute de escritório, e
         o precedente do item 39 é forte: o limiar da busca por bairro nasceu de 1500 m e caiu
         para 700 m no primeiro teste em aparelho real, no mesmo dia.
      4. **Medir o raio de cada casa curada** e gravar pelo painel (itens 57 e 58). Isto **é** o
         R3: quem está na calçada curando o lugar é quem mede. Fazer as duas coisas em viagens
         diferentes seria andar o bairro duas vezes.
      5. **Confirmar que o GPS existe pelo túnel.** `navigator.geolocation` **não existe** fora de
         contexto seguro — em HTTP de rede local a feature inteira cai em "sem-suporte". Precisa
         do túnel HTTPS do `frontend/CLAUDE.md`, incluindo o segundo túnel (o da API), senão
         sinalizar nem sai do telefone.
      **Faça junto com o R3, na mesma noite.** Depois de 02/09 são a mesma caminhada: o curador
      anda o recorte, cadastra o lugar, mede o raio de pé na porta e testa o "Tô aqui" lá dentro.
- [ ] R9. **Vincular uma casa já curada ao dono dela** (item 3). **Decisão fechada em 29/08 (ADR-010);
      falta escrever o script — ninguém está nele agora.**
      O enunciado mudou: não existe "cadastrar estabelecimento". `Estabelecimento` não é a casa (não
      tem geografia, bairro nem endereço) — é a **conta comercial do dono**, e a casa já entra no app
      como `Lugar`, no R3. O que falta é o vínculo.
      **Quem faz:** o curador, num ato único e transacional (cria o `Estabelecimento`, vincula o
      `Lugar` existente, promove o papel). O **dono cria a própria conta** por signup normal — o
      curador não manuseia senha de ninguém.
      **O que derrubou o autocadastro:** ele não tem saída boa. Ou o dono cria só a conta e nasce um
      **órfão** (o banco aceita: `Estabelecimento` não tem FK para `Lugar`, e o painel responde `[]` e
      zeros), ou ele cria a casa junto e um `Lugar` entra no app **sem ninguém ter ido lá** — a única
      coisa que o produto não pode fazer.
      **Falta implementar:** `scripts/vincular_estabelecimento.py`, no molde do `promote_role.py`.
      Sem rota HTTP: um endpoint "criar estabelecimento" isolado é a porta do órfão.
      **A conversa com o dono que você já conhece pode acontecer antes de tudo isso** — como ensaio,
      mostrando o canvas de design no celular. Não vira o bairro piloto por isso, e ensina como a
      conversa corre sem custar nenhuma semana.
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


### A tarde de 28/08 — a ficha do lugar e o que ela puxou

O pedido foi "uma tela de estabelecimento com alguns campos". O que apareceu no caminho foi que
**não havia tela de lugar nenhuma**: só `/role/[id]`, então um lugar sem rolê hoje era inalcançável
na interface — justamente o degrau de baixo da escada do `conceito.md`.

- [x] **`/lugar/[id]`, a ficha da casa**, nas duas visualizações, com foto em primeiro plano e o
      bloco de cor do design como alternativa. O nome do lugar virou link no detalhe do rolê, no
      caderninho e na gaveta do mapa; o "Sem rolê hoje", que era um `span` morto, virou a porta
      para ela.
- [x] **Migrations 0004, 0005 e 0006** — a ficha: descrição, instagram, preço da longneck com a
      data em que foi visto, programação da semana e funcionamento estruturado em faixas.
- [x] **Preço nunca aparece sozinho.** Vem com "visto em 28/08": um número sem idade vira promessa
      que a casa não pode cumprir. O servidor carimba, e corrigir recarimba.
- [x] **Funcionamento virou dado, não texto** — botões de dia e roleta de hora. Eu tinha defendido
      o texto livre olhando só o custo de manutenção; a estrutura devolve **"esta casa está aberta
      agora?"**, que é a pergunta do produto. Inclui o caso que erra fácil: às 00h30 de sábado quem
      está aberto é a faixa de **sexta** que atravessa a meia-noite.
- [x] **Programação separada do rolê.** "Toda semana" é o que a casa costuma ter, declarado; rolê é
      o que alguém foi ver hoje, verificado. A tela diz isso — mesma fronteira do ADR-008.
- [x] **Balão no pin do mapa** levando à ficha. O pin era um ponto colorido sem nome, e na home e
      no detalhe do rolê, que não têm gaveta, não levava a lugar nenhum.
- [x] **`GET /salvos` enriquecido** (item 16) — e não por desempenho: a tela resolvia "tem rolê
      hoje?" pelo `GET /mapa`, que é filtrado por bairro, e dizia "sem rolê hoje" para lugar salvo
      de outro recorte **mesmo tendo rolê**.
- [x] **Conta comum conseguia salvar e mais nada.** Comentar estava trancado dentro da confirmação
      de sinalização — que exige um papel que ela não tem. A única contribuição permitida era
      inalcançável.
- [x] **O "Tô indo" cinza saiu.** CTA primário desabilitado por regra de negócio lia como app
      quebrado. E o texto que o substituiu foi reescrito: falava da fragilidade do app, que é
      conversa de bastidor.
- [x] **ADR-008 e ADR-009 propostos** — o estabelecimento publicando com atribuição, e o sinal de
      presença verificado por proximidade. Os dois esperam a conversa.
- [x] **Corrigir lugar** cobre a ficha inteira, com rótulo em cada campo: a primeira versão eram
      sete caixas de texto sem nome, e o formulário abre com tudo preenchido, então o placeholder
      já tinha sumido.

## Correções críticas

- [x] 1. **Versionar o projeto.** Feito: repositório único na raiz, commit inicial `d44aa40` com
      161 arquivos. O `.git` vazio do backend foi retirado (não tinha commits nem remotes).
      Conferido que `.env` real, `node_modules`, `.next` e os canvas gerados ficaram de fora.
- [x] 1b. **Criar o remote e dar push.** Feito — ver R2.
- [x] 2. **Bairro piloto: Anhangabaú.** Pergunta 1 de `docs/conceito.md`, respondida. Ver R1.
- [x] 3. **Decidido em 29/08 — ADR-010: quem vincula é o curador, em campo.** O autocadastro do dono
      foi rejeitado, e não por contrariar o ADR-0007: por não ter saída boa (órfão, ou lugar sem
      visita). Este item era a **decisão**, e ela saiu; a implementação do script é o **R9**, e o
      card dela é o R9 — estavam os dois em "Fazendo" dizendo a mesma coisa duas vezes.
      Enunciado original:
      Decisão de produto: curador cadastra em campo? Dono faz onboarding self-service (contraria
      ADR-0007 de promoção manual de papel, então provavelmente não)? Definir antes de implementar a
      rota.

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
      (fase 3 da seção Frontend). Detalhes nos itens C3–C6.
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

Depende de duas coisas que ainda não existem: **login no frontend** (fase 3 da seção Frontend)
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
- [ ] 10. **[campo] Validar a distinção entre "favoritar lugar" e "sinalizar rolê".**
       **A interface já implementa** a hipótese `1e` — são dois gestos em lugares diferentes:
       salvar mora no lugar (coração no detalhe e na ficha), sinalizar mora no rolê ("Tô indo").
       O que continua aberto é o que sempre foi: **validar em campo** se isso resolve na cabeça de
       quem usa, e é pergunta 4 do `conceito.md`, não tarefa de código. Enunciado original: o
       hi-fi aposta na hipótese `1e`
       (dois gestos, dois lugares na tela); validar em campo se isso resolve de fato na cabeça do
       usuário, ou se as hipóteses `1f`/`1g` do wireframe voltam à mesa.
- [x] 11. **Ícones do PWA e service worker** — feito em 28/08 (item F36). O app agora
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
- [x] 17. **`sinais_recentes` em `RolePublic`** — feito em 29/08. É o "6 sinalizaram nas últimas
       2h" do hi-fi, e conta **pessoas distintas**, não linhas. A janela é a warm (2h) e não a live
       (30min): contar na janela curta daria um número menor que o frescor exibido na mesma tela, e
       as duas coisas se contradiriam. Vive em `contar_sinais_de_role()` porque só a tela de
       detalhe precisa do número — os outros seis pontos que calculam frescor o descartariam. Zero
       vem como 0 e a tela esconde o bloco: "0 sinalizaram" é pior que silêncio.
- [x] 18. **`GET /auth/me`** — nome e data de cadastro pro perfil (`2h`). O papel não precisa dele:
       já viaja dentro do JWT e o front decodifica client-side pra decidir o gating de UI.
- [ ] 19. **`lat`/`lng` em `RoleDescoberta`** (o `lugar_id` saiu) — `lugar_id` feito em 28/08: sem ele o
       botão Salvar da home ficava `disabled` por falta de dado (parecia regra de produto e era
       lacuna de schema). `lat`/`lng` continuam de fora — só entram junto com a distância "a pé",
       que precisa de geolocalização e ainda não tem tela.
- [x] 20. **`DELETE /sinalizacoes/{id}`** — feito, junto com `GET /sinalizacoes/minhas`, que é o
       que faz o "Tá marcado" sobreviver a sair da tela e voltar.
- [x] 21. **`Lugar.endereco`** — feito em 28/08 (migration 0003, nullable). O lugar já era
       localizável por `geo`, então o endereço é para quem lê e vai a pé, não para o sistema —
       e é opcional porque exigir o número transformaria uma anotação de calçada num formulário.
       O JSON do seed já trazia o campo e o script o ignorava em silêncio; agora grava.


### A escada bar simples → lugar com atração (refinamento de 27/08 no `conceito.md`)

O degrau mais simples — bar aberto e com movimento, sem nada programado — hoje é **estruturalmente
invisível** nas duas camadas, embora o backend já calcule o frescor dele.

- [x] 22. **Seed de desenvolvimento.** Hoje popular o banco exige criar usuário, promover a curador
       via `scripts/promote_role.py` e cadastrar lugares/rolês na mão. Um seed com a Vila Madalena
       fictícia (14 lugares, 3 rolês, comentários, sinalizações recentes) faz o frontend ter contra
       o que rodar desde o primeiro dia, e reproduz os estados `live`/`warm`/`new` de propósito.

- [x] 31. **`/mapa` expõe o frescor do próprio lugar** — feito em 29/08. `MapaPin.frescor` vem de
       `frescor_de_lugar()`, que já existia e só era usado em `GET /lugares/{id}`. O pin usa o
       frescor do rolê quando há um e cai no do lugar quando não há — antes um bar cheio numa terça,
       sem nada programado, ficava apagado para sempre. Vale no mapa real, no abstrato e na gaveta.
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

- [x] 35. **Não há autocadastro de estabelecimento — e, desde o ADR-010, não vai haver.** Com o
       painel do dono no ar, a lacuna do R9 deixou de ser abstrata: uma conta de dono sem casa
       vinculada cai num recado explicando que o vínculo é manual. Isso é honesto e sustentável
       enquanto forem poucas casas visitadas a pé — vira gargalo no dia em que não for.
       O que muda com o ADR-010: esse recado deixa de ser estado provisório e passa a ser o desenho.
       O gargalo, quando vier, vira **tela no painel do curador**, não onboarding do dono.
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

- [x] 44. **[decisão, 29/08] A programação fixa fica informativa. Não gera rolê.**
       `Lugar.programacao` aparece na ficha sob "toda semana", e o rolê de cada noite continua
       sendo publicado por alguém. Fechado por decisão, não por implementação.

       **Por que não gerar.** Um rolê nascido de recorrência é um rolê que ninguém foi ver — é
       declaração, não observação, e é a mesma linha que o ADR-008 traça. Mas o argumento que
       decidiu foi outro: **o modo de falhar do automático é pior que o do manual.** Se a casa
       cancelar o forró numa quinta, o cron publica assim mesmo; um humano não publicaria. Num
       produto que se vende por não afirmar o que não sabe, errar para o lado de publicar demais
       é pior do que publicar de menos.

       **O que foi descartado junto:** revisar o ADR-004 para admitir cron, e materializar o rolê
       preguiçosamente durante um `GET` — as duas saídas técnicas ficam sem uso.

       **O que reabre isto:** o curador reclamar de republicar o mesmo rolê toda semana (aí a
       saída é um toque de confirmação no painel, não automação), ou o ADR-008 ser aceito e o dono
       passar a preencher a programação — nesse caso quem afirma é a casa, e a pergunta muda.
- [!] 45. **Foto do lugar, tirada pelo curador em campo. Bloqueado: destrava com o R7** — o deploy
       é que decide onde os arquivos moram, e falta conta e chave de armazenamento de objeto
       (S3/R2). A ficha já **exibe** a foto em primeiro
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

- [x] 47. **Tags do lugar, e o pin apagado que parecia inexistente.** Feito em 30/08, os dois juntos
       porque eram a mesma queixa: olhar o mapa e não ver o que existe.
       **O pin:** `--color-pin-off` era `#6a5f88`, praticamente `--color-muted-3` (`#6f6690`), a cor
       de **texto desabilitado** — sobre o dark-matter o lugar sumia, e quem olhava concluía que ali
       não havia nada, quando havia uma casa visitada a pé. Agora é lilás claro (`#ded4ff`) e o pin
       subiu de `h-2.5` para `h-3`. **Neutro de propósito:** magenta, âmbar e ciano continuam
       significando "está acontecendo agora", que é o que não podia ser diluído — um pin sem rolê
       tão chamativo quanto um `live` mataria a leitura do mapa.
       **As tags:** migration 0007, `ARRAY(String)` nullable como `fotos`. Vocabulário fechado em
       `frontend/src/lib/tags.ts` (21 tags, máximo 6 por lugar), coluna livre no banco — o mesmo
       arranjo de `categoria`, para a lista crescer sem migration. Entram no cadastro e na correção
       de lugar, e aparecem na ficha. **Só exibem, não filtram**, por decisão: com dois lugares
       curados não há o que filtrar, e o passo, quando houver, é um índice GIN na mesma coluna.
       **O que isso resolve, concretamente:** o Bar do China está no banco com `categoria = "forró"`,
       que nem existe no vocabulário fechado. Não era descuido — era falta de onde pôr "tem forró".
       Ver item 48.
- [x] 48. **`categoria` dos dois lugares reais — corrigido em 03/09, e quem denunciou foi a cor.**
       O Bar do China estava como `"forró"`, que é gênero musical e não categoria. Com a camada 2
       no ar, o card dele simplesmente **não colorava** — o `corDaCategoria` cai em neutro fora do
       vocabulário, de propósito. O sintoma apontou direto para o dado.
       Corrigido: `categoria = 'Boteco'` e **`Forró` foi para as tags**, que é onde essa
       informação sempre pertenceu — o vocabulário de `lib/tags.ts` já tinha a entrada esperando.
       O rolê dele herdava a categoria errada e foi junto.
       **O Tokyo estava certo o tempo todo:** `"Bar"` bate com `CATEGORIAS_LUGAR`, que é
       capitalizado. Este item suspeitava dele pela caixa alta, e a suspeita era infundada — o
       mapeamento compara sem caixa, então `"bar"` dos fictícios também funciona.
       **Fica a propriedade que isso revelou:** cor que não aparece quando o dado é inválido é
       melhor que cor inventada. O fundo do problema segue de pé — `Lugar.categoria` é
       `String(60)` livre e nada impõe o vocabulário no servidor.
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

**Atualização de 01/09: o 43 foi decidido** — ADR-009 aceito, com raio por rolê e a separação entre
"Tô indo" e "Tô aqui" (item 51). Então o 40 está destravado e o 41 resolvido de graça, os dois
esperando só a implementação de fase 2. Sobra o 42, que segue dependendo do R9 e da conversa.

- [x] 40. **[decisão] Resolvido em 02/09: a conta comum ganha "Tô aqui".** A restrição do ADR-006
       caiu junto com o motivo dela — o sinal era autodeclarado e por isso forjável, e agora a
       âncora é a coordenada conferida no servidor, não o papel de quem toca. Entrar no app passou
       a mudar alguma coisa. Nenhuma das três saídas listadas abaixo foi a escolhida: a resposta
       veio do 43. Enunciado original:
       **O que uma conta comum ganha ao entrar?** Hoje: salvar lugar e comentar. Não
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

- [x] 41. **Resolvido de graça pelo 43, em 02/09.** Não dá para estar fisicamente no lugar às 10h
       da manhã de um rolê das 21h — a verificação de proximidade fecha esta porta sem regra
       extra, que é exatamente o que o ADR-009 previa. Enunciado original:
       **Frescor não devia ser calculável antes de o rolê começar.** Descoberto em 28/08,
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

- [x] 43. **"Tô aqui" — implementado em 02/09.** `POST /sinalizacoes` recebe `lat`/`lng`, o
       servidor confere contra o raio e recusa com 403 dizendo a distância e o limite; a coordenada
       é conferida e descartada. Duas ações na tela, e o ciclo intenção→presença na mesma linha.
       7 testes novos em `test_presenca_verificada.py`. Doc: `docs/features/presenca-verificada.md`.
       **Falta o R8:** nada disso foi exercitado com GPS real, e o modo de falha mais provável —
       recusar quem está mesmo lá — é o que a suíte não reproduz. Enunciado original:
       **"Tô aqui" — sinal de presença verificado por proximidade. DECIDIDO em 01/09.** ADR-009
       do backend, status **aceito** (ver item 51 para as duas emendas: raio por rolê e a separação
       em duas ações). Deixou de ser hipótese; o que resta aqui é a implementação, que é fase 2. `POST /sinalizacoes` passa a receber `lat`/`lng` e o servidor
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

- [ ] 24. **Decidir se check-in de usuário comum alimenta o frescor público.** Recomendação do
       plano: **não** no v1 (mantém o ADR-0006 intacto), e reavaliar com dado depois. Frescor
       errado destrói confiança mais rápido que frescor ausente. Seja qual for a escolha, vira
       **ADR novo ou emenda ao 0006** — não decisão implícita no código.
- [x] 25. **Desenhar a aba de Conexões.** Feito: `docs/front-end-ideias/conexoes/` — aba em desktop
       e telefone, estado vazio, convite e confirmação de check-in. O estado vazio resolve o cold
       start colocando os salvos do curador no lugar, para a aba nunca nascer morta; o convite
       lista o que a pessoa passa **e não passa** a ver; o check-in materializa o copy novo do
       anonimato (item 23). **Falta desenhar:** o selo "N conexões salvaram" no card de descoberta.
- [ ] 26. **Backend: `Conexao` + check-in + salvos compartilhados.** Detalhado abaixo, na seção do
       backend (itens 27–30).

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

## Presença verificada e chat do rolê (features novas — specs em `docs/`)

Duas specs escritas em 01/09 e movidas da raiz para `docs/plano-presenca.md` e
`docs/plano-chat-role.md`. Não foram para `docs/features/` porque aquele diretório é do que **foi
construído**; estas descrevem o que ainda não existe, então ficam ao lado do `plano-conexoes.md`,
que é do mesmo tipo. As referências cruzadas internas foram corrigidas (as duas apontavam para
`conceito-app-role.md`, que é a cópia dentro do bundle de design, não `docs/conceito.md`).

**As duas specs se declaram fase 2, não MVP** — e a razão é a mesma do `conceito.md`: presença
precisa de densidade que não existe no dia 1, e "0 pessoas aqui" em tudo é pior que não mostrar
nada. Nada aqui compete com o R3.

**O que elas mudam no que já estava no quadro:** a spec de presença **decide** o que o item 43
tinha como hipótese — autodeclaração por toque, sem checagem, fica descartada. Ver o item 51.

- [x] 51. **[decisão] ADR-009 aceito em 01/09 — com duas emendas.** A contradição era esta: as
       specs de fase 2 afirmavam como regra fechada que só sinaliza quem está no lugar, enquanto o
       ADR-009 estava "proposto" e o item 43 dizia "[hipótese]". Resolvido aceitando o ADR, com
       duas mudanças em relação ao texto de 28/08:
       **(1) O raio é do rolê, não uma constante global.** Definido na criação, por quem cria — o
       curador, que esteve lá e é o único no fluxo que sabe o tamanho do lugar. O texto proposto
       fazia dele configuração única (~150 m para tudo), e um número global erra nas duas direções
       ao mesmo tempo: apertado para uma festa de rua, largo demais para separar dois bares
       vizinhos do Arouche. Vira o item 57 (schema) e o 58 (painel).
       **(2) "Tô indo" e "Tô aqui" são duas ações**, e isso é parte da decisão, não desdobramento:
       "Tô indo" é de fora, sem GPS, avisa quem te acompanha; "Tô aqui" é dentro do raio,
       verificado no servidor, e é o único que alimenta o frescor.
       Isso **destrava o item 40** (sinal verificado deixa de ser forjável, então pode ser liberado
       para conta comum) e **resolve o 41 de graça** (não dá para estar no bar às 10h da manhã de
       um rolê das 21h).
- [x] 57. **Raio de presença no schema — feito em 02/09, e no `Lugar`, não só no `Role`.**
       Migration `0008_raio_de_presenca`: `lugar.raio_metros` (o padrão da casa, medido em campo),
       `role.raio_metros` (a exceção, sobrescreve) e o valor `intencao` no enum. A cascata vive em
       `services/presenca.raio_efetivo()`. Enunciado original:
       **`Role.raio_metros` — primeira consequência de schema do ADR-009.** Coluna nullable com
       migration, e o valor global do `config.py` vira o **default** em vez da regra: obrigar o
       curador a decidir um raio em todo rolê é atrito num formulário que já é longo, e quem não
       preencher precisa cair em algum lugar. A calibração do R8 passa a calibrar o padrão.
       **Pergunta deixada em aberto de propósito:** o raio talvez devesse nascer no `Lugar` (o
       tamanho da casa não muda entre uma quinta e um sábado) e o `Role` só sobrescrever quando
       for exceção — senão é redigitar o mesmo número toda semana. Decidir na implementação.
- [x] 58. **Campo de raio no painel do curador — feito em 02/09**, em `corrigir-lugar.tsx`,
       colado nas coordenadas porque é a mesma pergunta. O texto de ajuda fala em passos ("um
       boteco de esquina são uns 50; uma festa que toma a rua, uns 400") em vez de metros
       abstratos, porque quem preenche está na calçada. Enunciado original:
       **Campo de raio no painel do curador.** Formulário de publicar rolê. Sem isto a coluna
       do item 57 existe e ninguém consegue preencher — e o valor só é bom se vier de quem esteve
       no lugar.
- [ ] 52. **[decisão] Método da verificação: geofence por GPS ou QR lido no local.** É a pergunta
       que ficou em aberto nas **duas** specs, e o ADR-009 só previa GPS. O QR é mais à prova de
       fraude mas depende do estabelecimento e acrescenta um passo — ou seja, empurra a decisão
       para depois do R10, porque exige parceiro. Junto vem a tolerância do perímetro: o ADR-009
       chuta ~150 m e manda calibrar no R8, e o precedente do item 39 é forte — o limiar da busca
       por bairro nasceu de 1500 m de escritório e caiu para 700 m no primeiro teste real.
       O caso difícil que as duas specs nomeiam: GPS erra pior justamente **dentro** do bar, em
       subsolo e em prédio alto — e o perímetro precisa aceitar quem está na fila sem aceitar quem
       está na esquina.
- [ ] 53. **Chat do rolê** (`docs/plano-chat-role.md`). Um chat por `Role`, que abre em
       `data_inicio` e fecha em `data_fim`, com entrada liberada só a quem confirmou presença e
       acesso valendo até o fim sem reconfirmar. Precisa de denúncia e bloqueio desde o primeiro
       dia. **Nada disso existe no backend**: não há entidade de mensagem, não há transporte em
       tempo real, e o ADR-004 descartou fila/worker/Redis — que é exatamente o tipo de coisa que
       um chat costuma pedir. Antes de estimar, decidir se o ADR-004 precisa ser reaberto.
       Uma ponta solta da própria spec continua de pé: o que acontece com o chat depois do fim do
       rolê — some de vez ou vira arquivo read-only por um tempo curto.
       **A outra o schema já respondeu:** a spec pergunta qual a janela padrão para rolê "sem
       horário de fim definido", mas `Role.data_fim` é `nullable=False` desde a migration 0001 —
       não existe rolê sem fim neste banco. A janela do chat é `data_inicio`–`data_fim`, sem caso
       de exceção. Se um dia rolê sem fim passar a existir, é decisão de schema primeiro, e aí a
       pergunta da spec volta.
- [ ] 56. **[decisão] Expiração da presença: reusar as janelas do frescor ou inventar outra.** A
       spec lista "modelo de expiração da presença — quanto tempo uma sinalização conta como
       agora" como pergunta em aberto, mas o app **já responde isso de fato**: `Sinalizacao` não
       tem coluna de expiração, e o que decide é a janela lida em `config.py` —
       `frescor_live_window_minutes = 30` e `frescor_warm_window_minutes = 120`. Ou seja, "agora"
       já quer dizer 30 minutos e "ainda quente" já quer dizer 2 horas, calculados na leitura
       (ADR-0001, sem cron).
       A decisão real é outra: **a presença verificada usa as mesmas janelas?** Um sinal com GPS
       confirmado é mais forte que um autodeclarado, e talvez devesse valer mais tempo — ou o
       acesso ao chat, que a spec diz durar até o fim do rolê, é uma terceira janela que não é
       nem 30 nem 120 minutos. São três durações diferentes num app que hoje tem duas.
- [ ] 54. **Card de Story compartilhável** (seção do `docs/plano-presenca.md`). Depende de o rolê
       ter identidade visual boa, e isso é o **item 45**, que está bloqueado no R7 esperando onde
       os arquivos vão morar. Cadastro cru gera Story feio, e Story feio ninguém posta — então
       este item nasce atrás do 45, não em paralelo. A spec cita uma prévia `previa-story.html`
       que **não existe no repositório**; se ela existir em algum lugar, trazer junto.
- [x] 55. **[decisão] O anonimato passa a ter escopo — ADR-011, aceito em 01/09.** A colisão era
       real: o item 23 fechou "sinal é anônimo, comentário é assinado", e o chat é uma terceira
       categoria que essa regra não previu, porque a porta de entrada é a presença e lá dentro
       todo mundo aparece com o próprio perfil.
       **Decidido:** o sinal continua anônimo **em público** — contagens, card, mapa e frescor
       seguem só com números, nunca nomes. **Dentro do chat**, quem entra é identificado para quem
       está lá. E a presença de quem entrou no chat **continua contando** na contagem pública: a
       identificação vale dentro da conversa e não vaza para fora dela.
       Como o chat nasce e morre com o rolê, a identificação também é efêmera — não constrói
       histórico público de onde você esteve.
       **O que isso obriga:** o copy tem que dizer o escopo. "Ninguém vê seu nome" deixa de ser
       verdade sem qualificação, e a assimetria (você vê os nomes, eles veem o seu) só é legítima
       se estiver dita **antes** de entrar. Vira o item 59.
       Rejeitadas: apelido por rolê (enfraquece a moderação por contexto social e cria uma terceira
       identidade), segundo toque explícito para entrar no chat (é o atrito que a spec de presença
       existe para evitar) e trocar o chat por outro gancho (é trocar um cold start por um pior).
- [ ] 59. **Reescrever o copy do anonimato com o escopo do ADR-011.** Hoje o perfil e a tela de
       sinal dizem que ninguém vê seu nome, sem qualificar. Com o chat, isso passa a ser meia
       verdade. Duas metades: (a) o texto atual precisa ganhar escopo — nome não aparece no rolê
       nem nas contagens; (b) a tela de entrada do chat precisa dizer a assimetria antes do toque,
       não depois.
       **Reabre o item 23**, que está `[x]` e verificado. Não agora: enquanto o chat não existir, a
       regra de duas metades ainda descreve o app real, e mudar o copy antes seria prometer uma
       coisa que não acontece. O gatilho é o item 53 começar.

### O que já estava no quadro e converge com estas duas specs

Nenhum destes é trabalho novo — é reconhecer que já estavam apontando para cá.

| Item | Como converge |
|---|---|
| **43** — "Tô aqui" verificado por proximidade | É a **mesma feature** que o núcleo da spec de presença. Separa "Tô aqui" (no lugar, com GPS, alimenta frescor) de "Tô indo" (de casa, avisa amigos) — exatamente a distinção que a spec faz |
| **40** — o que uma conta comum ganha ao entrar | A spec responde por um caminho que o item 40 não listava: entrar no **chat**. O 40 tinha três saídas (a, b, c) e esta é uma quarta |
| **41** — frescor calculável antes de o rolê começar | **Resolvido de graça** pela regra, agora aceita (ADR-009): não dá para estar fisicamente no lugar às 10h de um rolê das 21h |
| **10** — validar "favoritar lugar" × "sinalizar rolê" em campo | A spec abre a mesma pergunta com outras palavras ("como a interface distingue, sem ruído"). É pergunta 4 do `conceito.md`, e a interface já implementa a hipótese `1e` |
| **24** — check-in de conta comum alimenta o frescor público? | Mesma pergunta que a spec faz ao separar o dado de presença verificada do aviso social |
| **29** — check-in como `Sinalizacao` de `tipo=presenca` | Já concluiu que check-in **não precisa de tabela nova**. Vale para a presença da spec: a `Sinalizacao` já é o motor |
| **27–30** — backend de Conexões | É o "motor social pleno" da escada de incentivos, que a spec coloca na fase 2. O `plano-conexoes.md` já detalha |
| **13** — cron de expiração/decaimento | A spec pede presença com "janela de expiração, esfria sozinha". Hoje é 100% on-read (ADR-0001), o que provavelmente já basta — mas é a mesma pergunta |
| **45** — foto do lugar (bloqueado no R7) | Pré-requisito do item 54: sem identidade visual não há card de Story que alguém poste |
| **17** — `sinais_recentes` exposto | Já entrega o "X pessoas aqui agora" que a spec pede, contando **pessoas distintas** |
| **34** — frescor contava linhas, não pessoas | É o precedente que sustenta a regra central da spec: sem verificação o dado é forjável, e isso não é hipotético |
| **X4** — "Tô indo" para conta comum como check-in visível às conexões | É o "motor social pleno" pela ponta do frontend |
| **ADR-008 / item 42** — casa publica o próprio rolê | Alimenta o degrau "benefício do estabelecimento", o último da escada |

## Frontend — as fases de construção das telas

Veio de `frontend/TODO.md`, centralizado aqui em 28/08. Os itens numerados ganharam o prefixo **F**
porque a numeração colidia com a da raiz — existia "item 15" nos dois arquivos, querendo dizer
coisas diferentes. Os de letra (P, C, S, X) já eram únicos e ficaram como estavam.

Convenções de trabalho do frontend (tokens, partição mobile/desktop, armadilhas) continuam em
`frontend/CLAUDE.md`; aqui ficam só as tarefas.

### Fase 0 — scaffold e sistema visual ✅

- [x] F1. **Criar o projeto Next.js.** Feito: Next 16.3.3, React 19.2.8, Tailwind v4, TypeScript,
      ESLint, Turbopack, `src/`, alias `@/*`.
- [x] F2. **Fontes e metadata em `app/layout.tsx`.** Anton 400 e Inter 400/500/600/700 via
      `next/font/google` (`--font-anton`, `--font-inter`), `lang="pt-BR"`, `themeColor` `#08060f`,
      `colorScheme: dark`.
- [x] F3. **Tokens em `app/globals.css`.** Todos os tokens em `@theme`, mais os utilitários
      `pulse-agora` e `rotulo` (o rótulo de seção repete em 6 das 8 telas) e o bloco
      `prefers-reduced-motion`. Dark-only, sem troca de tema.
- [x] F4. **Shell.** Mobile: `mx-auto w-full max-w-md`. Desktop: sidebar + conteúdo. Sem moldura de
      telefone, notch ou barra de status falsa.
- [x] F5. **`lib/types.ts`** — espelho dos schemas Pydantic, datas como `string` ISO.
- [x] F6. **`lib/api.ts`** — fetch tipado, `ApiError` com status (401/403/409) e `ApiOffline`
      separado. `.env.local.example` criado.
- [x] F7. **`lib/frescor.ts`** — mapeamento único, `null` → sem badge.
- [x] F8. **`lib/tempo.ts`** — `America/Sao_Paulo` fixo (também evita divergência de hidratação).
- [x] F9. **Nav das duas visualizações** — `components/nav-items.tsx` (destinos e ícones, fonte
      única), `views/mobile/bottom-nav.tsx` e `views/desktop/sidebar.tsx`.
- [x] F10. **`components/ui/frescor-pill.tsx`** — ponto de 7px, pulse só no `live`.

### Partição mobile / desktop ✅ infraestrutura

Decisão registrada em `CLAUDE.md`: mesmo app, mesmas URLs, mesmos dados; só a composição muda,
cortada por CSS em `lg`. `lib/` e `components/ui/` compartilhados, `views/` diverge.

- [x] P1. `components/viewport.tsx` — `<Mobile>` e `<Desktop>`.
- [x] P2. `app/page.tsx` busca uma vez e alimenta as duas visualizações. Verificado no HTML
      servido: exatamente 2× cada card e cada pin, um por partição.
- [x] P3. **Partição em todas as rotas existentes** (`/`, `/mapa`, `/role/[id]`, `/salvos`,
      `/perfil`, `/curador`). Verificado no HTML servido: 6/6 respondem 200 com as duas árvores.
      Toda tela nova continua precisando das duas composições.
- [x] P4. **Design de desktop feito** — 5 artboards em `docs/front-end-ideias/desktop/`. A
      pergunta "o desktop é o app público ampliado ou o painel do curador?" foi respondida com
      **os dois**: 4 telas do app público + o painel, que ganhou nav própria por ser outra
      superfície.
- [ ] P5. Reavaliar o custo do DOM duplicado quando o mapa virar client-side com pan e zoom. Saídas
      registradas em `CLAUDE.md`: `<Activity mode="hidden">` do React 19.2, ou `proxy.ts` por
      user-agent.

### Fase 1 — as duas telas públicas (sem auth, sem backend novo)

Fatia que prova a tese com dado real. Consome só rotas públicas — nenhuma mudança no backend.

- [x] F11. **Tela `2c` — Home**, nas duas visualizações. Mobile (`views/mobile/home.tsx`): header,
       "Hoje à noite" + contagem, rail horizontal de cards de 206px, seam "ou explore a região",
       mini-mapa, bottom nav. Desktop (`views/desktop/home.tsx`): sidebar, grade de cards de 2–3
       colunas e mapa fixo à direita ocupando a altura da tela. Card compartilhado em
       `components/ui/role-card.tsx`. **Subtítulo usa `lugar_nome`**, não "8 min a pé".
       ⚠️ Bairro ainda fixo no código — vira `localStorage` na fase 2.
- [x] F12. **`components/ui/mapa-estilizado.tsx`** — grid, faixas inclinadas e pins reais
       projetados na bbox dos `lat`/`lng`, com margem para não colar nas bordas e fallback para
       centro quando há um pin só. Cor pelo `frescor` do `role_ativo`; sem rolê fica menor e em
       `--color-pin-off`. Sem tiles e sem dependência externa.
- [ ] F12b. **Verificar contra a artboard.** A home foi construída lendo o hi-fi, mas não foi
       comparada lado a lado com ele. Conferir espaçamentos, pesos e tamanhos antes de considerar
       a tela fechada.
- [x] F13. **Card social da home** (só desktop). Cita **comentário**, não sinalização — decisão (ii)
       do item 4a, tomada. Só aparece com dado de exemplo: com a API real seria
       preciso um `GET /comentarios/recentes?bairro=X` que não existe, e citar quem sinalizou
       quebraria o anonimato prometido no `2d`.
- [x] F14. **Tela `2f` — Mapa.** Pins selecionáveis, filtro Todos/Com rolê, cartão do lugar com
       último comentário e CTA. Desktop: lista do bairro vira coluna permanente ao lado do mapa,
       em vez de gaveta. **"Comentado agora" não foi implementado** — `total_comentarios` não tem
       janela de tempo. Copy usa "4 comentários", não "na última hora".
- [x] F15. **"Rota"** — link externo pro Google Maps, nas duas visualizações.
- [x] F16. **Tela `2d` — Detalhe do rolê.** Hero, badges, título, lugar, comentários e stats. O
       bloco de descrição renderiza **quando** `descricao` existir e mostra uma linha honesta
       quando não existir (o campo não está no backend — item 15). O CTA "Tô indo"
       aparece **desabilitado com explicação** ("Sinalizar ainda está com os curadores da Vila") —
       decisão (i) do item 4a, tomada, alinhada ao ADR-0006.
- [ ] F16b. **"Compartilhar" no `2d`** — Web Share API com fallback de copiar link. Não implementado.
- [ ] F17. **Estados de carregamento e erro:** falta o skeleton no formato dos cards (não spinner)
       via `loading.tsx`. O caso de API fora do ar já está coberto (`AvisoOffline` + `lib/fixtures`),
       e `/role/[id]` já trata 404 com `notFound()`.
- [x] F18. **Estados vazios.** Feitos: home sem rolê, caderninho vazio, painel do curador sem nada
      no ar, painel do dono sem casa vinculada e busca por localização fora de área. Enunciado
      original: ⚠️ Não existem no design (item 4b). Sem bairro
       piloto e sem seed, é o estado que mais vai aparecer. Precisa de design antes de codar, mas
       precisa de *algo* para a tela não quebrar: no mínimo um texto centrado no tom do produto.
- [x] F19. **Testado em device real em 28/08**, por túnel, num Android em 4G: o card do rolê, o
      seam e o mapa couberam na dobra com a barra inferior visível. A ressalva de altura que
      vinha do começo do projeto está resolvida — e o mesmo teste revelou três bugs que só
      apareciam no aparelho (mapa em branco, barra flutuando, "você está aqui" a 1,4 km).
      Enunciado original: A ressalva de
       `docs/arquitetura-backend-frontend.md`: na artboard de 740px as duas camadas cabem sem
       scroll; num telefone real (~650px úteis) provavelmente não. Se não couber, encolher o
       mini-mapa — não virar abas.

### Sugerir um lugar — o começo da rotina de curadoria

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

### Fase 2 — onboarding e perfil (client-side)

- [x] F20. **Abertura — escolha de bairro** (`/abertura`, era a tela `2a`). Duas diferenças
       deliberadas em relação ao hi-fi: **não há etiqueta "em breve"**, porque prometer bairro
       futuro é afirmar roadmap que ninguém decidiu; e **as contagens vêm da API**, então quando
       não há curadoria a tela diz "curadoria começando" em vez de número inventado.
       Recortes reais: República (piloto) e Pinheiros.
       **A escolha vive em cookie, não `localStorage`** — a home e o mapa renderizam no servidor e
       precisam do bairro antes de mandar HTML. Sem cookie, `/` e `/mapa` redirecionam para cá.
       Não implementei o passo 2 (gostos): ver item F21, que segue sem uso funcional.
- [ ] F21. **Tela `2b` — Onboarding, gostos.** Chips selecionáveis, passo 2 de 2, card do curador,
       "Ver a noite de hoje" e "Pular por agora". Salvar em `localStorage` e **não usar para nada
       ainda**: `/descoberta` não aceita filtro nem ordenação por gosto, e implementar ranking por
       preferência contraria a decisão de a descoberta ser curatorial. Débito consciente, descrito
       em `docs/plano-frontend.md`.
- [x] F22. **`lib/bairros.ts` + guarda de rota.** Feito com cookie (ver item F20). `bairro-servidor.ts`
       lê no servidor e valida contra a lista — cookie é entrada do usuário.
- [x] F23. **Tela `2h` — Perfil.** Feita e com dado real: nome e data de cadastro vêm de
       `GET /auth/me`, que passou a existir, e o avatar usa `components/ui/avatar.tsx`, cuja cor
       deriva do nome. "Rolês que você foi" segue como travessão, não zero — zero seria afirmação.
       Enunciado original: Avatar, "Você", stats, bloco "meu bairro" com "trocar",
       bloco de privacidade e card "para donos de casa". **Nome e "desde agosto" ficam de fora até
       existir `GET /auth/me`** (item 18); "rolês que você foi" não tem rota e sai
       do escopo. O toggle "Meus sinais são anônimos" vira **texto informativo, não controle** — um
       toggle que não desliga nada promete um controle que não existe.

### Painel do curador ⚠️ casca pronta, sem backend ligado

Decisão tomada: **o painel do curador é a superfície mais desktop-native do produto** — é onde
alguém trabalha sentado, depois de andar pelo bairro. Por isso tem nav própria
(`views/desktop/sidebar-curador.tsx`), e não é o app público esticado. Design:
`docs/front-end-ideias/desktop/Curador.dc.html`.

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

### Fase 3 — auth e salvar

- [x] F24. **Login e cadastro desenhados e implementados.** Design em
       `docs/front-end-ideias/entrar/` (telefone e desktop). A auth preguiçosa aparece no
       layout: a tela mostra o que a pessoa estava salvando, e no desktop isso vira a coluna da
       esquerda inteira.
- [x] F25. **`lib/auth.ts`** — token em `localStorage`, decodificação client-side do payload do JWT
       para ler `papel` e `exp` (sem verificar assinatura: é gating de UI, a autoridade é o
       backend), e limpeza do token em 401.
- [x] F26. **Auth preguiçosa** (decisão (iii) do item 4a): o app é público e
       read-only; o login só aparece quando a pessoa tenta salvar pela primeira vez, preservando a
       intenção para depois do login.
- [x] F27. **Salvar e dessalvar** no `2d` e no `2f`, com atualização otimista e reversão em erro.
       `POST /salvos` devolve 409 se já salvo — tratar como sucesso idempotente, não como falha.
- [x] F28. **Tela `2g` — Salvos, com dado real.** `GET /salvos` + uma chamada a `/lugares/{id}` por item (o N+1 do item 16). Estado vazio honesto.
- [x] F28b. **Salvar/dessalvar de fato** — feito no detalhe do rolê, nas duas visualizações. "Meu caderninho", contagem, filtros e lista. ⚠️ Com a API atual
       custa uma chamada a `/lugares/{id}` por item — fazer a mudança 16 de este arquivo antes, ou
       aceitar o N+1 conscientemente. Os filtros "Abertos agora" e "Nunca fui" e os estados
       "aberto"/"fechado" **não são implementáveis**: não há horário de funcionamento no schema nem
       histórico de presença. Implementar só "Todos" e "Tem rolê" (derivável de `role_ativo`).

### Fase 4 — contribuição

- [x] F29. **CTA de sinalizar no `2d`.** Três comportamentos: deslogado leva para entrar guardando o destino; papel comum vê desabilitado com o motivo; curador sinaliza de verdade. Depende da decisão (i) do item 4a.
       Recomendação registrada: mostrar desabilitado com explicação honesta para `papel=comum`,
       porque `POST /sinalizacoes` responde **403** para quem não é curador ou dono (ADR-0006).
       Tratar o 403 de verdade — não assumir que a UI sempre acerta o gating.
- [x] F30. **Tela `2e` — Sinal enviado.** Feita como estado do `2d`. Confirmação, contador "expira em" com barra de progresso
       (`timestamp` + 120min, a janela warm do backend — deixar claro no código que é **convenção
       de UI**, não prazo garantido pela API), "Contar como está lá dentro" (`POST /comentarios`) e
       "Cancelar meu sinal" (⚠️ sem rota: item 20). Implementar como estado do
       `2d`, não como rota nova.
- [x] F31. **Comentar** — feito, e desde 28/08 **fora** do `2e`, em `components/ui/contar-como-esta.tsx`.
      Estava dentro da confirmação de sinalização, que só aparece depois de marcar presença — e
      sinalizar é restrito a curador e dono (ADR-0006). A única contribuição que uma conta comum
      tem permissão de dar estava trancada atrás da ação que ela não pode executar.
- [ ] F31b. **Comentar do `LugarSheet` do `2f`** — ainda não.

### Conexões — as telas (plano em `docs/plano-conexoes.md`)

Aba de Conexões: amigos, check-in e os salvos deles. **Ler o plano antes** — ele decide a ordem
(salvos das conexões antes do check-in) e por que o v1 é sem push. Depende da fase 3 (login) e do
bairro piloto. Backend: itens 27–30 de este arquivo.

**Design pronto:** `docs/front-end-ideias/conexoes/` — 5 artboards (aba em desktop e telefone,
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
- [ ] X4. **"Tô indo" para usuário comum, como check-in visível às conexões.** Premissa
      atualizada em 28/08: o botão **não é mais um CTA desabilitado** — para papel comum a tela diz
      a regra em palavras e oferece "contar como está", que é a ação que essa conta tem. O que
      falta é o resto: para usuário comum ele passa a
      significar check-in visível às conexões. **Atualizar também o copy** "Ninguém vê seu nome",
      que deixa de ser verdade como está escrito (item 23).
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

### Fase 5 — enriquecimento (depende do backend)

- [x] F32. **Descrição do rolê no `2d`** — feito, nas duas visualizações. Era
      o "motivo pra ir", a peça que mais falta para o `2d` cumprir a tese do produto.
- [ ] F33. **Card do curador no `2d` ("VALIDOU EM CAMPO")** — falta decidir o que ele afirma:
      assinar com nome do curador é promessa de responsabilidade que ninguém combinou ainda.
      A outra metade deste item, o **endereço do lugar, está feita** (migration 0003; aparece no
      `2d` nas duas visualizações) — o card ficava em "Fazendo" por causa dela.
- [x] F34. **"N sinalizaram nas últimas 2h" no `2d`** — feito junto com o item 17, nas duas
      visualizações. Só aparece quando há alguém: zero fica escondido.
- [ ] F35. Distância "a pé" com geolocalização do browser, quando `RoleDescoberta` trouxer
      `lat`/`lng` (item 19).
- [x] F36. **PWA de verdade** — feito em 28/08. `app/manifest.ts`, ícones reais gerados
      (`public/icons/`, o pin magenta pulsando — sem palavra escrita, porque rasterizar uma
      fonte do sistema no lugar de Anton daria um logotipo que não é o nosso), `public/sw.js`
      e `public/offline.html`.
      **A regra do service worker: cacheia a casca, nunca o dado.** JS, CSS, fontes e ícones
      entram no cache; resposta de API e página renderizada, não. Servir de cache um rolê de
      ontem rotulado "bombando agora" seria pior que não abrir. Navegação sem rede cai em
      `/offline.html`, que não finge ter conteúdo. Registrado só em produção — em dev o SW
      interceptaria os assets do Turbopack e viraria depuração de cache.

## Técnico / infra / testes

- [~] 12. **Deploy de produção.** O plano que estava aqui (Railway/Fly.io/Render + Vercel +
       Postgres gerenciado, de `docs/arquitetura-backend-frontend.md`) foi substituído em 03/09 por
       `docs/adr/0001-deploy-em-vps-unico-sao-paulo.md`. **Os arquivos existem desde 05/09** —
       `docker-compose.prod.yml`, `deploy/Caddyfile`, `frontend/Dockerfile`, os dois scripts de
       backup — e o stack foi verificado nesta máquina. Falta rodar no servidor. Execução
       acompanhada no R7; o o quê e o como em `docs/features/deploy.md`.
- [ ] 13. **Decidir se o cron de expiração/decaimento é necessário.** A arquitetura acordada
       previa "cron simples pra expirar rolês e decair sinalizações"; o backend construído não tem
       nenhum — frescor é 100% calculado na leitura (`services/frescor.py`, ADR-0001). Provavelmente
       suficiente pro piloto; a decisão é só registrar isso (atualizar o doc de arquitetura) ou
       medir e concluir que precisa de job.
- [ ] 14. **Definir CI** (rodar `ruff check .`, `mypy src`, `pytest` do backend automaticamente) —
       hoje esses comandos só rodam manualmente, e dependem de um Postgres+PostGIS no ar. Depende da
       task 1 (sem commit não há o que rodar CI em cima).
       Ganhou um motivo novo em 31/08: ver o item 49, em que a suíte passou verde contra código
       que não era o do disco. CI que constrói do zero não tem como cair nisso.
       **E ganhou o motivo definitivo em 01/09**, com a regra de que todo trabalho vira branch de
       feature e só merga passando no regressivo (ver `CLAUDE.md`). Hoje esse portão é manual e
       nada o impõe: a `master` aceita push direto e ninguém checa. CI + proteção de branch no
       GitHub é o que faz a regra existir de fato — sem isso ela vale por disciplina, e disciplina
       é o que falha em dia corrido.
       **Ficou barato em 01/09:** o portão virou um comando com código de saída,
       `scripts/regressivo.sh`, escrito já pensando em ser o que a CI chama. O escopo mínimo
       agora é um workflow que roda esse script em PR contra a `master`, mais proteção de branch
       no GitHub barrando merge no vermelho — não é mais "montar a CI", é "chamar o script".
       O que **falta de verdade** é serviço de Postgres+PostGIS no runner, já que a suíte não
       usa mock.
- [x] 60. **Sistema visual monocromático — a camada 1 (fundação).** Feito e **validado em campo
       em 02/09**, num telefone pelo túnel. Substitui o sistema do hi-fi (quase-preto arroxeado, Anton maiúsculo, quatro
       cores saturadas) por preto/cinza/branco, Inter, superfície elevada com raio.
       Números: 310 trocas de cor em 51 arquivos, 42 `uppercase` removidos, 26 CTAs invertidos
       (o primário deixou de ser colorido — é o que liberou o acento), 120 raios, 141 bordas
       viradas régua, 36 cards elevados. Doc: `docs/features/sistema-visual-monocromatico.md`.
       **A regra que sustenta o resto:** token tem nome de PAPEL, não de matiz. `--color-agora`,
       nunca `--color-magenta` — o hue no nome foi o que travou a mudança anterior.
       **Passou por uma versão dura e voltou:** a primeira tentativa era `#000` puro, régua de 1px
       e raio zero. Em tela ficou cartaz, não app de madrugada. Está registrado no doc para
       ninguém "corrigir" a suavização de volta achando que é desvio do suíço.
       **O teste no telefone pegou 4 bugs que lint, build e os 56 testes deixaram passar** — três
       eram cor fixa em hex dentro do JSX (inclusive um ✓ branco sobre círculo branco) e o quarto
       era o acento vazando para link, aba e seleção. Os 17 hex viraram `currentColor` e nasceu
       `--color-selecao`. Detalhe no doc da feature.
- [x] 63. **Um botão só: "Bora" decide entre presença e intenção.** Feito e **validado em campo
       em 02/09**, num telefone: os dois caminhos conferidos lado a lado — o aceite virou "Tá
       marcado" com frescor `warm` (uma pessoa não faz `live`), e a recusa a 10 km virou "tá
       anotado" com a distância vinda do campo estruturado. ADR-009 ganhou a **emenda 3**: quem escolhe entre "Tô aqui" e "Tô
       indo" passou a ser o app, não a pessoa — a diferença entre as duas não é preferência, é
       fato verificável, e o telefone sabe. Oferecer as duas era pedir que ela declarasse algo que
       o aparelho podia medir, com risco de declarar errado e envenenar o frescor.
       **O contrato do 403 mudou junto:** `detail` virou objeto com `distancia_m` e `raio_m`. Antes
       o frontend garimpava a distância com regex sobre a frase em português — quebraria calado no
       dia em que alguém reescrevesse o texto, e a regex ainda tinha um byte de backspace escrito
       por engano no lugar da borda de palavra. Testes dos dois lados agora afirmam os campos.
       O teste em campo confirmou de quebra três correções do mesmo dia: o ✓ preto sobre o círculo
       branco (era `stroke="#fff"` fixo, branco sobre branco), a distância real vinda do campo
       estruturado, e o anel vazado do `new` contra o ponto cheio do `warm` — a distinção por
       forma em vez de cor, legível na tela.
- [?] 61. **Camada 2 de estilo — a cor voltou por eixo semântico.** Feita em 02–03/09,
       aguardando validação. **Mudou de escopo no caminho:** o item previa "composição e
       densidade", e o que se mostrou necessário foi cor — a camada 1 tinha deixado o app preto e
       branco demais.
       Dois eixos independentes: **frescor** (magenta/âmbar/ciano do hi-fi, saturado, pulsa) e
       **categoria** (8 matizes, vibrantes mas com teto no frescor). CTA, aba ativa, link e
       seleção continuam neutros de propósito — foi isso que liberou o acento.
       A cor aparece no rótulo e no bloco-foto do card, nos pins do mapa (com a escala 10/14/16px
       do hi-fi de volta), na confirmação de presença e no painel do dono. **O pin sem rolê deixou
       de ser cinza** e mostra a categoria: o mapa de um bairro sem rolê ficava inteiro apagado,
       dizendo sem querer que não havia nada ali.
       Doc em `docs/features/sistema-visual-monocromatico.md`, que agora cobre as duas camadas.
       **Composição e densidade continuam sem fazer** — espaçamento, hierarquia dentro do card, a
       navegação e os estados vazios, que nunca foram desenhados em sistema nenhum. Fica para uma
       camada 3.
       **As 8 cores foram validadas em tela em 03/09**, com um rolê por categoria na Vila
       Madalena (que é fictícia por decisão, então a curadoria real de República não foi suja).
       O teste pegou dois problemas que só apareciam com dado:
       (a) **todos os pins ficavam cianos** — `new` atropelava a categoria, e `new` é o estado de
       todo rolê recém-criado. Agora só `live` e `warm` dominam o pin (`frescorDominaOPin`);
       (b) **o dourado do `Bar` colidia com o âmbar do `warm`** — matizes vizinhas, e nenhuma
       podia sair do lugar, então quem separa passou a ser a luminosidade (`#a8802f`).
       Ficou de fora, e é limitação conhecida: a **Vila Madalena não existe em produção** (ver
       `lib/bairros.ts` — dado fictício não vaza para build de produção), então a paleta inteira
       só é visível em dev. Em produção só se vê o que a curadoria real tiver.
- [ ] 62. **O basemap do mapa perdeu a justificativa.** O `mapa-real.tsx` diz, textualmente, que o
       CARTO dark-matter foi escolhido "para conviver com o `#08060f` do app e fazer os pins
       magenta/âmbar/ciano saltarem". **As duas metades expiraram em 02/09:** o fundo virou
       quase-preto neutro e os pins viraram branco e cinza — contraste bem menor sobre um mapa
       cinza-azulado, que ainda por cima puxa para o frio contra um app neutro.
       Deixado em aberto por decisão, para ser visto junto com a camada 2. Saídas: trocar por um
       estilo neutro, ou `filter: grayscale()` no container. O alerta está no próprio arquivo.
- [~] 50. **O frontend quase não tem teste — e é ali que o projeto quebra.** Primeiro degrau feito em 02/09. Levantado em
       01/09 ao montar o regressivo: zero arquivos `.test`/`.spec` em `frontend/src`, zero
       ferramenta instalada (nem Vitest, nem Playwright, nem Testing Library). `npm run lint` e
       `npm run build` pegam erro de tipo e de compilação — **não pegam comportamento**. Então
       chamar o portão de "regressivo" é honesto só para o backend.
       **A evidência de que isso importa está no próprio histórico:** "mapa não desenhava —
       container absolute resolvia para altura 0", "o pin que sumia do mapa" e "a ficha do lugar
       descartava o frescor que a API já calculava" são três bugs reais e recentes, e nenhum dos
       três quebraria o build.
       **A evidência ficou muito mais forte em 02/09.** O sistema visual inteiro e a lógica do
       botão principal foram reescritos com zero teste de frontend, e **os quatro bugs que
       apareceram foram todos encontrados por um humano olhando um screenshot** — não pela suíte.
       O pior era um ✓ branco dentro de um círculo branco: um disco liso, sem símbolo, que passou
       por `lint`, `build` e pelos 56 testes sem levantar nada. Os outros três eram cor fixa em hex
       no JSX e o acento vazando para link, aba e seleção.
       Nenhum é bug de tipo ou de compilação — que é exatamente a classe que as ferramentas atuais
       cobrem, e **não** é a classe que este frontend produz. O que ele produz é o mapa que não
       desenha, o pin que some, o check invisível.
       **Degrau 1 — FEITO em 02/09.** Vitest sobre `lib/`: **46 testes** em `horarios`, `frescor`,
       `tempo` e `localizacao`, rodando em 1,4 s, com passo próprio no regressivo (que passou de
       sete para nove etapas). São funções puras — `environment: node`, sem jsdom, sem mock de
       rede —, e um deles já pegou um engano meu: eu tinha escrito a expectativa errada da faixa
       que atravessa a meia-noite, e o código estava certo.
       **Degrau 2 — falta, e é o que pegaria os bugs de verdade.** Componente e fluxo exigem
       renderizar: jsdom + Testing Library para componente, Playwright para fluxo. É o que teria
       pego o ✓ invisível, o mapa que não desenha e o pin que some — nenhum deles é alcançável por
       teste de função pura. O Playwright fica para depois do R7, quando houver ambiente de
       verdade para apontar.
- [x] 49. **O serviço `api` do compose não monta o código — a imagem o assa.** Descoberto em
       31/08: só o Postgres tem volume; `api` não tem bind mount. Então
       `docker compose exec api uv run pytest` roda **o código de quando a imagem foi construída**.
       O container estava de pé havia 22 horas e a suíte passou verde contra a árvore velha, sem
       nenhum sinal de que não era o código do disco. Hoje o contorno é
       `docker compose up -d --build api` depois de qualquer edição em `backend/`, e está anotado
       no `CLAUDE.md`. A correção é montar `./src` e `./tests` no serviço `api` em
       desenvolvimento — o que também deixa o reload do uvicorn útil.
       **Cuidado ao fazer:** a imagem instala o pacote (`uv run` resolve `boraroles` do venv do
       container); montar por cima sem checar o modo de instalação pode dar import de metade
       velha e metade nova, que é pior que o problema.
       **Resolvido em 01/09, pelos dois caminhos, e os dois verificados.** O
       `scripts/regressivo.ps1` força `--build` a cada execução, então o portão nunca mais testa
       imagem velha — confirmado pela prova negativa: um bug introduzido no disco apareceu na
       execução seguinte. E `backend/docker-compose.dev.yml`, override opt-in que monta `./src`,
       `./tests` e o alembic, funciona: `boraroles.__file__` imprime
       `/app/src/boraroles/__init__.py` e não `site-packages`, um arquivo criado em `./src`
       apareceu no container sem rebuild e sumiu ao ser apagado do disco. O "metade velha, metade
       nova" que este item temia não acontece.
       **Validado em 02/09, e no uso real:** construindo a presença verificada eu editei o código
       e testei o container, caindo exatamente na armadilha deste item — dois dias depois de
       documentá-la. O mount resolveu na hora, e o `ruff --fix` rodado de dentro do container
       chegou a editar o arquivo no host. É a prova de que serve para o dia a dia, não só para o
       teste que o criou.
- [ ] 50. **`seed/republica.json` e o banco divergiram.** O arquivo tem só o Bar do China, sem
       bairro nem coordenada; o banco tem Bar do China **e** Tokyo, com geo, cadastrados pelo
       painel do curador. O seed é a memória versionada da curadoria — enquanto o dado real só
       viver no Postgres local, uma máquina nova (ou o deploy do R7) nasce sem o piloto.
       Decidir qual é a fonte da verdade: ou o painel exporta para o JSON, ou o JSON deixa de
       fingir que é o registro e vira só exemplo. Fica mais barato decidir antes do R3 despejar
       10 lugares no banco.

## Fora de escopo por enquanto (decisão registrada, não esquecida)

- Fila/worker/Redis — ADR-0004, só entra se leitura em tempo real virar problema medido.
- Ranking algorítmico em `/descoberta` — hoje é curatorial + tiebreaker de frescor, de propósito.
- Refresh token / 2FA — ADR-0003, expiração longa (30 dias) é suficiente pro piloto.
- Social (compartilhar com amigos) — fase 2, ver `docs/conceito.md`.
- Pruning automático de `sinalizacao` — tabela pequena no piloto; deletar manualmente se crescer.
