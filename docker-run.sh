#!/bin/bash
#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║            DOCKER DEPLOYMENT SCRIPT [NEXUS-GATEWAY-117]            ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Automated Docker deployment for the complete CHAOSV3 platform     ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Cross-Platform Compatible with Linux/macOS                        ║
# ╚════════════════════════════════════════════════════════════════════╝
#=======================================================================

# CIPHER-X: Color & Output Formatting
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BOLD='\033[1m'
RESET='\033[0m'

# CIPHER-X: Banner Display
show_banner() {
    echo ""
    echo -e "${CYAN}${BOLD}  ╔════════════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${CYAN}${BOLD}  ║                C.H.A.O.S.V3 DOCKER DEPLOYMENT                       ║${RESET}"
    echo -e "${CYAN}${BOLD}  ╠════════════════════════════════════════════════════════════════════╣${RESET}"
    echo -e "${CYAN}${BOLD}  ║  Cross-platform Modern MSN-Inspired Chat Platform Deployment       ║${RESET}"
    echo -e "${CYAN}${BOLD}  ║  Complete Docker Environment: MongoDB + Backend + Frontend         ║${RESET}"
    echo -e "${CYAN}${BOLD}  ╚════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
}

# CIPHER-X: Step Completion Marker
mark_step() {
    echo -e "${GREEN}${BOLD}[✓]${RESET} $1"
}

# CIPHER-X: Info Message Display
show_info() {
    echo -e "${CYAN}${BOLD}[i]${RESET} $1"
}

# CIPHER-X: Warning Message Display
show_warning() {
    echo -e "${YELLOW}${BOLD}[!]${RESET} $1"
}

# CIPHER-X: Error Message Display 
show_error() {
    echo -e "${RED}${BOLD}[x]${RESET} $1"
}

# CIPHER-X: Check if Docker is installed
test_docker() {
    if ! command -v docker &> /dev/null; then
        return 1
    fi
    return 0
}

# CIPHER-X: Validate required files exist
test_required_files() {
    if [ ! -f "backend/Dockerfile" ] || [ ! -f "FRONTEND/Dockerfile" ] || [ ! -f "docker-compose.yml" ]; then
        return 1
    fi
    return 0
}

# CIPHER-X: Create JWT secrets if not present
ensure_jwt_secrets() {
    show_info "Checking JWT secrets..."
    
    # Check for existing .env.docker file
    if [ ! -f ".env.docker" ]; then
        show_info "Creating .env.docker with secure JWT secrets..."
        
        # Generate random secrets
        JWT_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        JWT_REFRESH_SECRET=$(cat /dev/urandom | tr -dc 'a-zA-Z0-9' | fold -w 32 | head -n 1)
        
        # Create the file
        cat > .env.docker << EOF
# Docker Environment Variables
JWT_SECRET=$JWT_SECRET
JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET
EOF
        
        mark_step "Created .env.docker with secure JWT secrets"
    else
        mark_step "Found existing .env.docker file"
    fi
}

# CIPHER-X: Main Function for Deploying with Docker
deploy_chaosv3() {
    show_banner
    
    # Check for Docker
    if ! test_docker; then
        show_error "Docker is not installed or not running! Please install Docker and try again."
        exit 1
    fi
    mark_step "Docker is installed and running"
    
    # Check for required files
    if ! test_required_files; then
        show_error "Required Docker files not found! Please ensure all Dockerfiles and docker-compose.yml are present."
        exit 1
    fi
    mark_step "All required Docker files present"
    
    # Ensure JWT secrets are set
    ensure_jwt_secrets
    
    # Start the deployment
    show_info "Starting C.H.A.O.S.V3 deployment with Docker Compose..."
    
    # Set build kit environment variables
    export COMPOSE_DOCKER_CLI_BUILD=1
    export DOCKER_BUILDKIT=1
    
    # Build and start the containers
    if docker-compose --env-file .env.docker up -d --build; then
        show_info "Waiting for services to start up completely..."
        sleep 10
        
        # Display running containers
        docker-compose ps
        
        echo ""
        echo -e "${GREEN}${BOLD}  ╔════════════════════════════════════════════════════════════════════╗${RESET}"
        echo -e "${GREEN}${BOLD}  ║                     DEPLOYMENT SUCCESSFUL                          ║${RESET}"
        echo -e "${GREEN}${BOLD}  ╚════════════════════════════════════════════════════════════════════╝${RESET}"
        echo ""
        echo -e "  Frontend URL:         ${CYAN}http://localhost:3000${RESET}"
        echo -e "  Backend API:          ${CYAN}http://localhost:5000/api/v1${RESET}"
        echo -e "  Test Diagnostics:     ${CYAN}http://localhost:3000/test${RESET}"
        echo ""
        echo -e "  To stop the services: ${CYAN}docker-compose down${RESET}"
        echo ""
    else
        show_error "Docker Compose deployment failed. Check the error messages above."
        exit 1
    fi
}

# OMEGA-MATRIX: Execute main function
deploy_chaosv3
