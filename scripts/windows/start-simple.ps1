#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                 SIMPLIFIED LAUNCHER [QUANTUM-CORE]                 ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Simple terminal launcher for CHAOSV3 platform                     ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝
#=======================================================================

#=======================================================================
# CIPHER-X: SIMPLIFIED LAUNCH PROTOCOL
# Direct terminal commands with maximum compatibility
# Perfect for systems with script execution restrictions
#=======================================================================

# Get script directory
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path -Parent $scriptPath
Set-Location -Path $scriptDir

# Show banner
Write-Host ""
Write-Host "  ╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║                  C.H.A.O.S.V3 SIMPLE LAUNCHER                     ║" -ForegroundColor Cyan
Write-Host "  ╠════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "  ║  Launching backend and frontend in separate terminals...          ║" -ForegroundColor Cyan
Write-Host "  ╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Launch backend
Write-Host "[+] Starting Backend Server" -ForegroundColor Magenta
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\backend'; npm run dev"

# Wait a moment to stagger launches
Start-Sleep -Seconds 2

# Launch frontend
Write-Host "[+] Starting Frontend Server" -ForegroundColor Magenta
Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$scriptDir\FRONTEND'; npm run dev"

# Display URLs
Write-Host ""
Write-Host "[i] Access the application at:" -ForegroundColor Blue
Write-Host "    Frontend: http://localhost:3000" -ForegroundColor Green
Write-Host "    Backend API: http://localhost:5000/api/v1" -ForegroundColor Green
Write-Host ""
Write-Host "[i] Each server is running in its own terminal window" -ForegroundColor Blue
Write-Host "    Close those windows individually when you're finished" -ForegroundColor Blue
Write-Host ""

# Keep script open for a moment
Start-Sleep -Seconds 5
