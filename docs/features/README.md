# Documentação de features

Um arquivo por feature: `docs/features/<nome-curto>.md`, escrito **na mesma branch da feature**.
Obrigatório desde 01/09/2026 — feature sem doc não merga. A regra e o ciclo completo estão na
seção "Fluxo de trabalho" do `CLAUDE.md` da raiz.

## Isto não é ADR

O projeto já tem ADRs (`backend/docs/adr/`, `frontend/docs/adr/`) e eles continuam valendo.
São coisas diferentes; duplicar uma na outra é como as duas apodrecem.

| | O que registra |
|---|---|
| **ADR** | a **decisão**, e por que ela venceu a alternativa |
| **Doc de feature** | o que foi **construído**, e como se comporta |

Quando a feature nasceu de uma decisão registrada, o doc **linka** o ADR em vez de reexplicá-lo.

## O que escrever

Escreva para quem abrir o código daqui a três meses sem ter estado aqui:

- **O que faz**, em uma frase, do ponto de vista de quem usa o app.
- **Por onde passa** — rotas de API, telas, tabelas e migrations, serviços tocados. É o mapa que
  evita ter que reconstruir a feature a partir do `git log`.
- **Como verificar que está de pé** — o caminho manual, clique a clique, não só o nome dos testes.
- **O que deliberadamente não faz, e por quê.** A seção que mais economiza tempo depois: sem ela
  todo limite vira suspeita de bug, e alguém "conserta" uma decisão que foi tomada de propósito.
- **Link para o ADR**, se houver.

## O que não precisa de doc

Correção de bug, ajuste de texto, refatoração sem efeito visível: o commit é o registro. A regra
existe para o que muda **o que o app faz** — não para gerar arquivo por obrigação.
