# Conceito — App de descoberta de rolês (SP)

*Documento de consolidação do brainstorm. Captura as decisões e o raciocínio por trás delas. Nada aqui é final; é a base pra continuar.*

---

## A tese em uma frase

Um app de **comunidade** para **descobrir** rolês que estão acontecendo **hoje, perto de você** — focado no que você **ainda não conhece**, não no que você já frequenta.

## O diferencial (por que ele existe)

O problema não é falta de apps de "onde ir" — é o contrário. Google Maps, Instagram e afins já resolvem **busca** (você sabe o que quer e vai atrás). O buraco que ninguém preenche bem é a **descoberta espontânea**: *"estou sem plano, me mostra algo bom que eu não conheço e que rola agora."*

O Instagram é ótimo pra **retenção** (te reforça o que você já segue) e péssimo pra **descoberta** (só te mostra o conhecido). É exatamente esse vão que o app ocupa. **Regra de ouro:** toda feature precisa servir à descoberta do desconhecido de hoje. Se não serve, provavelmente é distração.

Consequência direta: **ranking de qualidade não é a espinha dorsal.** Ranking mostra o que já é popular — ou seja, o que você já conhece — e joga o app na quadra onde o Google tem 20 anos de vantagem. O sinal que importa é **estado em tempo real** (tá começando a encher, bombando, abriu agora, tem fila), que ninguém mais entrega e que decai em minutos.

---

## A tela — duas camadas

A tensão entre "buscar" e "descobrir" se resolve pela **ordem vertical**: o que empurra fica em cima, o que puxa fica embaixo. Mesma tela, dois comportamentos, sem obrigar a pessoa a escolher um modo.

- **Topo — Descoberta (empurra).** Banner/feed curado. Serve quem chegou sem plano: bate o olho e é fisgado. Poucos itens, bem apresentados, cada um com um motivo pra ir. Disfarça a baixa densidade da fase inicial (4 cards bonitos > 4 pinos perdidos num mapa) e mantém você no controle da ordem — logo, da descoberta.
- **Base — Mapa (puxa).** Serve quem já tem uma região em mente. O valor aqui **não é o inventário de lugares** (isso o Google faz), e sim a **camada social e a novidade**: o que estão comentando, o que mudou, o que é novo. Isso mantém o app fora da quadra do Google mesmo dentro do mapa.

**Por que não abrir no mapa:** o mapa é cruel com vazio (3 pinos numa terça = app quebrado), é uma interface de *busca* (o olho vai pra onde você já conhece) e pressupõe intenção que quem "decide se sai" ainda não tem. Ele é a interface certa pro momento *"já estou na rua"* — que é fase posterior.

---

## Duas camadas de conteúdo

Não confundir **lugar** com **momento**:

- **Lugares** — permanentes, curados, favoritáveis. A base.
- **Rolês** — efêmeros, montados por cima dos lugares ("hoje tem samba às 20h").

O **efêmero é o que faz a pessoa voltar.** O lugar permanente é a base; o rolê do dia é o motivo de reabrir o app. Se a pessoa abre o mapa da região três sextas seguidas e vê sempre os mesmos pinos, o hábito morre.

### Refinamento (27/08/2026): a escada vai do bar simples ao lugar com atração

O produto atende **evento e bar**, começando pelos mais simples e subindo. Isso importa porque a
maior parte da oferta de um bairro não tem agenda: tem **oferta** ("chopp em dobro até 22h") e
**estado** (aberto, cheio, com movimento). O exemplo canônico do documento — "hoje tem samba às
20h" — é o topo da escada, não a base.

Consequências:

- **Oferta é rolê.** Cabe no modelo sem mudança: título, motivo pra ir, janela de horário. E passa
  na regra de ouro — oferta boa em lugar que você não conhece é motivo legítimo para sair.
- **O "motivo pra ir" fica mais decisivo, não menos.** Num evento o título já carrega a razão
  ("Samba de quinta"); num bar simples o título é fraco e o texto do curador faz todo o trabalho.
- **O frescor do lugar passa a valer sozinho.** Um boteco cheio numa terça é conteúdo, mesmo sem
  nada programado. O backend já calcula isso (`frescor_de_lugar`, sinalização com `lugar_id`), mas
  hoje nem a descoberta nem o mapa usam — ver os itens abertos no `TODO.md`.

---

## Motores de conteúdo e incentivo

Princípio central: **ninguém contribui por altruísmo.** Todo motor que depende de "ajudar estranhos de graça" falha. Todo motor que **esconde a contribuição dentro de um ato egoísta** funciona. A contribuição tem que ser efeito colateral de algo que a pessoa já quer fazer.

| Camada | Motor | Incentivo egoísta | Fase |
|---|---|---|---|
| **Oferta** (o que existe) | Estabelecimento divulga o próprio rolê + campo/curadores cadastram | Bar quer público; curador quer status | Já |
| **Qualidade** (o que presta) | Usuário "curte/salva" lugares | Meu caderninho de lugares — o agregado vira sinal de curadoria | Já |
| **Frescor** (o que rola agora) | Presença/check-in leve, um toque | (mais fraco — começar só com curadores e engajados) | Já, com cautela |
| **Social** (mostrar pros amigos) | Compartilhar onde está | As pessoas já querem que amigos saibam onde estão | Fase 2 |

Notas de risco por motor:
- **Curtir** só funciona reenquadrado como *salvar pra si* — senão o benefício vai só pro outro e ninguém curte.
- **Social** é o mais forte em incentivo, mas tem cold start *dentro de cada grupo de amigos* (inútil se você é o único do grupo que usa) e **privacidade** delicada (opt-in explícito, círculos fechados).
- **Estabelecimento** é o único motor que resolve conteúdo *e* embute monetização *e* não depende de já ter usuários. Mas tem viés (todo dono acha o próprio rolê ótimo) — a curadoria de campo filtra.
- **Curadores** (o 1% que cria): assumir de vez que poucos criam e muitos consomem. Cultivar um punhado de pessoas que já gostam de ser "quem sabe o rolê" — contribuem por status. Casa perfeitamente com o trabalho de campo (recrutados pessoalmente).

---

## Monetização

**Destaque verificado**, não ranking pago.

O único ativo do app é a **confiança**. No minuto em que o usuário desconfia que o topo é pago, vira panfleto e a descoberta morre. Então:

- O estabelecimento paga pra ser **destacado/promovido, com selo claro** — separado da curadoria orgânica (modelo Google/iFood: "promovido" ≠ "orgânico").
- O destaque só entra se um curador **validou em campo** que o rolê é real e bom. Isso cria algo que o Instagram Ads não tem: parece **recomendação**, não anúncio.
- **O banner de descoberta não pode ser o espaço pago principal.** Ele vive de ser genuíno; se vira propaganda, morre como todo anúncio ignorável.

**Painel do estabelecimento** — ferramenta *em cima* da comunidade, não um produto B2B paralelo. Deixa o dono ver o engajamento (quantos salvaram, quantos sinalizaram presença). Detalhe que se auto-organiza: o painel só tem valor **porque** a comunidade existe — num app vazio ele não mostra nada. Isso força a ordem certa (comunidade primeiro). Cuidados: começar **simples** (dois números honestos, talvez até uma conversa sua com o dono), nunca virar dashboard corporativo cedo; e só mostrar o que dá pra medir com confiança (o dono vai cruzar com o movimento real da casa).

---

## Ordem de construção

Cada eixo tem uma sequência, e pular etapa quebra o produto:

- **Território:** um punhado de bairros → cidade. Começar por **poucos bairros de SP com vida noturna forte** (Vila Madalena, Pinheiros, Baixo Augusta...). 200 usuários espalhados pela Grande SP = nada; concentrados num bairro = mapa vivo. Fora do recorte, **melhor o mapa nem existir do que existir vazio**.
- **Momento:** *"em casa decidindo se sai"* → *"na rua procurando after"*. O primeiro tolera dados menos frescos (a pessoa está se arrumando); o after exige tempo real puro e densidade noturna que não existe no dia 1.
- **Curadoria:** campo manual → administrativo → sistema escalável. **Não automatizar antes de entender o processo.** O campo não serve só pra popular o mapa — serve pra *descobrir qual é o processo* antes de codificá-lo. Ir o mais longe possível no manual (planilha, você cadastrando, WhatsApp) antes da primeira linha do sistema.
- **Produto:** comunidade → painel do estabelecimento.

**Alerta pra perfil técnico:** o risco não é falta de capacidade de construir — é **construir cedo demais a coisa errada, bonita e escalável, que ninguém validou.** Segurar o instinto de já montar o sistema escalável.

---

## O loop completo (como tudo se conecta)

```
Usuário/estabelecimento indica um lugar ou rolê
        ↓
Curadoria valida  (campo no início → comunitária conforme escala)
        ↓
Vira DESCOBERTA pra quem não conhece  (camada de cima)
        ↓
Presença/curtidas geram sinal social e frescor  (camada de baixo)
        ↓
Engajamento vira valor no painel do estabelecimento  → monetização
```

---

## Perguntas em aberto (próximos passos)

Nada disso precisa ser resolvido agora, mas são os fios soltos:

1. **Qual bairro exato é o piloto, e por quê?** (proximidade sua + densidade de rolê + você conseguir ir a pé validar)
2. **Fluxo de telas real** a partir do conceito de duas camadas.
3. **O mínimo pra começar o campo** — que provavelmente é *bem menos app do que parece*. Talvez comece sem app nenhum (planilha + grupo curado) só pra provar que existe demanda e que o processo de curadoria funciona.
4. Como distinguir, na cabeça do usuário e na interface, a ação de **favoritar lugar** (permanente) da de **sinalizar rolê** (efêmero).

---

## Resumo de uma linha

Descoberta (não busca) do desconhecido bom de hoje, hiperlocal em SP, alimentada por motores egoístas + curadoria de campo, monetizada por destaque verificado — construída na ordem certa: manual antes de sistema, comunidade antes de painel, um bairro antes da cidade.
