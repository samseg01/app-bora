# Sistema visual — fundação monocromática e a volta da cor

> **Duas camadas, e o arquivo cobre as duas.** A camada 1 (02/09) tirou toda a cor; a
> camada 2 (02–03/09) devolveu por eixo semântico. Ler as duas em ordem: a segunda só
> faz sentido sabendo o que a primeira consertou.

## O que faz

Substitui o sistema visual do hi-fi (quase-preto arroxeado, Anton condensado maiúsculo, magenta +
âmbar + ciano + violeta) por um monocromático suave: preto, cinzas e branco, Inter, superfícies
elevadas com raio generoso.

**É a camada 1 — a fundação.** Trata de *tokens, tipografia, cor e superfície*. Composição,
densidade e o desenho de cada tela ficam para uma segunda camada, por decisão de 02/09: meio app
recomposto é pior que nenhum, e a fundação precisa estar de pé antes.

## As três regras

Estão no cabeçalho de `frontend/src/app/globals.css`, que é a fonte da verdade. Quebrar qualquer
uma desfaz o sistema:

1. **Os nomes dos tokens são de PAPEL, não de matiz.** `--color-agora`, nunca `--color-magenta`.
   Não é preciosismo: o hue no nome foi **exatamente o que travou a mudança** — 143 arquivos
   diziam "magenta" quando queriam dizer "agora", e trocar a cor exigia reescrever o significado
   junto.
2. **O branco é o acento, e por isso é escasso.** O texto corrente é cinza (`--color-text-dim`, o
   que o `body` herda). Branco puro fica para título (27 lugares) e para "agora" (~6). Branco em
   tudo é o mesmo erro que magenta em tudo, sem a cor.
3. **A superfície é suave, a régua é discreta.** O card agrupa por *elevação* — um degrau de cinza
   acima do fundo, raio generoso, borda quase invisível —, não por contorno desenhado.

## Por onde passa

| Arquivo | O quê |
|---|---|
| `app/globals.css` | os tokens, o `pulse-agora`, as utilities `rotulo`/`titulo`/`elevado`, as transições |
| `app/layout.tsx` | Inter como única família; Anton removido |
| `lib/frescor.ts` | o mapeamento reescrito — só `live` tem cor |
| 51 arquivos `.tsx` | 310 trocas de cor, 42 `uppercase` removidos, 26 CTAs invertidos, 120 raios, 141 bordas → régua, 36 cards elevados |
| `app/manifest.ts`, `public/offline.html` | `theme_color` acompanhando |

## As decisões que não são óbvias

**O CTA primário deixou de ser colorido.** Botão branco sobre preto, não terracota/magenta. Foi
isso que liberou o acento para significar uma coisa só — enquanto o CTA era da cor do "agora", o
acento aparecia em toda tela e não dizia nada.

**`warm` e `new` perderam a cor e ganharam forma.** `live` é ponto branco cheio pulsando; `warm` é
ponto cheio cinza claro; `new` é **anel vazado**. O anel não é enfeite: ele diz "ainda não tem
ninguém" pela própria forma, o que a cor nunca conseguiu dizer quando ciano parecia tão vivo
quanto magenta.

**O suíço puro foi suavizado depois de ver em tela.** A primeira versão era `#000000`, régua de
1px e raio zero. Ficou dura — cartaz, não app de madrugada. O que mudou: o fundo saiu do preto
absoluto (`#08080a`), a régua virou `#ffffff14`, voltaram raio (12/16/20) e sombra de elevação.
**Isso é registro de que a versão dura existiu e foi rejeitada com o olho**, não no papel.

**Três suavizações que não estavam no pedido** e valem tanto quanto o raio: transição de 140ms em
tudo que responde a toque (troca de estado por corte seco é metade da sensação de "duro");
`line-height: 1.55` no corpo; e o tracking do rótulo caiu de 2px para 1.2px.

## Como verificar

1. `.\scripts\regressivo.ps1` — verde.
2. **A olho, num telefone**, que é como foi decidido: `/abertura`, `/`, `/role/[id]`, `/perfil`.
3. **O teste que importa:** numa tela com um rolê `live` e outros sem, o "Bombando agora" tem que
   saltar. Se não saltar, a saída **não é devolver cor** — é escurecer os cinzas à volta.
4. `grep -r "magenta\|amber\|cyan\|violet" frontend/src --include=*.tsx` deve voltar vazio.

## O que deliberadamente não faz

- **Não recompõe tela nenhuma.** Espaçamento, hierarquia e o desenho de cards, listas e navegação
  são a camada 2. Aqui só mudou o vocabulário visual, não o layout.
- **Não resolve o mapa** — ver abaixo.
- **Não tem modo claro.** O app é usado à noite, na rua; tela clara às 2h dentro de um bar escuro
  é agressiva e denuncia quem está mexendo no celular. Foi uma das quatro direções oferecidas e
  foi recusada por isso.
- **Não usa cor para categoria.** Categoria era âmbar e virou cinza. Se um dia precisar voltar a
  se distinguir, o caminho é forma ou posição, não hue — senão a regra 2 cai.

## O que o teste em telefone pegou, e nenhum teste automatizado pegaria

Quatro bugs, encontrados por um screenshot em 02/09. **Os quatro passaram por `lint`, `build` e
pelos 56 testes** — e a causa comum vale mais que os bugs:

**A varredura mexeu em classes Tailwind. Nenhum dos quatro era classe.**

1. **O check invisível.** O ✓ da confirmação tinha `stroke="#fff"` **fixo no JSX**, dentro de um
   círculo que virou branco. Branco sobre branco: um disco liso, sem símbolo.
2. **O coração rosa.** `fill="#ff6fa0"`, sobrevivente do sistema antigo pelo mesmo motivo.
3. **O bloco de foto começava no acento.** `from-agora via-pedra` — ou seja, **foto ausente era a
   coisa mais clara da tela**, o oposto exato da regra 2.
4. **O vazamento semântico** (abaixo), que é o mais grave.

Foram **17 cores fixas em hex** no total. Todas viraram `currentColor`, que herda do elemento: a
próxima troca de sistema leva os SVGs junto em vez de deixá-los para trás. **Se aparecer um
`stroke="#..."` novo em JSX, é regressão** — a busca por `bg-magenta` nunca vai encontrá-lo.

### O vazamento: a regra 1 foi violada por quem a escreveu

O mapeamento mecânico trocou `text-magenta-soft` por `text-agora-soft`, e de repente link, aba
ativa, chip selecionado e coração de salvar estavam **todos dizendo "agora"**. Era o erro do
magenta com nome novo, cometido no mesmo dia em que a regra contra ele foi escrita.

Corrigidas 82 ocorrências, e criado `--color-selecao` — **a mesma cor branca hoje**, token separado
de propósito: um chip que você está tocando e um rolê que está bombando são coisas diferentes, e se
um dia precisarem divergir o lugar já existe.

Depois disso, `agora` sobrou em **seis lugares**: `lib/frescor.ts` (3), a legenda do mapa e a barra
de expiração do sinal. É onde ele devia estar desde o começo, e é o número a conferir se alguém
suspeitar de regressão.

## Camada 2 — a cor volta, por eixo semântico

A camada 1 resolveu o problema (cor sem significado) e criou outro: **o app ficou preto e
branco demais.** A cor voltou, mas com uma regra que impede o ciclo de recomeçar — ela
volta por **eixo**, e são dois, independentes:

| Eixo | Cores | Comportamento |
|---|---|---|
| **Frescor** — o que acontece agora | magenta `#ff3d81`, âmbar `#ffb443`, ciano `#1fd0ff` | saturado, pulsa, é o teto de vibração da tela |
| **Categoria** — o que o lugar é | 8 matizes | vibrante, mas **nunca mais que o frescor** |

Os três hexes do frescor são os do hi-fi, sem alteração: é o único uso em que a cor
antiga sempre apareceu sozinha e sempre significou uma coisa só.

**O que NÃO recebeu cor de volta, de propósito:** CTA primário, aba ativa, link e
seleção. Foi devolvê-los ao neutro que liberou o acento — se o botão voltar a magenta,
volta a competir com o `live`, e o sistema antigo está de volta com outro nome.

### As 8 categorias, e por que essas matizes

`lib/categorias.ts` é o ponto único, no molde do `frescor.ts`. Três propriedades
deliberadas:

1. **A matiz encoda a escada do `conceito.md`.** Boteco, Bar, Feira e Praça em tons de
   terra — a base que o produto quer atender. Sarau, Galeria, Casa de show e Balada em
   frios — o topo programado. Quem cadastra lê o eixo sem que ninguém explique.
2. **Evitam a vizinhança do frescor.** Magenta vive em 340°, âmbar em 38°, ciano em
   190°. A categoria que mais se aproxima é Balada (325°), e ela se separa por saturação
   e por posição: rótulo pequeno contra ponto que pulsa.
3. **Vibrantes, com teto.** O primeiro corte era tão dessaturado que o app continuava
   parecendo monocromático — subiram a pedido. **Se uma categoria gritar mais que um
   rolê bombando, a hierarquia inverteu e está errada.**

**O caso `Bar`, que precisou de um segundo corte.** A matiz dele (45°) é vizinha do âmbar do
`warm` (38°), e em tela um pin de categoria e um pin quente pareciam a mesma cor. Nenhuma das
duas podia sair do lugar — o âmbar é do hi-fi, e `Bar` precisa ficar entre `Boteco` e `Feira`
para a escada se ler. Então quem separa é a **luminosidade**: `#a8802f`, latão escuro, contra
`#ffb443`. Vale como método para o próximo conflito de matiz.

### Onde a cor aparece

- **Card** — o bloco no lugar da foto vira gradiente da categoria. É a maior superfície
  do card, e foi o que resolveu o "card cinza com uma palavra colorida" da primeira
  tentativa. De quebra, o gradiente **deixou de girar por índice na lista**: variar por
  posição era decoração, e o prop `indice` morreu junto.
- **Mapa** — cor **e tamanho**, na escala do hi-fi: 10px sem frescor, 14px em
  `warm`/`new`, 16px em `live`. Redundância deliberada: um mapa lido de relance na rua
  precisa que o "está bombando" chegue pelo tamanho antes da cor.
- **Pin sem rolê, e sem calor** — mostra a **categoria**, não cinza. E "sem calor" inclui
  `new`: só `live` e `warm` ganham da categoria no pin, porque só eles afirmam que tem gente
  ali. `new` significa "recém-criado, ninguém sinalizou ainda" — o estado de **todo rolê no
  minuto em que nasce** —, e deixá-lo ganhar pintava o mapa inteiro de ciano: oito casas de
  categorias diferentes viravam oito pontos idênticos, e a cor voltava a não dizer nada.
  Apareceu na primeira tela da camada 2, num screenshot. No **card** o `new` mantém o anel
  ciano, porque lá é um badge pequeno ao lado do rótulo e do bloco-foto, que já carregam a
  categoria; a disputa só existe onde o pin é a única marca.
  A regra vive em `frescorDominaOPin()` e tem teste — ela é sutil e some fácil numa
  refatoração. O mapa de um bairro sem rolê
  ficava inteiro apagado, dizendo sem querer que não havia nada ali — quando havia casas
  que alguém foi visitar a pé. A hierarquia se mantém porque o frescor ganha em três
  eixos ao mesmo tempo: cor, tamanho e pulso.
- **Confirmação de presença** — círculo magenta e a barra de expiração com o gradiente
  `90deg, #ff3d81 → #ffb443`, literalmente o do hi-fi. Ela vai de "agora" a "esfriando",
  que é o que ela mede.
- **Painel do estabelecimento** — sem design prévio, então a decisão foi dar ao dono **o
  mesmo vocabulário que ele vê no app público**: sinais de presença em magenta (o número
  do agora), pessoas que salvaram em âmbar (interesse que fica), inventário neutro. Zero
  nunca ganha cor — seria celebrar o vazio.

### `--color-agora` foi removido

Ele nasceu na camada 1 para ser "o acento". Quando a cor voltou, descobriu-se que **tudo
que o usava falava do lugar estar cheio** — era `live` com outro nome, inclusive o
círculo do "Tá marcado", que no hi-fi sempre foi magenta. Manter dois tokens para a mesma
afirmação era o começo do problema de novo.

### A armadilha do Tailwind v4 que quase passou

O gradiente foi escrito primeiro como template: `` from-${cor}/45 ``. **Não funciona** —
o Tailwind v4 varre o código atrás de nome de classe **literal**, e uma montada em
template não é gerada. O bloco ficaria transparente **sem erro nenhum**, nem no build nem
no lint. As classes agora são escritas por extenso, e há um teste com regex que rejeita
classe montada.

### O que a camada 2 revelou sobre o dado

O card do único rolê de República **não colorava** — e não era bug: `Lugar.categoria`
estava como `"forró"`, fora do vocabulário, então caía em neutro de propósito. **Foi a
camada de cor que denunciou o item 48**, e ele foi corrigido no mesmo movimento: a
categoria virou `Boteco` e `Forró` foi para as tags, que é onde essa informação sempre
pertenceu.

Vale como propriedade do sistema: **cor que não aparece quando o dado é inválido é melhor
que cor inventada.**

## Em aberto — o basemap do mapa

**Deixado em aberto de propósito**, por decisão de 02/09. O `mapa-real.tsx` documenta o problema no
próprio arquivo: o CARTO dark-matter foi escolhido *"para conviver com o `#08060f` do app e fazer
os pins magenta/âmbar/ciano saltarem"* — e as duas metades dessa justificativa expiraram. O fundo
agora é quase-preto neutro e os pins são branco e cinza, contraste bem menor sobre um mapa
cinza-azulado.

Saídas, quando for a hora: trocar o estilo por um neutro, ou `filter: grayscale()` no container.
É item do `TODO.md`.

## Ligações

- `frontend/src/app/globals.css` — o cabeçalho é a fonte da verdade
- `frontend/CLAUDE.md`, seção "O design" — tokens, tipografia e as armadilhas
- O hi-fi segue valendo como registro do **fluxo** das telas, não do estilo
