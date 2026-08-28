# bora-roles/backend

API do app de descoberta de rolês (piloto SP). FastAPI + Postgres/PostGIS. Ver `../docs/conceito.md` pra tese do produto e `../docs/arquitetura-backend-frontend.md` pra arquitetura acordada.

## Rodando localmente

```bash
cp .env.example .env
docker compose up -d
```

Isso sobe o Postgres (com PostGIS) e a API; o container da API aplica as migrations (`alembic upgrade head`) antes de subir o `uvicorn`. API em `http://localhost:8000`, docs interativas em `http://localhost:8000/docs`.

## Rodando os testes

```bash
docker compose exec api uv run pytest   # 37 testes, contra o Postgres/PostGIS do compose
```

## Promovendo um usuário a curador/dono_estabelecimento

Não existe endpoint de auto-promoção (de propósito — ver ADR-007). Rode:

```bash
docker compose exec api python scripts/promote_role.py usuario@exemplo.com curador
```

## Desenvolvimento sem Docker

```bash
uv sync
uv run alembic upgrade head   # requer DATABASE_URL apontando pra um Postgres/PostGIS local
uv run uvicorn boraroles.main:app --reload
```

Ver `CLAUDE.md` pra árvore de diretórios e decisões de design.
