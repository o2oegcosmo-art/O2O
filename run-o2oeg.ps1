# O2OEG MASTER LAUNCH CONTROL
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "🚀 O2OEG AI-FIRST SAAS PLATFORM" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan

# 1. Check Database (MySQL)
Write-Host "[*] Checking Database (MySQL Port 3306)..." -ForegroundColor Gray
$dbCheck = netstat -ano | findstr :3306
if ($dbCheck -like "*LISTENING*") {
    Write-Host "[OK] Database is RUNNING." -ForegroundColor Green
} else {
    Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
    Write-Host "⚠️ [CRITICAL] DATABASE IS NOT RUNNING!" -ForegroundColor Red
    Write-Host "Please START LARAGON before continuing." -ForegroundColor Yellow
    Write-Host "!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!" -ForegroundColor Red
    Read-Host "Press Enter to try continuing anyway (Errors may occur)..."
}

# 2. Check Backend Environment
Write-Host "[*] Checking Backend..." -ForegroundColor Gray
if (Test-Path "backend\.env") {
    Write-Host "[OK] .env file found." -ForegroundColor Green
} else {
    Write-Host "[ERR] .env file missing in backend folder!" -ForegroundColor Red
    exit
}

# 2. Start Processes in New Windows
Write-Host "[*] Launching Backend Server (Port 8000)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; php artisan serve"

Write-Host "[*] Launching Frontend Development (Vite)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "[*] Launching AI Queue Worker (Redis)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; php artisan queue:listen"

Write-Host "[*] Launching WhatsApp Bridge (Node.js)..." -ForegroundColor Magenta
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd whatsapp-bridge; node index.js"

Write-Host "------------------------------------------"
Write-Host "✅ ALL SYSTEMS GO!" -ForegroundColor Green
Write-Host "Backend: http://localhost:8000"
Write-Host "Frontend: http://localhost:5173 (Check console for port)"
Write-Host "------------------------------------------"
Write-Host "Press any key to close this controller (services will keep running)."
Read-Host
