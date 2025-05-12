# CHAOSV3 - A Modern MSN-Inspired Chat Platform

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

## 🛠️ Deployment Options

### Docker Deployment
```bash
# Clone the repository
git clone https://github.com/yourusername/chaosv3.git
cd chaosv3

# Configure environment variables
cp .env.example .env
# Edit .env file with your settings

# Start with Docker Compose
docker-compose up -d
```

### Windows Executable
Download the latest .exe from the releases page or build it yourself:

```bash
# Install dependencies
npm install

# Build the executable
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
