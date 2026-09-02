#!/usr/bin/env bash
#
# O regressivo do bora-roles: um comando, tudo ou nada.
#
# Gêmeo de scripts/regressivo.ps1, para Git Bash e para a CI (item 14 do TODO).
# Mesmas etapas, mesma ordem, mesmo código de saída: 0 verde, 1 vermelho.
#
# É o portão do fluxo de branch descrito no CLAUDE.md: nada merga na master sem
# este script verde.
#
# Uso:
#   scripts/regressivo.sh              # tudo
#   scripts/regressivo.sh --so-backend
#   scripts/regressivo.sh --so-frontend   # NÃO é o regressivo
#   scripts/regressivo.sh --sem-build     # atalho perigoso, ver abaixo

set -uo pipefail

RAIZ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKEND="$RAIZ/backend"
FRONTEND="$RAIZ/frontend"

BANCO_TESTE="boraroles_test"
URL_TESTE="postgresql+asyncpg://boraroles:boraroles@postgres:5432/$BANCO_TESTE"

SO_BACKEND=0
SO_FRONTEND=0
SEM_BUILD=0

for arg in "$@"; do
  case "$arg" in
    --so-backend)  SO_BACKEND=1 ;;
    --so-frontend) SO_FRONTEND=1 ;;
    --sem-build)   SEM_BUILD=1 ;;
    -h|--help)     sed -n '3,15p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "argumento desconhecido: $arg" >&2; exit 2 ;;
  esac
done

# Cor só quando há terminal; a CI recebe texto limpo.
if [ -t 1 ]; then
  VERM=$'\033[31m'; VERD=$'\033[32m'; CIAN=$'\033[36m'; AMAR=$'\033[33m'; CINZ=$'\033[90m'; FIM=$'\033[0m'
else
  VERM=''; VERD=''; CIAN=''; AMAR=''; CINZ=''; FIM=''
fi

PASSO_N=0
RESUMO=""
INICIO_TUDO=$SECONDS

falhe() {
  printf '\n%sVERMELHO — %s%s\n' "$VERM" "$1" "$FIM"
  printf '%s%s%s\n\n' "$VERM" "$2" "$FIM"
  printf '%sO regressivo não passou. Não merge nesta branch.%s\n' "$VERM" "$FIM"
  exit 1
}

# Roda um passo e o julga pelo código de saída.
passo() {
  local nome="$1"; local dir="$2"; shift 2
  PASSO_N=$((PASSO_N + 1))
  printf '\n%s[%d] %s%s\n' "$CIAN" "$PASSO_N" "$nome" "$FIM"
  printf '%s    %s%s\n' "$CINZ" "$*" "$FIM"

  local ini=$SECONDS
  ( cd "$dir" && "$@" )
  local codigo=$?
  local seg=$((SECONDS - ini))

  if [ "$codigo" -ne 0 ]; then
    RESUMO+=$(printf '\n  %-34s FALHOU  %ss' "$nome" "$seg")
    falhe "$nome" "O comando saiu com código $codigo. A saída completa está acima."
  fi
  RESUMO+=$(printf '\n  %-34s ok      %ss' "$nome" "$seg")
  printf '%s    ok (%ss)%s\n' "$VERD" "$seg" "$FIM"
}

printf '\n=== regressivo do bora-roles ===\n'

# --- Etapa 0: o Docker está de pé? -------------------------------------------
# Falhar aqui em um segundo é muito melhor que falhar lá na frente, depois de o
# frontend inteiro ter compilado.
if [ "$SO_FRONTEND" -eq 0 ]; then
  printf '\n%s[0] daemon do Docker%s\n' "$CIAN" "$FIM"
  if ! docker info >/dev/null 2>&1; then
    falhe 'daemon do Docker' \
"O Docker não está rodando, então nada do backend pode ser verificado.
Ligue o Docker Desktop e rode de novo.

Não merge dizendo que a mudança era pequena — o CLAUDE.md é explícito: com o
daemon parado o certo é não mergear e dizer que não foi verificado.
(Para verificar só o frontend: scripts/regressivo.sh --so-frontend)"
  fi
  printf '%s    ok%s\n' "$VERD" "$FIM"
fi

# --- Frontend (rápido, e não precisa de Docker) ------------------------------
if [ "$SO_BACKEND" -eq 0 ]; then
  passo 'frontend: lint'  "$FRONTEND" npm run lint
  passo 'frontend: build' "$FRONTEND" npm run build
fi

if [ "$SO_FRONTEND" -eq 1 ]; then
  printf '\n%s\n\n' "$RESUMO"
  printf '%sVERDE (só frontend) em %ss%s\n' "$VERD" "$((SECONDS - INICIO_TUDO))" "$FIM"
  printf '%sAtenção: --so-frontend NÃO é o regressivo. O backend não foi verificado.%s\n' "$AMAR" "$FIM"
  exit 0
fi

# --- Subir a imagem a partir do código do disco ------------------------------
# Sem o --build, `docker compose exec` roda o código de quando a imagem foi
# construída. Já aconteceu de a suíte passar verde contra uma árvore de 22 horas
# atrás, sem nenhum sinal. Ver item 49 do TODO.md.
if [ "$SEM_BUILD" -eq 1 ]; then
  printf '\n%s[!] --sem-build: a suíte vai rodar contra a IMAGEM, não contra o disco.%s\n' "$AMAR" "$FIM"
  passo 'backend: subir (sem rebuild)' "$BACKEND" docker compose up -d
else
  passo 'backend: construir e subir' "$BACKEND" docker compose up -d --build api
fi

# --- Garantir o banco de teste -----------------------------------------------
# A extensão PostGIS não precisa ser criada aqui: a migration 0001 faz
# CREATE EXTENSION IF NOT EXISTS postgis, e o alembic roda dentro do próprio
# pytest (conftest._apply_migrations). Aqui só precisamos do banco existindo.
PASSO_N=$((PASSO_N + 1))
printf '\n%s[%d] banco de teste (%s)%s\n' "$CIAN" "$PASSO_N" "$BANCO_TESTE" "$FIM"
existe="$(cd "$BACKEND" && docker compose exec -T postgres \
  psql -U boraroles -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$BANCO_TESTE'" 2>&1)"
if [ $? -ne 0 ]; then
  falhe 'banco de teste' "Não consegui falar com o Postgres do compose.
$existe"
fi
if [ "$(printf '%s' "$existe" | tr -d '[:space:]')" != "1" ]; then
  printf '%s    criando %s%s\n' "$CINZ" "$BANCO_TESTE" "$FIM"
  if ! ( cd "$BACKEND" && docker compose exec -T postgres createdb -U boraroles "$BANCO_TESTE" ); then
    falhe 'banco de teste' "Falhei ao criar $BANCO_TESTE."
  fi
else
  printf '%s    já existia%s\n' "$CINZ" "$FIM"
fi
RESUMO+=$(printf '\n  %-34s ok' 'banco de teste')
printf '%s    ok%s\n' "$VERD" "$FIM"

# --- Lint, tipos e a suíte ---------------------------------------------------
passo 'backend: ruff' "$BACKEND" docker compose exec -T api uv run ruff check .
passo 'backend: mypy' "$BACKEND" docker compose exec -T api uv run mypy src

# O -e aponta a suíte para o banco de teste. Sem isso ela roda no banco de
# desenvolvimento e pode ficar vermelha por dado que você criou à mão.
passo 'backend: pytest (banco de teste)' "$BACKEND" \
  docker compose exec -T -e "DATABASE_URL=$URL_TESTE" api uv run pytest -q

# --- Resumo ------------------------------------------------------------------
printf '\n%s\n\n' "$RESUMO"
printf '%sVERDE em %ss — pode mergear.%s\n' "$VERD" "$((SECONDS - INICIO_TUDO))" "$FIM"
if [ "$SEM_BUILD" -eq 1 ]; then
  printf '%sRessalva: rodou com --sem-build, então testou a imagem e não o disco.%s\n' "$AMAR" "$FIM"
fi
exit 0
