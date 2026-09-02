# ADR-011 — O anonimato do sinal tem escopo: público anônimo, chat identificado

## Status

**Aceito** em 01/09/2026. Não implementado — o chat é fase 2
(`../../../docs/plano-chat-role.md`). O que a decisão muda **hoje** é o copy: o app promete
anonimato sem qualificar o escopo, e a promessa passa a precisar dizer até onde vai.

Emenda ao que o item 23 do `TODO.md` fechou em 28/08.

## Contexto

O item 23 resolveu a primeira contradição de anonimato do produto com uma regra de duas metades,
que está implementada e verificada:

> **Sinal é anônimo, comentário é assinado.**

Ela funciona porque cada metade tem uma razão: o sinal precisa ser barato de dar (ninguém vê seu
nome, então dar é sem custo social), e o comentário precisa ser caro de forjar (tem autor, então
responde por ele). A home cita comentário justamente para não quebrar o anonimato do sinal.

O `plano-chat-role.md` introduz uma terceira categoria que essa regra não previu, e ela colide de
frente com a primeira metade:

- A **porta de entrada do chat é a presença** — é isso que faz do chat o "pedágio invisível" que
  gera o dado, o mecanismo central da escada de incentivos do `plano-presenca.md`.
- Dentro do chat, a spec exige que os participantes apareçam **com o próprio perfil**, porque
  conversa anônima em grupo é convite a abuso, e o próprio nome é o que dá contexto social.

Somando as duas: quem confirma presença para entrar no chat **deixa de ser anônimo**. O sinal, que
o app promete ser anônimo, passaria a te identificar pela porta dos fundos.

## Decisão

**O anonimato deixa de ser absoluto e passa a ter escopo declarado.**

| Onde | Você é | Por quê |
|---|---|---|
| Contagens públicas, card, mapa, frescor | **anônimo** — só números, nunca nomes | é o que mantém o sinal barato de dar |
| Comentário | **assinado** | responde pelo que afirma (inalterado, item 23) |
| **Dentro do chat do rolê** | **identificado para quem está no chat** | modera pelo contexto social; conversa anônima em grupo é abuso barato |

Três regras que fazem parte da decisão:

1. **A presença de quem entrou no chat continua contando.** Entrar no chat não tira você da
   contagem pública — o "X pessoas aqui agora" segue somando você, e segue sem o seu nome. A
   identificação vale **dentro** da conversa, e não vaza para fora dela.
2. **O escopo é do rolê, e morre com ele.** O chat nasce e morre com o rolê
   (`plano-chat-role.md`), então a identificação também é efêmera: não constrói histórico público
   de onde você esteve.
3. **A promessa na tela precisa dizer o escopo.** "Ninguém vê seu nome" deixa de ser verdade sem
   qualificação. O copy passa a separar as duas coisas — o nome não aparece no rolê nem nas
   contagens; dentro do chat, quem está lá vê quem você é.

## Alternativas consideradas

**Chat com apelido por rolê, sem ligação com o perfil.** Preservaria o anonimato para fora sem
abrir mão da identidade dentro. Rejeitada por duas razões: enfraquece exatamente o que a spec dá
como motivo da identidade — perfil real reduz abuso, apelido descartável não —, e cria uma
terceira identidade num app que já tem conta e papel. Continua sendo a saída se o abuso não
aparecer e a exposição incomodar.

**Entrar no chat como segundo toque explícito, separado do sinal.** Manteria o item 23 literalmente
intacto: sinaliza anônimo, e entrar no chat é outra ação que identifica. Rejeitada porque é
exatamente o atrito que o `plano-presenca.md` quer evitar — o princípio dele é que **ninguém clica
por altruísmo** e a presença tem que cair como efeito colateral de algo que a pessoa já quer. Dois
toques transformam o pedágio invisível em pedágio.

**O chat não ser a porta de entrada.** Preservaria o item 23 escolhendo outro degrau da escada como
gancho de largada. Rejeitada porque o chat é o único degrau que não depende de rede de amigos nem
de parceiro comercial — trocar por social ou por benefício é trocar um cold start por outro pior.

## Consequências

- **O item 23 deixa de estar fechado.** Ele está marcado `[x]` e verificado, mas descreve uma regra
  de duas metades que agora tem três. Precisa ser reaberto quando o chat for construído — não
  antes, porque hoje o chat não existe e a regra de duas metades ainda descreve o app real.
- **O copy do perfil e da tela de sinal muda**, e muda antes do chat existir se a gente quiser ser
  honesto sobre o rumo. Hoje o texto diz que ninguém vê seu nome, sem escopo.
- **Cria uma assimetria que precisa estar visível na hora de entrar**: você vê os nomes de quem
  está no chat, e eles veem o seu. Quem não quiser ser visto não entra — e essa escolha só é
  legítima se estiver dita antes, não depois.
- **Não muda nada no schema.** `Sinalizacao` continua sem nome exposto nas leituras públicas; o que
  muda é quem lê o quê, e isso é a rota do chat, que ainda não existe.
