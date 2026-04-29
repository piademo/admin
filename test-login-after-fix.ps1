Write-Host "=== Probando login después de fix de permisos ===" -ForegroundColor Cyan

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
    Write-Host "`n✅ ¡LOGIN EXITOSO!" -ForegroundColor Green
    Write-Host "Email: $($response.user.email)" -ForegroundColor Green
    Write-Host "User ID: $($response.user.id)" -ForegroundColor Green
    Write-Host "Access Token (primeros 30 chars): $($response.access_token.Substring(0,30))..." -ForegroundColor Green
    Write-Host "`n🎉 El problema está resuelto. Ahora puedes hacer login en localhost:3001" -ForegroundColor Yellow
} catch {
    Write-Host "`n❌ Aún hay error:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    if ($_.ErrorDetails.Message) {
        $errorJson = $_.ErrorDetails.Message | ConvertFrom-Json
        Write-Host "Código: $($errorJson.code)" -ForegroundColor Yellow
        Write-Host "Mensaje: $($errorJson.msg)" -ForegroundColor Yellow
    }
    Write-Host "`n💡 Si el error persiste, contacta al soporte de Supabase" -ForegroundColor Cyan
}
