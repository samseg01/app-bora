# ADR-007 — Promoção de papel manual

## Status

Aceito.

## Contexto

`docs/conceito.md` é explícito: a curadoria começa manual, e curadores são recrutados
pessoalmente, não auto-selecionados. Deixar qualquer usuário se promover a curador pelo próprio
cadastro seria tanto uma falha de produto (quebra o modelo de curadoria de campo) quanto uma falha
de segurança (escalação de privilégio trivial).
atua## Decisão

`POST /auth/signup` sempre cria o usuário com `papel=comum`, sem exceção. A única forma de
promover alguém a `curador` ou `dono_estabelecimento` é `scripts/promote_role.py <email> <papel>`,
rodado manualmente contra o banco. Não existe endpoint HTTP para isso.

## Consequências

- Onboarding de curador/estabelecimento é sempre uma ação humana (quem opera o piloto rodando o
  script), nunca self-service — de propósito, na fase atual.
- Se isso virar um gargalo operacional real (muitos curadores pra promover manualmente), a próxima
  etapa natural é um fluxo de convite/aprovação no painel do curador — decisão pra quando esse
  sintoma aparecer, não antes.
