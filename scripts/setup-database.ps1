# ============================================================================
# Setup Database - BookFast Admin Panel
# ============================================================================
# Este script ejecuta automáticamente las migraciones en Supabase
# ============================================================================

param(
    [string]$SupabaseUrl = "https://jsqminbgggwhvkfgeibz.supabase.co",
    [string]$ServiceRoleKey = $env:SUPABASE_SERVICE_ROLE_KEY
)

Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  BOOKFAST ADMIN - DATABASE SETUP" -ForegroundColor White
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Verificar service role key
if ([string]::IsNullOrEmpty($ServiceRoleKey)) {
    Write-Host "ERROR: SUPABASE_SERVICE_ROLE_KEY no está configurada" -ForegroundColor Red
    Write-Host ""
    Write-Host "Configúrala así:" -ForegroundColor Yellow
    Write-Host '  $env:SUPABASE_SERVICE_ROLE_KEY = "tu-service-role-key"' -ForegroundColor White
    Write-Host ""
    Write-Host "O pásala como parámetro:" -ForegroundColor Yellow
    Write-Host '  .\setup-database.ps1 -ServiceRoleKey "tu-key"' -ForegroundColor White
    Write-Host ""
    exit 1
}

# Leer archivos SQL
$migrationFile = Join-Path $PSScriptRoot "..\supabase-migrations\001_platform_admin_security.sql"
$insertUserFile = Join-Path $PSScriptRoot "insert-platform-user-admin3.sql"

if (-not (Test-Path $migrationFile)) {
    Write-Host "ERROR: No se encuentra $migrationFile" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $insertUserFile)) {
    Write-Host "ERROR: No se encuentra $insertUserFile" -ForegroundColor Red
    exit 1
}

$migration = Get-Content $migrationFile -Raw
$insertUser = Get-Content $insertUserFile -Raw

# Headers para API
$headers = @{
    "apikey" = $ServiceRoleKey
    "Authorization" = "Bearer $ServiceRoleKey"
    "Content-Type" = "application/json"
    "Prefer" = "return=representation"
}

# Función para ejecutar SQL
function Invoke-SupabaseSQL {
    param([string]$SQL, [string]$Description)
    
    Write-Host "→ Ejecutando: $Description" -ForegroundColor Cyan
    
    $body = @{
        query = $SQL
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod `
            -Uri "$SupabaseUrl/rest/v1/rpc/exec_sql" `
            -Method POST `
            -Headers $headers `
            -Body $body `
            -ErrorAction Stop
        
        Write-Host "  ✓ $Description completado" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ✗ Error en $Description" -ForegroundColor Red
        Write-Host "  $($_.Exception.Message)" -ForegroundColor Yellow
        
        if ($_.ErrorDetails.Message) {
            Write-Host "  $($_.ErrorDetails.Message)" -ForegroundColor Yellow
        }
        
        return $false
    }
}

# Ejecutar migraciones
Write-Host ""
Write-Host "PASO 1: Ejecutar migración principal" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

if (-not (Invoke-SupabaseSQL -SQL $migration -Description "Migración 001 - Security Foundation")) {
    Write-Host ""
    Write-Host "ERROR: La migración falló. Revisa los errores arriba." -ForegroundColor Red
    Write-Host ""
    Write-Host "TIP: Si ya ejecutaste la migración antes, es normal que falle." -ForegroundColor Yellow
    Write-Host "     Continúa con el siguiente paso." -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "PASO 2: Insertar usuario admin3" -ForegroundColor Yellow
Write-Host "----------------------------------------" -ForegroundColor Gray

if (Invoke-SupabaseSQL -SQL $insertUser -Description "Insertar platform_user admin3") {
    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  ✓ BASE DE DATOS CONFIGURADA" -ForegroundColor White
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Usuario admin creado:" -ForegroundColor Cyan
    Write-Host "  Email:    admin3@bookfast.es" -ForegroundColor White
    Write-Host "  Password: Admin2024!" -ForegroundColor White
    Write-Host "  Rol:      super_admin" -ForegroundColor White
    Write-Host ""
    Write-Host "Ahora puedes:" -ForegroundColor Yellow
    Write-Host "  1. Ir a http://localhost:3001/login" -ForegroundColor White
    Write-Host "  2. Login con las credenciales de arriba" -ForegroundColor White
    Write-Host "  3. Configurar MFA desde el dashboard" -ForegroundColor White
    Write-Host ""
}
else {
    Write-Host ""
    Write-Host "ERROR: No se pudo insertar el usuario" -ForegroundColor Red
    Write-Host ""
    Write-Host "Opciones:" -ForegroundColor Yellow
    Write-Host "  1. Ejecuta manualmente en Supabase SQL Editor:" -ForegroundColor White
    Write-Host "     $insertUserFile" -ForegroundColor Gray
    Write-Host ""
    Write-Host "  2. O verifica si el usuario ya existe:" -ForegroundColor White
    Write-Host "     SELECT * FROM platform.platform_users WHERE email = 'admin3@bookfast.es';" -ForegroundColor Gray
    Write-Host ""
}
