# Feature — Chat do rolê

*Documentação por feature. Escopo: o chat ao vivo de cada rolê — o que é, regras, requisitos e decisões em aberto. É o gancho inicial da feature de presença (`plano-presenca.md`) e faz parte do conceito maior em `conceito.md`.*

---

## O que é

Cada rolê tem um chat ao vivo próprio, que **abre e fecha junto com o rolê** e só é acessível a quem **confirmou presença**. É o **gancho inicial** da escada de incentivos da presença — a razão pra confirmar presença mesmo antes de existir rede de amigos ou benefício de estabelecimento. Confirmar presença destrava a conversa ao vivo daquele rolê.

---

## O chat é do rolê, não do lugar

O chat pertence ao **rolê** (efêmero), não ao **lugar** (permanente). Cada rolê tem seu próprio chat, que **nasce e morre com o rolê**. Isso encaixa direto no modelo de duas camadas de conteúdo (lugar permanente × rolê efêmero) e evita salas permanentes que precisariam de moderação pra sempre — cada conversa é um momento que se fecha sozinho.

---

## Regras (spec)

- **Janela de vida.** O chat abre no horário de início do rolê e fecha no horário de fim. Fora dessa janela, não há conversa ativa.
- **Porta de entrada.** Entra quem **confirmou presença** naquele rolê. Confirmar presença é a chave — é o "pedágio invisível" do princípio de incentivo da presença: a pessoa confirma presença pra entrar no chat, e o dado de presença cai de lado. *(A mecânica e os motores da presença estão em `plano-presenca.md`.)*
- **Duração do acesso.** Confirmada a presença, o acesso vale até o fim do rolê, sem precisar reconfirmar.
- **Identidade.** Participantes aparecem com o próprio perfil (não anônimo) — reduz abuso e dá contexto social.
- **Moderação.** Mesmo efêmero, precisa de denúncia e bloqueio. A trava de presença já filtra boa parte do spam: só entra quem está no rolê.

---

## Por que é elegante

A janela de vida atrelada ao rolê torna o chat **inerentemente efêmero** — condiz com a tese de que o efêmero é o coração do app. Sem salas eternas, sem histórico infinito pra moderar; a conversa é do momento e fecha com ele.

---

## Requisitos funcionais

- Criar um chat por rolê, atrelado ao rolê (não ao lugar).
- Abrir o chat no horário de início e fechá-lo no horário de fim do rolê.
- Liberar a entrada apenas para quem confirmou presença naquele rolê; o acesso vale até o fim do rolê, sem reconfirmar.
- Exibir participantes pelo próprio perfil.
- Fechar/arquivar o chat ao fim do rolê (comportamento pós-fim a definir — ver "Em aberto").
- Suportar denúncia e bloqueio de usuário dentro do chat.

---

## Por que não é MVP

Depende da presença, que já é fase 2 — e ainda exige gente **no mesmo rolê ao mesmo tempo** pra a conversa existir. Com poucos usuários, o chat abre vazio e a feature não se sustenta. Entra quando houver densidade suficiente pra que um rolê tenha várias pessoas presentes simultaneamente.

---

## Em aberto

- **Verificação de presença** (reforça a integridade do chat): já decidido que sinalizar presença exige estar **fisicamente no local** (ver `plano-presenca.md`), o que garante que só entra no chat quem está mesmo no rolê. Falta apenas o método (geofence por GPS vs. QR no local) e a tolerância do perímetro.
- **Comportamento pós-fim:** o chat some de vez ao fim do rolê ou vira arquivo read-only por um tempo curto.
- **Rolês sem horário de fim definido:** qual a janela padrão do chat (ex.: fecha após X horas ou por inatividade).
