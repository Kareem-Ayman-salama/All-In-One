$ErrorActionPreference = 'Stop'

$ProjectRoot = Split-Path -Parent $PSScriptRoot
$PhpRoot = Join-Path $env:USERPROFILE '.cache\codex-runtimes\php-8.3.33'
$Php = Join-Path $PhpRoot 'php.exe'
$PhpIni = Join-Path $PhpRoot 'php-cli.ini'

if (-not (Test-Path $Php)) {
    throw "Bundled PHP was not found at $Php"
}

if (-not (Test-Path $PhpIni)) {
    throw "Bundled PHP ini was not found at $PhpIni"
}

Set-Location $ProjectRoot
& $Php -c $PhpIni -S 127.0.0.1:8000 -t public public/index.php
