#!/bin/bash

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
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
"$SCRIPT_DIR/scripts/chaosctl.sh" "$@"
