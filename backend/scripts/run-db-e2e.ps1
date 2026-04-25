param(
  [string]$MySqlPath = "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe",
  [string]$DbUser = "root",
  [string]$DbPassword = "MySQL#2024$",
  [string]$Database = "integra360",
  [string]$DbHost = "127.0.0.1",
  [int]$DbPort = 3306,
  [switch]$PersistData,
  [switch]$KeepDatabase
)

$ErrorActionPreference = "Stop"
$PSNativeCommandUseErrorActionPreference = $false

function Invoke-MySql {
  param(
    [Parameter(Mandatory = $true)][string]$Sql,
    [string]$TargetDatabase = $Database
  )

  $mysqlCommand = $MySqlPath

  if (-not (Test-Path $MySqlPath)) {
    $resolved = Get-Command $MySqlPath -ErrorAction SilentlyContinue
    if ($null -eq $resolved) {
      throw "MySQL client not found at path or PATH command: $MySqlPath"
    }
    $mysqlCommand = $resolved.Source
  }

  $args = @(
    "--batch",
    "--raw",
    "--skip-column-names",
    "-h", $DbHost,
    "-P", "$DbPort",
    "-u", $DbUser,
    $TargetDatabase,
    "-e", $Sql
  )

  $oldPwd = $env:MYSQL_PWD
  $env:MYSQL_PWD = $DbPassword
  try {
    $output = & $mysqlCommand @args 2>&1
    $exitCode = $LASTEXITCODE
  }
  finally {
    if ($null -eq $oldPwd) {
      Remove-Item Env:MYSQL_PWD -ErrorAction SilentlyContinue
    } else {
      $env:MYSQL_PWD = $oldPwd
    }
  }

  if ($exitCode -ne 0) {
    throw "MySQL command failed (exit=$exitCode):`n$output"
  }

  return ($output -join "`n")
}

function Assert-Condition {
  param(
    [Parameter(Mandatory = $true)][bool]$Condition,
    [Parameter(Mandatory = $true)][string]$Message
  )

  if (-not $Condition) {
    throw "ASSERT FAILED: $Message"
  }
}

function Get-CheckRow {
  param(
    [Parameter(Mandatory = $true)][string[]]$Lines,
    [Parameter(Mandatory = $true)][string]$CheckName
  )

  foreach ($line in $Lines) {
    if ($line -like "$CheckName`t*") {
      return $line
    }
  }

  throw "Check row not found in E2E output: $CheckName"
}

if (-not $KeepDatabase) {
  Write-Host "[INFO] Recreating database for deterministic CI run..."
  Invoke-MySql -TargetDatabase "information_schema" -Sql "DROP DATABASE IF EXISTS $Database;"
  Invoke-MySql -TargetDatabase "information_schema" -Sql "CREATE DATABASE $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
} else {
  Write-Host "[INFO] Keeping existing database and ensuring it exists..."
  Invoke-MySql -TargetDatabase "information_schema" -Sql "CREATE DATABASE IF NOT EXISTS $Database CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
}

Write-Host "[INFO] Applying database migrations..."
Invoke-MySql -Sql "SOURCE c:/Users/Rodrigo/OneDrive/Escritorio/snippets/vue/Integra360/backend/database/migrations/20260425_001_multi_tenant_schema.sql;"
Invoke-MySql -Sql "SOURCE c:/Users/Rodrigo/OneDrive/Escritorio/snippets/vue/Integra360/backend/database/migrations/20260425_002_business_logic.sql;"
Invoke-MySql -Sql "SOURCE c:/Users/Rodrigo/OneDrive/Escritorio/snippets/vue/Integra360/backend/database/migrations/20260425_003_performance_strategy.sql;"
Invoke-MySql -Sql "SOURCE c:/Users/Rodrigo/OneDrive/Escritorio/snippets/vue/Integra360/backend/database/migrations/20260425_005_product_images.sql;"
Invoke-MySql -Sql "SOURCE c:/Users/Rodrigo/OneDrive/Escritorio/snippets/vue/Integra360/backend/database/migrations/20260425_006_products_extended_fields.sql;"
Invoke-MySql -Sql "SOURCE c:/Users/Rodrigo/OneDrive/Escritorio/snippets/vue/Integra360/backend/database/migrations/20260425_004_seed_base_catalogs.sql;"

$persistFlag = if ($PersistData) { 1 } else { 0 }
Write-Host "[INFO] Running E2E validation with persist_data=$persistFlag ..."
$e2eOutput = Invoke-MySql -Sql "SET @persist_data = $persistFlag; SOURCE c:/Users/Rodrigo/OneDrive/Escritorio/snippets/vue/Integra360/backend/database/tests/20260425_e2e_validation.sql;"

$lines = $e2eOutput -split "`r?`n" | Where-Object { $_.Trim().Length -gt 0 }

$stockLine = Get-CheckRow -Lines $lines -CheckName "CHECK_STOCK_AVAILABLE"
$inventoryLine = Get-CheckRow -Lines $lines -CheckName "CHECK_INVENTORY"
$cashLine = Get-CheckRow -Lines $lines -CheckName "CHECK_CASH_CLOSING"
$auditLine = Get-CheckRow -Lines $lines -CheckName "CHECK_AUDIT_MOVEMENTS"
$refLine = Get-CheckRow -Lines $lines -CheckName "CHECK_REFERENTIAL_COUNTS"
$cleanupLine = Get-CheckRow -Lines $lines -CheckName "CHECK_CLEANUP"

$stockCols = $stockLine -split "`t"
$inventoryCols = $inventoryLine -split "`t"
$cashCols = $cashLine -split "`t"
$auditCols = $auditLine -split "`t"
$refCols = $refLine -split "`t"
$cleanupCols = $cleanupLine -split "`t"

Assert-Condition -Condition ($stockCols[1] -eq "95.0000") -Message "Stock available expected 95.0000, got $($stockCols[1])"
Assert-Condition -Condition ($inventoryCols[1] -eq "95.0000") -Message "Inventory on hand expected 95.0000, got $($inventoryCols[1])"
Assert-Condition -Condition ($inventoryCols[3] -eq "95.0000") -Message "Inventory available expected 95.0000, got $($inventoryCols[3])"
Assert-Condition -Condition ($cashCols[1] -eq "63280.0000") -Message "Cash expected amount mismatch: $($cashCols[1])"
Assert-Condition -Condition ($cashCols[2] -eq "63280.0000") -Message "Cash counted amount mismatch: $($cashCols[2])"
Assert-Condition -Condition ($cashCols[3] -eq "0.0000") -Message "Cash difference expected 0.0000, got $($cashCols[3])"
Assert-Condition -Condition ($auditCols[1] -eq "2") -Message "Audit rows expected 2, got $($auditCols[1])"
Assert-Condition -Condition ($refCols[1] -eq "1" -and $refCols[2] -eq "1" -and $refCols[3] -eq "1" -and $refCols[4] -eq "1") -Message "Referential counts mismatch: $refLine"

if ($PersistData) {
  Assert-Condition -Condition ($cleanupCols[1] -eq "COMMIT") -Message "Expected COMMIT cleanup action, got $($cleanupCols[1])"
  Assert-Condition -Condition ($cleanupCols[2] -eq "1") -Message "Expected persisted company row = 1, got $($cleanupCols[2])"
} else {
  Assert-Condition -Condition ($cleanupCols[1] -eq "ROLLBACK") -Message "Expected ROLLBACK cleanup action, got $($cleanupCols[1])"
  Assert-Condition -Condition ($cleanupCols[2] -eq "0") -Message "Expected rolled-back company row = 0, got $($cleanupCols[2])"
}

Write-Host "[PASS] Database migrations + E2E validation successful."
Write-Host "[PASS] Cleanup mode: $($cleanupCols[1])"
