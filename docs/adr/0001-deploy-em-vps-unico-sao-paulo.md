# ADR-0001 (raiz) — Deploy em VPS único em São Paulo, front e back no mesmo box

## Status

**Aceito** em 03/09/2026. Não implementado — a execução é o R7 do `TODO.md`.

Primeiro ADR de raiz. Os ADRs existentes moram em `backend/docs/adr/` e `frontend/docs/adr/`, e
esta decisão não cabe em nenhum dos dois: ela define onde as **duas** partes rodam.

**Substitui** o plano registrado em `docs/arquitetura-backend-frontend.md` ("Railway/Fly.io/Render
pro backend, Vercel pro Next.js, Postgres gerenciado com PostGIS"). Aquele documento não foi
reescrito; em conflito, vale este ADR.

## Contexto

O app só existe na máquina de desenvolvimento. Um dia inteiro de campo já dependeu de túnel
`cloudflared` — três quedas e quatro URLs — e o R8 (testar no bairro, em 4G) não é executável
assim. O deploy também é o que destrava o item 45: a foto do curador está bloqueada esperando
alguém decidir onde os arquivos moram.

Três requisitos vieram do que já está construído, não de preferência:

1. **PostGIS.** O backend não usa Postgres puro — usa `postgis/postgis:16-3.4`, tem índice GiST em
   `lugar.geo`, e a suíte de 56 testes roda contra Postgres+PostGIS real, sem mock (ADR-002 do
   backend). Nem todo Postgres gerenciado entrega a extensão, e descobrir isso depois de migrar é
   caro.
2. **Disco persistente.** O item 45 depende de armazenar arquivo. A maior parte dos PaaS tem disco
   efêmero — foto salva em disco some no próximo deploy —, o que obrigaria a contratar object
   storage (S3/R2) antes da primeira foto existir.
3. **Latência de São Paulo.** O app é mobile-first e a tese é decidir na rua, no 4G. Todas as
   rotas de leitura são `export const dynamic = "force-dynamic"`, então **cada renderização de
   página faz um fetch servidor→servidor à API**. Front e back em continentes diferentes colocam
   uma volta de internet no caminho crítico de toda tela.

## Decisão

**Uma VPS só, em São Paulo, rodando o `docker compose` inteiro:** Postgres+PostGIS, FastAPI, Next
em modo SSR (`output: "standalone"`) e Caddy à frente terminando TLS.

**Provedor: Hostinger, plano KVM 2, datacenter São Paulo** — 2 vCPU, 8 GB RAM, 100 GB NVMe, 8 TB
de tráfego. R$ 43,99/mês no plano de 24 meses, R$ 77,99 na renovação.

A forma, que é o que responde "dá pra publicar os dois?":

```
                    :443  Caddy (TLS automático)
                      |
        /api/*  ------+------  resto
           |                     |
      api:8000               web:3000
    (FastAPI/uvicorn)     (Next SSR standalone)
           |
     postgres:5432  (postgis/postgis:16-3.4, volume em disco)
```

Quatro serviços no mesmo `docker-compose.yml`, um `git pull && docker compose up -d --build`
publica os dois lados de uma vez.

Três coisas que são parte da decisão, não consequência dela:

- **O frontend sai da Vercel.** Front e back passam a ser **a mesma origem**: acaba o CORS, acaba
  o `CORS_ORIGINS` apontando pra domínio de terceiro, e some a volta de rede do SSR — o fetch de
  cada render vira loopback.
- **PostGIS deixa de ser risco de provedor.** Roda a mesma imagem que a suíte testa. Paridade
  entre desenvolvimento, teste e produção.
- **O item 45 destrava com um volume em disco**, sem precisar de conta e chave de object storage
  no dia 1.

## Alternativas consideradas

**Magalu Cloud, BV2-4-40 (R$ 102,99/mês — 2 vCPU, 4 GB, 40 GB).** Segundo lugar, e perdeu por
pouco. Tem tudo que importa: datacenter em Tamboré/SP, NVMe, snapshot, cobrança por hora, CLI,
provider Terraform oficial, object storage S3-compatível — e, diferente da Hostinger, **emite
NF-e, é empresa brasileira e cobra em real sem IOF**. Perdeu porque cobra 2,3× por metade da RAM e
40% do disco, e porque **hoje não existe CNPJ neste projeto** — a nota fiscal é uma vantagem que
não pode ser exercida. Ver "gatilhos de reavaliação".

**Vultr `vc2-2c-4gb` (~R$ 111/mês — 2 vCPU, 4 GB, 80 GB, 3 TB).** Foi a primeira recomendação
desta análise, por documentação e maturidade. Caiu quando a verificação mostrou que a Magalu tem o
mesmo ferramental (Terraform, CLI, object storage, cobrança horária) e ainda emite nota — sobrando
pra Vultr só disco maior e um teto de egress que nesta escala não é exercido.

**AWS Lightsail Medium (~R$ 133/mês).** Mais caro que todos, e São Paulo recebe **metade** da
franquia de tráfego. Sem vantagem compensatória.

**Oracle Cloud Always Free, `VM.Standard.A1.Flex` em GRU (4 OCPU ARM, 24 GB, 200 GB, grátis).**
Tecnicamente o melhor hardware da lista, de graça, em São Paulo, e as imagens `postgis/postgis` e
`python:3.12-slim` têm arm64. Recusado pelo risco operacional: `out of host capacity` recorrente
na criação e histórico de recuperação de instância ociosa. Guardar a única cópia da curadoria de
campo — o R3, que é o gargalo do projeto inteiro — nisso, pra economizar R$ 44/mês, é a troca
errada.

**Hetzner (~R$ 44/mês) e DigitalOcean.** Os mais baratos e os mais maduros, e **descartados por
geografia**: nenhum tem presença na América do Sul. Falkenstein são 200–220 ms de São Paulo, o que
anula o requisito 3 — e o requisito 3 é o que traz o frontend pro mesmo box. Hetzner + Cloudflare
na frente resolveria os assets estáticos, mas não o HTML dinâmico, que é 100% das rotas de
leitura.

**Railway/Render + Vercel + Postgres gerenciado (o plano original).** Descartado pelos três
requisitos de uma vez: PostGIS incerto, disco efêmero (item 45 seguiria bloqueado), CORS
obrigatório e a volta de rede no SSR de toda página.

## Consequências

**A operação passa a ser sua.** TLS, atualização de SO, restart automático, monitoramento — e,
acima de tudo, **backup**. Num PaaS o backup do banco é caixinha marcada; aqui, se não houver
`pg_dump` diário saindo da máquina, os 10–15 lugares curados a pé do R3 vivem num disco só. Isso
não é boa prática opcional: é pré-requisito de considerar o R7 concluído.

**Não há nota fiscal.** Desde 01/10/2022 quem presta o serviço é a **Hostinger International
Limited (Chipre)**; a `Hostinger Brasil Hospedagem de Sites LTDA` existe mas não é a contratada. O
que se recebe é fatura, não NF-e, e o gasto vira importação de serviço. **Aceito porque não há
CNPJ.** Também enfraquece o argumento de jurisdição: o dado fica em território nacional, mas a
parte contratante é estrangeira — resposta menos limpa sob LGPD do que "empresa brasileira,
datacenter brasileiro", num app que coleta coordenada de GPS e promete anonimato no sinal.

**Compromisso de 24 meses pré-pagos** pelo preço promocional (R$ 1.055 de uma vez). Se o piloto
morrer em três meses, o dinheiro foi. Um plano de 12 meses corta o compromisso pela metade a um
custo mensal um pouco maior, e é a escolha recomendada enquanto o piloto não se provar.

**É hospedagem, não nuvem.** Sem cobrança por hora, sem API/Terraform, sem object storage do
provedor. Nada disso é exercido por este projeto hoje — é um box, um `docker compose` e um
`git pull` —, mas fecha portas se um dia for.

**Um único domínio de falha.** Se o box cai, cai o app inteiro, não só a API.

**Os 8 GB de RAM resolvem o `next build` no próprio servidor.** Era o único motivo pelo qual 4 GB
seria apertado: o build do Next 16 com Tailwind v4 tem pico de 1,5–2,5 GB, e num box de 2 GB o OOM
killer levaria o Postgres. Com 8 GB, o deploy é `git pull && docker compose up -d --build` e não
depende de registry externo nem da CI do item 14.

**Dimensionamento não previu fila.** O ADR-004 do backend recusa worker/Redis/cron e foi
reafirmado em 29/08. Se a decisão for revertida, Redis nesta escala come 10–50 MB — não é o que
define o tamanho da máquina.

**Pendências que o deploy torna obrigatórias:**

- `JWT_SECRET` vindo do ambiente. O default em `config.py` é `"change-me-to-a-long-random-string"`.
- `POSTGRES_PASSWORD` do ambiente. O default do compose é `boraroles`.
- **A porta `5432` sai do `docker-compose.yml`.** Hoje o Postgres publica na host; num VPS isso é
  o banco exposto na internet.
- `output: "standalone"` no `next.config.ts` e um `Dockerfile` para o frontend, que ainda não
  existe — hoje só o backend é conteinerizado.
- **Selecionar São Paulo explicitamente no checkout.** A Hostinger provisiona em outro datacenter
  se a região não for escolhida — e aí a decisão inteira, que gira em torno de latência, é
  perdida.
- Swapfile de 2 GB. Custa nada e transforma OOM em lentidão.

## Gatilhos de reavaliação

- **Surgir um CNPJ para o projeto** → migrar para a **Magalu**. A NF-e passa a ser exercível, some
  a importação de serviço, e a jurisdição fica coerente com a promessa de privacidade do app.
- **O piloto morrer ou mudar de bairro** antes do fim do contrato → o dinheiro do pré-pago é
  afundado; não é motivo para manter uma escolha ruim.
- **Carga real além de um bairro** → subir de plano, ou separar o Postgres numa segunda máquina.

Em qualquer um dos casos a migração é barata **por construção**: os dois lados são o mesmo
`docker compose`. Sair daqui é `pg_dump`, subir o compose na máquina nova e apontar o DNS — uma
tarde, não um projeto. Essa reversibilidade é parte do motivo de a decisão poder ser tomada agora,
com o piloto ainda não validado.
