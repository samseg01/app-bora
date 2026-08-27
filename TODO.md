# TODO — bora-roles (visão geral)

Tasks de escopo do monorepo (produto, decisões cross-cutting). Para tasks internas de cada parte,
ver `backend/TODO.md` (esqueleto completo) e `frontend/TODO.md` (8 rotas no ar, faltam
onboarding, login e a confirmação de sinal).

## Roteiro até a primeira conversa com um estabelecimento

Plano ativo. O objetivo não é terminar o app — é ter algo palpável para mostrar a um dono de casa,
que é o **único motor do `conceito.md` que não depende de já ter usuários**. Itens marcados
`[campo]` e `[decisão]` não são código.

- [x] R1. **[decisão] Bairro piloto: Anhangabaú.** Primeiro estabelecimento a abordar:
      **Bar do China**. Decidido em 27/08/2026. ⚠️ Duas ressalvas registradas, nenhuma impede
      começar. **Recorte recomendado após pesquisa: República / Largo do Arouche / Av. Vieira de
      Carvalho**, não o entorno imediato do Bar do China. O bar fica na Av. Prestes Maia, 78,
      colado no metrô São Bento (confirmar com o dono) — que é o núcleo financeiro e histórico, com
      muito movimento de dia e quase nada à noite. A densidade noturna do Centro está ~1,2 km a
      oeste, no eixo Arouche/Vieira de Carvalho: bares tradicionais, cena LGBT+ desde os anos 70,
      preços até 40% abaixo da Vila Madalena e metrô República na porta. Um recorte ali se percorre
      a pé em ~10 min, que é o critério do `conceito.md`. **O Bar do China fica fora desse recorte —
      e tudo bem:** ele é a primeira conversa (R9, ensaio), não a âncora do piloto. Ressalva de
      campo: o critério "validar a pé" pesa diferente no Centro à noite; Arouche tem a vantagem de
      ser movimentado, que é melhor que deserto.
- [ ] R2. ⏳ **Criar o remote e dar push.** Bloqueado: não há `gh` instalado nem credencial do
      GitHub nesta máquina, então o repositório precisa ser criado por você (**privado**). Depois:
      `git remote add origin <url> && git push -u origin master`. Pré-requisito técnico do deploy (R7): Railway e Vercel
      publicam a partir do GitHub. Também tira o projeto de "existe só nesta máquina".
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
      **Não** mostrar o painel do estabelecimento: vai estar zerado, e o `conceito.md` diz que esse
      painel só tem valor porque a comunidade existe.

## Correções críticas

- [x] 1. **Versionar o projeto.** Feito: repositório único na raiz, commit inicial `d44aa40` com
      161 arquivos. O `.git` vazio do backend foi retirado (não tinha commits nem remotes).
      Conferido que `.env` real, `node_modules`, `.next` e os canvas gerados ficaram de fora.
- [ ] 1b. **Criar o remote e dar push.** É o item R2 do roteiro acima.
- [x] 2. **Bairro piloto: Anhangabaú.** Pergunta 1 de `docs/conceito.md`, respondida. Ver R1.
- [ ] 3. **Decidir o fluxo de criação de `Estabelecimento`.** Hoje não existe endpoint — só rotas
      de leitura pro dono (`backend/CLAUDE.md`, seção "Gap conhecido"). Decisão de produto: curador
      cadastra em campo? Dono faz onboarding self-service (contraria ADR-0007 de promoção manual de
      papel, então provavelmente não)? Definir antes de implementar a rota.

## Diferenciais / features principais

- [ ] 4. **Implementar o frontend público (PWA, Next.js).** A pasta `frontend/` já existe com
      `CLAUDE.md` (convenções, tokens, contratos da API) e `TODO.md` (**as 37 tasks detalhadas, em
      6 fases — é lá que o trabalho é acompanhado**). Análise que originou tudo:
      `docs/plano-frontend.md`. ⚠️ Em andamento: 8 rotas no ar nas duas visualizações. Faltam
      onboarding (`2a`/`2b`), login e a confirmação de sinal (`2e`).
- [ ] 4a. **Decidir os 3 pontos travados de design ↔ backend** antes da fase 4 do plano: (i) o que
      o usuário comum vê no lugar do CTA "Tô indo", já que `POST /sinalizacoes` dá 403 pra ele
      (recomendação no plano: CTA desabilitado com explicação honesta); (ii) o card social da home
      passa a citar **comentários** em vez de sinalizações, pra não quebrar o anonimato prometido
      no `2d`/`2h`; (iii) confirmar a "auth preguiçosa" — app público read-only, login só quando a
      pessoa tenta salvar. Detalhes em `docs/plano-frontend.md`.
- [ ] 4b. **Desenhar os estados vazios e as telas de auth.** O hi-fi pressupõe a Vila Madalena
      cheia e não tem login/cadastro; as duas coisas faltam antes de o app funcionar com banco
      vazio ou com usuário de verdade.
- [ ] 5. **Conectar o frontend ao backend com dado real do bairro piloto** (depende das tasks 2 e
      4). Os tipos do front devem convergir com os schemas Pydantic de
      `backend/src/boraroles/schemas/`; a API já expõe tudo que as telas públicas precisam
      (`GET /descoberta`, `GET /mapa`, `GET /roles/{id}`, `GET /lugares/{id}`). Lembrar de incluir a
      origem do front em `CORS_ORIGINS` no `.env` do backend.
- [ ] 6. **Painel do curador como UI real.** ⚠️ Em andamento — decidido que é a superfície
      desktop-native do produto, desenhado (`docs/front-end-ideias/desktop/Curador.dc.html`) e a
      tela existe em `/curador` nas duas visualizações. **Falta ligar no backend**: o CRUD em
      `backend/.../api/v1/curador.py` exige token e papel `curador`, então depende do login
      (fase 3 do `frontend/TODO.md`). Detalhes nos itens C3–C6 de lá.
- [ ] 7. **Sinalização de presença na UI.** Começar restrito a curadores/usuários engajados
      (motor mais frágil do conceito — ver tabela de motores em `docs/conceito.md`). A API já
      existe e já é restrita (ADR-0006); falta o fluxo de UI (telas `2d` → `2e` do hi-fi).
- [ ] 8. **Painel do estabelecimento como UI real**, só depois de ter volume de Salvos/Sinalizações
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

- [ ] 23. **Decidir o copy do anonimato.** O app promete hoje, na tela, "ninguém vê seu nome" no
       `2d`/`2h` e "só seus, ninguém mais vê" no `2g`. Check-in e salvos compartilhados contradizem
       as duas frases. A saída proposta: o mapa público continua anônimo (nenhum endpoint expõe
       autor de sinalização) e só as conexões veem nome — mas **o copy precisa mudar antes**, não
       depois. É a promessa mais explícita do produto.
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

## UX / polish

- [ ] 9. **Selo de "promovido" separado do orgânico**, quando o destaque verificado (monetização)
      entrar em jogo — não pode ser ambíguo, é o que preserva a confiança no ranking curatorial.
      O schema já tem `Estabelecimento.plano` (`organico`/`destacado`), mas nada na API de leitura
      usa esse campo hoje.
- [ ] 10. **Distinção clara na interface entre "favoritar lugar" (permanente) e "sinalizar rolê"
       (efêmero)** — pergunta 4 em aberto no `docs/conceito.md`. O hi-fi aposta na hipótese `1e`
       (dois gestos, dois lugares na tela); validar em campo se isso resolve de fato na cabeça do
       usuário, ou se as hipóteses `1f`/`1g` do wireframe voltam à mesa.
- [ ] 11. **Ícones do PWA e service worker**, quando o frontend existir — sem ícone real e sem SW,
       "instalável" e cache offline não funcionam de verdade.

## Backend — lacunas que o design revelou

Nenhuma bloqueia a fase 1 do frontend. Ordem por custo/benefício, detalhada em
`docs/plano-frontend.md`.

- [ ] 15. **`Role.descricao`** (texto, nullable) + expor em `RolePublic` + aceitar no CRUD do
       curador. É o "motivo pra ir" — o wireframe dedicou 3 telas (`1m`/`1n`/`1o`) a estudar esse
       copy e o schema não tem onde guardá-lo. Sem isso o detalhe do rolê é só título + horário.
       Lembrar do gotcha: migration à mão, no padrão do `0001_initial_schema.py`.
- [ ] 16. **`GET /salvos` enriquecido** — devolver `LugarPublic` + `role_ativo` em vez de só
       `lugar_id`, senão a tela `2g` precisa de uma chamada a `/lugares/{id}` por item salvo.
- [ ] 17. **Expor `sinais_recentes` em `RolePublic`** — a contagem já é calculada dentro de
       `frescor_de_role()`, mas só o rótulo sai. Destrava "6 sinalizaram nas últimas 2h" no `2d`.
- [ ] 18. **`GET /auth/me`** — nome e data de cadastro pro perfil (`2h`). O papel não precisa dele:
       já viaja dentro do JWT e o front decodifica client-side pra decidir o gating de UI.
- [ ] 19. **`lugar_id`, `lat`, `lng` em `RoleDescoberta`** — destrava distância "a pé" (com
       geolocalização) e navegação direta do card pro lugar.
- [ ] 20. **`DELETE /sinalizacoes/{id}`** — "Cancelar meu sinal" do `2e` não tem rota.
- [ ] 21. **`Lugar.endereco`** (nullable) — o `2d` mostra "Rua Aspicuelta, 340" e o schema só tem
       `geo` e `bairro`.
- [ ] 22. **Seed de desenvolvimento.** Hoje popular o banco exige criar usuário, promover a curador
       via `scripts/promote_role.py` e cadastrar lugares/rolês na mão. Um seed com a Vila Madalena
       fictícia (14 lugares, 3 rolês, comentários, sinalizações recentes) faz o frontend ter contra
       o que rodar desde o primeiro dia, e reproduz os estados `live`/`warm`/`new` de propósito.

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
