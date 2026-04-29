# Script para verificar si el nuevo usuario funciona
Write-Host "=== Instrucciones para crear usuario admin ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Ve a Supabase Dashboard -> Authentication -> Users" -ForegroundColor Cyan
Write-Host "2. Haz clic en 'Add user'" -ForegroundColor Cyan
Write-Host "3. Ingresa los siguientes datos:" -ForegroundColor Cyan
Write-Host "   - Email: admin3@bookfast.es" -ForegroundColor White
Write-Host "   - Password: Admin2024!" -ForegroundColor White
Write-Host "   - ✓ Marca 'Auto Confirm User'" -ForegroundColor Green
Write-Host "4. Clic en 'Create user'" -ForegroundColor Cyan
Write-Host ""
Write-Host "5. Copia el UUID del usuario creado" -ForegroundColor Cyan
Write-Host "6. Ve a SQL Editor y ejecuta:" -ForegroundColor Cyan
Write-Host ""
Write-Host "INSERT INTO platform_users (id, email, role, full_name)" -ForegroundColor Magenta
Write-Host "SELECT id, email, 'admin', 'Admin BookFast'" -ForegroundColor Magenta
Write-Host "FROM auth.users" -ForegroundColor Magenta
Write-Host "WHERE email = 'admin3@bookfast.es';" -ForegroundColor Magenta
Write-Host ""
Write-Host "7. Luego ejecuta este script para probar:" -ForegroundColor Cyan
Write-Host "   powershell -ExecutionPolicy Bypass -File test-new-user.ps1" -ForegroundColor White
Write-Host ""

Read-Host "Presiona Enter cuando hayas completado los pasos anteriores"

Write-Host "`n=== Probando login con nuevo usuario ===" -ForegroundColor Cyan

$anonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpzcW1pbmJnZ2d3aHZrZmdlaWJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI4NjI2NDMsImV4cCI6MjA3ODQzODY0M30.IKpcREfE0cHsh0PxcFqzWIKkWVnCMSrHzOxeZDs38qU"
$url = "https://jsqminbgggwhvkfgeibz.supabase.co/auth/v1/token?grant_type=password"

$headers = @{
    "apikey" = $anonKey
    "Content-Type" = "application/json"
}

$body = @{
    email = "admin3@bookfast.es"
    password = "Admin2024!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri $url -Method POST -Headers $headers -Body $body
    Write-Host "`n✅ ¡LOGIN EXITOSO!" -ForegroundColor Green
    Write-Host "Email: $($response.user.email)" -ForegroundColor Green
    Write-Host "User ID: $($response.user.id)" -ForegroundColor Green
    Write-Host "`n🎉 Ahora puedes hacer login en localhost:3001 con:" -ForegroundColor Yellow
    Write-Host "   Email: admin3@bookfast.es" -ForegroundColor White
    Write-Host "   Password: Admin2024!" -ForegroundColor White
} catch {
    Write-Host "`n❌ Error en login:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        Write-Host "Detalles: $($_.ErrorDetails.Message)" -ForegroundColor Yellow
    }
}
