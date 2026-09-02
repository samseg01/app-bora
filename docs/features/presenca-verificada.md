# Presença verificada — "Tô aqui" e "Tô indo"

## O que faz

Sinalizar presença num rolê passou a exigir **estar no lugar**: o app manda a coordenada, o
servidor confere contra o raio daquela casa e recusa quem está longe. Em troca, a ação deixou de
ser privilégio de curador — **qualquer pessoa logada** pode acender um rolê, porque a âncora agora
é onde ela está, não o papel dela.

E há **um botão só, chamado "Bora"** — quem escolhe entre as duas ações é o app (ADR-009,
emenda 3). A diferença entre elas não é preferência, é fato verificável: ou você está dentro do
raio ou não está, e o telefone sabe.

| Situação | Vira | O que a tela diz |
|---|---|---|
| dentro do raio | `presenca` | "Tá marcado" — acendeu o rolê |
| longe (403) | `intencao` | *"Você está a 3,2 km daqui, então ficou anotado que você vem"* |
| sem permissão de GPS | `intencao` | "Ficou anotado que você vem" |

As duas **não são alternativas: são estados de um ciclo.** Quem ficou em intenção e chega toca o
mesmo botão, e a *mesma linha* vira presença, com o relógio recomeçando na chegada. Por isso a tela
de "tá anotado" continua oferecendo o "Cheguei".

**A tela precisa dizer POR QUÊ.** Com um botão só, a pessoa toca esperando acender o rolê e às
vezes recebe outra coisa — sem explicação, isso lê como o app ter feito algo pelas costas dela. É
por isso que a recusa devolve `distancia_m` e `raio_m` em campo estruturado, e não só a frase.

Implementa o **ADR-009** (aceito em 01/09) e destrava o **item 40**.

## Por onde passa

**Backend**

| Arquivo | O quê |
|---|---|
| `alembic/versions/0008_raio_de_presenca.py` | `lugar.raio_metros`, `role.raio_metros`, valor `intencao` no enum |
| `services/presenca.py` | **novo** — `raio_efetivo()` e `esta_no_lugar()`; todo o ADR-009 passa aqui |
| `api/v1/contribuicao.py` | `_exige_estar_no_lugar()`; a restrição de papel caiu |
| `services/descoberta.py` | `_pessoas()` exclui `intencao` da contagem de frescor |
| `schemas/sinalizacao.py` | `lat`/`lng`, obrigatórios exceto para `intencao` |
| `config.py` | `presenca_raio_padrao_metros = 150` |
| `tests/test_presenca_verificada.py` | **novo** — 7 testes |

**Frontend**

| Arquivo | O quê |
|---|---|
| `components/ui/acao-sinalizar.tsx` | o botão único e a cascata que decide entre presença e intenção |
| `components/ui/corrigir-lugar.tsx` | campo "raio de presença" no painel do curador |
| `lib/api.ts`, `lib/types.ts` | `pos` no `sinalizar()`, `raio_metros` nos tipos |

`lib/localizacao.pedirPosicao()` **não mudou** — já existia para a busca de bairro e foi reusada.

## O raio mora no lugar, não no sistema

A decisão que mais mudou o desenho. O ADR proposto tinha um raio global de ~150 m; na aceitação
isso caiu, porque **um número único erra nas duas direções ao mesmo tempo** — apertado demais para
uma festa de rua, largo demais para separar dois bares vizinhos do Largo do Arouche.

A cascata é `Role.raio_metros` → `Lugar.raio_metros` → padrão do config:

- **No lugar** é onde o dado nasce, e é por isso que ele fica lá: quem mede é o curador, de pé na
  calçada, durante o R3. O tamanho de um bar não muda entre quinta e sábado — guardar isso no rolê
  obrigaria a redigitar o mesmo número toda semana.
- **No rolê** só para a exceção: a festa que transborda para a rua.
- **O padrão existe** para a feature funcionar com o banco de hoje, em que nenhum lugar tem raio
  medido. Sem ele, a verificação ficaria inerte até a curadoria inteira ser refeita.

## Como verificar que está de pé

1. `.\scripts\regressivo.ps1` — 56 testes, verde.
2. **O caminho feliz, em campo:** abrir um rolê logado, tocar "Tô aqui", aceitar a permissão →
   "Tá marcado", e o contador de sinais do rolê sobe.
3. **A recusa:** tocar "Tô aqui" longe do lugar → mensagem com a distância e o limite.
4. **A negativa de permissão:** negar a localização → o texto oferece "Ainda tô indo" como saída,
   em vez de dizer que falhou.
5. **O ciclo:** tocar "Ainda tô indo" → a tela diz que isso não acende o rolê; tocar "Cheguei" no
   lugar → vira presença e o contador sobe **1**, não 2.
6. **O raio importando:** pôr `raio_metros = 30` num lugar pelo painel e tentar sinalizar da
   calçada de frente. Deve recusar.

Os passos 1 e 5 estão cobertos por teste automatizado. **2, 3 e 4 foram executados em campo em
02/09**, num telefone pelo túnel: a recusa por distância veio com a mensagem certa, o aceite acendeu
o rolê como `warm` (uma pessoa não faz `live`), e o ciclo intenção→presença fechou na mesma linha.
Em 02/09, com o botão único, **os dois caminhos foram conferidos lado a lado** num telefone — dois
rolês no mesmo bairro, um com raio grande e outro com o padrão. O aceite virou "Tá marcado" com
frescor `warm`; a recusa a 10 km trouxe a distância certa. O **6 nunca foi executado** como teste
próprio, mas o par acima o cobre na prática: foi o raio de cada lugar que decidiu quem entrou.

## O que deliberadamente não faz

- **A intenção não avisa ninguém.** É registrada e não tem leitor: quem leria é a aba de Conexões,
  que não tem backend (itens 27–30). A tela **diz isso** — "isso não acende o rolê para os outros"
  — em vez de fingir que a ação serviu para alguma coisa. Preferimos a meia-feature honesta à
  feature completa mentirosa. Foi também um dos motivos de o botão virar um só: dar peso visual de
  CTA secundário a uma ação sem efeito era prometer o que não existe.
- **A recusa não é erro.** 403 e permissão negada deixaram de ser tratados como falha e viraram
  caminhos — os dois terminam em intenção, com explicação. A função que traduzia falha em mensagem
  morreu junto; sobrou só a falha genuína, que tem uma mensagem só.
- **Não detecta chegada automaticamente.** Seria preciso acompanhar a localização em segundo
  plano, o oposto exato da regra do ADR-009 de conferir e descartar. Um app que promete não guardar
  onde você esteve não pode ficar checando onde você está. A chegada é um toque.
- **Não prova presença.** Geolocalização de navegador se falsifica em minutos. Isto é atrito, não
  controle de segurança: sobe o custo de mentir de zero para pequeno, e a maioria não mente por não
  ter motivo.
- **Não distingue bares vizinhos.** Com raio generoso o bastante para o GPS urbano funcionar,
  vários lugares do Arouche caem no mesmo círculo.
- **Não abre chat nenhum** — o chat é o item 53 e não existe.
- **O raio de 150 m é chute de escritório.** Precisa do R8, e o precedente é forte: o limiar da
  busca por bairro nasceu de 1500 m e caiu para 700 m no primeiro teste em aparelho real.

## O que ainda não foi verificado, e é a parte que importa

**Nada disto foi exercitado com GPS de verdade.** Os testes rodam contra Postgres real e provam a
lógica — aceita perto, recusa longe, o raio da casa muda quem entra, intenção não acende, intenção
vira presença na mesma linha. Mas **coordenada de teste não é GPS**, e o ADR-009 é explícito em que
o erro do GPS piora justamente dentro do bar, entre prédios altos: 50 a 200 m.

Ou seja: o modo de falha mais provável desta feature — **recusar quem está mesmo lá** — é
exatamente o que a suíte não consegue reproduzir. Só o R8 responde, e é ele que decide se 150 m é
número ou chute.

Também não foi testado o caminho por HTTPS no telefone. `navigator.geolocation` **não existe** fora
de contexto seguro, então em HTTP de rede local a feature inteira cai em "sem-suporte" — o túnel do
`frontend/CLAUDE.md` resolve, e é o mesmo procedimento do R8.

## Ligações

- `backend/docs/adr/0009-sinal-de-presenca-verificado-por-proximidade.md` — a decisão e as emendas
- `docs/plano-presenca.md` — a spec de produto, e a escada de incentivos em que isto é o degrau 0
- Itens 40, 43, 51, 52, 57, 58 do `TODO.md`
