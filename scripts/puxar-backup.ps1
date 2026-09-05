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

# Qual é o mais recente é decidido lá, não aqui: o servidor é quem sabe.
$maisRecente = (ssh $Servidor "ls -1t $OrigemRemota/boraroles-*.sql.gz 2>/dev/null | head -1").Trim()
if (-not $maisRecente) { throw "Nenhum backup encontrado em $OrigemRemota no servidor." }

$nome = Split-Path $maisRecente -Leaf
$local = Join-Path $Destino $nome

if (Test-Path $local) {
    Write-Output "Ja tenho $nome — nada a puxar."
} else {
    scp "${Servidor}:${maisRecente}" $local
    if ($LASTEXITCODE -ne 0) { throw "scp falhou." }
    $tam = [math]::Round((Get-Item $local).Length / 1KB, 1)
    Write-Output "Puxado $nome ($tam KB) para $Destino"
}

# Um backup de 2 KB é um dump vazio ou quebrado — e o silêncio é o modo de falha
# clássico aqui: o arquivo existe, o script diz ok, e não há banco dentro dele.
if ((Get-Item $local).Length -lt 2KB) {
    Write-Warning "ATENCAO: $nome tem menos de 2 KB. Conferir se o dump nao veio vazio."
}

Get-ChildItem $Destino -Filter "boraroles-*.sql.gz" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$RetencaoDias) } |
    Remove-Item -Force
