# Test 1: Verificar si la anon key funciona
Write-Host "=== TEST 1: Probando login con curl ===" -ForegroundColor Cyan

$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcW1pbmJnZ2d3aHZrZmdlaWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjI2NDMsImV4cCI6MjA3ODQzODY0M30.IKpcREfE0cHsh0PxcFqzWIKkWVnCMSrHzOxeZDs38qU"
$url = "https://jsqminbgggwhvkfgeibz.supabase.co/auth/v1/token?grant_type=password"

$headers = @{
    "apikey" = $anonKey
    "Content-Type" = "application/json"
}

$body = @{
    email = "admin@bookfast.es"
    password = "Admin2024!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "✅ LOGIN EXITOSO!" -ForegroundColor Green
    Write-Host "Access Token (primeros 50 chars): $($response.access_token.Substring(0,50))..." -ForegroundColor Green
    Write-Host "Email: $($response.user.email)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR EN LOGIN:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}

Write-Host "`n=== TEST 2: Verificando service_role key ===" -ForegroundColor Cyan

$serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcW1pbmJnZ2d3aHZrZmdlaWJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjg2MjY0MywiZXhwIjoyMDc4NDM4NjQzfQ.uKFhaqJQlccvwO4UvttO0orcInECcc6fO8z9Ze9YhG8"
$adminUrl = "https://jsqminbgggwhvkfgeibz.supabase.co/auth/v1/admin/users"

$adminHeaders = @{
    "apikey" = $serviceKey
    "Authorization" = "Bearer $serviceKey"
}

try {
    $response = Invoke-RestMethod -Uri $adminUrl -Method GET -Headers $adminHeaders
    Write-Host "✅ SERVICE_ROLE KEY FUNCIONA!" -ForegroundColor Green
    Write-Host "Usuarios encontrados: $($response.users.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ ERROR CON SERVICE_ROLE KEY:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
}
