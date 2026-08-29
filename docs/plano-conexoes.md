# Plano — aba de Conexões (check-in social e salvos de quem você confia)

Feature nova: uma aba de **Conexões** com seus amigos, onde você faz **check-in** apontando para
onde está indo, avisa quem tem conexão com você, e vê os **lugares salvos** por eles.

Este documento existe porque o `CLAUDE.md` obriga a passar qualquer feature nova pela regra de ouro
do `conceito.md` antes de propor. A resposta curta: **a maior parte dela se sustenta, e uma parte
resolve um problema que o produto já tinha.** Mas ela também colide de frente com uma promessa que
o app já faz na tela, e essa colisão precisa de decisão antes de qualquer código.

---

## 1. São três features, não uma

Vale separar, porque elas têm valor, custo e risco bem diferentes:

| # | Peça | O que é | Serve à descoberta? |
|---|---|---|---|
| **A** | **Conexões** | grafo de amizade recíproca, opt-in | indiretamente — é a base das outras duas |
| **B** | **Check-in** | "tô indo pro Bar Aurora", visível às suas conexões | **não** — serve coordenação e retenção |
| **C** | **Salvos das conexões** | os lugares que seus amigos salvaram aparecem pra você | **sim, diretamente** |

Isso importa para o sequenciamento: **C é a peça que o `conceito.md` mais justifica, e é a mais
barata.** B é a mais pedida e a mais cara (notificação, privacidade, novo modelo de visibilidade).
Se as três forem construídas como um bloco só, a peça que serve à tese fica refém da que não serve.

---

## 2. O veredito contra a regra de ouro

> *"Toda feature precisa servir à descoberta do desconhecido de hoje. Se não serve, provavelmente é
> distração."* — `conceito.md`

**C passa com folga.** Um lugar que um amigo seu salvou e você não conhece é exatamente
"desconhecido bom", com confiança embutida. É o mesmo argumento do curador — alguém em quem você
confia já filtrou — aplicado a uma rede menor e mais pessoal.

**B não passa pelo teste literal**: saber que a Marina vai pro Bar Aurora não te faz descobrir
nada novo. Ela serve **retenção** e **coordenação**, que são coisas legítimas mas não são a tese.

**Mas há um argumento forte a favor de B**, e ele vem do próprio documento. O `conceito.md` monta
uma tabela de motores e diz duas coisas que, juntas, apontam para essa feature:

- **Social é o motor mais forte em incentivo** — "as pessoas já querem que amigos saibam onde estão".
- **Frescor é o motor mais fraco** — tanto que a recomendação foi "começar só com curadores e
  engajados", o que virou o ADR-0006 e é por isso que o botão "Tô indo" hoje está **desabilitado
  para todo mundo** no app.

E o princípio central: *"ninguém contribui por altruísmo. Todo motor que esconde a contribuição
dentro de um ato egoísta funciona."*

**O check-in é literalmente isso.** A pessoa avisa os amigos porque quer (ato egoísta), e o sinal de
presença cai no sistema como efeito colateral. **B é o motor que pode destravar o motor mais fraco
do produto** — e hoje esse motor está travado a ponto de a ação principal da tela de detalhe estar
desligada.

**Veredito:** vale construir, com C antes de B, e com as ressalvas das seções 3 e 4.

---

## 3. A colisão central: o app promete anonimato hoje

Isto não é detalhe. O app **já diz na tela**, em dois lugares:

- Tela de detalhe do rolê (`2d`): *"Expira sozinho. **Ninguém vê seu nome.**"*
- Perfil (`2h`): *"Seus sinais são anônimos. Ninguém vê seu nome num sinal — nem o estabelecimento."*

E a tela de Salvos diz: *"**só seus, ninguém mais vê**"*.

Um check-in que avisa amigos é o oposto do primeiro. Salvos visíveis para conexões é o oposto do
segundo. **Construir isso sem resolver a contradição quebra a promessa mais explícita do produto** —
e confiança é, segundo o `conceito.md`, o único ativo do app.

### A saída: um gesto, dois registros, duas audiências

A resolução limpa é separar **o sinal** da **identidade**, mantendo as duas promessas verdadeiras:

| | Sinalização (o que já existe) | Check-in (o que entra) |
|---|---|---|
| Quem vê | ninguém — vira número agregado no mapa | só as suas conexões, pelo nome |
| Alcance | público | círculo fechado, recíproco |
| Duração | decai em ~2h | expira em ~2h |
| Promessa | "ninguém vê seu nome" — **continua verdadeira** | "só quem você aceitou" |

Um único toque em "Tô indo" pode gerar os dois registros. O anonimato do mapa público permanece
intacto porque **nenhum endpoint público jamais expõe o autor de uma sinalização** — isso já é
verdade hoje e não deve mudar.

O que **precisa mudar** é o copy: "ninguém vê seu nome" vira algo como *"no mapa você é anônimo; só
suas conexões veem que você foi"*. Mais comprido, mas verdadeiro.

### E os salvos?

`Salvo` é privado hoje, por decisão e por copy. Tornar visível às conexões precisa ser
**opt-in explícito, desligado por padrão**, com o copy da tela de Salvos ajustado quando ligado. O
`conceito.md` já antecipa isso: *"privacidade delicada (opt-in explícito, círculos fechados)"*.

---

## 4. Riscos que o próprio conceito já nomeou

**Cold start dentro do grupo de amigos.** O `conceito.md` é explícito: social é *"inútil se você é o
único do grupo que usa"*. Diferente dos outros motores, este não degrada bem — uma aba de conexões
vazia não é "pouco conteúdo", é uma tela morta. Consequências para o projeto:

- A aba precisa ser **útil com zero conexões** ou ela afunda no dia 1. A saída é a peça C dar as
  caras: sem conexões, a aba mostra convite + os salvos dos **curadores** do bairro (que são
  conexões públicas por natureza), não uma tela vazia.
- Depende de o **bairro piloto** existir (item 1 do `TODO.md`). Amigos que saem juntos saem no
  mesmo pedaço da cidade; o piloto concentrado é o que torna a rede plausível.
- O convite precisa ser de **fricção quase zero** — link, não busca por usuário.

**Segurança, não só privacidade.** Isto é vida noturna: transmitir para onde você está indo, à
noite, é diferente de compartilhar uma playlist. O desenho tem que assumir isso:

- Conexão só recíproca (os dois aceitam), nunca unilateral.
- Check-in expira sozinho e **não deixa histórico** visível para ninguém — nem para as conexões.
- Poder desfazer o check-in ("cancelar meu sinal", que aliás já está desenhado na tela `2e` e não
  tem rota no backend).
- Poder fazer check-in **no bairro** em vez de no lugar exato, para quem quer avisar sem se
  localizar. (Recomendo ter isso no v1, não depois.)
- Nada de localização contínua em segundo plano. Check-in é um ato pontual e explícito.

**O risco de virar ranking de popularidade.** O `conceito.md` rejeita ranking como espinha dorsal:
*"ranking mostra o que já é popular — ou seja, o que você já conhece"*. Então: mostrar "2 conexões
salvaram" como **selo** num card, sim; **reordenar** a descoberta por isso, não. A descoberta segue
curatorial (decisão já registrada em `services/descoberta.py`).

---

## 5. Modelo de dados

A boa notícia: o esquema atual já quase comporta a feature.

### Entidade nova: `Conexao`

```
Conexao
  id               uuid pk
  solicitante_id   uuid fk usuario
  destinatario_id  uuid fk usuario
  status           enum(pendente, aceita, bloqueada)
  created_at       timestamptz
  respondida_em    timestamptz | null

  unique (solicitante_id, destinatario_id)
  check  (solicitante_id <> destinatario_id)
  index  (destinatario_id, status)
```

Uma linha por par, com as consultas olhando as duas direções. Não duplicar em duas linhas: dobra a
escrita e abre espaço para os dois lados divergirem.

⚠️ **Gotcha do projeto:** o enum de `status` precisa passar por `_pg_enum()` em `db/models.py`, não
por `sa.Enum(...)` direto — senão o SQLAlchemy grava `.name` em vez de `.value` e quebra em runtime,
não em teste de schema.

### Check-in: **provavelmente nenhuma entidade nova**

Um check-in é uma `Sinalizacao` de `tipo=presenca` que já existe no schema. O que falta não é
tabela, é **uma consulta com escopo**: "presenças das minhas conexões nas últimas 2h". O autor já
está lá em `Sinalizacao.usuario_id` — ele só nunca é exposto.

Se o check-in por bairro (sem lugar exato) entrar, aí sim há um ajuste: hoje a `CheckConstraint`
`ck_sinalizacao_um_alvo` exige exatamente um entre `role_id` e `lugar_id`. Um check-in "estou na
Vila" não tem nenhum dos dois. Duas saídas: relaxar a constraint para aceitar bairro, ou modelar o
check-in vago como entidade própria. **Recomendo entidade própria** — a `Sinalizacao` é o motor de
frescor e não deve ganhar semântica de "presença difusa".

### Preferência de visibilidade

Um campo em `Usuario` (`salvos_visiveis_para_conexoes bool default false`) resolve a peça C sem
tabela nova. É o menor passo honesto.

---

## 6. API

Nada disso existe hoje. Rotas propostas, todas autenticadas:

| Rota | O quê |
|---|---|
| `POST /conexoes/convite` | gera um link/código de convite de uso único |
| `POST /conexoes/aceitar` | aceita um convite (cria a `Conexao` já `aceita`) |
| `GET /conexoes` | minhas conexões + pendentes |
| `DELETE /conexoes/{id}` | desfazer |
| `GET /conexoes/agora` | quem das minhas conexões fez check-in nas últimas 2h |
| `POST /checkins` | o check-in (lugar, rolê **ou** bairro) |
| `DELETE /checkins/{id}` | desfazer — resolve também o "Cancelar meu sinal" da tela `2e` |
| `GET /conexoes/salvos` | lugares salvos pelas conexões que optaram por mostrar |
| `PATCH /usuarios/me/privacidade` | liga/desliga a visibilidade dos salvos |

**Uma decisão de arquitetura precisa ser tomada aqui:** o check-in de um usuário comum **conta para
o frescor público** do mapa?

- **(a) Não conta.** Check-in é só social; o frescor segue restrito a curadores (ADR-0006 intacto).
- **(b) Conta.** É o "esconder a contribuição dentro do ato egoísta" na veia — resolve o motor
  fraco de verdade.
- **(c) Conta, mas só de quem tem histórico** (N conexões, ou tempo de conta).

**Recomendo (a) no v1**, e (b) como decisão *medida* depois. Razão: com volume baixo, um punhado de
check-ins de amigos vira `live` no mapa público sem que o lugar esteja cheio de verdade — e frescor
errado destrói a confiança mais rápido que frescor ausente. Ir para (b) quando der para comparar
check-in com o movimento real. É a mesma disciplina de "manual antes de sistema".

Seja qual for, isso é um **ADR novo** (ou uma emenda ao 0006), não uma escolha implícita no código.

---

## 7. Telas

**A barra de navegação passa de 4 para 5 itens:** Descobrir · Mapa · **Conexões** · Salvos · Perfil.
Cinco é o teto confortável da barra inferior no telefone; não cabe um sexto depois.

### Aba de Conexões

- **Quem está fora agora** — a lista de check-ins ativos das suas conexões, com o lugar e há quanto
  tempo. É o coração da aba.
- **Salvos por quem você confia** — a peça C. Grade de lugares, cada um com quem salvou.
- **Suas conexões** — lista, convites pendentes, botão de convidar.
- **Estado vazio** — o mais importante da tela, e o que decide se a feature pega. Sem conexões:
  convite em destaque + os salvos dos curadores do bairro, para a aba nunca estar morta.

### Check-in: o botão que já está lá

O `2d` já tem o CTA **"Tô indo — vale por 2h"**, hoje desabilitado com a explicação de que sinalizar
está restrito aos curadores. **Essa feature é o que liga esse botão.** Para um usuário comum ele
passa a significar check-in visível às conexões — e a tela `2e` ("Tá marcado", contador de
expiração, "Cancelar meu sinal") já está desenhada no hi-fi e nunca foi implementada.

Ou seja: boa parte da UI de B **já existe no design** e está esperando.

### Selo nos cards

"2 conexões salvaram" como selo discreto no card de descoberta. **Sem reordenar o feed.**

✅ **Desenhado.** `docs/front-end-ideias/conexoes/` — 5 artboards: a aba em desktop (1440×900) e em
telefone (390×844), o **estado vazio**, o **convite** (com a lista do que a pessoa passa e não passa
a ver) e a **confirmação de check-in**, que é onde o copy novo do anonimato aparece. Fontes `.dc.html`
editáveis na pasta; canvas publicado.

Continua sem design: o selo "N conexões salvaram" no card de descoberta, e o estado vazio na
composição desktop (segue a mesma lógica do de telefone).

---

## 8. Notificação: o "avisar os amigos" é mais caro do que parece

"Avisando pros amigos" sugere push. Push de verdade num PWA exige: service worker (não existe —
não há nenhum SW no projeto), Web Push com VAPID, fluxo de permissão, e no iOS só funciona depois
que o usuário instala o PWA na tela inicial. É um subprojeto, não um detalhe.

**Recomendação:** v1 **sem push**. O aviso é in-app — a aba mostra quem está fora agora, e um selo
na barra indica novidade. Push entra depois, junto com o resto do trabalho de PWA (ícones reais e
service worker, itens já listados no `TODO.md`, seção Frontend).

Isso derruba muito o custo do v1 e não tira o valor central: quem abre o app à noite vê onde os
amigos estão.

---

## 9. Sequenciamento

Deliberadamente na ordem "o que serve à tese primeiro, o que é caro depois":

1. **Conexões (A)** — modelo, convite por link, aceitar, listar. Sem isso nada existe.
2. **Salvos das conexões (C)** — opt-in desligado por padrão + a grade na aba. É a peça que serve à
   descoberta e a que faz a aba não nascer vazia.
3. **Check-in (B)** — liga o botão "Tô indo" do `2d` e implementa a tela `2e`, que já está
   desenhada. Sem push.
4. **Selo "N conexões salvaram"** nos cards, sem reordenar.
5. **Push** — só junto com service worker e ícones do PWA.
6. **Reavaliar se check-in alimenta o frescor público** (a decisão (b) da seção 6), com dado.

**Pré-requisitos duros:** login no frontend (fase 3 da seção Frontend do `TODO.md` — nada disso funciona sem
usuário autenticado) e o bairro piloto (item 1 do `TODO.md` — sem concentração geográfica a rede de
amigos não fecha).

---

## 10. O que **não** fazer

- **Não** transformar a descoberta em feed social. O topo é curatorial; conexões são uma camada ao
  lado, nunca por cima.
- **Não** mostrar histórico de check-ins de ninguém. O efêmero some — é o que torna o gesto barato.
- **Não** fazer conexão unilateral (seguir). Recíproca por segurança e porque o valor é mútuo.
- **Não** expor autor de sinalização em nenhum endpoint público. A promessa do mapa anônimo é
  separada e permanece.
- **Não** construir push antes de haver conexões reais usando a aba.
- **Não** deixar a aba nascer vazia. Sem a peça C e um bom estado vazio, ela é uma tela morta.
