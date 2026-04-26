param(
  [string]$DbHost = "localhost",
  [int]$DbPort = 3306,
  [string]$DbUser = "root",
  [string]$DbName = "integra360",
  [string]$DbPassword,
  [switch]$PromptPassword
)

$ErrorActionPreference = "Stop"

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Split-Path -Parent $scriptDir
$migrationFile = Join-Path $backendDir "database/migrations/20260425_007_seed_superadmin.sql"
$validationFile = Join-Path $backendDir "database/tests/20260425_superadmin_validation.sql"

if (-not (Test-Path $migrationFile)) {
  throw "No se encontro el archivo de migracion: $migrationFile"
}

if (-not (Test-Path $validationFile)) {
  throw "No se encontro el archivo de validacion: $validationFile"
}

if (-not (Get-Command mysql -ErrorAction SilentlyContinue)) {
  throw "No se encontro el comando 'mysql' en PATH. Instala MySQL CLI o agrega su ruta al PATH."
}

if (-not $DbPassword -or $PromptPassword) {
  $securePassword = Read-Host "MySQL Password" -AsSecureString
  $bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
  $DbPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
}

$env:MYSQL_PWD = $DbPassword

try {
  Write-Host "[1/2] Ejecutando migracion superadmin..." -ForegroundColor Cyan
  Get-Content $migrationFile | mysql --host=$DbHost --port=$DbPort --user=$DbUser $DbName

  Write-Host "[2/2] Ejecutando validacion superadmin..." -ForegroundColor Cyan
  Get-Content $validationFile | mysql --host=$DbHost --port=$DbPort --user=$DbUser $DbName --table

  Write-Host "Proceso completado correctamente." -ForegroundColor Green
}
finally {
  Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue

  if ($bstr) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }

  Remove-Variable securePassword,bstr -ErrorAction SilentlyContinue
}
