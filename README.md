# C.H.A.O.S. - Cross-platform Hub for Audio, Organizing & Socializing

![C.H.A.O.S. Logo](./assets/logo.png)

## Overview

C.H.A.O.S. is a modern, cross-platform messenger application with voice capabilities, designed to run seamlessly on both Windows and Linux. The application follows a client-server architecture with secure communications and real-time messaging features.

## Features

- **Real-time Messaging**: Direct messages, group chats, and server-based communications
- **Voice Communication**: High-quality voice chat with minimal latency
- **Cross-Platform**: Desktop applications for Windows and Linux
- **User Profiles**: Customizable profiles with statuses and avatars
- **Server Management**: Create and join servers with multiple channels
- **Secure Communications**: End-to-end encryption for messages
- **Themeable Interface**: Windows XP inspired design with customization options

## Project Structure

```
CHAOSV3/
├── assets/                # Static assets like icons, images
├── client/               # Cross-platform client application
│   ├── frontend/         # React/TypeScript frontend (existing)
│   ├── electron/         # Electron configuration for desktop apps
│   └── shared/           # Shared utilities between platforms
├── server/               # Backend server implementation
│   ├── api/              # API endpoints
│   ├── auth/             # Authentication services
│   ├── database/         # Database models and migrations
│   ├── realtime/         # WebSocket/real-time services
│   ├── voice/            # Voice communication services
│   └── utils/            # Utility functions
├── config/               # Configuration files
├── docs/                 # Documentation
└── scripts/              # Deployment and utility scripts
```

## Technology Stack

### Client
- **Frontend**: React, TypeScript, Next.js
- **Desktop**: Electron
- **State Management**: React Context API / Redux
- **Styling**: Tailwind CSS

### Server
- **Backend**: Python FastAPI
- **Database**: PostgreSQL
- **Authentication**: JWT, OAuth2
- **Real-time**: WebSockets
- **Voice**: WebRTC

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.10+
- PostgreSQL 14+

### Development Setup

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd CHAOSV3
   ```

2. **Set up Python virtual environment**:
   ```bash
   python -m venv venv
   # On Windows
   .\venv\Scripts\activate
   # On Linux
   source venv/bin/activate
   pip install -r server/requirements.txt
   ```

3. **Install frontend dependencies**:
   ```bash
   cd frontend
   npm install
   ```

4. **Start the development server**:
   ```bash
   # Terminal 1 - Backend
   cd server
   python main.py

   # Terminal 2 - Frontend
   cd frontend
   npm run dev
   ```

5. **Build desktop application**:
   ```bash
   cd client
   npm run build
   npm run package
   ```

## Configuration

The application uses environment-based configuration for different deployment scenarios. Configuration files are stored in the `config/` directory.

### Ollama Integration

C.H.A.O.S. includes AI capabilities powered by Ollama:
- Default model: llama3.2
- Configurable settings in `config/ollama_config.yaml`

## Deployment

Instructions for deploying to production environments are available in `docs/deployment.md`.

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-feature`
3. Commit your changes: `git commit -am 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Submit a pull request

## License

[MIT License](LICENSE)
