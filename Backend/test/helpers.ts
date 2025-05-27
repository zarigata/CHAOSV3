// ==========================================================
// 🔧 C.H.A.O.S. TEST HELPERS 🔧
// ==========================================================
// ▀█▀ █▀▀ █▀ ▀█▀   █░█ █▀▀ █░░ █▀█ █▀▀ █▀█ █▀
// ░█░ ██▄ ▄█ ░█░   █▀█ ██▄ █▄▄ █▀▀ ██▄ █▀▄ ▄█
// ==========================================================
// [CODEX-1337] UTILITY FUNCTIONS FOR TESTING
// [CODEX-1337] SERVER BUILD AND TEARDOWN HELPERS
// [CODEX-1337] AUTH TOKEN GENERATION
// [CODEX-1337] MOCK DATA GENERATORS
// ==========================================================

import { FastifyInstance } from 'fastify';
import { PrismaClient, User, Hub, Channel, Message, UserSession } from '@prisma/client';
import { mockDeep, MockProxy } from 'jest-mock-extended';
import { buildServer } from '../src/index';
import { prisma } from '../src/utils/database';
import jwt from 'jsonwebtoken';

/**
 * [CODEX-1337] Test server instance types
 */
interface TestContext {
  server: FastifyInstance;
  mockPrisma: MockProxy<PrismaClient> & PrismaClient;
}

/**
 * [CODEX-1337] Build test server
 * Creates isolated server instance for test cases
 */
export const buildTestServer = async (): Promise<TestContext> => {
  const server = await buildServer();
  // Cast prisma to the mocked version
  const mockPrisma = prisma as unknown as MockProxy<PrismaClient> & PrismaClient;
  
  return { server, mockPrisma };
};

/**
 * [CODEX-1337] Close test server and resources
 * Ensures clean shutdown of test server
 */
export const closeTestServer = async (server: FastifyInstance): Promise<void> => {
  await server.close();
};

/**
 * [CODEX-1337] Generate auth token for tests
 * Creates fully functional JWT with user data for authenticating test requests
 */
export const generateAuthToken = (userData: Partial<User> = {}): string => {
  const user = {
    id: 'test-user-id',
    email: 'test@example.com',
    username: 'testuser',
    role: 'USER',
    status: 'ONLINE',
    ...userData,
  };
  
  return jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET || 'test_jwt_secret', {
    expiresIn: '1h',
  });
};

/**
 * [CODEX-1337] Mock User generator
 * Creates realistic user data for tests
 */
export const mockUser = (overrides: Partial<User> = {}): User => {
  const now = new Date();
  
  return {
    id: `user-${Math.random().toString(36).substr(2, 9)}`,
    email: `user-${Math.random().toString(36).substr(2, 9)}@example.com`,
    username: `user-${Math.random().toString(36).substr(2, 9)}`,
    displayName: 'Test User',
    password: 'hashed_password_string',
    role: 'USER',
    status: 'ONLINE',
    avatarUrl: null,
    bio: null,
    lastSeen: now,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as User;
};

/**
 * [CODEX-1337] Mock Message generator
 * Creates realistic message data for tests
 */
export const mockMessage = (overrides: Partial<Message> = {}): Message => {
  const now = new Date();
  
  return {
    id: `msg-${Math.random().toString(36).substr(2, 9)}`,
    content: 'Test message content',
    senderId: 'test-sender-id',
    recipientId: 'test-recipient-id',
    channelId: null,
    createdAt: now,
    updatedAt: now,
    isEdited: false,
    isRead: false,
    readAt: null,
    ...overrides,
  } as Message;
};

/**
 * [CODEX-1337] Mock Hub generator
 * Creates realistic hub data for tests
 */
export const mockHub = (overrides: Partial<Hub> = {}): Hub => {
  const now = new Date();
  
  return {
    id: `hub-${Math.random().toString(36).substr(2, 9)}`,
    name: 'Test Hub',
    description: 'A test hub for unit tests',
    iconUrl: null,
    ownerId: 'test-owner-id',
    isPrivate: false,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  } as Hub;
};

/**
 * [CODEX-1337] Setup mock data responses
 * Configures mock Prisma client with predefined responses
 */
export const setupMockPrismaResponses = (
  mockPrisma: MockProxy<PrismaClient> & PrismaClient,
  options: {
    users?: User[];
    messages?: Message[];
    hubs?: Hub[];
  } = {}
): void => {
  const users = options.users || [mockUser()];
  const messages = options.messages || [mockMessage()];
  const hubs = options.hubs || [mockHub()];
  
  // Mock user queries
  mockPrisma.user.findUnique.mockImplementation((args) => {
    const userId = args.where?.id as string;
    const user = users.find((u) => u.id === userId);
    return Promise.resolve(user as User | null);
  });
  
  mockPrisma.user.findFirst.mockImplementation((args) => {
    const email = args.where?.email as string;
    const user = users.find((u) => u.email === email);
    return Promise.resolve(user as User | null);
  });
  
  // Mock message queries
  mockPrisma.message.findMany.mockResolvedValue(messages);
  mockPrisma.message.create.mockImplementation((args) => {
    const newMessage = {
      ...mockMessage(),
      ...args.data,
    };
    return Promise.resolve(newMessage);
  });
  
  // Mock hub queries
  mockPrisma.hub.findUnique.mockImplementation((args) => {
    const hubId = args.where?.id as string;
    const hub = hubs.find((h) => h.id === hubId);
    return Promise.resolve(hub as Hub | null);
  });
  
  mockPrisma.hub.findMany.mockResolvedValue(hubs);
};
