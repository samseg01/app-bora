# Foto do lugar — tirada pelo curador, na calçada

O curador fotografa a casa no momento em que a cadastra, do próprio celular, e a foto
aparece no topo da ficha do lugar.

Fecha o item 45 do `TODO.md`, que estava bloqueado desde 28/08 esperando alguém decidir
onde os arquivos moram. Quem decidiu foi o
[ADR de raiz 0001](../adr/0001-deploy-em-vps-unico-sao-paulo.md) — e decidiu diferente do
que o item previa: ver "A hipótese que não se confirmou", abaixo.

## O que a feature faz

No painel do curador, tanto no formulário de **cadastrar lugar** quanto no de **corrigir**,
existe um botão que abre a câmera ou a galeria do telefone. A foto escolhida sobe na hora,
aparece como prévia, e é gravada junto com a ficha.

Ela nasce em campo de propósito. `docs/conceito.md` diz que a origem da imagem é a foto do
curador — coerente com a tese ("este lugar presta porque eu estive lá") e sem problema de
direito de imagem, que foto de terceiro traria.

## Por onde ela passa

| Camada | Arquivo | O que faz |
|---|---|---|
| API | `backend/src/boraroles/api/v1/curador.py` | `POST /api/v1/curador/fotos` — multipart, só curador |
| Serviço | `backend/src/boraroles/services/fotos.py` | valida, sorteia o nome, grava em disco |
| Config | `backend/src/boraroles/config.py` | `fotos_dir`, `foto_max_bytes` |
| Servir | `backend/src/boraroles/main.py` | `StaticFiles` montado em `/fotos` |
| Borda | `deploy/Caddyfile` | `/fotos/*` → api |
| Disco | `docker-compose.prod.yml`, `backend/docker-compose.yml` | volume nomeado `fotos` em `/dados/fotos` |
| Backup | `deploy/backup.sh`, `scripts/puxar-backup.ps1` | o tar do volume, além do `pg_dump` |
| Cliente | `frontend/src/lib/api.ts` | `api.enviarFoto(token, arquivo)` |
| Cliente | `frontend/src/lib/fotos.ts` | `urlDaFoto()` — resolve o caminho relativo |
| UI | `frontend/src/components/ui/enviar-foto.tsx` | o botão, a prévia e o erro |
| UI | `frontend/src/app/curador/lugares/page.tsx`, `components/ui/corrigir-lugar.tsx` | onde ele aparece |
| UI | `frontend/src/views/lugar-ficha.tsx` | mostra a foto no topo |

**Nenhuma migration.** `Lugar.fotos` é `ARRAY(String)` desde a migration inicial e nunca
tinha sido usada. O que faltava não era coluna — era ter onde pôr o arquivo.

## As decisões que valem saber

**O upload não escreve no banco.** Ele grava o arquivo e devolve `{"url": "/fotos/…"}`.
Quem põe isso em `Lugar.fotos` é o `POST`/`PATCH /curador/lugares` de sempre. Juntar as
duas coisas criaria um segundo caminho de escrita no mesmo campo, e dois jeitos de mexer
no mesmo dado é como um deles fica para trás. O preço é arquivo órfão quando alguém envia
e desiste de salvar — kilobytes num disco de 100 GB, e visível (está em `fotos_dir` sem
estar em nenhum `Lugar.fotos`).

**O tipo é decidido pelos primeiros bytes, não pelo `Content-Type`.** O cabeçalho é escrito
pelo cliente e não custa nada mentir nele. JPEG, PNG e WebP são reconhecidos pela
assinatura. WebP entra porque câmera de Android moderno entrega WebP com frequência —
recusá-lo seria recusar o formato do aparelho que o curador tem na mão.

**O nome vem de `uuid4`, nunca do cliente.** Nome de upload é a via clássica de travessia
de diretório e de sobrescrever arquivo alheio. Nenhum byte do cliente entra no caminho; a
extensão vem do tipo detectado.

**O tamanho é conferido enquanto lê.** Ler tudo para medir depois é aceitar o arquivo
inteiro antes de recusá-lo — num box de 8 GB, um jeito barato de derrubar a API. Teto de
8 MB, que cabe foto de celular sem tratamento.

**O arquivo só ganha o nome final depois de completo** (`.parcial` e renomeia), mesma
disciplina do `deploy/backup.sh`: um arquivo truncado com nome final parece bom até alguém
abrir.

**Quem serve é a API, não o `file_server` do Caddy.** Por **paridade**: `/fotos/x.jpg`
resolve igual em desenvolvimento, no teste e em produção, e o Caddy não precisa montar o
volume. Servir imagem por Python custa mais — e a esta escala, um punhado de fotos de bar,
ninguém mede. Virar `file_server` é trocar três linhas no `Caddyfile`.

**O caminho gravado é relativo** (`/fotos/x.jpg`), porque front e back são a mesma origem
em produção. Guardar o domínio no banco só criaria dado para migrar quando ele mudasse. O
custo disso é que em desenvolvimento o navegador está em `:3000` e o arquivo em `:8000` —
resolvido por `lib/fotos.ts`, que prefixa a origem da API quando ela é absoluta. Sem essa
função a foto sumiria **só** na máquina de quem está construindo, com um 404 que parece
upload quebrado e é roteamento.

**A prévia carrega do servidor, não do arquivo local.** `URL.createObjectURL` seria mais
rápido e confirmaria menos: só que o arquivo foi escolhido. A prévia atual confirma que
ele subiu, foi gravado e está sendo servido de volta — a pergunta que interessa quando se
está longe de casa e não dá para conferir depois.

**Sem `capture="environment"` no input.** `capture` força a câmera e **remove a galeria**,
o que quebraria o caso real de já ter fotografado a casa antes de sentar para cadastrar.

## A hipótese que não se confirmou

O item 45 dizia: *"Ou entra armazenamento de objeto (S3/R2) desde o começo, o que pede
conta e chave"*. Não pediu. O ADR de raiz 0001 escolheu VPS em vez de PaaS por três
requisitos, e o segundo deles era exatamente disco persistente — então quando a hora
chegou, o disco já estava lá: 100 GB de NVMe e um volume nomeado. A feature saiu sem
nenhuma conta nova.

Sair para S3/R2 continua barato se um dia o disco apertar: é trocar `salvar_foto()` por um
cliente. Nada acima de `services/fotos.py` sabe que existe sistema de arquivos.

## Como verificar que está de pé

1. Entre como curador em `/curador/lugares`.
2. No formulário de cadastro, toque em **tirar ou escolher foto**. No telefone, a folha do
   Android oferece câmera e galeria.
3. A prévia aparece — e ela vem do servidor, então prévia visível já significa arquivo
   gravado e sendo servido.
4. Cadastre. Abra `/lugar/{id}`: a foto está no topo, no lugar do bloco de cor.
5. Pela API, o caminho completo:
   ```sh
   TOKEN=...
   curl -X POST https://SEU-DOMINIO/api/v1/curador/fotos \
     -H "Authorization: Bearer $TOKEN" -F "arquivo=@foto.jpg"
   # {"url":"/fotos/<uuid>.jpg"}
   curl -o volta.jpg https://SEU-DOMINIO/fotos/<uuid>.jpg   # bytes idênticos
   ```
6. As recusas, que são o que mais importa: mandar um `.md` com `type=image/jpeg` responde
   **415**; um arquivo acima de 8 MB responde **413**; conta comum responde **403**.

**Exercitado em 05/09** contra o compose local: upload de JPEG devolvendo o caminho, GET
trazendo os bytes idênticos (mesmo md5), e o 415 com `Content-Type` mentiroso. Mais 7
testes automatizados em `backend/tests/test_upload_foto.py` e 6 em
`frontend/src/lib/fotos.test.ts`. A suíte foi de 56 para 63.

## O que ela deliberadamente não faz

- **Uma foto por lugar, na prática.** A coluna é lista e o backend aceita várias; a UI usa
  e edita só a primeira. Galeria é outra tela, e não é o que o campo pede hoje.
- **Não redimensiona nem recomprime.** Uma foto de celular vai inteira, com os metadados
  dela — **inclusive EXIF, que pode conter coordenada de GPS**. Para foto de fachada de bar
  isso é o endereço do bar, que já é público e já está no cadastro. Se um dia a foto vier
  de usuário, e não de curador, isso vira problema de privacidade e precisa ser limpo.
- **Não apaga arquivo.** Trocar a foto de um lugar deixa a anterior no disco, e o órfão do
  envio abandonado também. Faxina é assunto do dia em que houver volume.
- **Não tem galeria, corte, filtro nem ordenação.**
- **Não valida que a imagem abre.** A assinatura diz que é JPEG; um JPEG corrompido passa.
  Decodificar exigiria Pillow no backend por uma garantia que o navegador já dá ao exibir.
- **Não serve miniatura.** A ficha carrega a foto em tamanho cheio. Num 4G ruim, isso pesa
  — é o primeiro candidato a melhoria se o R8 mostrar lentidão.

## Nota de operação: o backup cresceu junto

O `pg_dump` **não** cobre arquivo. `Lugar.fotos` guarda o caminho; o JPEG mora no volume.
Sem tratamento, a foto tirada de pé na calçada seria o único dado do projeto sem cópia — e
o mais insubstituível, porque refazer exige voltar ao bar.

Por isso `deploy/backup.sh` agora produz **dois** arquivos por noite: o dump do banco e um
`boraroles-fotos-<carimbo>.tar.gz` do volume. O `scripts/puxar-backup.ps1` traz os dois. O
tar só existe depois que houver alguma foto — e o log diz `sem fotos ainda` em vez de
silenciar, para que ninguém confunda "não há foto" com "o backup parou".
