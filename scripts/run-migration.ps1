# ============================================================================
# Run Database Migration - BookFast Admin Panel
# ============================================================================

param(
    [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BOOKFAST ADMIN - RUN MIGRATION" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar service role key
if ([string]::IsNullOrEmpty($ServiceRoleKey)) {
    Write-Host "Service Role Key no configurada.`n" -ForegroundColor Yellow
    Write-Host "Opciones:`n" -ForegroundColor White
    Write-Host "1. Configura la variable de entorno:" -ForegroundColor Green
    Write-Host '   $env:SUPABASE_SERVICE_ROLE_KEY = "tu-key"' -ForegroundColor Gray
    Write-Host '   .\scripts\run-migration.ps1' -ForegroundColor Gray
    Write-Host ""
    Write-Host "2. Pásala como parámetro:" -ForegroundColor Green
    Write-Host '   .\scripts\run-migration.ps1 -ServiceRoleKey "tu-key"' -ForegroundColor Gray
    Write-Host ""
    Write-Host "3. Ingrésala ahora:" -ForegroundColor Green
    $ServiceRoleKey = Read-Host "Service Role Key" -AsSecureString
    $ServiceRoleKey = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($ServiceRoleKey)
    )
    Write-Host ""
}

# Configuración
$SupabaseUrl = "https://jsqminbgggwhvkfgeibz.supabase.co"
$MigrationFile = Join-Path $PSScriptRoot "..\supabase-migrations\001_platform_admin_security.sql"
$InsertUserFile = Join-Path $PSScriptRoot "insert-platform-user-admin3.sql"

# Verificar archivos
if (-not (Test-Path $MigrationFile)) {
    Write-Host "ERROR: No se encuentra $MigrationFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $InsertUserFile)) {
    Write-Host "ERROR: No se encuentra $InsertUserFile" -ForegroundColor Red
    exit 1
}

# Leer archivos
$MigrationSQL = Get-Content $MigrationFile -Raw
$InsertUserSQL = Get-Content $InsertUserFile -Raw

Write-Host "→ Archivos cargados correctamente" -ForegroundColor Green
Write-Host ""

# Función para ejecutar SQL en Supabase
function Invoke-SupabaseSQL {
    param(
        [string]$SQL,
        [string]$Description
    )
    
    Write-Host "→ Ejecutando: $Description..." -ForegroundColor Cyan
    
    try {
        $headers = @{
            "apikey" = $ServiceRoleKey
            "Authorization" = "Bearer $ServiceRoleKey"
            "Content-Type" = "application/x-www-form-urlencoded"
        }
        
        # Usar REST API para ejecutar SQL
        $response = Invoke-RestMethod `
            -Uri "$SupabaseUrl/rest/v1/rpc/exec" `
            -Method POST `
            -Headers $headers `
            -Body $SQL `
            -ErrorAction Stop
        
        Write-Host "  ✓ $Description completado`n" -ForegroundColor Green
        return $true
    }
    catch {
        $errorMessage = $_.Exception.Message
        $errorDetails = ""
        
        if ($_.ErrorDetails.Message) {
            try {
                $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json
                $errorDetails = $errorObj.message
            }
            catch {
                $errorDetails = $_.ErrorDetails.Message
            }
        }
        
        Write-Host "  ✗ Error en $Description`n" -ForegroundColor Red
        Write-Host "  Mensaje: $errorMessage" -ForegroundColor Yellow
        if ($errorDetails) {
            Write-Host "  Detalles: $errorDetails" -ForegroundColor Yellow
        }
        Write-Host ""
        
        # Si es un error de función no existe, intentar método alternativo
        if ($errorMessage -like "*function*does not exist*" -or $errorDetails -like "*function*does not exist*") {
            Write-Host "  ℹ La función exec no existe. Usa Supabase SQL Editor manual." -ForegroundColor Yellow
            return $false
        }
        
        return $false
    }
}

# Intentar ejecutar migración
Write-Host "PASO 1: Migración principal" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

$result1 = Invoke-SupabaseSQL -SQL $MigrationSQL -Description "Migración 001 - Security Foundation"

if (-not $result1) {
    Write-Host "No se puede ejecutar SQL directamente via API.`n" -ForegroundColor Yellow
    Write-Host "SOLUCIÓN: Ejecuta manualmente en Supabase SQL Editor:`n" -ForegroundColor Cyan
    Write-Host "1. Ve a: https://supabase.com/dashboard/project/jsqminbgggwhvkfgeibz/editor" -ForegroundColor White
    Write-Host "2. Copia y pega: supabase-migrations/001_platform_admin_security.sql" -ForegroundColor White
    Write-Host "3. Click en Run" -ForegroundColor White
    Write-Host "4. Copia y pega: scripts/insert-platform-user-admin3.sql" -ForegroundColor White
    Write-Host "5. Click en Run`n" -ForegroundColor White
    exit 1
}

Write-Host "PASO 2: Insertar usuario admin" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray
Write-Host ""

$result2 = Invoke-SupabaseSQL -SQL $InsertUserSQL -Description "Insertar platform_user admin3"

if ($result2) {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  ✓ MIGRACIÓN COMPLETADA" -ForegroundColor White
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usuario admin creado:" -ForegroundColor Cyan
    Write-Host "  Email:    admin3@bookfast.es" -ForegroundColor White
    Write-Host "  Password: Admin2024!" -ForegroundColor White
    Write-Host "  Rol:      super_admin" -ForegroundColor White
    Write-Host ""
    Write-Host "Siguiente paso:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor White
    Write-Host "  http://localhost:3001/login" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "No se pudo insertar el usuario automáticamente." -ForegroundColor Yellow
    Write-Host "Ejecuta manualmente: scripts/insert-platform-user-admin3.sql" -ForegroundColor Cyan
    Write-Host ""
}
