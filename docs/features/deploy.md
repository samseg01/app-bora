# Deploy de produção — uma VPS, quatro contêineres

O app deixa de existir só na máquina de desenvolvimento: passa a rodar numa VPS em São
Paulo, alcançável por HTTPS, com o backend e o frontend na mesma origem.

Decisão em [`docs/adr/0001-deploy-em-vps-unico-sao-paulo.md`](../adr/0001-deploy-em-vps-unico-sao-paulo.md) —
por que VPS e não PaaS+Vercel, por que Hostinger, e o que dispara migração. Este documento
é o **o quê e o como**: o que foi construído e o roteiro para subir.

## O que a feature faz

Um `git pull && docker compose -f docker-compose.prod.yml up -d --build` publica os dois
lados do app de uma vez, atrás de um domínio com TLS automático.

## Por onde ela passa

| Arquivo | Papel |
|---|---|
| `docker-compose.prod.yml` | os quatro serviços: `postgres`, `api`, `web`, `caddy` |
| `deploy/Caddyfile` | a borda — TLS automático e o corte `/api/*` → api, resto → web |
| `.env.producao.example` | modelo dos segredos; o `.env` real só existe no servidor |
| `frontend/Dockerfile` | novo — o frontend não era conteinerizado (ia pra Vercel) |
| `frontend/.dockerignore` | novo |
| `frontend/next.config.ts` | ganhou `output: "standalone"` |
| `deploy/backup.sh` | `pg_dump` diário, no servidor, por cron |
| `scripts/puxar-backup.ps1` | a outra metade: puxa o dump para fora da máquina |

Nada do backend mudou. `backend/docker-compose.yml` continua sendo o de desenvolvimento
e **não** é o que roda em produção.

### O desenho

```
internet :443
      │
    caddy  (TLS do Let's Encrypt, renovação automática)
      ├── /api/*  ─────► api:8000    (FastAPI/uvicorn)
      ├── /health ─────► api:8000
      └── resto   ─────► web:3000    (Next SSR standalone)
                            │
                            └── SSR busca em http://api:8000 (rede do compose)
      api ─────────────► postgres:5432  (postgis/postgis:16-3.4, volume em disco)
```

Só o `caddy` publica porta na host. `postgres`, `api` e `web` existem apenas na rede
interna do compose — em particular **a 5432 saiu**, que no compose de desenvolvimento é
publicada e numa VPS seria o banco na internet aberta.

### As três coisas que mudam por serem a mesma origem

1. **Não há CORS.** O navegador pede `/api/v1/...` no próprio domínio.
2. **`NEXT_PUBLIC_API_URL` é relativo** (`/api/v1`), assado no build. Trocar de domínio
   não obriga a reconstruir a imagem.
3. **O SSR fala com a api por `http://api:8000`**, dentro da rede do compose — não sai
   para a internet e não depende de DNS público. É exatamente a falha descrita em
   `frontend/src/lib/api.ts`: em 02/09 o navegador do celular resolvia o host do túnel e o
   servidor do Next não, e o app dizia "API fora do ar" com a API no ar.

## Roteiro — do zero ao app no ar

Feito uma vez. Comandos rodam **no servidor**, como root, salvo onde estiver dito.

### 0. Antes de tudo: São Paulo

No painel da Hostinger, confirme que a VPS está no **datacenter de São Paulo**. Se estiver
em outro, reinstale agora — a decisão inteira gira em torno de latência, e o box em outro
continente joga fora o motivo de o frontend estar aqui. Anote o **IP**.

### 1. Acesso e higiene básica

```sh
ssh root@SEU-IP

apt update && apt upgrade -y
apt install -y ufw fail2ban git

# Firewall: só ssh e web. O banco não tem porta publicada, mas o ufw é a segunda linha.
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

systemctl enable --now fail2ban
```

### 2. Swap de 2 GB

Custa nada e transforma OOM em lentidão — o pico do `next build` com Tailwind v4 fica
entre 1,5 e 2,5 GB.

```sh
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

### 3. Docker

```sh
curl -fsSL https://get.docker.com | sh
docker compose version    # precisa responder v2.x
```

### 4. O repositório

O repo é privado. Gere uma chave **no servidor** e cadastre como deploy key no GitHub
(Settings → Deploy keys → Add, só leitura):

```sh
ssh-keygen -t ed25519 -C "vps-boraroles" -f /root/.ssh/id_ed25519 -N ""
cat /root/.ssh/id_ed25519.pub      # cole isto no GitHub

mkdir -p /opt && cd /opt
git clone git@github.com:samseg01/app-bora.git bora-roles
cd /opt/bora-roles
```

### 5. Os segredos

```sh
cp .env.producao.example .env
openssl rand -base64 36    # POSTGRES_PASSWORD
openssl rand -base64 36    # JWT_SECRET
nano .env
```

Preencha:

- `DOMINIO` — sem domínio próprio, use **sslip.io**: troque os pontos do IP por traços.
  IP `203.0.113.10` vira `DOMINIO=203-0-113-10.sslip.io`. Resolve sozinho, sem registrar
  nada, e o Caddy tira certificado de verdade em cima dele. **HTTPS não é capricho aqui**:
  `navigator.geolocation` não existe fora de contexto seguro, então em HTTP a presença
  verificada inteira (ADR-009) cai em "sem-suporte" e o R8 não é executável.
- `ACME_EMAIL` — seu e-mail. Obrigatório; sem ele o Caddy não sobe.
- `POSTGRES_PASSWORD` e `JWT_SECRET` — os dois valores gerados acima. O default do
  `JWT_SECRET` está no repositório, ou seja, é público: com ele qualquer um forja token de
  curador.

O compose recusa subir com qualquer um dos cinco faltando, em vez de subir com default e
parecer que deu certo.

### 6. Subir

```sh
cd /opt/bora-roles
docker compose -f docker-compose.prod.yml up -d --build
docker compose -f docker-compose.prod.yml ps
```

O primeiro build leva alguns minutos (imagem do Next e `uv sync` do backend). O
entrypoint do backend roda `alembic upgrade head` antes do uvicorn, então o schema sobe
sozinho — não há passo de migration à mão.

Conferir, **da sua máquina**, não do servidor:

```sh
curl https://SEU-DOMINIO/health              # {"status":"ok"}
curl -o /dev/null -w '%{http_code}\n' "https://SEU-DOMINIO/api/v1/descoberta?bairro=Rep%C3%BAblica"
```

E abra `https://SEU-DOMINIO/` no navegador: deve cair na abertura pedindo o bairro.

Se o certificado não sair, o log diz por quê:
`docker compose -f docker-compose.prod.yml logs caddy`. A causa quase sempre é a 80
fechada (o Let's Encrypt valida por ela) ou o DNS não apontando.

### 7. Levar a curadoria para lá

O banco sobe **vazio**. Os dois lugares reais de República (Bar do China e Tokyo) estão
hoje no banco da máquina de desenvolvimento, e o `seed/republica.json` está atrás deles
(ver "Issues conhecidos" no `CLAUDE.md`). Duas opções, e a primeira é a honesta:

- **(a) Recadastrar pelo painel do curador em produção.** São dois lugares, e de quebra
  testa o painel no ambiente real.
- **(b) Copiar o banco de dev para produção:**

```sh
# na máquina de desenvolvimento
docker compose exec -T postgres pg_dump -U boraroles -d boraroles --no-owner --no-privileges | gzip > dump.sql.gz
scp dump.sql.gz root@SEU-IP:/tmp/

# no servidor
zcat /tmp/dump.sql.gz | docker compose -f /opt/bora-roles/docker-compose.prod.yml exec -T postgres psql -U boraroles -d boraroles
```

Promover um curador em produção segue manual (ADR-0007):

```sh
docker compose -f docker-compose.prod.yml exec api python scripts/promote_role.py SEU-EMAIL curador
```

### 8. Backup — sem isto o R7 não está concluído

O ADR é explícito: a curadoria do R3 são 10 a 15 lugares andados a pé, e sem backup ela
vive num disco só.

**No servidor**, o dump diário:

```sh
crontab -e
# 17 4 * * * /opt/bora-roles/deploy/backup.sh >> /var/log/boraroles-backup.log 2>&1

/opt/bora-roles/deploy/backup.sh      # rodar uma vez à mão para conferir
ls -la /var/backups/boraroles/
```

**Na sua máquina**, puxar para fora — é isto que fecha o requisito, porque o dump no disco
do servidor protege contra "apaguei a tabela", não contra "o box morreu":

```powershell
.\scripts\puxar-backup.ps1 -Servidor root@SEU-IP
```

Agende no Agendador de Tarefas do Windows para as 05:00, depois do cron.

**Teste a restauração uma vez.** Backup não testado é hipótese: suba o dump num banco
descartável local e confira que os lugares estão lá.

## Publicar uma mudança

```sh
ssh root@SEU-IP
cd /opt/bora-roles && git pull && docker compose -f docker-compose.prod.yml up -d --build
```

O `--build` reconstrói o que mudou; migrations aplicam sozinhas no start da api. Há alguns
segundos de indisponibilidade — aceitável para um piloto de um bairro, e resolver isso
exigiria dois contêineres e troca de tráfego, que não se paga aqui.

## Como verificar que está de pé

1. `https://SEU-DOMINIO/health` responde `{"status":"ok"}` — o backend está vivo.
2. `https://SEU-DOMINIO/` abre a abertura e deixa escolher o bairro.
3. Escolhido o bairro, a home renderiza — isso prova o SSR chegando na api pela rede
   interna. Se ela quebrar, é aqui que aparece: **em produção não há fixture de exemplo**
   (o R6), então API inacessível vira erro, não tela bonita com dado inventado.
4. Criar conta e entrar funciona — prova `JWT_SECRET` e escrita no banco.
5. `docker compose -f docker-compose.prod.yml ps` mostra os quatro `Up`, e `postgres` sem
   porta publicada na host.
6. `ls /var/backups/boraroles/` tem um arquivo de hoje.

**Este roteiro foi exercitado nesta máquina em 05/09**, com o compose de produção real:
imagens construídas, os quatro serviços de pé, Caddy roteando `/health` e `/api/v1/*` para
o backend e o resto para o Next, CSS e `manifest.webmanifest` servidos, SSR renderizando a
home com `NODE_ENV=production`, signup/login/`/auth/me` respondendo e `pg_dump` saindo
íntegro. O que **não** foi exercitado é o que só existe no servidor: TLS do Let's Encrypt
de verdade (no teste local o Caddy usou o CA interno), o cron e o `puxar-backup.ps1`.

## O que ela deliberadamente não faz

- **Não há CI, e o deploy não é automático.** `git pull` na mão. Automatizar isso depende
  do item 14, que ainda não existe.
- **Não há zero-downtime.** Ver acima.
- **Não há registry de imagem.** Constrói no próprio servidor — é o que os 8 GB de RAM
  compram (ADR).
- **Não há monitoramento nem alerta.** Se o box cair, quem descobre é você abrindo o app.
- **Não há staging.** Uma máquina, um ambiente.
- **Não há armazenamento de arquivo ainda.** O volume em disco existe e é o que destrava o
  item 45 (foto do lugar), mas a feature em si não foi construída.
- **O `.env` do servidor não é versionado nem espelhado em lugar nenhum.** Se a máquina
  sumir, `JWT_SECRET` some com ela — e todos os tokens emitidos morrem junto. Isso é
  aceitável (todo mundo entra de novo), mas guarde os segredos no seu gerenciador de senhas.
