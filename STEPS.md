# 🧭 Development Roadmap: C.H.A.O.S.

---

## Phase 1: Project Setup

### 1.1 Initialize Monorepo
- [x] Use pnpm / TurboRepo
- [x] Create `frontend`, `backend`, `shared`

### 1.2 Setup Versioning/CI
- [x] GitHub repo with actions for lint/build/test
- [x] ESLint, Prettier, Commitlint

---

## Phase 2: Backend API

### 2.1 Init Backend
- [ ] Fastify/NestJS scaffolding
- [ ] Health route
- [ ] Swagger doc integration

### 2.2 Auth System
- [ ] Register/Login (JWT + refresh token)
- [ ] Password hashing (bcrypt)
- [ ] Token refresh endpoint

### 2.3 User Management
- [ ] Get user data
- [ ] Update profile, avatar, status
- [ ] Delete account

### 2.4 Real-Time WebSocket Layer
- [ ] WS server setup
- [ ] Online presence
- [ ] Real-time messages

### 2.5 DMs and Groups
- [ ] Message schema (Prisma)
- [ ] Send/receive messages
- [ ] Group creation/invites
- [ ] Hub/channel architecture

### 2.6 Deploy Backend
- [ ] Docker + Docker Compose
- [ ] Setup SSL
- [ ] PostgreSQL
- [ ] PM2/Nginx

---

## Phase 3: Frontend

### 3.1 Base Setup
- [x] Vite + React + TS
- [x] Tailwind + Shadcn
- [x] Theme system

### 3.2 Layout
- [x] Left-side navigation (à la MSN)
- [x] Top profile bar
- [x] Central chat view
- [x] Component folder architecture

### 3.3 Messaging
- [x] Send/receive text messages
- [x] Typing indicator
- [x] Emoji picker
- [x] Status badge

### 3.4 Groups/Hubs
- [x] Hub page layout
- [x] Channel system
- [x] Member viewing
- [x] Create hub form
- [ ] Hub invitation system
- [ ] Moderation features

### 3.5 Real-time Integration
- [ ] Connect WebSocket
- [ ] Update UI with live data
- [ ] Online/offline detection

### 3.6 Native App
- [ ] Integrate with Tauri
- [ ] Auto-updates
- [ ] System tray support

---

## Phase 4: Testing

### 4.1 Backend
- [ ] Unit: Jest
- [ ] API: Supertest
- [ ] Auth, messages, errors

### 4.2 Frontend
- [ ] Component: Vitest
- [ ] Integration: React Testing Library
- [ ] E2E: Playwright

---

## Phase 5: Finalization

- [ ] Polish UI/UX
- [ ] Add sound effects, animations
- [ ] Optimize bundles
- [ ] Setup CI/CD pipelines
- [ ] Write user docs

---

## Current Progress Summary
<!-- [CODEX-1337] ALPHA RELEASE PROGRESS TRACKING -->

**Frontend (75% complete):**
- ✅ All core UI components implemented
- ✅ MSN-inspired layouts and styling
- ✅ Message and chat components
- ✅ Hub page and channel components
- ✅ Create hub form with multi-step process
- 🔄 Pending backend integration

**Backend (0% complete):**
- 🚀 Architecture designed
- 🚀 Next priority for implementation
- 🚀 Will focus on authentication first

**Next Tasks:**
1. Begin backend implementation with Fastify
2. Create database models with Prisma
3. Implement WebSocket connection for real-time features
4. Connect frontend to backend API
