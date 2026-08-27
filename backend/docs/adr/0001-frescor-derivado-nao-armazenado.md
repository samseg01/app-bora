# ADR-001 — Frescor derivado, não armazenado

## Status

Aceito.

## Contexto

O "frescor" (live/warm/new) é o diferencial técnico central do produto: o sinal de que algo está
acontecendo *agora*, que o Google/Instagram não entregam (ver `docs/conceito.md`). Ele decai em
minutos-horas conforme as sinalizações de presença envelhecem.

## Decisão

O frescor nunca é uma coluna armazenada em `role` ou `lugar`. Ele é sempre calculado em tempo de
leitura, agregando as linhas recentes de `sinalizacao` (`services/frescor.py` +
`services/descoberta.py`). Não existe cron, worker ou coluna pré-computada recalculando esse
estado.

## Consequências

- Correção por construção: não existe um valor "desatualizado" de frescor pra sincronizar.
- Custo: cada leitura de `/descoberta`, `/mapa` ou `/roles/{id}` paga uma agregação sobre
  `sinalizacao`. Aceitável na escala do piloto (um bairro); ver a conversa de escalabilidade no
  histórico do projeto para os gatilhos que justificariam mover isso pra um valor pré-computado —
  não antes disso.
