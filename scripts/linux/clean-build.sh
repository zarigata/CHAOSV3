#!/bin/bash
#******************************************************************
# ╔════════════════════════════════════════════════════════════╗
# ║          << C.H.A.O.S.V3 - CODEX >> CLEAN BUILD           ║
# ╠════════════════════════════════════════════════════════════╣
# ║ Cross-platform compatible clean build script               ║
# ║ Removes all development artifacts and rebuilds from source ║
# ╚════════════════════════════════════════════════════════════╝
#******************************************************************

# CIPHER-X: Ensure we're in the project root directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
cd "$SCRIPT_DIR"

# OMEGA-MATRIX: Display header and information
echo "╔════════════════════════════════════════════════════════════╗"
echo "║          << C.H.A.O.S.V3 - CODEX >> CLEAN BUILD           ║"
echo "╠════════════════════════════════════════════════════════════╣"
echo "║ Performing complete cleanup and rebuild of all components  ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# OMEGA-MATRIX: Define cleanup functions
clear_build_artifacts() {
    local directory="$1"
    local name="$2"
    
    echo -e "\e[33m🧹 Cleaning $name build artifacts...\e[0m"
    
    # Remove build artifacts
    local folders_to_remove=("node_modules" "dist" "build" ".next" "coverage")
    local files_to_remove=("yarn-error.log" "npm-debug.log" ".DS_Store")
    
    for folder in "${folders_to_remove[@]}"; do
        local path="$directory/$folder"
        if [ -d "$path" ]; then
            echo -e "\e[90m   Removing $folder...\e[0m"
            rm -rf "$path" 2>/dev/null
        fi
    done
    
    for file in "${files_to_remove[@]}"; do
        local path="$directory/$file"
        if [ -f "$path" ]; then
            echo -e "\e[90m   Removing $file...\e[0m"
            rm -f "$path" 2>/dev/null
        fi
    done
    
    echo -e "\e[32m✅ Cleaned $name artifacts\e[0m"
}

install_dependencies() {
    local directory="$1"
    local name="$2"
    
    cd "$directory"
    
    echo -e "\e[33m📦 Installing $name dependencies...\e[0m"
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        echo -e "\e[90m   Running npm install...\e[0m"
        npm install --legacy-peer-deps
        
        if [ $? -ne 0 ]; then
            echo -e "\e[31m⚠️ Warning: npm install failed for $name. Attempting with legacy peer deps...\e[0m"
            npm install --legacy-peer-deps
        fi
    else
        echo -e "\e[31m⚠️ Warning: No package.json found in $name\e[0m"
    fi
    
    cd "$SCRIPT_DIR"
    echo -e "\e[32m✅ $name dependencies installed\e[0m"
}

build_project() {
    local directory="$1"
    local name="$2"
    
    cd "$directory"
    
    echo -e "\e[33m🔨 Building $name...\e[0m"
    
    # Check if package.json exists
    if [ -f "package.json" ]; then
        # Check if build script exists in package.json using grep
        if grep -q "\"build\":" "package.json"; then
            echo -e "\e[90m   Running npm run build...\e[0m"
            npm run build
        else
            echo -e "\e[33m⚠️ Warning: No build script found in $name package.json\e[0m"
        fi
    else
        echo -e "\e[31m⚠️ Warning: No package.json found in $name\e[0m"
    fi
    
    cd "$SCRIPT_DIR"
    echo -e "\e[32m✅ $name built successfully\e[0m"
}

# CIPHER-X: Remove temporary files from project root
echo -e "\e[33m🧹 Cleaning temporary files from project root...\e[0m"
rm -f *.log .DS_Store 2>/dev/null
echo -e "\e[32m✅ Temporary files removed\e[0m"

# CIPHER-X: Clean and rebuild Backend
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      BACKEND REBUILD                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
backend_dir="$SCRIPT_DIR/backend"
clear_build_artifacts "$backend_dir" "Backend"
install_dependencies "$backend_dir" "Backend"
build_project "$backend_dir" "Backend"

# CIPHER-X: Clean and rebuild Frontend
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                     FRONTEND REBUILD                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
frontend_dir="$SCRIPT_DIR/FRONTEND"
clear_build_artifacts "$frontend_dir" "Frontend"
install_dependencies "$frontend_dir" "Frontend"
build_project "$frontend_dir" "Frontend"

# OMEGA-MATRIX: Final summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    BUILD COMPLETE                           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo -e "\e[32m✅ CHAOSV3 has been cleaned and rebuilt successfully!\e[0m"
echo "🚀 To start the development environment:"
echo "   - Backend: cd backend && npm run dev"
echo "   - Frontend: cd FRONTEND && npm run dev"
echo ""
