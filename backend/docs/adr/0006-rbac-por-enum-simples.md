# ADR-006 — RBAC por enum simples

## Status

Aceito.

## Contexto

O modelo de domínio já define três papéis fixos (`docs/arquitetura-backend-frontend.md`):
`comum`, `curador`, `dono_estabelecimento`. Não há indicação de que o piloto precise de permissões
granulares ou dinâmicas.

## Decisão

`PapelUsuario` é um enum de 3 valores fixos no schema (coluna `papel` em `usuario`). Controle de
acesso é feito por uma dependency (`api/deps.require_role(*papeis)`) que checa
`usuario.papel in papeis` — sem tabela de permissões, sem papéis compostos, sem hierarquia.

## Consequências

- `POST /sinalizacoes` está restrito a `curador`/`dono_estabelecimento` (ver sequenciamento do
  documento de arquitetura); abrir pra `comum` mais adiante é uma linha de código, não uma
  migration.
- Se o produto evoluir pra permissões por recurso (ex: curador só de um bairro específico), isso é
  uma extensão de schema nova — não forçada aqui.
