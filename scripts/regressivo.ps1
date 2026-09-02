#Requires -Version 5.1
<#
.SYNOPSIS
    O regressivo do bora-roles: um comando, tudo ou nada.

.DESCRIPTION
    Roda a suite inteira do projeto e sai com codigo 0 (verde) ou 1 (vermelho).
    E o portao do fluxo de branch descrito no CLAUDE.md: nada merga na master
    sem este script verde.

    Passa pelas etapas na ordem mais barata primeiro, e PARA no primeiro
    vermelho — quem esta esperando nao precisa ver os outros falharem em
    cascata.

    Os testes rodam contra um banco SEPARADO (boraroles_test), criado aqui se
    nao existir. O banco de desenvolvimento nunca e tocado: assim o regressivo
    nao fica vermelho por causa de uma conta que voce criou a mao.

.PARAMETER SoBackend
    Roda so o backend (pula lint e build do frontend).

.PARAMETER SoFrontend
    Roda so o frontend (nao precisa de Docker). NAO e o regressivo.

.PARAMETER SemBuild
    Pula o rebuild da imagem. ATALHO PERIGOSO: sem o build, a suite roda contra
    o codigo assado na imagem, nao contra o seu disco. Use so para reexecutar
    um regressivo que voce acabou de rodar.

.EXAMPLE
    .\scripts\regressivo.ps1
#>
[CmdletBinding()]
param(
    [switch]$SoBackend,
    [switch]$SoFrontend,
    [switch]$SemBuild
)

$ErrorActionPreference = 'Stop'

$Raiz     = Split-Path -Parent $PSScriptRoot
$Backend  = Join-Path $Raiz 'backend'
$Frontend = Join-Path $Raiz 'frontend'

$BancoTeste = 'boraroles_test'
$UrlTeste   = "postgresql+asyncpg://boraroles:boraroles@postgres:5432/$BancoTeste"

$script:Resultados = @()
$InicioTudo = Get-Date

function Escreva([string]$Texto, [string]$Cor = 'Gray') {
    Write-Host $Texto -ForegroundColor $Cor
}

function Falhe([string]$Passo, [string]$Recado) {
    Escreva ''
    Escreva "VERMELHO — $Passo" 'Red'
    Escreva $Recado 'Red'
    Escreva ''
    Escreva 'O regressivo nao passou. Nao merge nesta branch.' 'Red'
    exit 1
}

# Cada passo roda um executavel nativo e e julgado pelo codigo de saida.
function Invoke-Passo {
    param(
        [string]   $Nome,
        [string]   $Dir,
        [string]   $Exe,
        [string[]] $Argumentos
    )

    $n = $script:Resultados.Count + 1
    Escreva ''
    Escreva "[$n] $Nome" 'Cyan'
    Escreva ("    " + $Exe + " " + ($Argumentos -join ' ')) 'DarkGray'

    $inicio = Get-Date
    Push-Location $Dir
    try {
        & $Exe @Argumentos
        $codigo = $LASTEXITCODE
    } finally {
        Pop-Location
    }
    $seg = [math]::Round(((Get-Date) - $inicio).TotalSeconds, 1)

    if ($codigo -ne 0) {
        $script:Resultados += [pscustomobject]@{ Passo = $Nome; Estado = 'FALHOU'; Seg = $seg }
        Falhe $Nome "O comando saiu com codigo $codigo. A saida completa esta acima."
    }

    $script:Resultados += [pscustomobject]@{ Passo = $Nome; Estado = 'ok'; Seg = $seg }
    Escreva "    ok ($seg s)" 'Green'
}

Escreva ''
Escreva '=== regressivo do bora-roles ===' 'White'

# --- Etapa 0: o Docker esta de pe? -------------------------------------------
# Falhar aqui em um segundo e muito melhor que falhar la na frente, depois de o
# frontend inteiro ter compilado.
if (-not $SoFrontend) {
    Escreva ''
    Escreva '[0] daemon do Docker' 'Cyan'
    docker info 2>&1 | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Escreva '    ausente' 'Red'
        $recado = @(
            'O Docker Desktop nao esta rodando, entao nada do backend pode ser verificado.',
            'Ligue o Docker Desktop e rode de novo.',
            '',
            'Nao merge dizendo que a mudanca era pequena — o CLAUDE.md e explicito: com o',
            'daemon parado o certo e nao mergear e dizer que nao foi verificado.',
            '(Para verificar so o frontend: .\scripts\regressivo.ps1 -SoFrontend)'
        ) -join [Environment]::NewLine
        Falhe 'daemon do Docker' $recado
    }
    Escreva '    ok' 'Green'
}

# --- Frontend (rapido, e nao precisa de Docker) ------------------------------
if (-not $SoBackend) {
    Invoke-Passo 'frontend: lint'  $Frontend 'npm' @('run', 'lint')
    Invoke-Passo 'frontend: build' $Frontend 'npm' @('run', 'build')
}

if ($SoFrontend) {
    $total = [math]::Round(((Get-Date) - $InicioTudo).TotalSeconds, 1)
    Escreva ''
    $script:Resultados | Format-Table -AutoSize | Out-String | Write-Host
    Escreva "VERDE (so frontend) em $total s" 'Green'
    Escreva 'Atencao: -SoFrontend NAO e o regressivo. O backend nao foi verificado.' 'Yellow'
    exit 0
}

# --- Subir a imagem a partir do codigo do disco ------------------------------
# Sem o --build, `docker compose exec` roda o codigo de quando a imagem foi
# construida. Ja aconteceu de a suite passar verde contra uma arvore de 22
# horas atras, sem nenhum sinal. Ver item 49 do TODO.md.
if ($SemBuild) {
    Escreva ''
    Escreva '[!] -SemBuild: a suite vai rodar contra a IMAGEM, nao contra o disco.' 'Yellow'
    Invoke-Passo 'backend: subir (sem rebuild)' $Backend 'docker' @('compose', 'up', '-d')
} else {
    Invoke-Passo 'backend: construir e subir' $Backend 'docker' @('compose', 'up', '-d', '--build', 'api')
}

# --- Garantir o banco de teste -----------------------------------------------
# A extensao PostGIS nao precisa ser criada aqui: a migration 0001 faz
# CREATE EXTENSION IF NOT EXISTS postgis, e o alembic roda dentro do proprio
# pytest (conftest._apply_migrations). Aqui so precisamos do banco existindo.
$n = $script:Resultados.Count + 1
Escreva ''
Escreva "[$n] banco de teste ($BancoTeste)" 'Cyan'
Push-Location $Backend
try {
    $existe = docker compose exec -T postgres psql -U boraroles -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$BancoTeste'" 2>&1
    if ($LASTEXITCODE -ne 0) {
        Falhe 'banco de teste' ("Nao consegui falar com o Postgres do compose." + [Environment]::NewLine + $existe)
    }
    if (("$existe".Trim()) -ne '1') {
        Escreva "    criando $BancoTeste" 'DarkGray'
        docker compose exec -T postgres createdb -U boraroles $BancoTeste 2>&1 | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Falhe 'banco de teste' "Falhei ao criar $BancoTeste."
        }
    } else {
        Escreva '    ja existia' 'DarkGray'
    }
} finally {
    Pop-Location
}
$script:Resultados += [pscustomobject]@{ Passo = 'banco de teste'; Estado = 'ok'; Seg = 0 }
Escreva '    ok' 'Green'

# --- Lint, tipos e a suite ---------------------------------------------------
Invoke-Passo 'backend: ruff' $Backend 'docker' @('compose', 'exec', '-T', 'api', 'uv', 'run', 'ruff', 'check', '.')
Invoke-Passo 'backend: mypy' $Backend 'docker' @('compose', 'exec', '-T', 'api', 'uv', 'run', 'mypy', 'src')

# O -e aponta a suite para o banco de teste. Sem isso ela roda no banco de
# desenvolvimento e pode ficar vermelha por dado que voce criou a mao.
Invoke-Passo 'backend: pytest (banco de teste)' $Backend 'docker' @(
    'compose', 'exec', '-T', '-e', ("DATABASE_URL=" + $UrlTeste),
    'api', 'uv', 'run', 'pytest', '-q'
)

# --- Resumo ------------------------------------------------------------------
$total = [math]::Round(((Get-Date) - $InicioTudo).TotalSeconds, 1)
Escreva ''
$script:Resultados | Format-Table -AutoSize | Out-String | Write-Host
Escreva "VERDE em $total s — pode mergear." 'Green'
if ($SemBuild) {
    Escreva 'Ressalva: rodou com -SemBuild, entao testou a imagem e nao o disco.' 'Yellow'
}
exit 0
