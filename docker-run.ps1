#!/usr/bin/env pwsh
#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║            DOCKER DEPLOYMENT SCRIPT [NEXUS-GATEWAY-117]            ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Automated Docker deployment for the complete CHAOSV3 platform     ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Cross-Platform Compatible with PowerShell 7.x+                    ║
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
    Write-Host "$CYAN$BOLD  ║                C.H.A.O.S.V3 DOCKER DEPLOYMENT                       ║$RESET"
    Write-Host "$CYAN$BOLD  ╠════════════════════════════════════════════════════════════════════╣$RESET"
    Write-Host "$CYAN$BOLD  ║  Cross-platform Modern MSN-Inspired Chat Platform Deployment       ║$RESET"
    Write-Host "$CYAN$BOLD  ║  Complete Docker Environment: MongoDB + Backend + Frontend         ║$RESET"
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

# CIPHER-X: Validate required files exist
function Test-RequiredFiles {
    $backendDockerfile = Test-Path -Path "backend/Dockerfile"
    $frontendDockerfile = Test-Path -Path "FRONTEND/Dockerfile"
    $dockerCompose = Test-Path -Path "docker-compose.yml"
    
    return $backendDockerfile -and $frontendDockerfile -and $dockerCompose
}

# CIPHER-X: Create JWT secrets if not present
function Ensure-JWTSecrets {
    Show-Info "Checking JWT secrets..."
    
    # Check for existing .env.docker file
    if (-not (Test-Path -Path ".env.docker")) {
        Show-Info "Creating .env.docker with secure JWT secrets..."
        $jwtSecret = -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        $jwtRefreshSecret = -join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object {[char]$_})
        
        @"
# Docker Environment Variables
JWT_SECRET=$jwtSecret
JWT_REFRESH_SECRET=$jwtRefreshSecret
"@ | Out-File -FilePath ".env.docker" -Encoding utf8
        
        Mark-Step "Created .env.docker with secure JWT secrets"
    } else {
        Mark-Step "Found existing .env.docker file"
    }
}

# CIPHER-X: Main Function for Deploying with Docker
function Deploy-ChaosV3 {
    Show-Banner
    
    # Check for Docker
    if (-not (Test-Docker)) {
        Show-Error "Docker is not installed or not running! Please install Docker Desktop and try again."
        return
    }
    Mark-Step "Docker is installed and running"
    
    # Check for required files
    if (-not (Test-RequiredFiles)) {
        Show-Error "Required Docker files not found! Please ensure all Dockerfiles and docker-compose.yml are present."
        return
    }
    Mark-Step "All required Docker files present"
    
    # Ensure JWT secrets are set
    Ensure-JWTSecrets
    
    # Start the deployment
    Show-Info "Starting C.H.A.O.S.V3 deployment with Docker Compose..."
    
    try {
        # Ensure we're using the right environment file
        $env:COMPOSE_DOCKER_CLI_BUILD = 1
        $env:DOCKER_BUILDKIT = 1
        
        # Build and start the containers
        docker-compose --env-file .env.docker up -d --build
        
        if ($LASTEXITCODE -eq 0) {
            Show-Info "Waiting for services to start up completely..."
            Start-Sleep -Seconds 10
            
            # Display running containers
            docker-compose ps
            
            Write-Host ""
            Write-Host "$GREEN$BOLD  ╔════════════════════════════════════════════════════════════════════╗$RESET"
            Write-Host "$GREEN$BOLD  ║                     DEPLOYMENT SUCCESSFUL                          ║$RESET"
            Write-Host "$GREEN$BOLD  ╚════════════════════════════════════════════════════════════════════╝$RESET"
            Write-Host ""
            Write-Host "  Frontend URL:         $CYAN http://localhost:3000 $RESET"
            Write-Host "  Backend API:          $CYAN http://localhost:5000/api/v1 $RESET"
            Write-Host "  Test Diagnostics:     $CYAN http://localhost:3000/test $RESET"
            Write-Host ""
            Write-Host "  To stop the services: $CYAN docker-compose down $RESET"
            Write-Host ""
        } else {
            Show-Error "Docker Compose deployment failed. Check the error messages above."
        }
    } catch {
        Show-Error "An error occurred during deployment: $_"
    }
}

# OMEGA-MATRIX: Execute main function
Deploy-ChaosV3
