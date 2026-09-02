# Regressivo — o portão em um comando

## O que faz

Um comando roda a verificação inteira do projeto — lint e build do frontend, lint, tipos e os 49
testes do backend — e responde uma coisa só: **verde ou vermelho**. É o portão do fluxo de branch
descrito no `CLAUDE.md`: nada merga na `master` sem ele verde.

```powershell
.\scripts\regressivo.ps1      # PowerShell (o shell da máquina)
```
```bash
scripts/regressivo.sh         # Git Bash, e é o que a CI vai chamar
```

## Por onde passa

Nenhum código de produção foi tocado. A feature é toda de ferramenta:

| Arquivo | Papel |
|---|---|
| `scripts/regressivo.ps1` | o switch, em PowerShell |
| `scripts/regressivo.sh` | gêmeo em bash, para Git Bash e para a CI do item 14 |
| `backend/docker-compose.dev.yml` | override opt-in que monta `./src` e `./tests` (item 49) |

As etapas, na ordem em que rodam — **para no primeiro vermelho**, para ninguém ficar lendo cinco
falhas em cascata que vieram da mesma causa:

| # | Etapa | Onde |
|---|---|---|
| 0 | daemon do Docker está de pé? | falha em ~1s se não |
| 1 | `npm run lint` | `frontend/` |
| 2 | `npm run build` | `frontend/` |
| 3 | `docker compose up -d --build api` | `backend/` |
| 4 | criar `boraroles_test` se não existir | `backend/` |
| 5 | `ruff check .` | no container |
| 6 | `mypy src` | no container |
| 7 | `pytest -q`, com `DATABASE_URL` apontando para `boraroles_test` | no container |

Três decisões dentro dessa ordem valem ser ditas:

- **O Docker é checado antes de tudo.** Falhar em um segundo é melhor que falhar no passo 5,
  depois de o frontend inteiro ter compilado. E a mensagem de erro não é "docker não encontrado":
  é o lembrete de que, com o daemon parado, o certo é **não mergear e dizer que não foi
  verificado**, em vez de mergear alegando mudança pequena.
- **O frontend vem antes do backend** porque é rápido e não precisa de Docker.
- **O `--build` é forçado**, sempre. Sem ele, `docker compose exec` roda o código assado na imagem:
  em 31/08 a suíte passou verde contra uma árvore de 22 horas atrás, sem nenhum sinal. Ver item 49.

## O banco de teste é separado, e isso é o ponto

Até aqui a suíte rodava **no mesmo banco do desenvolvimento**. Isso já deixou o projeto vermelho
por motivo errado: uma conta criada à mão com `dono@exemplo.com` colidia com o fixture e derrubava
o teste por violação de unicidade — daí a recomendação de usar `@local.dev` para contas manuais,
que era contorno, não conserto.

Agora os testes rodam em `boraroles_test`, criado pelo script na primeira execução. Saiu barato
porque o encanamento já permitia: `conftest.py` lê `settings.database_url`, `alembic/env.py` lê a
mesma coisa, e as duas vêm de `DATABASE_URL` — então basta um `-e` no `docker compose exec`. A
extensão PostGIS não precisa de tratamento especial: a migration `0001` faz
`CREATE EXTENSION IF NOT EXISTS postgis`, e o `conftest._apply_migrations` roda o alembic sozinho.

Um portão que dá falso vermelho é um portão que se aprende a ignorar. Esta era a parte que
tornava o regressivo confiável.

## Como verificar que está de pé

1. Com o Docker **desligado**: `scripts/regressivo.sh` deve parar na etapa 0 e sair com código 1.
2. `scripts/regressivo.sh --so-frontend` deve rodar lint+build e sair 0, avisando em amarelo que
   isso **não** é o regressivo.
3. Com o Docker ligado: `scripts/regressivo.ps1` inteiro deve terminar em `VERDE`, e
   `docker compose exec postgres psql -U boraroles -l` deve listar `boraroles_test`.
4. Quebre algo de propósito (uma linha em `services/frescor.py`) e confirme que fica vermelho no
   passo 7, com código de saída 1.

## O que deliberadamente não faz

- **Não testa comportamento de frontend.** O frontend do projeto não tem um único teste — zero
  arquivos `.test`/`.spec`, zero ferramenta instalada. `lint` e `build` pegam erro de tipo e de
  compilação, não regressão de comportamento. Três bugs recentes escapariam inteiros: o mapa que
  não desenhava por altura 0, o pin que sumia, a ficha que descartava o frescor que a API já
  mandava. **Então "regressivo" hoje quer dizer: regressivo do backend.**
- **Não roda sozinho.** Não há CI nem proteção de branch; nada impede um push direto na `master`.
  O script é o portão, mas quem fecha o portão ainda é você. É o item 14 do `TODO.md`, e o
  `regressivo.sh` foi escrito já pensando em ser o que a CI chama.
- **Não paraleliza** as etapas. Sequencial é mais lento e muito mais legível quando falha.
- **Não limpa `boraroles_test` entre execuções.** Não precisa: cada teste roda numa transação
  revertida no fim (`conftest.db_session`). Se um dia o banco sujar, `dropdb boraroles_test` e a
  próxima execução o recria.
- **O `--sem-build` existe e é uma armadilha consciente.** Serve para reexecutar um regressivo que
  você acabou de rodar; o script avisa em amarelo, antes e depois, que testou a imagem e não o
  disco.

## Ligações

- Regra de fluxo e o ciclo de branch: seção "Fluxo de trabalho" do `CLAUDE.md` da raiz.
- Item 49 do `TODO.md` (imagem sem bind mount) — endereçado por dois caminhos: `--build` forçado
  aqui, e `backend/docker-compose.dev.yml` para o dia a dia.
- Item 14 do `TODO.md` (CI) — é o que transforma este script em portão de verdade.
