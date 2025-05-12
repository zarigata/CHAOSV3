#!/bin/bash
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

# CIPHER-X: Color & Output Formatting
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
RESET='\033[0m'

# CIPHER-X: Banner Display
show_banner() {
    echo ""
    echo -e "${CYAN}${BOLD}  ╔════════════════════════════════════════════════════════════════════╗${RESET}"
    echo -e "${CYAN}${BOLD}  ║                  C.H.A.O.S.V3 QUANTUM LAUNCHER                     ║${RESET}"
    echo -e "${CYAN}${BOLD}  ╠════════════════════════════════════════════════════════════════════╣${RESET}"
    echo -e "${CYAN}${BOLD}  ║  One-click startup for the entire platform (Backend + Frontend)    ║${RESET}"
    echo -e "${CYAN}${BOLD}  ╚════════════════════════════════════════════════════════════════════╝${RESET}"
    echo ""
}

# CIPHER-X: Message Formatting Functions
mark_step() {
    echo -e "${GREEN}${BOLD}[✓]${RESET} $1"
}

show_info() {
    echo -e "${BLUE}${BOLD}[i]${RESET} $1"
}

show_warning() {
    echo -e "${YELLOW}${BOLD}[!]${RESET} $1"
}

show_error() {
    echo -e "${RED}${BOLD}[x]${RESET} $1"
}

log_section() {
    echo -e "${PURPLE}${BOLD}[+] $1 ${RESET}"
    echo -e "${PURPLE}${BOLD}    --------------------------------------------------${RESET}"
}

# CIPHER-X: Check for required dependencies
check_dependencies() {
    log_section "Checking Required Dependencies"
    
    if ! command -v node &> /dev/null; then
        show_error "Node.js is required but not installed"
        exit 1
    else
        NODE_VERSION=$(node -v)
        mark_step "Node.js $NODE_VERSION is installed"
    fi
    
    if ! command -v npm &> /dev/null; then
        show_error "NPM is required but not installed"
        exit 1
    else
        NPM_VERSION=$(npm -v)
        mark_step "NPM $NPM_VERSION is installed"
    fi
}

# CIPHER-X: Create necessary environment files if they don't exist
setup_environment() {
    log_section "Setting Up Environment"
    
    # Check if backend .env exists
    if [ ! -f "backend/.env" ]; then
        show_info "Creating backend .env file from .env.example..."
        cp -f .env.example backend/.env
        mark_step "Created backend .env file"
    else
        mark_step "Backend .env file already exists"
    fi
    
    # Check if frontend .env.local exists
    if [ ! -f "FRONTEND/.env.local" ]; then
        show_info "Creating frontend .env.local file..."
        echo "NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1" > FRONTEND/.env.local
        mark_step "Created frontend .env.local file"
    else
        mark_step "Frontend .env.local file already exists"
    fi
}

# CIPHER-X: Start backend server
start_backend() {
    log_section "Starting Backend Server"
    
    cd backend || { show_error "Backend directory not found"; exit 1; }
    
    # Check if node_modules exists, otherwise install dependencies
    if [ ! -d "node_modules" ]; then
        show_info "Installing backend dependencies..."
        npm install
    fi
    
    # Check if dist exists, otherwise build
    if [ ! -d "dist" ]; then
        show_info "Building backend..."
        npm run build
    fi
    
    show_info "Starting backend server (development mode)..."
    # Start backend in background
    npm run dev &
    BACKEND_PID=$!
    mark_step "Backend server started (PID: $BACKEND_PID)"
    
    # Return to root directory
    cd ..
}

# CIPHER-X: Start frontend server
start_frontend() {
    log_section "Starting Frontend Server"
    
    cd FRONTEND || { show_error "Frontend directory not found"; exit 1; }
    
    # Check if node_modules exists, otherwise install dependencies
    if [ ! -d "node_modules" ]; then
        show_info "Installing frontend dependencies..."
        npm install
    fi
    
    show_info "Starting frontend development server..."
    # Start frontend in background
    npm run dev &
    FRONTEND_PID=$!
    mark_step "Frontend server started (PID: $FRONTEND_PID)"
    
    # Return to root directory
    cd ..
}

# CIPHER-X: Display system URLs
show_urls() {
    log_section "Access CHAOSV3 Platform"
    
    echo -e "${GREEN}${BOLD}Frontend: ${RESET}${BOLD}http://localhost:3000${RESET}"
    echo -e "${BLUE}${BOLD}Backend API: ${RESET}${BOLD}http://localhost:5000/api/v1${RESET}"
    echo -e "${YELLOW}${BOLD}Health Check: ${RESET}${BOLD}http://localhost:5000/health${RESET}"
    echo ""
    echo -e "Press ${RED}${BOLD}Ctrl+C${RESET} to stop all servers"
}

# CIPHER-X: Cleanup function for exit
cleanup() {
    echo ""
    log_section "Shutting Down CHAOSV3"
    
    show_info "Stopping backend server..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID
        mark_step "Backend server stopped"
    fi
    
    show_info "Stopping frontend server..."
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID
        mark_step "Frontend server stopped"
    fi
    
    echo ""
    echo -e "${GREEN}${BOLD}All servers have been stopped. Thank you for using CHAOSV3!${RESET}"
    exit 0
}

# CIPHER-X: Register cleanup handler
trap cleanup EXIT INT TERM

# CIPHER-X: Main execution flow
show_banner
check_dependencies
setup_environment
start_backend
start_frontend
show_urls

# CIPHER-X: Keep script running to manage background processes
wait
