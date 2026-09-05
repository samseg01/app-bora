<#
.SYNOPSIS
    Puxa o backup mais recente do banco de produção para esta máquina.

.DESCRIPTION
    A outra metade do backup. O `deploy/backup.sh` roda no servidor e deixa o dump
    no disco de lá — o que protege contra erro humano, não contra o box morrer.
    O ADR de raiz 0001 exige o dump *saindo da máquina*, e é este script que faz isso.

    Rodar por Agendador de Tarefas do Windows, diariamente, depois do horário do cron
    (o cron sugerido é 04:17; agende para as 05:00).

.EXAMPLE
    .\scripts\puxar-backup.ps1 -Servidor root@203.0.113.10
#>
param(
    [Parameter(Mandatory = $true)]
    [string]$Servidor,

    [string]$Destino = "$env:USERPROFILE\backups\bora-roles",

    [string]$OrigemRemota = "/var/backups/boraroles",

    [int]$RetencaoDias = 30
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path $Destino)) { New-Item -ItemType Directory -Path $Destino -Force | Out-Null }

# Dois arquivos, nao um: o pg_dump nao cobre as fotos do item 45, que vivem num volume e
# viram um tar separado no servidor. Puxar so o .sql.gz deixaria justamente o dado mais
# insubstituivel de fora — refazer uma foto exige voltar ao bar.
#
# O tar e opcional de proposito: enquanto ninguem tiver fotografado nada, ele nao existe,
# e isso nao e erro.
$padroes = @(
    @{ Glob = "boraroles-*.sql.gz";       Rotulo = "banco";  Obrigatorio = $true },
    @{ Glob = "boraroles-fotos-*.tar.gz"; Rotulo = "fotos";  Obrigatorio = $false }
)

foreach ($p in $padroes) {
    # Qual e o mais recente e decidido la, nao aqui: o servidor e quem sabe.
    # O glob do banco casaria tambem com o das fotos, entao o das fotos e excluido na fonte.
    $filtro = if ($p.Rotulo -eq "banco") { "ls -1t $OrigemRemota/$($p.Glob) 2>/dev/null | grep -v -- '-fotos-' | head -1" }
              else { "ls -1t $OrigemRemota/$($p.Glob) 2>/dev/null | head -1" }
    # A saida vem nula quando nao ha arquivo — e nula nao tem .Trim(). Chamar direto
    # funcionava enquanto so existia o dump do banco, que nunca falta; o tar das fotos
    # falta ate a primeira foto existir, e ai o script morria em vez de seguir.
    $saida = ssh $Servidor $filtro | Select-Object -First 1
    $maisRecente = if ($saida) { $saida.Trim() } else { "" }

    if (-not $maisRecente) {
        if ($p.Obrigatorio) { throw "Nenhum backup de $($p.Rotulo) em $OrigemRemota no servidor." }
        Write-Output "Sem backup de $($p.Rotulo) ainda — nada a puxar."
        continue
    }

    $nome = Split-Path $maisRecente -Leaf
    $local = Join-Path $Destino $nome

    if (Test-Path $local) {
        Write-Output "Ja tenho $nome — nada a puxar."
    } else {
        scp "${Servidor}:${maisRecente}" $local
        if ($LASTEXITCODE -ne 0) { throw "scp de $($p.Rotulo) falhou." }
        $tam = [math]::Round((Get-Item $local).Length / 1KB, 1)
        Write-Output "Puxado $nome ($tam KB) para $Destino"
    }

    # Um dump de 2 KB e vazio ou quebrado — e o silencio e o modo de falha classico aqui:
    # o arquivo existe, o script diz ok, e nao ha banco dentro dele.
    if ($p.Obrigatorio -and (Get-Item $local).Length -lt 2KB) {
        Write-Warning "ATENCAO: $nome tem menos de 2 KB. Conferir se o dump nao veio vazio."
    }

    Get-ChildItem $Destino -Filter $p.Glob |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetencaoDias) } |
        Remove-Item -Force
}
