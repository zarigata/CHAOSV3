#=======================================================================
# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                  ROOT LAUNCHER [QUANTUM-GATEWAY]                   ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Root-level launcher for CHAOSV3 control system                    ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝
#=======================================================================

# Forward all parameters to the main control script
$scriptPath = Join-Path $PSScriptRoot "scripts\chaosctl.ps1"
& $scriptPath @args
