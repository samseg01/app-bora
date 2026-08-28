# ADR-009 — Sinal de presença verificado por proximidade

## Status

**Proposto** (28/08/2026). Não implementado. Decide-se junto com os itens 40 e 41 do `TODO.md`, que
são a mesma pergunta vista de outros lados.

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
3. **O raio é configuração** (como as janelas de frescor), começando em ~150 m e calibrado em campo
   no R8. O limiar de "você está aqui" da busca por bairro nasceu de um chute de escritório de
   1500 m e foi corrigido para 700 m no primeiro teste em aparelho real, no mesmo dia — este vai
   precisar do mesmo tratamento.
4. **Sem permissão de localização, sem sinal.** Nada de "não consegui te localizar, marca assim
   mesmo": qualquer fallback reabre o buraco inteiro e o motor volta a não valer nada.

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
