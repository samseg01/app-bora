# ADR-010 — Vincular estabelecimento é ato de curadoria, não autocadastro

## Status

Aceito (29/08/2026). Fecha o **R9** do `TODO.md` como decisão; a implementação (o script) fica
pendente.

## Contexto

`Estabelecimento` e `Lugar` são entidades diferentes, e a confusão entre elas é o que mantinha o R9
travado. O schema (`db/models.py`) é explícito:

| | `Estabelecimento` | `Lugar` |
|---|---|---|
| Campos | `dono_usuario_id` (**NOT NULL**), `nome`, `plano` | `geo`, `bairro`, `endereco`, `categoria`, `descricao`, `horarios`, `fotos`, `preco_longneck`… |
| Geografia | nenhuma | é o ponto no mapa |
| Exposto ao público | nunca — nenhuma rota pública o devolve | é o que o app inteiro mostra |

`Estabelecimento` não descreve uma casa: descreve **a relação comercial entre uma pessoa e o app**.
O que ele destrava é o painel do dono, o `plano` de destaque e — se o ADR-008 for aceito — o direito
de publicar rolê na própria casa. O app inteiro funciona sem ele: descoberta, rolê, sinal, salvo,
comentário e ficha passam todos só por `Lugar`.

Três fatos do modelo atual decidem o resto:

- **`Estabelecimento.dono_usuario_id` é `NOT NULL`.** Um estabelecimento não pode existir antes de o
  dono ter conta. Não é preferência: a outra ordem é impossível de inserir.
- **`Estabelecimento` não tem FK para `Lugar`.** O único elo é `Lugar.estabelecimento_id`, nullable,
  do outro lado. O banco aceita um estabelecimento **órfão**, sem lugar nenhum, e as rotas respondem
  educadamente com vazio: `GET /{id}/lugares` devolve `[]` e `GET /{id}/engajamento` devolve zeros.
- **Hoje há zero linhas**, e todos os lugares curados têm `estabelecimento_id` nulo. Esse é o estado
  normal, não uma pendência.

Precedente que vale: o ADR-007 já decidiu que promoção de papel é sempre manual, nunca self-service,
porque self-service ali é escalação de privilégio trivial. Vincular estabelecimento é a mesma
pergunta com outra roupa — quem se auto-declara dono do Bar do China ganha o painel do Bar do China.

## Decisão

**O curador cria o `Estabelecimento` e faz o vínculo, num ato só. O dono cria a própria conta.**

1. O dono faz `POST /auth/signup` normal, com `papel=comum` (ADR-007 intacto). O curador **não** cria
   conta para ninguém — isso significaria manusear senha de outra pessoa. A pessoa é dona da própria
   identidade; o curador atesta a **relação**.
2. O curador executa um ato **único e transacional**: cria o `Estabelecimento` apontando para aquela
   conta, vincula **pelo menos um** `Lugar` já existente, e promove o papel para
   `dono_estabelecimento`.
3. **Não existe endpoint "criar estabelecimento" isolado.** Ele seria a porta do órfão.

Forma mínima agora: `scripts/vincular_estabelecimento.py`, no molde do `promote_role.py`. Não precisa
de rota HTTP para resolver o R9.

O fluxo cai nos dois momentos que já existem no roteiro, e o `Lugar.estabelecimento_id` nullable já
foi desenhado para isso:

- **R3, a pé:** o curador visita e cadastra o `Lugar`. Sem dono, sem estabelecimento.
- **R10, a conversa:** o dono diz sim, faz signup no celular ali mesmo, e o curador vincula.

## Por que — o argumento que decide

**O autocadastro do dono não tem saída boa.** Não é que seja arriscado ou prematuro: a estrutura do
dado não deixa. Só existem dois desfechos, e os dois são ruins:

- **Ele cria só a conta** → nasce o órfão. Painel de zeros, sem casa, sem sentido. É o item 35 do
  `TODO.md` acontecendo por desenho em vez de por acaso.
- **Ele cria a conta e a casa junto** → um `Lugar` entra no app **sem ninguém ter ido lá**. Esse é o
  único movimento que o produto não pode fazer: é o ativo inteiro, a regra de ouro do `conceito.md`.

Dois argumentos de apoio:

- **Não há como verificar posse remotamente.** Bar não tem domínio de e-mail. Sobraria CNPJ, telefone
  da casa, algum documento — tudo infraestrutura nova, para um problema que hoje tem zero instâncias.
  O curador já está lá dentro, a pé, conversando com o dono: **verificar posse é verificação de
  campo**, igual à curadoria do lugar. Mesma viagem, mesma pessoa, mesmo critério.
- **O schema já impõe a ordem** (`dono_usuario_id` NOT NULL): signup do dono primeiro, vínculo
  depois.

## Alternativas consideradas

**Onboarding self-service do dono.** Rejeitada pelo argumento acima. Também contradiria o ADR-007 na
prática mesmo sem tocar em `papel`. Ela escala, e o autocadastro provavelmente vai ter que existir um
dia — é ele que sustenta o motor "bar quer público" do `conceito.md` sem multiplicar curadores. Mas
hoje há um bairro, um curador e zero estabelecimentos: construir isso agora é exatamente o risco que
o `conceito.md` nomeia — a coisa errada, bonita e escalável, que ninguém validou.

**`POST /curador/estabelecimentos` desde já.** Adiada, não rejeitada. O script resolve o volume atual
e usa o precedente que o projeto já tem. Ver o gatilho nas consequências.

**Fundir `Lugar` e `Estabelecimento`** (mover `dono_usuario_id` e `plano` para colunas de `Lugar`).
Rejeitada. O caso normal — casa curada a pé, sem dono — deixaria as duas colunas nulas, e elas
passariam a ser um par que só faz sentido preenchido junto: invariante mais fraca que uma tabela
separada. E `plano` é relação de cobrança, não propriedade de um ponto no mapa: um dono com duas
casas paga um plano, não dois. A relação é 1:N de propósito.

## Consequências

- **O R9 muda de enunciado.** Não é "como um estabelecimento é cadastrado" — não existe esse
  cadastro. É **"como uma casa já curada é vinculada ao dono dela"**. Enunciada assim, a pergunta
  quase se responde.
- **Nenhum estabelecimento pode existir antes do R3.** A curadoria a pé é pré-requisito estrutural,
  não só de conteúdo.
- **A invariante "pelo menos um lugar" não é garantida pelo banco.** Cardinalidade ≥1 não é
  expressável em FK simples; quem a garante é o ato ser único e transacional. Se um dia houver
  endpoint, ele precisa receber o(s) `lugar_id` na mesma chamada — nunca criar primeiro e vincular
  depois.
- **Gatilho para virar tela no painel do curador:** quando rodar script virar gargalo operacional
  (o mesmo gatilho que o ADR-007 já nomeia), ou antes disso, se o curador não conseguir rodar um
  script no meio do bar e o passo 2 travar. A saída então é uma tela em `/curador`, **não**
  onboarding do dono.
- **O ADR-008 depende deste.** Sem `estabelecimento_id` preenchido não há posse a verificar, e o
  dono não pode publicar em lugar nenhum.
- **Nome pendente, e não decidido aqui.** "Estabelecimento" se lê como "o bar", que é justamente o
  que a entidade não é — o mesmo mal-entendido aparece na UI, onde `/estabelecimento` é chamado de
  "painel do estabelecimento" e na verdade é o painel do **dono**. Renomear (`ContaDeDono`,
  `Parceria`) custa uma migration e **zero dado**, porque a tabela está vazia. A hora barata de fazer
  isso é junto da implementação deste ADR; depois encarece para sempre.
