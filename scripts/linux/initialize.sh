#!/bin/bash
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
    echo -e "${CYAN}${BOLD}  ║                    C.H.A.O.S.V3 INITIALIZATION                      ║${RESET}"
    echo -e "${CYAN}${BOLD}  ╠════════════════════════════════════════════════════════════════════╣${RESET}"
    echo -e "${CYAN}${BOLD}  ║  Cross-platform Modern MSN-Inspired Chat Platform Setup            ║${RESET}"
    echo -e "${CYAN}${BOLD}  ║  Project & Docker Environment Initialization                       ║${RESET}"
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
    if command -v docker &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# CIPHER-X: Check if Node.js is installed
test_nodejs() {
    if command -v node &> /dev/null; then
        return 0
    else
        return 1
    fi
}

# CIPHER-X: Clean up old build artifacts
clean_build_artifacts() {
    show_info "Cleaning up build artifacts and temporary files..."
    
    # Remove node_modules directories and other build artifacts
    find . -name "node_modules" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
    find . -name "dist" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
    find . -name "build" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
    find . -name ".next" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
    find . -name "out" -type d -prune -exec rm -rf {} \; 2>/dev/null || true
    find . -name "*.log" -type f -delete 2>/dev/null || true
    find . -name "*.bak" -type f -delete 2>/dev/null || true
    
    mark_step "Build artifacts cleaned up successfully"
}

# CIPHER-X: Setup MongoDB using Docker
setup_mongodb() {
    show_info "Setting up MongoDB using Docker..."
    
    if ! test_docker; then
        show_error "Docker is not installed or not in PATH. Please install Docker and try again."
        return 1
    fi
    
    # Check if container already exists
    if docker ps -a --filter "name=chaosv3-mongodb" --format "{{.Names}}" | grep -q "chaosv3-mongodb"; then
        show_info "MongoDB container already exists. Starting it if not running..."
        docker start chaosv3-mongodb
    else
        show_info "Creating and starting new MongoDB container..."
        docker run -d --name chaosv3-mongodb -p 27017:27017 -v chaosv3-data:/data/db mongo:latest
    fi
    
    # Wait for MongoDB to start
    sleep 5
    
    # Check if MongoDB is running
    if docker ps --filter "name=chaosv3-mongodb" --format "{{.Names}}" | grep -q "chaosv3-mongodb"; then
        mark_step "MongoDB is now running on localhost:27017"
        return 0
    else
        show_error "Failed to start MongoDB container"
        return 1
    fi
}

# CIPHER-X: Install backend dependencies
install_backend_dependencies() {
    show_info "Installing backend dependencies..."
    
    if ! test_nodejs; then
        show_error "Node.js is not installed. Please install Node.js and try again."
        return 1
    fi
    
    (cd backend && npm install)
    
    if [ $? -eq 0 ]; then
        mark_step "Backend dependencies installed successfully"
        return 0
    else
        show_error "Error installing backend dependencies"
        return 1
    fi
}

# CIPHER-X: Initialize frontend if it exists
install_frontend_dependencies() {
    if [ -d "frontend" ]; then
        show_info "Installing frontend dependencies..."
        
        (cd frontend && npm install)
        
        if [ $? -eq 0 ]; then
            mark_step "Frontend dependencies installed successfully"
            return 0
        else
            show_error "Error installing frontend dependencies"
            return 1
        fi
    else
        show_warning "Frontend directory not found. Skipping frontend initialization."
        return 0
    fi
}

# CIPHER-X: Main Execution
show_banner

result=0

# Clean up build artifacts
clean_build_artifacts

# Setup MongoDB using Docker
setup_mongodb
mongo_result=$?
result=$((result + mongo_result))

# Install backend dependencies
install_backend_dependencies
backend_result=$?
result=$((result + backend_result))

# Install frontend dependencies
install_frontend_dependencies
frontend_result=$?
result=$((result + frontend_result))

# Show final status
if [ $result -eq 0 ]; then
    echo ""
    echo -e "${GREEN}${BOLD}  ╔════════════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${GREEN}${BOLD}  ║                    INITIALIZATION SUCCESSFUL                        ║${RESET}"
    echo -e "${GREEN}${BOLD}  ╚════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    echo -e "  To start the backend server:  ${CYAN}cd backend && npm run dev${RESET}"
    echo -e "  MongoDB is running at:        ${CYAN}mongodb://localhost:27017/chaosv3${RESET}"
    echo ""
else
    echo ""
    echo -e "${RED}${BOLD}  ╔════════════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${RED}${BOLD}  ║                    INITIALIZATION INCOMPLETE                        ║${RESET}"
    echo -e "${RED}${BOLD}  ╚════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
    echo -e "  Please review the errors above and try again."
    echo ""
fi
