# ADR-002 — Postgres autogerenciado + PostGIS

## Status

Aceito.

## Contexto

O produto precisa de busca geo por bairro/raio como núcleo (não um recurso lateral). Havia duas
opções discutidas: Supabase (Postgres+PostGIS+Auth+Storage num único provedor gerenciado) ou
Postgres autogerenciado (Railway/Fly/Render) com autenticação própria.

## Decisão

Postgres autogerenciado com a extensão PostGIS, escolhido explicitamente pelo usuário em vez de
Supabase — mais controle sobre o schema de auth e sobre as queries geo, ao custo de mais código de
autenticação pra manter desde o dia 1 (ver ADR-003).

## Consequências

- Sem dependência de BaaS; a API é dona de toda a lógica de domínio e de identidade.
- `docker-compose.yml` usa a imagem `postgis/postgis:16-3.4` (não `postgres` puro).
- Índice espacial GiST em `lugar.geo` é criado automaticamente pelo GeoAlchemy2 (ver
  `db/models.py`); a migration inicial roda `CREATE EXTENSION IF NOT EXISTS postgis` antes de
  qualquer tabela.
