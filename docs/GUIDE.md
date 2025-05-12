# ╔════════════════════════════════════════════════════════════════════╗
# ║                     << C.H.A.O.S.V3 - CODEX >>                     ║
# ║                    QUANTUM COMMS PLATFORM GUIDE                    ║
# ╠════════════════════════════════════════════════════════════════════╣
# ║  Modern MSN-inspired chat platform with advanced features          ║
# ║  Last Updated: 2025-05-12                                          ║
# ║  Author: CHAOSV3 Team                                              ║
# ╚════════════════════════════════════════════════════════════════════╝

## 🔍 OVERVIEW

CHAOSV3 is a modern chat platform inspired by classic MSN Messenger, featuring real-time communication, user presence indicators, customizable profiles, and secure authentication. Built with a modern tech stack including React, Next.js, TypeScript, Node.js, Express, MongoDB, and Socket.IO.

## 🚀 QUICK START

### One-Click Launch

We've made it simple to launch the entire CHAOSV3 platform with a single command:

**Windows:**
```powershell
.\start.ps1
```

**Linux/macOS:**
```bash
bash ./start.sh
```

This will automatically:
1. Check for dependencies
2. Set up environment files
3. Start the backend server
4. Start the frontend development server
5. Display access URLs

## 🏗️ PROJECT STRUCTURE

```
CHAOSV3/
├── config/                    # Configuration files
│   └── ollama.json            # AI integration configuration
│
├── docs/                      # Documentation
│   └── GUIDE.md               # This guide file
│
├── scripts/                   # Utility scripts
│   ├── clean-build.ps1        # Windows build cleanup
│   ├── clean-build.sh         # Linux build cleanup
│   ├── docker-run.ps1         # Windows Docker launcher
│   ├── docker-run.sh          # Linux Docker launcher
│   ├── initialize.ps1         # Windows initialization
│   └── initialize.sh          # Linux initialization
│
├── FRONTEND/                  # Next.js frontend application
│   ├── app/                   # App routing components
│   ├── components/            # UI components
│   ├── lib/                   # Frontend libraries
│   └── ...                    # Configuration files
│
├── backend/                   # Express.js backend application
│   ├── src/                   # Source code
│   │   ├── controllers/       # API controllers
│   │   ├── middleware/        # Express middleware
│   │   ├── models/            # MongoDB schemas
│   │   ├── routes/            # API routes
│   │   ├── services/          # Business logic
│   │   └── utils/             # Utility functions
│   └── ...                    # Configuration files
│
├── shared/                    # Shared code between frontend/backend
│   └── types.ts               # TypeScript type definitions
│
├── start.ps1                  # Windows unified startup script
├── start.sh                   # Linux unified startup script
└── ...                        # Configuration files
```

## ⚙️ CONFIGURATION

### Environment Variables

The platform uses environment files for configuration:

**Backend (.env)**
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/chaosv3
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d
```

**Frontend (.env.local)**
```
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

### AI Integration (Ollama)

CHAOSV3 includes Ollama integration with the llama3.2 model by default. Configuration is stored in `config/ollama.json`.

## 🛠️ DEVELOPMENT

### Prerequisites

- Node.js 18+ and NPM
- MongoDB
- Git

### Manual Setup

**Backend:**
```bash
cd backend
npm install
npm run dev
```

**Frontend:**
```bash
cd FRONTEND
npm install
npm run dev
```

## 🔒 SECURITY

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting on authentication endpoints
- Input validation and sanitization

## 🌐 DEPLOYMENT

### Docker

```bash
# Using Docker Compose
docker-compose up -d
```

### Manual Deployment

**Backend:**
```bash
cd backend
npm install --production
npm run build
npm start
```

**Frontend:**
```bash
cd FRONTEND
npm install --production
npm run build
npm run start
```

## 🤝 CONTRIBUTING

Please follow these guidelines when contributing:
- Use the CODEX commenting style for better code readability
- Ensure code works on both Windows and Linux
- Create Python virtual environments for Python-related code
- Test thoroughly before submitting pull requests

## 📄 LICENSE

MIT License
