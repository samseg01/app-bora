# ADR-003 — Autenticação JWT caseira

## Status

Aceito.

## Contexto

Decorre diretamente da ADR-002: sem Supabase Auth nem Clerk, a API precisa da própria
autenticação.

## Decisão

- Hash de senha: `pwdlib[argon2]` (não `passlib`, que está sem manutenção ativa).
- Token: `PyJWT`, HS256, claims `sub` (id do usuário) e `papel`. Expiração longa (~30 dias, ver
  `JWT_EXPIRES_MINUTES`), sem fluxo de refresh token — simplificação deliberada pro piloto; re-login
  ocasional não é fricção real nessa escala.
- `core/security.py` concentra hash/verify/create/decode; `api/deps.py` concentra os pontos de
  extensão em cima disso (`get_current_user`, `require_role`, `require_estabelecimento_owner`).

## Consequências

- Mais superfície de código pra manter (comparado a delegar pra um provedor), mas sem dependência
  externa de auth.
- Se o refresh token ou 2FA vierem a ser necessários, entram como extensão desses mesmos módulos,
  não como reescrita.
