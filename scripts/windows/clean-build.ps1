<#
******************************************************************
 ╔════════════════════════════════════════════════════════════╗
 ║          C.H.A.O.S.V3 - CODEX CLEAN BUILD SCRIPT          ║
 ╠════════════════════════════════════════════════════════════╣
 ║ Cross-platform compatible clean build script               ║
 ║ Removes all development artifacts and rebuilds from source ║
 ╚════════════════════════════════════════════════════════════╝
******************************************************************
#>

# CIPHER-X: Ensure we're in the project root directory
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# OMEGA-MATRIX: Display header and information
Write-Host "=================================================================="
Write-Host "||            C.H.A.O.S.V3 - CODEX CLEAN BUILD             ||"
Write-Host "=================================================================="
Write-Host "||   Performing complete cleanup and rebuild of all components  ||"
Write-Host "=================================================================="
Write-Host ""

# OMEGA-MATRIX: Define cleanup functions
function Clear-BuildArtifacts {
    param (
        [string]$directory,
        [string]$name
    )
    
    Write-Host "🧹 Cleaning $name build artifacts..." -ForegroundColor Yellow
    
    # Remove build artifacts
    $foldersToRemove = @(
        "node_modules",
        "dist",
        "build",
        ".next",
        "coverage"
    )
    
    $filesToRemove = @(
        "yarn-error.log",
        "npm-debug.log",
        ".DS_Store"
    )
    
    foreach ($folder in $foldersToRemove) {
        $path = Join-Path -Path $directory -ChildPath $folder
        if (Test-Path -Path $path) {
            Write-Host "   Removing $folder..." -ForegroundColor DarkGray
            Remove-Item -Path $path -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    
    foreach ($file in $filesToRemove) {
        $path = Join-Path -Path $directory -ChildPath $file
        if (Test-Path -Path $path) {
            Write-Host "   Removing $file..." -ForegroundColor DarkGray
            Remove-Item -Path $path -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Host "✅ Cleaned $name artifacts" -ForegroundColor Green
}

function Install-Dependencies {
    param (
        [string]$directory,
        [string]$name
    )
    
    Push-Location $directory
    
    Write-Host "📦 Installing $name dependencies..." -ForegroundColor Yellow
    
    # Check if package.json exists
    if (Test-Path "package.json") {
        Write-Host "   Running npm install..." -ForegroundColor DarkGray
        npm install --legacy-peer-deps
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "⚠️ Warning: npm install failed for $name. Attempting with legacy peer deps..." -ForegroundColor Red
            npm install --legacy-peer-deps
        }
    } else {
        Write-Host "⚠️ Warning: No package.json found in $name" -ForegroundColor Red
    }
    
    Pop-Location
    Write-Host "✅ $name dependencies installed" -ForegroundColor Green
}

function Build-Project {
    param (
        [string]$directory,
        [string]$name
    )
    
    Push-Location $directory
    
    Write-Host "🔨 Building $name..." -ForegroundColor Yellow
    
    # Check if package.json exists
    if (Test-Path "package.json") {
        # Check if build script exists in package.json
        $packageJson = Get-Content "package.json" | ConvertFrom-Json
        if ($packageJson.scripts.build) {
            Write-Host "   Running npm run build..." -ForegroundColor DarkGray
            npm run build
        } else {
            Write-Host "⚠️ Warning: No build script found in $name package.json" -ForegroundColor Yellow
        }
    } else {
        Write-Host "⚠️ Warning: No package.json found in $name" -ForegroundColor Red
    }
    
    Pop-Location
    Write-Host "✅ $name built successfully" -ForegroundColor Green
}

# CIPHER-X: Remove temporary files from project root
Write-Host "🧹 Cleaning temporary files from project root..." -ForegroundColor Yellow
Remove-Item -Path "*.log" -Force -ErrorAction SilentlyContinue
Remove-Item -Path ".DS_Store" -Force -ErrorAction SilentlyContinue
Write-Host "✅ Temporary files removed" -ForegroundColor Green

# CIPHER-X: Clean and rebuild Backend
Write-Host ""
Write-Host "=================================================================="
Write-Host "||                     BACKEND REBUILD                       ||"
Write-Host "=================================================================="
$backendDir = Join-Path -Path $scriptPath -ChildPath "backend"
Clear-BuildArtifacts -directory $backendDir -name "Backend"
Install-Dependencies -directory $backendDir -name "Backend"
Build-Project -directory $backendDir -name "Backend"

# CIPHER-X: Clean and rebuild Frontend
Write-Host ""
Write-Host "=================================================================="
Write-Host "||                     FRONTEND REBUILD                      ||"
Write-Host "=================================================================="
$frontendDir = Join-Path -Path $scriptPath -ChildPath "FRONTEND"
Clear-BuildArtifacts -directory $frontendDir -name "Frontend"
Install-Dependencies -directory $frontendDir -name "Frontend"
Build-Project -directory $frontendDir -name "Frontend"

# OMEGA-MATRIX: Final summary
Write-Host ""
Write-Host "=================================================================="
Write-Host "||                      BUILD COMPLETE                       ||"
Write-Host "=================================================================="
Write-Host "✅ CHAOSV3 has been cleaned and rebuilt successfully!" -ForegroundColor Green
Write-Host "🚀 To start the development environment:"
Write-Host "   - Backend: cd backend && npm run dev"
Write-Host "   - Frontend: cd FRONTEND && npm run dev"
Write-Host ""
