#!/usr/bin/env pwsh
#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                PROJECT INITIALIZER [GENESIS-PRIME]                  ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Cross-platform initialization script for the CHAOSV3 platform     ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝
#=======================================================================

# CIPHER-X: Color & Output Formatting
$ESC = [char]27
$CYAN = "$ESC[36m"
$GREEN = "$ESC[32m"
$YELLOW = "$ESC[33m"
$RED = "$ESC[31m"
$BOLD = "$ESC[1m"
$RESET = "$ESC[0m"

# CIPHER-X: Banner Display
function Show-Banner {
    Write-Host ""
    Write-Host "$CYAN$BOLD  ╔════════════════════════════════════════════════════════════════════╗$RESET"
    Write-Host "$CYAN$BOLD  ║                    C.H.A.O.S.V3 INITIALIZATION                      ║$RESET"
    Write-Host "$CYAN$BOLD  ╠════════════════════════════════════════════════════════════════════╣$RESET"
    Write-Host "$CYAN$BOLD  ║  Cross-platform Modern MSN-Inspired Chat Platform Setup            ║$RESET"
    Write-Host "$CYAN$BOLD  ║  Project & Docker Environment Initialization                       ║$RESET"
    Write-Host "$CYAN$BOLD  ╚════════════════════════════════════════════════════════════════════╝$RESET"
    Write-Host ""
}

# CIPHER-X: Step Completion Marker
function Mark-Step($stepText) {
    Write-Host "$GREEN$BOLD[✓]$RESET $stepText"
}

# CIPHER-X: Info Message Display
function Show-Info($infoText) {
    Write-Host "$CYAN$BOLD[i]$RESET $infoText"
}

# CIPHER-X: Warning Message Display
function Show-Warning($warningText) {
    Write-Host "$YELLOW$BOLD[!]$RESET $warningText"
}

# CIPHER-X: Error Message Display 
function Show-Error($errorText) {
    Write-Host "$RED$BOLD[x]$RESET $errorText"
}

# CIPHER-X: Check if Docker is installed
function Test-Docker {
    try {
        $dockerVersion = docker --version
        return $true
    } catch {
        return $false
    }
}

# CIPHER-X: Check if Node.js is installed
function Test-NodeJS {
    try {
        $nodeVersion = node --version
        return $true
    } catch {
        return $false
    }
}

# CIPHER-X: Clean up old build artifacts
function Clean-BuildArtifacts {
    Show-Info "Cleaning up build artifacts and temporary files..."
    
    # Attempt to remove node_modules directories
    try {
        Get-ChildItem -Path . -Include node_modules -Recurse -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path . -Include dist,build,.next,out -Recurse -Directory | Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
        Get-ChildItem -Path . -Include *.log,*.bak -Recurse -File | Remove-Item -Force -ErrorAction SilentlyContinue
        Mark-Step "Build artifacts cleaned up successfully"
    } catch {
        Show-Warning "Some files could not be removed. This is normal if they're in use."
    }
}

# CIPHER-X: Setup MongoDB using Docker
function Setup-MongoDB {
    Show-Info "Setting up MongoDB using Docker..."
    
    if (-not (Test-Docker)) {
        Show-Error "Docker is not installed or not in PATH. Please install Docker and try again."
        return $false
    }
    
    try {
        # Check if container already exists
        $containerExists = docker ps -a --filter "name=chaosv3-mongodb" --format "{{.Names}}" 
        
        if ($containerExists) {
            Show-Info "MongoDB container already exists. Starting it if not running..."
            docker start chaosv3-mongodb
        } else {
            Show-Info "Creating and starting new MongoDB container..."
            docker run -d --name chaosv3-mongodb -p 27017:27017 -v chaosv3-data:/data/db mongo:latest
        }
        
        # Wait for MongoDB to start
        Start-Sleep -Seconds 5
        
        # Check if MongoDB is running
        $isRunning = docker ps --filter "name=chaosv3-mongodb" --format "{{.Names}}"
        
        if ($isRunning) {
            Mark-Step "MongoDB is now running on localhost:27017"
            return $true
        } else {
            Show-Error "Failed to start MongoDB container"
            return $false
        }
    } catch {
        Show-Error "Error setting up MongoDB: $_"
        return $false
    }
}

# CIPHER-X: Install backend dependencies
function Install-BackendDependencies {
    Show-Info "Installing backend dependencies..."
    
    if (-not (Test-NodeJS)) {
        Show-Error "Node.js is not installed. Please install Node.js and try again."
        return $false
    }
    
    try {
        Push-Location backend
        npm install
        Pop-Location
        Mark-Step "Backend dependencies installed successfully"
        return $true
    } catch {
        Show-Error "Error installing backend dependencies: $_"
        return $false
    }
}

# CIPHER-X: Initialize frontend if it exists
function Install-FrontendDependencies {
    if (Test-Path -Path "frontend") {
        Show-Info "Installing frontend dependencies..."
        
        try {
            Push-Location frontend
            npm install
            Pop-Location
            Mark-Step "Frontend dependencies installed successfully"
            return $true
        } catch {
            Show-Error "Error installing frontend dependencies: $_"
            return $false
        }
    } else {
        Show-Warning "Frontend directory not found. Skipping frontend initialization."
        return $true
    }
}

# CIPHER-X: Main Execution
Show-Banner

$result = $true

# Clean up build artifacts
Clean-BuildArtifacts

# Setup MongoDB using Docker
$mongoResult = Setup-MongoDB
$result = $result -and $mongoResult

# Install backend dependencies
$backendResult = Install-BackendDependencies
$result = $result -and $backendResult

# Install frontend dependencies
$frontendResult = Install-FrontendDependencies
$result = $result -and $frontendResult

# Show final status
if ($result) {
    Write-Host ""
    Write-Host "$GREEN$BOLD  ╔════════════════════════════════════════════════════════════════════╗$RESET"
    Write-Host "$GREEN$BOLD  ║                    INITIALIZATION SUCCESSFUL                        ║$RESET"
    Write-Host "$GREEN$BOLD  ╚════════════════════════════════════════════════════════════════════╝$RESET"
    Write-Host ""
    Write-Host "  To start the backend server:  $CYAN cd backend && npm run dev $RESET"
    Write-Host "  MongoDB is running at:        $CYAN mongodb://localhost:27017/chaosv3 $RESET"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "$RED$BOLD  ╔════════════════════════════════════════════════════════════════════╗$RESET"
    Write-Host "$RED$BOLD  ║                    INITIALIZATION INCOMPLETE                        ║$RESET"
    Write-Host "$RED$BOLD  ╚════════════════════════════════════════════════════════════════════╝$RESET"
    Write-Host ""
    Write-Host "  Please review the errors above and try again."
    Write-Host ""
}
