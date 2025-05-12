#!/bin/bash

#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                 MASTER CONTROL MODULE [QUANTUM-CORE]               ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Linux controller for all CHAOSV3 platform functions               ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝
#=======================================================================

# CIPHER-X: Detect script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"
cd "$PROJECT_ROOT" || exit 1

# CIPHER-X: Terminal colors
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# CIPHER-X: Banner display
show_banner() {
    clear
    echo -e ""
    echo -e "${CYAN}  ╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}  ║                  C.H.A.O.S.V3 CONTROL SYSTEM                      ║${NC}"
    echo -e "${CYAN}  ╠════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}  ║  Linux controller for the CHAOSV3 ecosystem                       ║${NC}"
    echo -e "${CYAN}  ╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e ""
}

# CIPHER-X: Help command
show_help() {
    echo -e "${YELLOW}[?] Available commands:${NC}"
    echo -e "    ${NC}./chaos.sh start [all|backend|frontend|db]   - Start services${NC}"
    echo -e "    ${NC}./chaos.sh stop [all|backend|frontend|db]    - Stop services${NC}"
    echo -e "    ${NC}./chaos.sh restart [all|backend|frontend|db] - Restart services${NC}"
    echo -e "    ${NC}./chaos.sh status                           - Show service status${NC}"
    echo -e "    ${NC}./chaos.sh docker [build|up|down|logs]      - Manage Docker environment${NC}"
    echo -e "    ${NC}./chaos.sh install                          - Install dependencies${NC}"
    echo -e "    ${NC}./chaos.sh update                           - Update dependencies${NC}"
    echo -e "    ${NC}./chaos.sh clean                            - Clean temporary files${NC}"
    echo -e "    ${NC}./chaos.sh fix                              - Fix common issues${NC}"
    echo -e "    ${NC}./chaos.sh init                             - Initialize environment${NC}"
    echo -e "    ${NC}./chaos.sh test                             - Run tests${NC}"
    echo -e ""
    echo -e "${YELLOW}[?] Options:${NC}"
    echo -e "    ${NC}-d, --docker   - Use Docker for operations${NC}"
    echo -e "    ${NC}-dev           - Use development environment${NC}"
    echo -e "    ${NC}-f, --force    - Force operation${NC}"
    echo -e ""
}

# CIPHER-X: Service status check
get_service_status() {
    echo -e "${BLUE}[i] Service Status:${NC}"
    
    # Check MongoDB
    if nc -z localhost 27017 2>/dev/null; then
        echo -e "    MongoDB : ${GREEN}RUNNING${NC}"
    else
        echo -e "    MongoDB : ${RED}STOPPED${NC}"
    fi
    
    # Check Backend
    if nc -z localhost 5000 2>/dev/null; then
        echo -e "    Backend : ${GREEN}RUNNING${NC}"
    else
        echo -e "    Backend : ${RED}STOPPED${NC}"
    fi
    
    # Check Frontend
    if nc -z localhost 3000 2>/dev/null; then
        echo -e "    Frontend : ${GREEN}RUNNING${NC}"
    else
        echo -e "    Frontend : ${RED}STOPPED${NC}"
    fi
    
    echo ""
}

# CIPHER-X: Start Docker environment 
start_docker_environment() {
    local service="${1:-all}"
    
    echo -e "${MAGENTA}[+] Starting Docker environment...${NC}"
    
    if [ "$service" = "all" ]; then
        docker-compose up -d
    else
        docker-compose up -d "$service"
    fi
    
    echo -e "    ${GREEN}✓ Docker services started${NC}"
    echo ""
    
    # Show URLs
    echo -e "${BLUE}[i] Access URLs:${NC}"
    echo -e "    ${GREEN}Frontend: http://localhost:3000${NC}"
    echo -e "    ${GREEN}Backend API: http://localhost:5000/api/v1${NC}"
    echo -e "    ${GREEN}Health Check: http://localhost:5000/health${NC}"
    echo ""
}

# CIPHER-X: Stop Docker environment
stop_docker_environment() {
    local service="${1:-all}"
    
    echo -e "${MAGENTA}[+] Stopping Docker environment...${NC}"
    
    if [ "$service" = "all" ]; then
        docker-compose down
    else
        docker-compose stop "$service"
    fi
    
    echo -e "    ${GREEN}✓ Docker services stopped${NC}"
    echo ""
}

# CIPHER-X: Start local backend
start_local_backend() {
    echo -e "${MAGENTA}[+] Starting Backend locally...${NC}"
    
    # Ensure we have correct imports for TypeScript path aliases
    local user_model_path="$PROJECT_ROOT/backend/src/models/User.ts"
    if grep -q "@shared/types" "$user_model_path"; then
        sed -i 's/import { UserStatus } from '"'"'@shared\/types'"'"';/import { UserStatus } from '"'"'..\/..\/..\/shared\/types'"'"';/g' "$user_model_path"
        echo -e "    ${GREEN}✓ Fixed TypeScript imports${NC}"
    fi
    
    # Start the backend in a new terminal
    cd "$PROJECT_ROOT/backend" || return
    gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || 
    xterm -e "npm run dev; exec bash" 2>/dev/null || 
    konsole -e "npm run dev; exec bash" 2>/dev/null || 
    mate-terminal -e "npm run dev; exec bash" 2>/dev/null || 
    echo -e "    ${YELLOW}! Could not open a new terminal, running in current terminal${NC}" && npm run dev
    
    cd "$PROJECT_ROOT" || return
    echo -e "    ${GREEN}✓ Backend started${NC}"
    echo -e "    ${GREEN}Backend API: http://localhost:5000/api/v1${NC}"
    echo ""
}

# CIPHER-X: Start local frontend
start_local_frontend() {
    echo -e "${MAGENTA}[+] Starting Frontend locally...${NC}"
    
    # Start the frontend in a new terminal
    cd "$PROJECT_ROOT/FRONTEND" || return
    gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || 
    xterm -e "npm run dev; exec bash" 2>/dev/null || 
    konsole -e "npm run dev; exec bash" 2>/dev/null || 
    mate-terminal -e "npm run dev; exec bash" 2>/dev/null || 
    echo -e "    ${YELLOW}! Could not open a new terminal, running in current terminal${NC}" && npm run dev
    
    cd "$PROJECT_ROOT" || return
    echo -e "    ${GREEN}✓ Frontend started${NC}"
    echo -e "    ${GREEN}Frontend URL: http://localhost:3000${NC}"
    echo ""
}

# CIPHER-X: Environment initialization
initialize_environment() {
    echo -e "${MAGENTA}[+] Initializing environment...${NC}"
    
    # Create a .env file if it doesn't exist
    local env_path="$PROJECT_ROOT/.env"
    if [ ! -f "$env_path" ]; then
        cat > "$env_path" << EOF
# CHAOSV3 Environment Configuration
JWT_SECRET=chaosv3_jwt_secret_replace_in_production
JWT_REFRESH_SECRET=chaosv3_refresh_secret_replace_in_production
MONGODB_URI=mongodb://localhost:27017/chaosv3
EOF
        echo -e "    ${GREEN}✓ Created .env file${NC}"
    fi
    
    # Install backend dependencies
    if [ ! -d "$PROJECT_ROOT/backend/node_modules" ]; then
        (cd "$PROJECT_ROOT/backend" && npm install)
        echo -e "    ${GREEN}✓ Installed backend dependencies${NC}"
    fi
    
    # Install frontend dependencies
    if [ ! -d "$PROJECT_ROOT/FRONTEND/node_modules" ]; then
        (cd "$PROJECT_ROOT/FRONTEND" && npm install)
        echo -e "    ${GREEN}✓ Installed frontend dependencies${NC}"
    fi
    
    echo -e "    ${GREEN}✓ Environment initialized${NC}"
    echo ""
}

# CIPHER-X: Fix common issues
fix_common_issues() {
    echo -e "${MAGENTA}[+] Fixing common issues...${NC}"
    
    # Fix TypeScript path aliases
    local files=(
        "$PROJECT_ROOT/backend/src/models/User.ts"
        "$PROJECT_ROOT/backend/src/controllers/userController.ts"
        "$PROJECT_ROOT/backend/src/controllers/messageController.ts"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ] && grep -q "@shared/types" "$file"; then
            sed -i 's/import {.*} from '"'"'@shared\/types'"'"';/import { \1 } from '"'"'..\/..\/..\/shared\/types'"'"';/g' "$file"
            echo -e "    ${GREEN}✓ Fixed imports in $(basename "$file")${NC}"
        fi
    done
    
    echo -e "    ${GREEN}✓ Common issues fixed${NC}"
    echo ""
}

# CIPHER-X: Parse arguments
DOCKER=false
DEV=false
FORCE=false

# Parse options
while [[ $# -gt 0 ]]; do
    case "$1" in
        -d|--docker)
            DOCKER=true
            shift
            ;;
        -dev)
            DEV=true
            shift
            ;;
        -f|--force)
            FORCE=true
            shift
            ;;
        *)
            break
            ;;
    esac
done

# Get command and target
COMMAND="${1:-help}"
TARGET="${2:-all}"

# CIPHER-X: Main execution
show_banner

# Process commands
case "$COMMAND" in
    help)
        show_help
        ;;
    
    start)
        if $DOCKER; then
            start_docker_environment "$TARGET"
        else
            if [ "$TARGET" = "all" ] || [ "$TARGET" = "backend" ]; then
                start_local_backend
            fi
            if [ "$TARGET" = "all" ] || [ "$TARGET" = "frontend" ]; then
                start_local_frontend
            fi
            if [ "$TARGET" = "all" ] || [ "$TARGET" = "db" ]; then
                echo -e "${YELLOW}[!] MongoDB must be started separately or use --docker option${NC}"
            fi
        fi
        ;;
    
    stop)
        if $DOCKER; then
            stop_docker_environment "$TARGET"
        else
            echo -e "${YELLOW}[!] For local services, please close the terminal windows manually${NC}"
        fi
        ;;
    
    status)
        get_service_status
        ;;
    
    docker)
        case "$TARGET" in
            build)
                echo -e "${MAGENTA}[+] Building Docker images...${NC}"
                docker-compose build
                ;;
            
            up)
                start_docker_environment
                ;;
            
            down)
                stop_docker_environment
                ;;
            
            logs)
                echo -e "${MAGENTA}[+] Showing Docker logs...${NC}"
                docker-compose logs -f
                ;;
            
            *)
                echo -e "${RED}[!] Unknown Docker command: $TARGET${NC}"
                echo -e "${YELLOW}    Use: docker [build|up|down|logs]${NC}"
                ;;
        esac
        ;;
    
    install)
        initialize_environment
        ;;
    
    fix)
        fix_common_issues
        ;;
    
    init)
        initialize_environment
        fix_common_issues
        ;;
    
    *)
        echo -e "${RED}[!] Unknown command: $COMMAND${NC}"
        show_help
        ;;
esac
