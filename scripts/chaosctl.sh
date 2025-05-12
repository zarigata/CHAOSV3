#!/bin/bash

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

# CIPHER-X: Determine script and project directories
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$ROOT_DIR" || exit 1

# CIPHER-X: Terminal colors for visual effects
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
YELLOW='\033[0;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# CIPHER-X: Command-line arguments
COMMAND="${1:-help}"
TARGET="${2:-all}"
DOCKER=false

# Check for Docker flag
for arg in "$@"; do
    if [ "$arg" = "--docker" ] || [ "$arg" = "-d" ]; then
        DOCKER=true
    fi
done

#=======================================================================
# CIPHER-X: Helper Functions
#=======================================================================

# Display banner
show_banner() {
    clear
    echo -e ""
    echo -e "${CYAN}  ╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${CYAN}  ║                  C.H.A.O.S.V3 CONTROL SYSTEM                      ║${NC}"
    echo -e "${CYAN}  ╠════════════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${CYAN}  ║  Universal controller for the CHAOSV3 ecosystem                   ║${NC}"
    echo -e "${CYAN}  ╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo -e ""
}

# Display help information
show_help() {
    echo -e "${YELLOW}[?] Available commands:${NC}"
    echo -e "    ./chaosctl.sh start [all|backend|frontend|db]  - Start services${NC}"
    echo -e "    ./chaosctl.sh stop [all|backend|frontend|db]   - Stop services${NC}"
    echo -e "    ./chaosctl.sh docker [build|up|down|logs]      - Docker operations${NC}"
    echo -e "    ./chaosctl.sh fix                             - Fix common issues${NC}"
    echo -e "    ./chaosctl.sh status                          - Show service status${NC}"
    echo -e ""
    echo -e "${YELLOW}[?] Options:${NC}"
    echo -e "    --docker, -d   - Use Docker containers (recommended)${NC}"
    echo -e ""
    echo -e "${BLUE}[i] Examples:${NC}"
    echo -e "    ${GREEN}./chaosctl.sh start --docker             - Start all services in Docker${NC}"
    echo -e "    ${GREEN}./chaosctl.sh docker up                  - Start Docker environment${NC}"
    echo -e ""
}

# Start Docker services
start_docker_services() {
    local service="${1:-all}"
    
    echo -e "${MAGENTA}[+] Starting Docker environment...${NC}"
    
    if [ "$service" = "all" ]; then
        docker-compose up -d
    else
        docker-compose up -d "$service"
    fi
    
    echo -e "    ${GREEN}✓ Docker services started${NC}"
    echo ""
    
    # Show access information
    echo -e "${BLUE}[i] Access URLs:${NC}"
    echo -e "    ${GREEN}Frontend: http://localhost:3000${NC}"
    echo -e "    ${GREEN}Backend API: http://localhost:5000/api/v1${NC}"
    echo -e "    ${GREEN}Health Check: http://localhost:5000/health${NC}"
    echo ""
}

# Stop Docker services
stop_docker_services() {
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

# Fix TypeScript imports
fix_typescript_imports() {
    echo -e "${MAGENTA}[+] Fixing TypeScript imports...${NC}"
    
    local files=(
        "$ROOT_DIR/backend/src/models/User.ts"
        "$ROOT_DIR/backend/src/controllers/userController.ts"
        "$ROOT_DIR/backend/src/controllers/messageController.ts"
    )
    
    for file in "${files[@]}"; do
        if [ -f "$file" ] && grep -q "@shared/types" "$file"; then
            sed -i 's/import { \(.*\) } from '\''@shared\/types'\'';/import { \1 } from '\''..\/..\/..\/shared\/types'\'';/g' "$file"
            echo -e "    ${GREEN}✓ Fixed imports in $(basename "$file")${NC}"
        fi
    done
    
    echo -e "    ${GREEN}✓ TypeScript imports fixed${NC}"
    echo ""
}

# Start local services
start_local_services() {
    local service="${1:-all}"
    
    if [ "$service" = "all" ] || [ "$service" = "backend" ]; then
        echo -e "${MAGENTA}[+] Starting Backend...${NC}"
        cd "$ROOT_DIR/backend" || return
        gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || 
        xterm -e "npm run dev; exec bash" 2>/dev/null || 
        konsole -e "npm run dev; exec bash" 2>/dev/null || 
        mate-terminal -e "npm run dev; exec bash" 2>/dev/null || 
        echo -e "    ${YELLOW}! Could not open a new terminal, running in background${NC}" && 
        (npm run dev > backend.log 2>&1 &)
        
        cd "$ROOT_DIR" || return
        echo -e "    ${GREEN}✓ Backend started${NC}"
    fi
    
    if [ "$service" = "all" ] || [ "$service" = "frontend" ]; then
        echo -e "${MAGENTA}[+] Starting Frontend...${NC}"
        cd "$ROOT_DIR/FRONTEND" || return
        gnome-terminal -- bash -c "npm run dev; exec bash" 2>/dev/null || 
        xterm -e "npm run dev; exec bash" 2>/dev/null || 
        konsole -e "npm run dev; exec bash" 2>/dev/null || 
        mate-terminal -e "npm run dev; exec bash" 2>/dev/null || 
        echo -e "    ${YELLOW}! Could not open a new terminal, running in background${NC}" && 
        (npm run dev > frontend.log 2>&1 &)
        
        cd "$ROOT_DIR" || return
        echo -e "    ${GREEN}✓ Frontend started${NC}"
    fi
    
    if [ "$service" = "all" ] || [ "$service" = "db" ]; then
        echo -e "${YELLOW}[!] MongoDB must be running separately${NC}"
        echo -e "    ${YELLOW}Consider using --docker option for automatic MongoDB setup${NC}"
    fi
    
    echo ""
    echo -e "${BLUE}[i] Access URLs:${NC}"
    echo -e "    ${GREEN}Frontend: http://localhost:3000${NC}"
    echo -e "    ${GREEN}Backend API: http://localhost:5000/api/v1${NC}"
    echo ""
}

# Get service status
get_service_status() {
    echo -e "${BLUE}[i] Checking service status...${NC}"
    
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
    
    # Check if Docker is running these services
    if docker ps | grep -q "chaosv3"; then
        echo ""
        echo -e "    ${BLUE}[Docker containers running]${NC}"
    fi
    
    echo ""
}

#=======================================================================
# CIPHER-X: Main Execution Flow
#=======================================================================
show_banner

case "$COMMAND" in
    help)
        show_help
        ;;
    
    start)
        if $DOCKER; then
            start_docker_services "$TARGET"
        else
            fix_typescript_imports
            start_local_services "$TARGET"
        fi
        ;;
    
    stop)
        if $DOCKER; then
            stop_docker_services "$TARGET"
        else
            echo -e "${YELLOW}[!] For local services, please close the terminal windows manually${NC}"
            echo -e "    ${YELLOW}or find and kill the processes using 'pkill node'${NC}"
        fi
        ;;
    
    docker)
        case "$TARGET" in
            build)
                echo -e "${MAGENTA}[+] Building Docker images...${NC}"
                docker-compose build
                ;;
            
            up)
                start_docker_services
                ;;
            
            down)
                stop_docker_services
                ;;
            
            logs)
                echo -e "${MAGENTA}[+] Displaying Docker logs...${NC}"
                docker-compose logs -f
                ;;
            
            *)
                echo -e "${RED}[!] Unknown Docker command: $TARGET${NC}"
                echo -e "${YELLOW}    Valid options: build, up, down, logs${NC}"
                ;;
        esac
        ;;
    
    fix)
        fix_typescript_imports
        ;;
    
    status)
        get_service_status
        ;;
    
    *)
        echo -e "${RED}[!] Unknown command: $COMMAND${NC}"
        show_help
        ;;
esac
