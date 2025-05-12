# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                 QUANTUM COMMUNICATION PLATFORM                     ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Modern MSN-inspired chat platform with advanced features          ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝

CHAOSV3 is a modern chat platform heavily inspired by MSN Messenger's nostalgic UI/UX, enhanced with features to compete with platforms like Discord. It features real-time messaging, voice/video chat, user presence indicators, screen sharing, and group channels.

## 🚀 Features

- **Real-time messaging** with rich text and emoji support
- **Voice & video calls** using WebRTC
- **Screen sharing** capabilities
- **User presence** with customizable statuses (Available, Away, Busy, etc.)
- **Group chats and channels**
- **File sharing and media embedding**
- **MSN-inspired UI/UX** with modern enhancements

## 💻 Technology Stack

- **Frontend**: React + TypeScript with Next.js
- **Backend**: Node.js with Express
- **Real-time Communication**: Socket.IO
- **Media Communication**: WebRTC
- **Database**: MongoDB
- **Authentication**: JWT-based
- **Styling**: TailwindCSS with custom MSN-inspired theme

/******************************************************************
 * CIPHER-X: QUANTUM IGNITION PROTOCOL
 * One-click startup for the entire platform
 * Streamlined development and deployment experience
 ******************************************************************/

## 🚀 One-Click Startup

We've created a simplified startup process with a single command:

**Windows:**
```powershell
.\start.ps1
```

**Linux/macOS:**
```bash
bash ./start.sh
```

This automatically:
- Checks for required dependencies
- Sets up environment configuration files
- Starts the backend API server
- Launches the frontend development server
- Provides access URLs for all components

## 🏗️ Project Organization

```
CHAOSV3/
├── config/                    # Configuration files
│   └── ollama.json            # AI integration settings
│
├── scripts/                   # Utility scripts
│   ├── clean-build.ps1/sh     # Build cleanup scripts
│   ├── docker-run.ps1/sh      # Docker deployment scripts
│   └── initialize.ps1/sh      # Environment setup scripts
│
├── docs/                      # Documentation
│   └── GUIDE.md               # Comprehensive user guide
│
├── FRONTEND/                  # Next.js frontend application
├── backend/                   # Express.js backend API
├── shared/                    # Shared type definitions
│
├── start.ps1                  # Windows unified startup
└── start.sh                   # Linux unified startup
```

## 🛠️ Deployment Options

### Docker Deployment
```bash
# Start with Docker Compose
docker-compose up -d
```

### Windows Executable
Build the executable with:

```bash
cd FRONTEND
npm run build:exe
```

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+
- MongoDB
- Git

### Frontend Development
```bash
cd frontend
npm install
npm run dev
```

### Backend Development
```bash
cd backend
npm install
npm run dev
```

## 📝 License
[MIT License](LICENSE)

## 💖 Acknowledgements
- Inspired by the legendary MSN Messenger
- Built with modern web technologies

---
© 2025 CHAOSV3 Team | Created with ⚡ by C.H.A.O.S
