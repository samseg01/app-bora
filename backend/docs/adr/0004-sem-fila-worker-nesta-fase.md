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
