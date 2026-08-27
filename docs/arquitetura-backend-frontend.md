# Arquitetura — backend + frontend

Plano do piloto (1 bairro), deliberadamente magro: segue a mesma ordem do `conceito.md` — manual antes de sistema, curadoria antes de automação, um bairro antes de escala. Não é uma arquitetura "pronta pra crescer"; é a mínima que sustenta o loop do produto.

## Modelo de dados (o coração do sistema)

A separação lugar/rolê do conceito vira o eixo central do schema:

| Entidade | Natureza | Campos-chave |
|---|---|---|
| **Lugar** | Permanente | nome, categoria, geo (lat/lng), bairro, estabelecimento_id (opcional), fotos |
| **Rolê** | Efêmero, expira | lugar_id, título, categoria, data/hora início-fim, criado_por (curador/estabelecimento) |
| **Sinalização** | Ainda mais efêmera (o "frescor") | rolê_id ou lugar_id, usuário_id, tipo (presença/fila/lotado), timestamp, decai em minutos-horas |
| **Salvo** | Curtir reenquadrado | usuário_id, lugar_id — a "curadoria disfarçada" |
| **Comentário** | Camada social do mapa | lugar_id ou rolê_id, texto, autor, timestamp |
| **Usuário** | — | perfil, papel (comum / curador / dono_estabelecimento) |
| **Estabelecimento** | — | dono, lugares vinculados, plano (orgânico/destacado) |

O estado `live/warm/new` dos cards não é um campo fixo — é **derivado**: calculado no momento da leitura a partir do volume/recência de Sinalizações. É o motor técnico do "frescor que decai em minutos" — o sinal que o conceito aposta como diferencial.

## Backend

**Stack:** Python + FastAPI, Postgres com extensão **PostGIS** (buscas geo por bairro/raio são o núcleo do produto), cron simples pra expirar rolês e decair sinalizações — sem fila pesada nessa fase.

Módulos:
- **API pública** (leitura): `GET /descoberta?bairro=X` (retorna os 3-5 rolês curados de hoje — curatorial no início, não um algoritmo de ranking), `GET /mapa?bairro=X&bbox=...` (pins + comentários).
- **API de contribuição** (escrita, autenticada): salvar lugar, sinalizar presença, comentar.
- **Painel do curador** (admin simples, autenticado por papel): CRUD de Lugar/Rolê — o "sistema" que substitui a planilha quando ela travar. Rotas protegidas na mesma API + tela web simples, sem app separado.
- **Painel do estabelecimento**: leitura agregada (quantos salvaram, quantas sinalizações) — nunca escrita direta no que é orgânico, só no que é próprio.
- **Auth**: solução pronta (Supabase Auth, Clerk, ou JWT simples) — não vale construir do zero num piloto de 1 bairro.

Nada de microsserviços, filas pesadas ou cache distribuído nessa fase — um Postgres bem indexado por geo aguenta um bairro inteiro tranquilamente.

## Frontend

Três interfaces, nessa ordem de prioridade:

1. **App público (PWA, não nativo)** — React (Next.js). PWA em vez de app nativo porque a descoberta espontânea não pode ter fricção de "baixar da loja": alguém sem plano precisa abrir um link e já ver o rolê de hoje. Instalável, mas o primeiro contato é web puro. As duas telas já prototipadas (rail de descoberta + mapa) são as duas rotas principais.
2. **Painel do curador** — a versão "sistema" da planilha. Formulário CRUD simples dentro do mesmo Next.js, atrás de login — não precisa de produto separado.
3. **Painel do estabelecimento** — tela read-only simples, cresce só quando tiver dado real pra mostrar (num app vazio ele não mostra nada, como já está no conceito).

## Sequenciamento (espelhando a "Ordem de construção" do conceito)

1. Schema (Lugar/Rolê/Sinalização) + API de leitura + as duas telas públicas conectadas a dado real do bairro piloto.
2. Painel do curador — pra sair da planilha e editar direto no banco.
3. Sinalização de presença (o motor "mais frágil") — começa restrito a curadores/engajados.
4. Painel do estabelecimento, só depois de ter volume de Salvos/Sinalizações pra mostrar algo honesto.
5. Social (compartilhar com amigos) fica pra fase 2.

## Custo/infra pro piloto

Hospedagem simples (Railway/Fly.io/Render pro backend, Vercel pro Next.js) + Postgres gerenciado com PostGIS — roda um bairro inteiro por muito pouco por mês. Sem infra própria nessa fase.

## Nota sobre o mockup (`mvp/preview-tela.jsx`)

No mockup, a camada de descoberta (rail de cards) e o mapa cabem inteiros num frame de 720px sem scroll — orçamento de altura artificial da prévia. Num telefone real, 3 cards de 112px + seam + mapa provavelmente empurram o mapa quase todo pra baixo da dobra. Vale testar a altura real num device antes de assumir que a convivência vertical das duas camadas funciona como desenhada.
