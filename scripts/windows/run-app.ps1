#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                 DIRECT LAUNCHER [QUANTUM-CORE]                     ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Direct command launcher for CHAOSV3 platform                      ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝
#=======================================================================

# Get script directory and ensure we're in it
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path -Parent $scriptPath
Set-Location -Path $scriptDir

# CODEX: Banner Display
Write-Host ""
Write-Host "  ╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║                  C.H.A.O.S.V3 DIRECT LAUNCHER                     ║" -ForegroundColor Cyan
Write-Host "  ╠════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "  ║  Starting backend service directly...                             ║" -ForegroundColor Cyan
Write-Host "  ╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Fix the type imports before running
$userModelPath = "$scriptDir\backend\src\models\User.ts"
Write-Host "[+] Updating TypeScript imports..." -ForegroundColor Magenta
$userModelContent = Get-Content -Path $userModelPath -Raw -ErrorAction SilentlyContinue
if ($userModelContent -match "@shared/types") {
    $updatedContent = $userModelContent -replace "import \{ UserStatus \} from '@shared/types';", "import { UserStatus } from '../../../shared/types';"
    Set-Content -Path $userModelPath -Value $updatedContent
    Write-Host "    ✓ Fixed User.ts imports" -ForegroundColor Green
} else {
    Write-Host "    ✓ User.ts imports already fixed" -ForegroundColor Green
}

# Start backend directly 
Write-Host ""
Write-Host "[+] Starting Backend Server" -ForegroundColor Magenta
Write-Host "    This will take a moment..." -ForegroundColor White

# Navigate to backend directory
Push-Location -Path "$scriptDir\backend"

Write-Host ""
Write-Host "    Access URLs:" -ForegroundColor Yellow
Write-Host "    Backend API: http://localhost:5000/api/v1" -ForegroundColor Green
Write-Host "    Health Check: http://localhost:5000/health" -ForegroundColor Green
Write-Host ""
Write-Host "    Press Ctrl+C to stop the server when finished" -ForegroundColor Yellow
Write-Host ""

# Run the backend directly
npm run dev
