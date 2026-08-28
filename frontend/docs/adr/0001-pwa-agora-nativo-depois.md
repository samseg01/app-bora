# ADR-001 — PWA agora, aplicativo nativo depois

## Status

Aceito (28/08/2026). Substitui a leitura de que "PWA em vez de nativo" seria permanente: o destino
**é** nativo. O que este ADR fixa é a ordem e o que fazer hoje para chegar lá barato.

## Contexto

Surgiu a proposta de migrar o frontend para React Native, com o argumento de obter uma base de
código só para web e mobile.

O estado do projeto quando a pergunta foi feita: frontend com 9 rotas nas duas visualizações,
consumindo a API real; mapa MapLibre funcionando depois de duas caçadas de layout; zero usuários,
zero lugares curados em campo, nenhum deploy. O gargalo declarado no `TODO.md` é o roteiro R1–R10,
cujo passo mais caro (R3) é andar pelo recorte da República a pé.

Três fatos pesaram:

1. **A base única já existe.** Um Next só, mesmas URLs, mesmos dados, duas composições cortadas por
   CSS em `lg`. O React Native não removeria essa divisão — o painel do curador em 1440px continua
   não sendo uma tela de telefone, e `views/mobile` / `views/desktop` existiriam do mesmo jeito. O
   que ele acrescenta é loja; o que ele tira é web.
2. **O link é o canal de distribuição.** O `conceito.md` define o produto pela descoberta
   espontânea do que está acontecendo hoje. Alguém joga um link de rolê num grupo às 21h: na web
   abre e renderiza; em nativo, abre uma página pedindo instalação. Sem base instalada, remover o
   link é remover o mecanismo antes de testá-lo.
3. **O custo é uma reescrita.** Sai o Tailwind v4 com os tokens recriados do hi-fi (RN não tem CSS;
   NativeWind é reimplementação parcial), saem os server components e o bairro por cookie lido no
   servidor, e sai o MapLibre — trocado por `react-native-maps` ou `@rnmapbox/maps`, ambos exigindo
   chave e faturamento, justamente a propriedade "sem credencial no deploy" que motivou o CARTO.

## Decisão

**Continuar em Next.js + PWA até que exista comunidade em pelo menos um bairro.** Nativo é o
destino declarado, não uma possibilidade remota — mas depois da validação, não antes.

Enquanto isso, o código é escrito para que a migração seja portável. Três regras, todas
verificáveis em revisão:

- **Regra que já existia, agora com um segundo motivo:** regra de negócio mora em `lib/`, nunca em
  `views/`. Antes isso evitava manter dois apps em sincronia; agora `lib/` também é *exatamente o
  que sobrevive* a uma migração para RN. Cada regra que vaza para dentro de `views/` é uma que
  vai ser reescrita duas vezes.
- **API é o contrato, e ela é agnóstica de plataforma.** O backend FastAPI não sabe o que é um
  navegador. Nenhuma rota nova deve assumir cliente web (nada de HTML, redirect ou cookie como
  transporte de estado de aplicação).
- **Isolar o que é do navegador.** Hoje: token em `localStorage` (`lib/auth.ts`) e bairro em cookie
  (`lib/bairros.ts`, `lib/bairro-servidor.ts`). São os dois pontos que um cliente nativo teria de
  trocar (por `SecureStore` / `AsyncStorage`). Devem continuar sendo os *únicos* — nenhum acesso
  direto a `localStorage`, `document.cookie` ou `window` espalhado por componente.

## Gatilhos para reavaliar

Revisitar quando **qualquer** um destes for verdade, não antes:

- O app passa a ser aberto por hábito em vez de descoberto por link (medível: retorno sem link).
- Push confiável no iOS vira requisito de produto — "tem algo acontecendo perto de você agora" é o
  caso óbvio, e é o motor de incentivo mais forte do `conceito.md` ainda não construído.
- Alguma capacidade nativa entra no escopo: geofencing em segundo plano, câmera para foto de campo
  do curador, localização contínua.
- Um estabelecimento ou curador pede o app na loja como condição — sinal de que a loja virou
  legitimidade, não fricção.

## Caminho de migração quando a hora chegar

Duas saídas, e a escolha entre elas depende do gatilho:

- **Capacitor**, se o que faltar for presença na loja e push. Empacota o app web existente sem
  reescrever. Ressalvas honestas: a Apple recusa webview puro sem valor nativo, e ele funciona
  melhor contra build estático do que contra o modelo de servidor usado hoje.
- **React Native / Expo de verdade**, se o que faltar for capacidade nativa contínua (localização
  em segundo plano). Aí é reescrita da camada de apresentação — e é aqui que as três regras acima
  pagam: `lib/` e a API atravessam, `views/` não.

Em nenhum dos dois casos a web é abandonada: o painel do curador e o do estabelecimento são
superfícies de desktop por decisão registrada, e o link compartilhável continua sendo como um
desconhecido descobre o app.

## Consequências

- O `TODO.md` ganha o que falta para ser PWA de fato — manifest, ícones e service worker não
  existem hoje (`public/` só tem os SVGs do scaffold), então o app é um site responsivo, não um
  PWA. É o item que entrega ícone na tela inicial e tolerância a sinal ruim por perto de um dia de
  trabalho.
- Web push cobre Android e, desde o iOS 16.4, PWAs instalados — o que adia o gatilho de push, mas
  não o elimina: a instalação no iOS exige um gesto manual que quase ninguém faz.
- Fica registrado que a resposta "não" tinha prazo. Quem reabrir esta discussão daqui a três meses
  deve olhar os gatilhos acima, não repetir a análise.
