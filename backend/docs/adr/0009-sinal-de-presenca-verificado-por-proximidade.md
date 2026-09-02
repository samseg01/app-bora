# ADR-009 — Sinal de presença verificado por proximidade

## Status

**Aceito** em 01/09/2026, com duas emendas em relação ao texto proposto em 28/08 — ver
"Emendas na aceitação", abaixo. **Ainda não implementado**: a feature é fase 2 (ver
`../../../docs/plano-presenca.md`), e o que a aceitação muda hoje é que ela deixa de ser hipótese
e passa a ser a premissa em que `plano-presenca.md` e `plano-chat-role.md` podem se apoiar.

O que a aceitação destrava, e por isso ela vinha primeiro: os itens 40 e 41 do `TODO.md` são a
mesma pergunta vista de outros lados, e as duas specs de fase 2 já estavam escritas assumindo
esta decisão.

## Contexto

Há uma incoerência no produto desde o começo, e ela ficou visível ao responder "para que serve o
botão hoje":

- O rótulo diz **"Tô indo"** — que é intenção, dita de casa.
- O dado gravado é `TipoSinalizacao.PRESENCA` — que é estar lá.
- O motor de frescor lê isso como **"tem gente nesse lugar agora"**.

As três coisas só coincidem para quem sinaliza de dentro do bar. Para um curador em campo,
coincidem. Para qualquer outra pessoa, não — e foi por isso que sinalizar nasceu restrito a curador
e dono (ADR-006), com o `conceito.md` escrevendo "com cautela" antes de existir código.

Isso deixou o item 40 em impasse: **"Tô indo" é a ação-título do app e a conta comum não a tem**, o
que faz entrar no app não mudar nada. Liberar sem mais nada entregaria o motor mais fraco da tabela
de incentivos e ainda tornaria o sinal forjável — o item 34 mostrou que isso não é hipótese: uma
pessoa sozinha tocando três vezes acendia "Bombando agora".

O item 41 é o mesmo problema por outro ângulo: um sinal deixado às 09h58 fazia o card de um rolê
das 21h dizer "Começando a encher" às 11h30.

Desde 28/08 existem as peças para resolver: `lib/localizacao.ts` no cliente, PostGIS e
`GET /lugares/proximos` no servidor.

## Decisão proposta

**Sinalizar presença exige estar perto do lugar, verificado no servidor.**

`POST /sinalizacoes` passa a receber `lat`/`lng`; o backend compara com a geometria do lugar
(direto, ou via o `Lugar` do `Role`) e recusa fora do raio. Quatro regras que fazem parte da
decisão, não detalhes:

1. **A verificação é no servidor.** No cliente, basta não chamar.
2. **A coordenada não é guardada.** Confere e descarta — mesma regra de `GET /lugares/proximos`, e
   a promessa de privacidade continua literal. Precisa estar dito na tela.
3. ~~**O raio é configuração**~~ — **substituído pela emenda 1 na aceitação.** O texto proposto
   dizia: "o raio é configuração (como as janelas de frescor), começando em ~150 m e calibrado em
   campo no R8". Continua valendo o alerta que o motivou: o limiar de "você está aqui" da busca
   por bairro nasceu de um chute de escritório de 1500 m e foi corrigido para 700 m no primeiro
   teste em aparelho real, no mesmo dia.
4. **Sem permissão de localização, sem sinal.** Nada de "não consegui te localizar, marca assim
   mesmo": qualquer fallback reabre o buraco inteiro e o motor volta a não valer nada.

## Emendas na aceitação (01/09/2026)

### Emenda 1 — o raio é do rolê, não uma constante global

**O raio é definido na criação do rolê, por quem cria.** Substitui a regra 3 proposta, que fazia
dele uma configuração única do sistema (`~150 m` para tudo).

O motivo é que o perímetro que significa "você está aqui" **não é uma propriedade do sistema, é
uma propriedade física do rolê**. Um bar de esquina, um rooftop, um subsolo e uma festa de rua
que ocupa dois quarteirões não cabem no mesmo círculo, e nenhum número global acerta os quatro.
Um raio único erra nas duas direções ao mesmo tempo: apertado demais para a festa de rua, largo
demais para separar dois bares vizinhos do Largo do Arouche.

Quem cria o rolê é o curador, **que esteve lá** — é a única pessoa no fluxo que sabe o tamanho do
lugar. Pedir esse número a ele é o mesmo princípio que já governa o resto do produto: a afirmação
vem de quem foi em campo.

Consequências, e nenhuma é de graça:

- **Coluna nova em `Role`** (`raio_metros`), com migration. É a primeira consequência de schema de
  qualquer decisão de fase 2 — está registrada como item no `TODO.md`.
- **Campo novo no painel do curador**, no formulário de publicar rolê.
- **Precisa de um padrão.** Obrigar o curador a decidir um raio em todo rolê é atrito num
  formulário que já é longo. A leitura adotada: a coluna é *nullable* e o valor global vira o
  **default** em vez da regra — quem não preencher cai nele. Isso preserva a calibração do R8,
  que passa a calibrar o padrão, não o único valor.
- **A calibração de campo continua obrigatória.** Um raio por rolê não conserta GPS ruim; só deixa
  de fingir que todo lugar tem o mesmo tamanho.

Uma pergunta que fica aberta de propósito: se o raio deveria nascer do `Lugar` (permanente, o
tamanho da casa não muda entre uma quinta e um sábado) e o `Role` só sobrescrever quando for
exceção — o que evitaria redigitar o mesmo número toda semana. Fica para a implementação, junto
com o item 44, que já decidiu que programação semanal não gera rolê automático.

### Emenda 2 — as duas ações são parte da decisão, não consequência dela

"Tô indo" e "Tô aqui" **passam a ser duas ações distintas no produto**, e isso está aceito junto
com o resto — não é um desdobramento a decidir depois:

- **"Tô indo"** — a pessoa **não** está no rolê. Sem GPS, não alimenta o frescor, serve para
  avisar quem te acompanha. É o motor social, fase 2.
- **"Tô aqui"** — a pessoa está dentro do raio daquele rolê, verificado no servidor. É o que
  alimenta o frescor.

A tabela abaixo, que no texto proposto era ilustração da consequência, passa a ser normativa.

### A consequência que muda o produto

Se a presença é verificada, o botão deixa de ser "Tô indo" e vira **"Tô aqui"**. E fica claro que
sempre houve **duas ações diferentes espremidas numa**:

| Ação | Onde | GPS | Para que serve |
|---|---|---|---|
| **"Tô indo"** | de casa | não | avisar amigos — a fase 2 do `conceito.md` |
| **"Tô aqui"** | no lugar | sim | alimentar o frescor |

O desenho original juntou as duas porque o motor social não existia. Separá-las resolve o item 41
de graça: sinalizar às 10h da manhã deixa de ser possível, porque você não está lá.

## O que isto NÃO faz

Registrado explicitamente para ninguém confundir depois:

- **Não prova presença.** Geolocalização de navegador se falsifica em minutos, no devtools ou com
  um app de GPS falso. Isto é atrito, não controle de segurança: sobe o custo de mentir de zero
  para pequeno.
- **Não distingue bares vizinhos.** Com raio generoso o bastante para o GPS urbano funcionar,
  vários lugares do Largo do Arouche caem no mesmo círculo.
- **Piora justamente onde importa.** O erro de GPS entre prédios altos vai de 50 a 200 m, e piora
  dentro do bar — que é exatamente o momento em que se quer o sinal. Raio apertado rejeita quem
  está lá de verdade, e essa é a pior falha possível: punir o honesto.

Vale mesmo assim porque a maioria não mente por não ter motivo. O que se quer evitar é o sinal
distraído de quem aponta do sofá, e para isso atrito basta.

## Alternativas consideradas

**Manter restrito a curador (estado atual).** Defensável enquanto houver um bairro e um curador,
e é o que o `conceito.md` mandou fazer. Deixa de ser quando o app precisar de frescor sem
multiplicar curadores — e mantém o app parecendo morto para quem entra, que é o item 40.

**Liberar para todos sem verificação.** Entrega o motor mais fraco sem âncora nenhuma. O item 34
já mostrou o que acontece.

**Confiar no comentário em vez do sinal.** O comentário é assinado e custa mais para forjar, e já
está liberado para qualquer autenticado. Mas ele é lento e raro — não serve como sinal binário de
"tem gente agora", que é o que colore o card.

## Consequências

- **Destrava o item 40.** Sinal verificado por presença deixa de ser ruído: um usuário comum
  sinalizando vira evidência. É o caminho para o motor de frescor sair do "com cautela".
- **Resolve o item 41** sem regra extra.
- **Custa uma permissão no momento mais sensível.** Pedir localização na hora de contribuir é
  atrito real, e parte das pessoas vai recusar. O ganho é o sinal valer alguma coisa.
- **Muda a tela e o vocabulário**, não só a API: "Tô aqui", e o "Tô indo" migra para a aba de
  Conexões quando ela existir.
