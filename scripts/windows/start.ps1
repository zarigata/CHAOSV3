#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                 UNIFIED LAUNCH SYSTEM [QUANTUM-IGNITION]           ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  One-click startup for the entire CHAOSV3 platform                 ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝
#=======================================================================

# Check PowerShell version and execution policy
$PSVersion = $PSVersionTable.PSVersion
if ($PSVersion.Major -lt 5) {
    Write-Host "[x] PowerShell version $PSVersion detected. Version 5.0 or higher is recommended." -ForegroundColor Red
    Write-Host "    You may experience issues with this script. Consider upgrading PowerShell." -ForegroundColor Yellow
}

# Get the execution policy and provide guidance if it's restrictive
$execPolicy = Get-ExecutionPolicy
if ($execPolicy -eq "Restricted" -or $execPolicy -eq "AllSigned") {
    Write-Host "[!] Your current execution policy ($execPolicy) may prevent this script from running properly." -ForegroundColor Yellow
    Write-Host "    If you experience issues, try running PowerShell as Administrator and execute:" -ForegroundColor Yellow
    Write-Host "    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope Process" -ForegroundColor Cyan
}

# Ensure this script runs from its own directory regardless of where it's called from
$scriptPath = $MyInvocation.MyCommand.Path
$scriptDir = Split-Path -Parent $scriptPath
Set-Location -Path $scriptDir

# CIPHER-X: Color definitions for console output
$colors = @{
    Cyan = [ConsoleColor]::Cyan
    Green = [ConsoleColor]::Green
    Yellow = [ConsoleColor]::Yellow
    Red = [ConsoleColor]::Red
    Blue = [ConsoleColor]::Blue
    Purple = [ConsoleColor]::Magenta
    Reset = [ConsoleColor]::White
}

# CIPHER-X: Banner Display
function Show-Banner {
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════════════════════════════╗" -ForegroundColor $colors.Cyan
    Write-Host "  ║                  C.H.A.O.S.V3 QUANTUM LAUNCHER                     ║" -ForegroundColor $colors.Cyan
    Write-Host "  ╠════════════════════════════════════════════════════════════════════╣" -ForegroundColor $colors.Cyan
    Write-Host "  ║  One-click startup for the entire platform (Backend + Frontend)    ║" -ForegroundColor $colors.Cyan
    Write-Host "  ╚════════════════════════════════════════════════════════════════════╝" -ForegroundColor $colors.Cyan
    Write-Host ""
}

# CIPHER-X: Status message functions
function Mark-Step {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor $colors.Green
}

function Show-Info {
    param([string]$Message)
    Write-Host "[i] $Message" -ForegroundColor $colors.Blue
}

function Show-Warning {
    param([string]$Message)
    Write-Host "[!] $Message" -ForegroundColor $colors.Yellow
}

function Show-Error {
    param([string]$Message)
    Write-Host "[x] $Message" -ForegroundColor $colors.Red
}

function Log-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "[+] $Title" -ForegroundColor $colors.Purple
    Write-Host "    --------------------------------------------------" -ForegroundColor $colors.Purple
}

# CIPHER-X: Setup environment vars, create .env files if needed
function Setup-Environment {
    Log-Section "Setting Up Environment"
    
    # Check if backend .env exists
    if (-not (Test-Path ".\backend\.env")) {
        Show-Info "Creating backend .env file from .env.example..."
        if (Test-Path ".\env.example") {
            Copy-Item ".\env.example" ".\backend\.env" -Force
            Mark-Step "Created backend .env file"
        } else {
            Show-Warning "Could not find .env.example, creating minimal .env file"
            @"
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chaosv3
JWT_SECRET=chaosv3_secure_jwt_secret
JWT_REFRESH_SECRET=chaosv3_secure_refresh_token_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
"@ | Out-File ".\backend\.env" -Encoding utf8
            Mark-Step "Created minimal backend .env file"
        }
    } else {
        Mark-Step "Backend .env file already exists"
    }
    
    # Check if frontend .env.local exists
    if (-not (Test-Path ".\FRONTEND\.env.local")) {
        Show-Info "Creating frontend .env.local file..."
        @"
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
"@ | Out-File ".\FRONTEND\.env.local" -Encoding utf8
        Mark-Step "Created frontend .env.local file"
    } else {
        Mark-Step "Frontend .env.local file already exists"
    }
}

# CIPHER-X: Check for Node.js and NPM
function Check-Dependencies {
    Log-Section "Checking Required Dependencies"
    
    try {
        $nodeVersion = node -v
        Mark-Step "Node.js $nodeVersion is installed"
    } catch {
        Show-Error "Node.js is required but not installed"
        exit 1
    }
    
    try {
        $npmVersion = npm -v
        Mark-Step "NPM $npmVersion is installed"
    } catch {
        Show-Error "NPM is required but not installed"
        exit 1
    }
}

# CIPHER-X: Start backend server
function Start-Backend {
    Log-Section "Starting Backend Server"
    
    # Navigate to backend directory
    Push-Location -Path ".\backend"
    
    # Check if node_modules exists, otherwise install dependencies
    if (-not (Test-Path ".\node_modules")) {
        Show-Info "Installing backend dependencies..."
        npm install
    }
    
    # Check if dist exists, otherwise build
    if (-not (Test-Path ".\dist")) {
        Show-Info "Building backend..."
        npm run build
    }
    
    # Start backend in a new window with error handling
    Show-Info "Starting backend server (development mode)..."
    try {
        $backendJob = Start-Process -FilePath "npm" -ArgumentList "run dev" -WindowStyle Normal -PassThru -ErrorAction Stop
        if ($backendJob) {
            Mark-Step "Backend server started (PID: $($backendJob.Id))"
        } else {
            Show-Warning "Backend server started but could not capture process information"
        }
    } catch {
        Show-Error "Failed to start backend server: $_"
        Show-Info "Attempting to start with alternative method..."
        # Alternative method using direct command
        $backendJob = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd $PWD && npm run dev" -WindowStyle Normal -PassThru
        if ($backendJob) {
            Mark-Step "Backend server started with alternative method (PID: $($backendJob.Id))"
        } else {
            Show-Error "Could not start backend server. Please run manually: 'cd backend && npm run dev'"
        }
    }
    
    # Return to root directory
    Pop-Location
    
    return $backendJob
}

# CIPHER-X: Start frontend server
function Start-Frontend {
    Log-Section "Starting Frontend Server"
    
    # Navigate to frontend directory
    Push-Location -Path ".\FRONTEND"
    
    # Check if node_modules exists, otherwise install dependencies
    if (-not (Test-Path ".\node_modules")) {
        Show-Info "Installing frontend dependencies..."
        npm install
    }
    
    # Start frontend in a new window with error handling
    Show-Info "Starting frontend development server..."
    try {
        $frontendJob = Start-Process -FilePath "npm" -ArgumentList "run dev" -WindowStyle Normal -PassThru -ErrorAction Stop
        if ($frontendJob) {
            Mark-Step "Frontend server started (PID: $($frontendJob.Id))"
        } else {
            Show-Warning "Frontend server started but could not capture process information"
        }
    } catch {
        Show-Error "Failed to start frontend server: $_"
        Show-Info "Attempting to start with alternative method..."
        # Alternative method using direct command
        $frontendJob = Start-Process -FilePath "cmd.exe" -ArgumentList "/c cd $PWD && npm run dev" -WindowStyle Normal -PassThru
        if ($frontendJob) {
            Mark-Step "Frontend server started with alternative method (PID: $($frontendJob.Id))"
        } else {
            Show-Error "Could not start frontend server. Please run manually: 'cd FRONTEND && npm run dev'"
        }
    }
    
    # Return to root directory
    Pop-Location
    
    return $frontendJob
}

# CIPHER-X: Display system URLs
function Show-URLs {
    Log-Section "Access CHAOSV3 Platform"
    
    Write-Host "Frontend: " -ForegroundColor $colors.Green -NoNewline
    Write-Host "http://localhost:3000" -ForegroundColor $colors.Reset
    
    Write-Host "Backend API: " -ForegroundColor $colors.Blue -NoNewline
    Write-Host "http://localhost:5000/api/v1" -ForegroundColor $colors.Reset
    
    Write-Host "Health Check: " -ForegroundColor $colors.Yellow -NoNewline
    Write-Host "http://localhost:5000/health" -ForegroundColor $colors.Reset
    
    Write-Host ""
    Write-Host "Press " -NoNewline
    Write-Host "Ctrl+C" -ForegroundColor $colors.Red -NoNewline
    Write-Host " to stop the script, but servers will continue running in their own windows."
}

# CIPHER-X: Main execution flow
try {
    # Track success/failure of each component
    $backendSuccess = $false
    $frontendSuccess = $false

    Show-Banner
    Check-Dependencies
    Setup-Environment

    # Start services with proper error handling
    $backendJob = Start-Backend
    if ($backendJob) { $backendSuccess = $true }

    $frontendJob = Start-Frontend
    if ($frontendJob) { $frontendSuccess = $true }

    # Only show URLs if at least one component started
    if ($backendSuccess -or $frontendSuccess) {
        Show-URLs
    } else {
        Write-Host ""
        Write-Host "[!] No services could be started automatically. Please check the error messages above." -ForegroundColor Red
        Write-Host "    You may need to start the services manually:" -ForegroundColor Yellow
        Write-Host "    1. Open a terminal in the 'backend' folder and run: npm run dev" -ForegroundColor Cyan
        Write-Host "    2. Open another terminal in the 'FRONTEND' folder and run: npm run dev" -ForegroundColor Cyan
    }
} catch {
    Write-Host ""
    Write-Host "[x] An unexpected error occurred: $_" -ForegroundColor Red
    Write-Host "    Please report this issue with the details above." -ForegroundColor Red
}

# CIPHER-X: Keep PowerShell open to show status
Write-Host ""
Write-Host "Servers are running. This window will stay open to monitor status."
Write-Host "Close this window when you're done using CHAOSV3."

try {
    while ($true) {
        Start-Sleep -Seconds 1
        
        # Check if either job has stopped
        if ($backendJob -and $backendJob.HasExited) {
            Show-Warning "Backend server has stopped unexpectedly!"
        }
        
        if ($frontendJob -and $frontendJob.HasExited) {
            Show-Warning "Frontend server has stopped unexpectedly!"
        }
    }
} finally {
    Write-Host ""
    Log-Section "CHAOSV3 Monitor Stopped"
    Write-Host "Server processes will continue running in their own windows."
    Write-Host "You may need to manually close them when done."
}
