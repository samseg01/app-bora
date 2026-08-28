# ADR-008 — O estabelecimento publica o próprio rolê, com atribuição em vez de aprovação

## Status

**Proposto** (28/08/2026). Não implementado e não decidido: depende da primeira conversa com um
dono de estabelecimento, marcada para hoje. Registrado agora porque a linha de raciocínio existe e
se perde se não for escrita — e porque a conversa deve **testar** esta hipótese, não apresentá-la
como pronta.

## Contexto

O `docs/conceito.md` já classifica este motor, e o classifica alto:

> **Oferta** (o que existe) | Estabelecimento divulga o próprio rolê + campo/curadores cadastram |
> Incentivo egoísta: **bar quer público** | Fase: **Já**

E na nota de risco: *"Estabelecimento é o único motor que resolve conteúdo **e** embute monetização
**e** não depende de já ter usuários. Mas tem viés (todo dono acha o próprio rolê ótimo) — a
curadoria de campo filtra."*

É o motor mais forte da lista de incentivos, o único que não sofre de cold start, e **não existe**.
Hoje `POST /curador/roles` exige `papel=curador`; o painel do dono tem três rotas, todas `GET`. Um
dono não consegue publicar nada.

Duas coisas do modelo atual importam para a decisão:

- `Role.criado_por` **já existe** desde a migration inicial e nunca foi exposto em nenhum schema. O
  sistema já sabe quem publicou cada rolê; falta só contar isso.
- `Lugar.estabelecimento_id` é nullable e ligável depois, o que permite o lugar existir (curado em
  campo) antes de o dono entrar (ver R9 no `TODO.md`).

## Decisão proposta

**O dono publica direto, e o card diz quem afirmou o quê.** Sem fila de aprovação.

A chave é notar que existem **duas afirmações diferentes, de fontes diferentes**, e que hoje elas
estão coladas numa só:

| Afirmação | Quem sustenta | O que o app garante |
|---|---|---|
| "Este lugar presta" | Curador que esteve lá a pé | O app garante — é a curadoria |
| "Hoje tem forró às 21h" | A casa | O app **atribui**, não garante |

O lugar continua entrando só depois de visita — isso não muda e é o ativo do produto. O que passa a
ser possível é a casa informar o que acontece nela hoje, com a origem visível no card.

Implementação mínima, quando for a hora:

1. Permitir que `papel=dono_estabelecimento` crie `Role` **apenas** em `Lugar` cujo
   `estabelecimento_id` seja o dele. A restrição de posse é o que impede o motor de virar spam.
2. Expor a origem derivada de `Role.criado_por` (`"curador"` | `"estabelecimento"`) nos schemas de
   leitura. Nenhuma coluna nova.
3. Mostrar a atribuição no card e no detalhe, com o mesmo peso visual que o "validado em campo"
   teria — não como selo de segunda classe, e não escondido.

## Alternativas consideradas

**Fila de aprovação: o dono publica, fica pendente, o curador libera.** Rejeitada. É o reflexo
natural e trava na prática: a casa publica às 18h e precisa de um humano disponível antes das 21h.
Um rolê que só aparece depois de começar não serve a um app cuja tese é "hoje à noite". Também cria
trabalho recorrente para o curador, que é o recurso mais escasso do projeto — e "manual antes de
sistema" vale para descobrir o que funciona, não para virar gargalo permanente.

**Publicar livre, sem atribuição.** Rejeitada por motivo oposto: apaga a diferença entre o que o
app viu e o que a casa afirmou, que é exatamente o que o produto tem para vender. No dia em que o
leitor não souber distinguir, a curadoria deixa de valer alguma coisa.

**Continuar só com curador.** É o estado atual e é defensável enquanto houver um bairro e um
curador. Deixa de ser no momento em que a oferta tiver de escalar sem multiplicar curadores — que é
justamente o gargalo que este ADR antecipa.

## Consequências

- **O viés do dono passa a estar na tela, e isso é proposital.** Todo dono acha a própria casa
  ótima. A resposta não é filtrar tudo, é dizer de quem é a fala. Quem lê decide o quanto vale.
- **Casa com a monetização.** O `conceito.md` define destaque verificado como exigindo validação de
  curador em campo. Este ADR mantém isso intacto: a listagem básica é declarada, o **destaque** é
  curado. Sem isso, o produto pago e o gratuito seriam a mesma coisa.
- **Abre a necessidade de tirar do ar.** Se a casa anunciar o que não confere, o curador precisa
  poder derrubar — `DELETE /curador/roles/{id}` já existe e serve.
- **Depende do R9.** Sem `Lugar.estabelecimento_id` preenchido não há posse a verificar, e o
  vínculo hoje é feito na mão (ver R9 no `TODO.md`).

## O que a conversa precisa responder

Este ADR é hipótese até estas perguntas terem resposta do lado de lá:

1. Ele publicaria com antecedência ou na hora? Isso decide se o formulário pede "evento da semana"
   ou "o que tem hoje".
2. Quem na casa faria isso — ele, o gerente, quem está no caixa? Decide a complexidade aceitável.
3. O que ele acha que deveria acontecer se uma casa anunciar o que não confere? A resposta diz se a
   parceria funciona, e é a pergunta mais reveladora das três.
