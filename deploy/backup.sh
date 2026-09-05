#!/bin/sh
# pg_dump diário do banco de produção. Roda NO SERVIDOR, por cron.
#
# Por que isto é pré-requisito e não boa prática opcional (ADR de raiz 0001): a
# curadoria de campo do R3 são 10 a 15 lugares andados a pé, um por um. Num PaaS o
# backup é caixinha marcada; numa VPS, se este script não rodar, esse trabalho vive
# num disco só.
#
# Instalação (ver docs/features/deploy.md):
#   sudo crontab -e
#   17 4 * * * /CAMINHO/DO/REPO/deploy/backup.sh >> /var/log/boraroles-backup.log 2>&1
#
# O script descobre sozinho onde o repositório está, a partir da própria localização —
# não existe caminho fixo aqui. Clonar em /opt, em ~/docker ou em qualquer outro lugar
# não muda nada; a única coisa que precisa estar certa é o caminho na linha do cron.
#
# ATENÇÃO — isto sozinho NÃO fecha o requisito. O dump cai no disco da MESMA máquina:
# protege contra "apaguei a tabela", não contra "o box morreu". O que fecha é puxar o
# arquivo para fora, e quem faz isso é `scripts/puxar-backup.ps1`, do outro lado.

set -eu

# A raiz do repo é o diretório acima deste script. `cd -P` resolve link simbólico, que é
# como o cron costuma entregar o caminho.
RAIZ=${RAIZ_APP:-$(cd -P "$(dirname "$0")/.." && pwd)}
DESTINO=${BACKUP_DIR:-/var/backups/boraroles}
DIAS=${BACKUP_RETENCAO_DIAS:-14}

# As credenciais são as mesmas do compose — uma fonte só, para não divergirem.
set -a
. "$RAIZ/.env"
set +a

mkdir -p "$DESTINO"
CARIMBO=$(date +%Y-%m-%d-%H%M)
ARQUIVO="$DESTINO/boraroles-$CARIMBO.sql.gz"

# `-T` porque cron não tem TTY. O dump sai pelo stdout do container e é comprimido
# do lado de fora, para não precisar de gzip dentro da imagem do Postgres.
docker compose -f "$RAIZ/docker-compose.prod.yml" exec -T postgres \
	pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --no-owner --no-privileges \
	| gzip -9 > "$ARQUIVO.parcial"

# Só vira backup depois de terminar: um dump interrompido com o nome final é pior que
# nenhum, porque parece um backup bom até a hora de restaurar.
mv "$ARQUIVO.parcial" "$ARQUIVO"

find "$DESTINO" -name 'boraroles-*.sql.gz' -mtime +"$DIAS" -delete

echo "$(date -Is) ok $ARQUIVO ($(du -h "$ARQUIVO" | cut -f1))"

# ---- As fotos (item 45) ----
#
# O pg_dump acima NÃO cobre arquivo: `Lugar.fotos` guarda o caminho, e o JPEG mora num
# volume. Sem este bloco, a foto que o curador tirou de pé na calçada seria o único dado
# do projeto sem cópia — e o mais insubstituível, porque refazer exige voltar ao bar.
#
# O tar sai de dentro do contêiner, e não de /var/lib/docker/volumes: o caminho interno é
# contrato do compose, o do host é detalhe de implementação do Docker.

FOTOS="$DESTINO/boraroles-fotos-$CARIMBO.tar.gz"

if docker compose -f "$RAIZ/docker-compose.prod.yml" exec -T api sh -c '[ -d /dados/fotos ] && [ -n "$(ls -A /dados/fotos 2>/dev/null)" ]'; then
	docker compose -f "$RAIZ/docker-compose.prod.yml" exec -T api tar -czf - -C /dados fotos > "$FOTOS.parcial"
	mv "$FOTOS.parcial" "$FOTOS"
	find "$DESTINO" -name 'boraroles-fotos-*.tar.gz' -mtime +"$DIAS" -delete
	echo "$(date -Is) ok $FOTOS ($(du -h "$FOTOS" | cut -f1))"
else
	# Silêncio aqui seria pior: sem a linha, quem lê o log não distingue "não há foto
	# ainda" de "o backup das fotos parou de rodar".
	echo "$(date -Is) sem fotos ainda — nada a arquivar"
fi
