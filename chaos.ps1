#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                 MASTER CONTROL MODULE [QUANTUM-CORE]               ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Core controller for all CHAOSV3 platform functions                ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝
#=======================================================================

# Cross-platform compatibility layer ensuring script functionality on both 
# Windows and Linux systems through PowerShell Core

# Add scripts directory to PATH for this session
$env:PATH += ";$PSScriptRoot\scripts\windows"
$env:PATH += ";$PSScriptRoot\scripts\linux"

# Script Parameters
param (
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Target = "all",
    
    [switch]$Docker,
    [switch]$Dev,
    [switch]$Force
)

#=======================================================================
# CIPHER-X: Color and visual constants
#=======================================================================
$colors = @{
    Cyan = [ConsoleColor]::Cyan
    Magenta = [ConsoleColor]::Magenta
    Yellow = [ConsoleColor]::Yellow
    Green = [ConsoleColor]::Green
    Red = [ConsoleColor]::Red
    Blue = [ConsoleColor]::Blue
    Gray = [ConsoleColor]::Gray
    White = [ConsoleColor]::White
}

#=======================================================================
# CIPHER-X: Helper Functions
#=======================================================================
function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor $colors.Cyan
    Write-Host "  ║                  C.H.A.O.S.V3 CONTROL SYSTEM                      ║" -ForegroundColor $colors.Cyan
    Write-Host "  ╠════════════════════════════════════════════════════════════════════╣" -ForegroundColor $colors.Cyan
    Write-Host "  ║  Multi-platform controller for the CHAOSV3 ecosystem              ║" -ForegroundColor $colors.Cyan
    Write-Host "  ╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor $colors.Cyan
    Write-Host ""
}

function Show-Help {
    Write-Host "[?] Available commands:" -ForegroundColor $colors.Yellow
    Write-Host "    chaos start [all|backend|frontend|db]   - Start services" -ForegroundColor $colors.White
    Write-Host "    chaos stop [all|backend|frontend|db]    - Stop services" -ForegroundColor $colors.White
    Write-Host "    chaos restart [all|backend|frontend|db] - Restart services" -ForegroundColor $colors.White
    Write-Host "    chaos status                           - Show service status" -ForegroundColor $colors.White
    Write-Host "    chaos docker [build|up|down|logs]      - Manage Docker environment" -ForegroundColor $colors.White
    Write-Host "    chaos install                          - Install dependencies" -ForegroundColor $colors.White
    Write-Host "    chaos update                           - Update dependencies" -ForegroundColor $colors.White
    Write-Host "    chaos clean                            - Clean temporary files" -ForegroundColor $colors.White
    Write-Host "    chaos fix                              - Fix common issues" -ForegroundColor $colors.White
    Write-Host "    chaos init                             - Initialize environment" -ForegroundColor $colors.White
    Write-Host "    chaos test                             - Run tests" -ForegroundColor $colors.White
    Write-Host ""
    Write-Host "[?] Options:" -ForegroundColor $colors.Yellow
    Write-Host "    -Docker   - Use Docker for operations" -ForegroundColor $colors.White
    Write-Host "    -Dev      - Use development environment" -ForegroundColor $colors.White
    Write-Host "    -Force    - Force operation" -ForegroundColor $colors.White
    Write-Host ""
}

function Get-ServiceStatus {
    Write-Host "[i] Service Status:" -ForegroundColor $colors.Blue
    
    $mongoRunning = $false
    $backendRunning = $false
    $frontendRunning = $false
    
    if ($Docker) {
        # Check Docker container status
        $containers = docker ps --format "{{.Names}}" 2>$null
        
        $mongoRunning = $containers -contains "chaosv3-mongodb"
        $backendRunning = $containers -contains "chaosv3-backend"
        $frontendRunning = $containers -contains "chaosv3-frontend"
    }
    else {
        # Check ports for running services
        $mongoRunning = Test-NetConnection -ComputerName localhost -Port 27017 -InformationLevel Quiet -ErrorAction SilentlyContinue
        $backendRunning = Test-NetConnection -ComputerName localhost -Port 5000 -InformationLevel Quiet -ErrorAction SilentlyContinue
        $frontendRunning = Test-NetConnection -ComputerName localhost -Port 3000 -InformationLevel Quiet -ErrorAction SilentlyContinue
    }
    
    $status = @{
        "MongoDB" = @{ Running = $mongoRunning; Color = if ($mongoRunning) { $colors.Green } else { $colors.Red } }
        "Backend" = @{ Running = $backendRunning; Color = if ($backendRunning) { $colors.Green } else { $colors.Red } }
        "Frontend" = @{ Running = $frontendRunning; Color = if ($frontendRunning) { $colors.Green } else { $colors.Red } }
    }
    
    foreach ($service in $status.Keys) {
        $statusText = if ($status[$service].Running) { "RUNNING" } else { "STOPPED" }
        Write-Host "    $service : " -NoNewline
        Write-Host $statusText -ForegroundColor $status[$service].Color
    }
    
    Write-Host ""
}

function Start-DockerEnvironment {
    param (
        [string]$ServiceName = "all"
    )
    
    Write-Host "[+] Starting Docker environment..." -ForegroundColor $colors.Magenta
    
    # Ensure we're in the root directory
    Set-Location $PSScriptRoot
    
    if ($ServiceName -eq "all") {
        docker-compose up -d
    }
    else {
        docker-compose up -d $ServiceName
    }
    
    Write-Host "    ✓ Docker services started" -ForegroundColor $colors.Green
    Write-Host ""
    
    # Show URLs
    Write-Host "[i] Access URLs:" -ForegroundColor $colors.Blue
    Write-Host "    Frontend: http://localhost:3000" -ForegroundColor $colors.Green
    Write-Host "    Backend API: http://localhost:5000/api/v1" -ForegroundColor $colors.Green
    Write-Host "    Health Check: http://localhost:5000/health" -ForegroundColor $colors.Green
    Write-Host ""
}

function Stop-DockerEnvironment {
    param (
        [string]$ServiceName = "all"
    )
    
    Write-Host "[+] Stopping Docker environment..." -ForegroundColor $colors.Magenta
    
    # Ensure we're in the root directory
    Set-Location $PSScriptRoot
    
    if ($ServiceName -eq "all") {
        docker-compose down
    }
    else {
        docker-compose stop $ServiceName
    }
    
    Write-Host "    ✓ Docker services stopped" -ForegroundColor $colors.Green
    Write-Host ""
}

function Start-LocalBackend {
    Write-Host "[+] Starting Backend locally..." -ForegroundColor $colors.Magenta
    
    # Ensure we have correct imports for TypeScript path aliases
    $userModelPath = "$PSScriptRoot\backend\src\models\User.ts"
    $userModelContent = Get-Content -Path $userModelPath -Raw -ErrorAction SilentlyContinue
    if ($userModelContent -match "@shared/types") {
        $updatedContent = $userModelContent -replace "import \{ UserStatus \} from '@shared/types';", "import { UserStatus } from '../../../shared/types';"
        Set-Content -Path $userModelPath -Value $updatedContent
        Write-Host "    ✓ Fixed TypeScript imports" -ForegroundColor $colors.Green
    }
    
    # Start the backend
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\backend'; npm run dev"
    
    Write-Host "    ✓ Backend started in a new window" -ForegroundColor $colors.Green
    Write-Host "    Backend API: http://localhost:5000/api/v1" -ForegroundColor $colors.Green
    Write-Host ""
}

function Start-LocalFrontend {
    Write-Host "[+] Starting Frontend locally..." -ForegroundColor $colors.Magenta
    
    # Start the frontend
    Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\FRONTEND'; npm run dev"
    
    Write-Host "    ✓ Frontend started in a new window" -ForegroundColor $colors.Green
    Write-Host "    Frontend URL: http://localhost:3000" -ForegroundColor $colors.Green
    Write-Host ""
}

function Initialize-Environment {
    Write-Host "[+] Initializing environment..." -ForegroundColor $colors.Magenta
    
    # Create a .env file if it doesn't exist
    $envPath = "$PSScriptRoot\.env"
    if (-not (Test-Path $envPath)) {
        $envContent = @"
# CHAOSV3 Environment Configuration
JWT_SECRET=chaosv3_jwt_secret_replace_in_production
JWT_REFRESH_SECRET=chaosv3_refresh_secret_replace_in_production
MONGODB_URI=mongodb://localhost:27017/chaosv3
"@
        Set-Content -Path $envPath -Value $envContent
        Write-Host "    ✓ Created .env file" -ForegroundColor $colors.Green
    }
    
    # Install backend dependencies
    if (-not (Test-Path "$PSScriptRoot\backend\node_modules")) {
        Push-Location -Path "$PSScriptRoot\backend"
        npm install
        Pop-Location
        Write-Host "    ✓ Installed backend dependencies" -ForegroundColor $colors.Green
    }
    
    # Install frontend dependencies
    if (-not (Test-Path "$PSScriptRoot\FRONTEND\node_modules")) {
        Push-Location -Path "$PSScriptRoot\FRONTEND"
        npm install
        Pop-Location
        Write-Host "    ✓ Installed frontend dependencies" -ForegroundColor $colors.Green
    }
    
    Write-Host "    ✓ Environment initialized" -ForegroundColor $colors.Green
    Write-Host ""
}

function Fix-CommonIssues {
    Write-Host "[+] Fixing common issues..." -ForegroundColor $colors.Magenta
    
    # Fix TypeScript path aliases
    $files = @(
        "$PSScriptRoot\backend\src\models\User.ts",
        "$PSScriptRoot\backend\src\controllers\userController.ts",
        "$PSScriptRoot\backend\src\controllers\messageController.ts"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            $content = Get-Content -Path $file -Raw
            if ($content -match "@shared/types") {
                $updatedContent = $content -replace "import \{ .*? \} from '@shared/types';", "import { `$1 } from '../../../shared/types';"
                Set-Content -Path $file -Value $updatedContent
                Write-Host "    ✓ Fixed imports in $(Split-Path $file -Leaf)" -ForegroundColor $colors.Green
            }
        }
    }
    
    Write-Host "    ✓ Common issues fixed" -ForegroundColor $colors.Green
    Write-Host ""
}

#=======================================================================
# CIPHER-X: Main execution logic
#=======================================================================
Show-Banner

# Process commands
switch ($Command.ToLower()) {
    "help" {
        Show-Help
    }
    
    "start" {
        if ($Docker) {
            Start-DockerEnvironment -ServiceName $Target
        }
        else {
            if ($Target -eq "all" -or $Target -eq "backend") {
                Start-LocalBackend
            }
            if ($Target -eq "all" -or $Target -eq "frontend") {
                Start-LocalFrontend
            }
            if ($Target -eq "all" -or $Target -eq "db") {
                Write-Host "[!] MongoDB must be started separately or use -Docker option" -ForegroundColor $colors.Yellow
            }
        }
    }
    
    "stop" {
        if ($Docker) {
            Stop-DockerEnvironment -ServiceName $Target
        }
        else {
            Write-Host "[!] For local services, please close the terminal windows manually" -ForegroundColor $colors.Yellow
        }
    }
    
    "status" {
        Get-ServiceStatus
    }
    
    "docker" {
        switch ($Target.ToLower()) {
            "build" {
                Write-Host "[+] Building Docker images..." -ForegroundColor $colors.Magenta
                docker-compose build
            }
            
            "up" {
                Start-DockerEnvironment
            }
            
            "down" {
                Stop-DockerEnvironment
            }
            
            "logs" {
                Write-Host "[+] Showing Docker logs..." -ForegroundColor $colors.Magenta
                docker-compose logs -f
            }
            
            default {
                Write-Host "[!] Unknown Docker command: $Target" -ForegroundColor $colors.Red
                Write-Host "    Use: docker [build|up|down|logs]" -ForegroundColor $colors.Yellow
            }
        }
    }
    
    "install" {
        Initialize-Environment
    }
    
    "fix" {
        Fix-CommonIssues
    }
    
    "init" {
        Initialize-Environment
        Fix-CommonIssues
    }
    
    default {
        Write-Host "[!] Unknown command: $Command" -ForegroundColor $colors.Red
        Show-Help
    }
}
