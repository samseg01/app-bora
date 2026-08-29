# ADR-004 — Sem fila/worker/Redis nesta fase

## Status

Aceito.

## Contexto

O documento de arquitetura (`docs/arquitetura-backend-frontend.md`) já descartava fila pesada pro
piloto de um bairro. A expiração de `role` e o decaimento de `sinalizacao` são sempre filtros de
leitura (ver ADR-001), não jobs de background.

## Decisão

Nenhum processo `worker`, nenhum Redis, nenhuma fila (nem mesmo algo leve como `arq`) no
`docker-compose.yml`. Um único processo `api` (FastAPI) + `postgres`.

## Consequências

- Superfície operacional mínima: só duas coisas pra subir e monitorar.
- Se um job de background vier a ser necessário (ex: expurgo agressivo de `sinalizacao` antiga por
  motivo de tamanho de tabela, não de correção), isso é uma decisão nova, tomada quando o sintoma
  aparecer — não antecipada aqui.

## Adendo (29/08/2026) — o sintoma apareceu e foi recusado

Este ADR terminava dizendo que um job de background seria "uma decisão nova, tomada quando o
sintoma aparecer". Ele apareceu: a ideia de uma agenda recorrente ("quinta é forró") gerando o
rolê da noite sem alguém publicar, item 44 do `TODO.md`.

**Recusado, e a decisão reforça este ADR em vez de contrariá-lo.** O motivo não foi custo
operacional — hospedagens gerenciadas oferecem cron de primeira classe hoje, e seria barato. Foi o
**modo de falhar**: se a casa cancela o forró numa quinta, o cron publica assim mesmo. Um humano
não publicaria. Num produto cujo ativo é não afirmar o que não sabe, automação que erra para o lado
de publicar demais custa mais do que a digitação que ela pouparia.

A saída técnica alternativa — materializar o rolê preguiçosamente dentro de um `GET` — foi
descartada pelo mesmo motivo, e ainda traria escrita no caminho de leitura mais quente do app.

Segue valendo: nenhum worker, nenhuma fila, nenhum cron.
