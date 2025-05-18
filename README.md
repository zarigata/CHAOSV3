# C.H.A.O.S. (Communication Hub for Animated Online Socializing)

<p align="center">
  <img src="./assets/logo.png" alt="C.H.A.O.S. Logo" width="200" />
  <br>
  <em>Bringing back the nostalgia of MSN Messenger with modern capabilities</em>
</p>

## 🌟 Overview

C.H.A.O.S. is a modern communication platform that combines the nostalgic charm of MSN Messenger with Discord's powerful community features. Our platform delivers:

- **Real-time messaging** with typing indicators and read receipts
- **Community hubs** with channels (like Discord servers)
- **Encrypted DMs** for privacy-focused communication
- **Status updates** (online, away, offline) with custom messages
- **Modern UI** with nostalgic MSN-inspired themes
- **Cross-platform** support via web and native desktop apps

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- PostgreSQL 14+
- Redis (for presence detection and caching)

### Development Setup

```bash
# Clone the repo
git clone https://github.com/yourusername/chaos.git
cd chaos

# Install dependencies
pnpm install

# Start development services
pnpm dev
```

## 🏗️ Architecture

C.H.A.O.S. is built as a monorepo with:

- **Frontend**: React, TypeScript, TailwindCSS, Shadcn/UI
- **Backend**: Node.js with Fastify, WebSockets, PostgreSQL, Redis
- **Native App**: Tauri (lightweight alternative to Electron)
- **Shared**: Common types and utilities

## 🧪 Testing

```bash
# Run all tests
pnpm test

# Run frontend tests
pnpm test:frontend

# Run backend tests
pnpm test:backend

# Run e2e tests
pnpm test:e2e
```

## 📝 License

[MIT License](./LICENSE)

## 🙏 Acknowledgements

Inspired by the golden days of MSN Messenger and the community-building capabilities of Discord.
