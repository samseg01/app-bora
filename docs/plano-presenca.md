# Feature — Sinalização de presença

*Documentação por feature. Escopo: o ato de sinalizar presença num lugar/rolê, os motores de incentivo por trás dele e o compartilhamento em Story. O chat do rolê, que é o gancho inicial desta feature, tem doc próprio em `plano-chat-role.md`. Faz parte do conceito maior descrito em `conceito.md`.*

---

## O que é

O usuário sinaliza, com um toque, que está num lugar ou rolê. Esse gesto alimenta o dado mais valioso e mais perecível do app — o **agora** — e desbloqueia camadas sociais em cima disso.

**Distinção importante:** sinalizar presença (efêmero — "estou aqui agora") ≠ favoritar lugar (permanente — "gosto desse lugar"). São duas ações diferentes e a interface não pode confundi-las.

---

## Regra — só sinaliza quem está no lugar

**Decidido em 01/09/2026 — ADR-009, aceito** (`backend/docs/adr/0009-sinal-de-presenca-verificado-por-proximidade.md`). Só é possível sinalizar presença se a pessoa estiver **fisicamente no local**, verificado por localização (geofence no perímetro do lugar). O **raio é definido na criação do rolê**, por quem cria — não é constante global. E "Tô indo" (de fora, sem GPS) e "Tô aqui" (no raio, verificado) são **duas ações distintas**, só a segunda alimentando o frescor. Autodeclaração por toque, sem checagem, fica descartada — deixaria qualquer um marcar presença de casa e envenenaria o dado de "quantos estão aqui agora", a prova social e a porta de entrada do chat.

Consequências:
- **Integridade do dado.** O "40 pessoas aqui agora" só vale se as 40 estiverem mesmo lá — a verificação é o que separa o número de um chute.
- **Trava do chat.** Como o chat é gated por presença, a verificação garante que a conversa é só de quem está no rolê, não de curioso de fora.
- **Atrito e falhas a resolver.** GPS erra em ambiente fechado, subsolo ou prédio alto; o perímetro precisa de tolerância pra não barrar quem está na fila ou saiu um instante, sem afrouxar a ponto de aceitar quem está na esquina. QR lido no local é a alternativa mais à prova de fraude, mas depende do estabelecimento e adiciona um passo.

---

## Para que serve (4 propósitos)

1. **Gerar o dado do "agora".** Saber que um lugar está cheio *neste momento* é o que nenhum concorrente entrega bem e o Google não tem. Transforma o app de catálogo em sinal ao vivo — e é o que muda a cada noite, fazendo a pessoa reabrir.
2. **Prova social no lugar do ranking.** Ranking mostra o que já é popular (o que você já conhece). Presença é o substituto honesto: "40 pessoas aqui agora" convence sem virar nota estática.
3. **Alimentar a curadoria por baixo.** Muita gente sinalizando num lugar ainda não curado = sinal de demanda ("esse lugar merece entrar"). Input pro que promover, sem depender só do olho em campo.
4. **Base para o social.** "Mostrar pros amigos onde estou" é uma forma de presença — o motor mais forte quando houver densidade de rede.

---

## O princípio central de incentivo

**Ninguém clica por altruísmo.** O custo (parar de curtir pra mexer no celular) é imediato; qualquer benefício distante ou coletivo perde pra esse custo. O clique só acontece se a pessoa ganha algo **no instante em que clica**, e a presença cai como efeito colateral.

Corolário de design: **o botão não deveria pedir "presença" — deveria pedir outra coisa e capturar presença de lado.** O erro do Foursquare foi tornar o check-in o objetivo. O acerto é tornar a presença o *pedágio invisível* pra fazer algo que a pessoa já quer (ver quem está lá, entrar no chat, pegar um benefício, chamar a galera).

Motores descartados como principais: gamificação pura (badges/pontos — meia-vida curta, serve só de tempero), status/vaidade (funciona só pro 1% curador), altruísmo (quase ninguém).

---

## Escada de incentivos (ordem de implementação)

| Etapa | Incentivo | Depende de | Fase |
|---|---|---|---|
| **Gancho inicial** | Entrar no **chat do rolê** (doc próprio: `plano-chat-role.md`) — aberto durante o rolê, só pra quem confirmou presença | Só de haver gente no rolê | Primeiro |
| **Amplificador** | Compartilhar no **Story do Instagram** (ver seção abaixo) | Rolê já ter identidade visual boa | Fase 2 |
| **Motor social pleno** | Sinalizar presença **pro grupo próximo** dentro do app | Densidade de rede (amigos no app) | Fase 2 |
| **Reforço gradual** | **Benefício do estabelecimento** no momento (chopp, fila, brinde) | Estabelecimentos parceiros a bordo | Depois |

Notas:
- O **chat** é o gancho certo pra começar porque não depende de rede nem de parceiro — só de conteúdo acontecendo no lugar.
- O **benefício do estabelecimento** não pode ser a isca inicial: benefício como incentivo de largada atrai o "caçador de desconto" e enviesa o dado. Ele entra como reforço depois que o hábito já existe.
- O **motor social pleno** é o mais forte de todos, mas tem cold start *dentro de cada grupo de amigos* (inútil se você é o único do grupo que usa) — por isso não é o começo.

---

## Sub-feature — Chat do rolê

O gancho inicial da escada: confirmar presença destrava o chat ao vivo daquele rolê. O chat é do **rolê** (efêmero), não do **lugar** (permanente) — abre e fecha junto com o rolê e só entra quem confirmou presença.

A spec completa (regras de janela de vida, porta de entrada, identidade, moderação, requisitos e decisões em aberto) vive em doc próprio: **`plano-chat-role.md`**. Aqui basta saber que a presença é a **porta de entrada** do chat — é isso que faz do chat o "pedágio invisível" que gera o dado de presença.

---

## Sub-feature — Compartilhamento em Story

Integração estilo **Strava / Spotify Wrapped**: ao sinalizar presença, o usuário pode gerar um card bonito pra postar no Story. Ataca o cold start por um ângulo que os outros motores não alcançam — distribui na rede que **já existe** (seguidores do Instagram), não na rede do app que ainda não existe. Cada compartilhamento é, ao mesmo tempo, flex egoísta pro usuário **e** aquisição gratuita pro app.

**Os 4 princípios inegociáveis do card:**

1. **É sobre a pessoa e o rolê, não sobre o app.** O herói é o rolê; a marca é assinatura discreta no rodapé. Card com logo gigante e "baixe o app" = ninguém posta (parece anúncio, ninguém polui o próprio perfil de graça). Strava mostra a corrida da pessoa; Wrapped mostra o gosto da pessoa — o app é só a moldura.
2. **Linha de FOMO = convite implícito.** Algo como "e você, vai ficar em casa?" transforma o post em chamado: quem vê sente que está perdendo e quer saber onde é. Marketing e aquisição no mesmo toque.
3. **Distribuição na rede existente.** É o que fura o cold start de rede — o ponto estratégico da feature.
4. **Sempre opt-in, por toque.** Compartilhar presença expõe localização em tempo real; é decisão ativa da pessoa, nunca automático. Considerar opção de compartilhar o rolê ("vou nesse rolê") sem fixar "estou aqui neste minuto".

**Pré-requisito:** o card só sai bonito se o rolê tiver identidade visual boa (nome, vibe, foto). Cadastro cru = Story feio = ninguém compartilha. Por isso essa sub-feature vem **depois** de resolver a apresentação do rolê — fase 2, não MVP.

*Prévia visual: `previa-story.html`.*

---

## Requisitos funcionais desta feature

**Núcleo (quando a presença entrar — fase 2):**
- Registrar presença de um usuário num lugar/rolê com um toque, com timestamp e janela de expiração (a presença "esfria" sozinha).
- Permitir a sinalização apenas quando a localização confirma que o usuário está no local (geofence no perímetro); bloquear a sinalização fora do perímetro.
- Agregar e exibir a contagem de presenças ativas de um lugar/rolê ("X pessoas aqui agora").
- Dar acesso ao chat do rolê apenas a quem confirmou presença (requisitos do chat em `plano-chat-role.md`).

**Social (fase 2):**
- Exibir presença de amigos/rede próxima (opt-in explícito, com controle de privacidade).

**Story (fase 2):**
- Gerar card de compartilhamento com identidade visual do rolê (nome, vibe, bairro, horário, marca discreta, linha de FOMO).
- Fluxo de compartilhamento pro Story do Instagram, por toque, opt-in.

**Reforço (depois):**
- Vincular benefício do estabelecimento a uma presença confirmada, exibível no momento.

---

## Por que não é MVP

A presença precisa de **densidade que não existe no dia 1**: com poucos usuários, o mapa mostra "0 pessoas aqui" em tudo — pior que não mostrar nada, parece cidade morta. No MVP, o "está bombando" vem da curadoria de campo ("passei lá, estava cheio") ou do próprio estabelecimento, não dos usuários.

A utilidade da presença **cresce junto com a fase do produto**: no momento "em casa decidindo se saio" (núcleo inicial), o dado de "quantos estão lá exatamente agora" importa menos — a pessoa tolera dado de algumas horas atrás. Presença brilha mesmo no "já estou na rua, pra onde agora?" — que é fase posterior.

---

## Em aberto

- Qual das etapas da escada dá pra entregar *bem* no bairro-piloto define qual vira o gancho de largada (chat precisa de gente no lugar; social precisa de rede; benefício precisa de parceiro).
- Como a interface distingue, sem ruído, favoritar lugar (permanente) de sinalizar presença (efêmero).
- Modelo de expiração da presença: quanto tempo uma sinalização conta como "agora".
- Mecanismo de verificação de localização: geofence por GPS vs. QR lido no local (ou combinação). Já decidido que sinalizar exige estar fisicamente no lugar (ver regra acima) — falta escolher o método e a tolerância do perímetro.
