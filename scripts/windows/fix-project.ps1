#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                PROJECT FIX UTILITY [REPAIR-MATRIX]                 ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Fix common dependency and module resolution issues                ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝
#=======================================================================

# Get script directory
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path -Parent $scriptPath
Set-Location -Path $scriptDir

# Show banner
Write-Host ""
Write-Host "  ╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "  ║                  C.H.A.O.S.V3 PROJECT REPAIR                      ║" -ForegroundColor Cyan
Write-Host "  ╠════════════════════════════════════════════════════════════════════╣" -ForegroundColor Cyan
Write-Host "  ║  Fixing dependency and module resolution issues...                ║" -ForegroundColor Cyan
Write-Host "  ╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

#=======================================================================
# Fix Frontend Dependencies
#=======================================================================
Write-Host "[+] Fixing Frontend Dependencies" -ForegroundColor Magenta
Write-Host "    Installing Next.js and other frontend dependencies..." -ForegroundColor White

# Navigate to frontend directory
Push-Location -Path "$scriptDir\FRONTEND"

# Install dependencies
Write-Host "    Running npm install in frontend directory..." -ForegroundColor Gray
npm install

# Return to root directory
Pop-Location
Write-Host "    ✓ Frontend dependencies fixed" -ForegroundColor Green

#=======================================================================
# Fix Backend TypeScript Path Resolution
#=======================================================================
Write-Host ""
Write-Host "[+] Fixing Backend Type Resolution" -ForegroundColor Magenta

# Modify the import statement in User.ts to use relative path instead of path alias
$userModelPath = "$scriptDir\backend\src\models\User.ts"
Write-Host "    Updating import path in $userModelPath..." -ForegroundColor White

$userModelContent = Get-Content -Path $userModelPath -Raw
$updatedContent = $userModelContent -replace "import \{ UserStatus \} from '@shared/types';", "import { UserStatus } from '../../../shared/types';"
Set-Content -Path $userModelPath -Value $updatedContent

# Do the same for messageController.ts
$messageControllerPath = "$scriptDir\backend\src\controllers\messageController.ts"
if (Test-Path $messageControllerPath) {
    Write-Host "    Updating import path in $messageControllerPath..." -ForegroundColor White
    
    $messageControllerContent = Get-Content -Path $messageControllerPath -Raw
    $updatedMessageContent = $messageControllerContent -replace "import \{ SocketEvent \} from '@shared/types';", "import { SocketEvent } from '../../../shared/types';"
    Set-Content -Path $messageControllerPath -Value $updatedMessageContent
}

# Do the same for userController.ts
$userControllerPath = "$scriptDir\backend\src\controllers\userController.ts"
if (Test-Path $userControllerPath) {
    Write-Host "    Updating import path in $userControllerPath..." -ForegroundColor White
    
    $userControllerContent = Get-Content -Path $userControllerPath -Raw
    $updatedUserContent = $userControllerContent -replace "import \{ UserStatus \} from '@shared/types';", "import { UserStatus } from '../../../shared/types';"
    Set-Content -Path $userControllerPath -Value $updatedUserContent
}

Write-Host "    ✓ Backend type resolution fixed" -ForegroundColor Green

# Install backend dependencies
Write-Host ""
Write-Host "[+] Installing Backend Dependencies" -ForegroundColor Magenta

# Navigate to backend directory
Push-Location -Path "$scriptDir\backend"

# Install dependencies
Write-Host "    Running npm install in backend directory..." -ForegroundColor Gray
npm install

# Return to root directory
Pop-Location
Write-Host "    ✓ Backend dependencies installed" -ForegroundColor Green

#=======================================================================
# Summary
#=======================================================================
Write-Host ""
Write-Host "[+] Repair Complete" -ForegroundColor Green
Write-Host "    The project has been fixed and should now run correctly."
Write-Host "    Please use the start-simple.ps1 script to launch the application."
Write-Host ""
Write-Host "    To start the application, run: ./start-simple.ps1" -ForegroundColor Yellow
Write-Host ""

# Pause to let user read the summary
Start-Sleep -Seconds 2
