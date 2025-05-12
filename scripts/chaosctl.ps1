#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                    CONTROL SYSTEM [QUANTUM-NEXUS]                  ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Universal controller for CHAOSV3 platform                         ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝
#=======================================================================

param (
    [Parameter(Position=0)]
    [string]$Command = "help",
    
    [Parameter(Position=1)]
    [string]$Target = "all",
    
    [switch]$Docker
)

# Root project directory (works regardless of where script is called from)
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path -Parent $scriptPath
$rootDir = (Get-Item $scriptDir).Parent.FullName

# Terminal colors for visual feedback
$colors = @{
    Cyan = [ConsoleColor]::Cyan
    Magenta = [ConsoleColor]::Magenta
    Yellow = [ConsoleColor]::Yellow
    Green = [ConsoleColor]::Green
    Red = [ConsoleColor]::Red
    Blue = [ConsoleColor]::Blue
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
    Write-Host "  ║  Universal controller for the CHAOSV3 ecosystem                   ║" -ForegroundColor $colors.Cyan
    Write-Host "  ╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor $colors.Cyan
    Write-Host ""
}

function Show-Help {
    Write-Host "[?] Available commands:" -ForegroundColor $colors.Yellow
    Write-Host "    chaosctl start [all|backend|frontend|db]  - Start services" -ForegroundColor White
    Write-Host "    chaosctl stop [all|backend|frontend|db]   - Stop services" -ForegroundColor White
    Write-Host "    chaosctl docker [build|up|down|logs]      - Docker operations" -ForegroundColor White
    Write-Host "    chaosctl fix                             - Fix common issues" -ForegroundColor White
    Write-Host "    chaosctl status                          - Show service status" -ForegroundColor White
    Write-Host ""
    Write-Host "[?] Options:" -ForegroundColor $colors.Yellow
    Write-Host "    -Docker   - Use Docker containers (recommended)" -ForegroundColor White
    Write-Host ""
    Write-Host "[i] Examples:" -ForegroundColor $colors.Blue
    Write-Host "    chaosctl start -Docker                   - Start all services in Docker" -ForegroundColor $colors.Green
    Write-Host "    chaosctl docker up                       - Start Docker environment" -ForegroundColor $colors.Green
    Write-Host ""
}

function Start-DockerServices {
    param (
        [string]$ServiceName = "all"
    )
    
    Write-Host "[+] Starting Docker environment..." -ForegroundColor $colors.Magenta
    
    # Navigate to root directory
    Set-Location -Path $rootDir
    
    if ($ServiceName -eq "all") {
        & docker-compose up -d
    }
    else {
        & docker-compose up -d $ServiceName
    }
    
    Write-Host "    ✓ Docker services started" -ForegroundColor $colors.Green
    Write-Host ""
    
    # Show access information
    Write-Host "[i] Access URLs:" -ForegroundColor $colors.Blue
    Write-Host "    Frontend: http://localhost:3000" -ForegroundColor $colors.Green
    Write-Host "    Backend API: http://localhost:5000/api/v1" -ForegroundColor $colors.Green
    Write-Host "    Health Check: http://localhost:5000/health" -ForegroundColor $colors.Green
    Write-Host ""
}

function Stop-DockerServices {
    param (
        [string]$ServiceName = "all"
    )
    
    Write-Host "[+] Stopping Docker environment..." -ForegroundColor $colors.Magenta
    
    # Navigate to root directory
    Set-Location -Path $rootDir
    
    if ($ServiceName -eq "all") {
        & docker-compose down
    }
    else {
        & docker-compose stop $ServiceName
    }
    
    Write-Host "    ✓ Docker services stopped" -ForegroundColor $colors.Green
    Write-Host ""
}

function Fix-TypeScriptImports {
    Write-Host "[+] Fixing TypeScript imports..." -ForegroundColor $colors.Magenta
    
    $files = @(
        "$rootDir\backend\src\models\User.ts",
        "$rootDir\backend\src\controllers\userController.ts",
        "$rootDir\backend\src\controllers\messageController.ts"
    )
    
    foreach ($file in $files) {
        if (Test-Path $file) {
            $content = Get-Content -Path $file -Raw
            if ($content -match "@shared/types") {
                $updatedContent = $content -replace "import \{ (.*?) \} from '@shared/types';", "import { `$1 } from '../../../shared/types';"
                Set-Content -Path $file -Value $updatedContent
                Write-Host "    ✓ Fixed imports in $(Split-Path $file -Leaf)" -ForegroundColor $colors.Green
            }
        }
    }
    
    Write-Host "    ✓ TypeScript imports fixed" -ForegroundColor $colors.Green
    Write-Host ""
}

function Start-LocalServices {
    param (
        [string]$ServiceName = "all"
    )
    
    if ($ServiceName -eq "all" -or $ServiceName -eq "backend") {
        Write-Host "[+] Starting Backend..." -ForegroundColor $colors.Magenta
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$rootDir\backend'; npm run dev"
        Write-Host "    ✓ Backend started in new window" -ForegroundColor $colors.Green
    }
    
    if ($ServiceName -eq "all" -or $ServiceName -eq "frontend") {
        Write-Host "[+] Starting Frontend..." -ForegroundColor $colors.Magenta
        Start-Process powershell.exe -ArgumentList "-NoExit", "-Command", "cd '$rootDir\FRONTEND'; npm run dev"
        Write-Host "    ✓ Frontend started in new window" -ForegroundColor $colors.Green
    }
    
    if ($ServiceName -eq "all" -or $ServiceName -eq "db") {
        Write-Host "[!] MongoDB must be running separately" -ForegroundColor $colors.Yellow
        Write-Host "    Consider using -Docker option for automatic MongoDB setup" -ForegroundColor $colors.Yellow
    }
    
    Write-Host ""
    Write-Host "[i] Access URLs:" -ForegroundColor $colors.Blue
    Write-Host "    Frontend: http://localhost:3000" -ForegroundColor $colors.Green
    Write-Host "    Backend API: http://localhost:5000/api/v1" -ForegroundColor $colors.Green
    Write-Host ""
}

function Get-ServiceStatus {
    Write-Host "[i] Checking service status..." -ForegroundColor $colors.Blue
    
    # Define port-to-service mapping
    $services = @{
        "MongoDB" = @{ Port = 27017; Running = $false }
        "Backend" = @{ Port = 5000; Running = $false }
        "Frontend" = @{ Port = 3000; Running = $false }
    }
    
    # Check if Docker is running these services
    $dockerContainers = docker ps --format "{{.Names}}" 2>$null
    $usingDocker = $dockerContainers -match "chaosv3"
    
    # Check each service
    foreach ($service in $services.Keys) {
        try {
            $port = $services[$service].Port
            $conn = New-Object System.Net.Sockets.TcpClient
            $conn.Connect("localhost", $port)
            $services[$service].Running = $conn.Connected
            $conn.Close()
        }
        catch {
            $services[$service].Running = $false
        }
        
        $statusText = if ($services[$service].Running) { "RUNNING" } else { "STOPPED" }
        $statusColor = if ($services[$service].Running) { $colors.Green } else { $colors.Red }
        
        Write-Host "    $service : " -NoNewline
        Write-Host $statusText -ForegroundColor $statusColor
    }
    
    # Show additional Docker info if relevant
    if ($usingDocker) {
        Write-Host ""
        Write-Host "    [Docker containers running]" -ForegroundColor $colors.Blue
    }
    
    Write-Host ""
}

#=======================================================================
# CIPHER-X: Main Execution Flow
#=======================================================================
Show-Banner

switch ($Command.ToLower()) {
    "help" {
        Show-Help
    }
    
    "start" {
        if ($Docker) {
            Start-DockerServices -ServiceName $Target
        }
        else {
            Fix-TypeScriptImports
            Start-LocalServices -ServiceName $Target
        }
    }
    
    "stop" {
        if ($Docker) {
            Stop-DockerServices -ServiceName $Target
        }
        else {
            Write-Host "[!] For local services, please close the terminal windows manually" -ForegroundColor $colors.Yellow
        }
    }
    
    "docker" {
        switch ($Target.ToLower()) {
            "build" {
                Write-Host "[+] Building Docker images..." -ForegroundColor $colors.Magenta
                Set-Location -Path $rootDir
                docker-compose build
            }
            
            "up" {
                Start-DockerServices
            }
            
            "down" {
                Stop-DockerServices
            }
            
            "logs" {
                Write-Host "[+] Displaying Docker logs..." -ForegroundColor $colors.Magenta
                Set-Location -Path $rootDir
                docker-compose logs -f
            }
            
            default {
                Write-Host "[!] Unknown Docker command: $Target" -ForegroundColor $colors.Red
                Write-Host "    Valid options: build, up, down, logs" -ForegroundColor $colors.Yellow
            }
        }
    }
    
    "fix" {
        Fix-TypeScriptImports
    }
    
    "status" {
        Get-ServiceStatus
    }
    
    default {
        Write-Host "[!] Unknown command: $Command" -ForegroundColor $colors.Red
        Show-Help
    }
}
