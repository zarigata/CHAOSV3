// ==========================================================
// 🧪 C.H.A.O.S. TEST SETUP 🧪
// ==========================================================
// █▀▀ █░░ █▀█ █▄▄ █▀█ █░░   ▀█▀ █▀▀ █▀ ▀█▀   █▀ █▀▀ ▀█▀ █░█ █▀█
// █▄█ █▄▄ █▄█ █▄█ █▀█ █▄▄   ░█░ ██▄ ▄█ ░█░   ▄█ ██▄ ░█░ █▄█ █▀▀
// ==========================================================
// [CODEX-1337] JEST GLOBAL SETUP CONFIGURATION
// [CODEX-1337] MOCK DATABASE AND ENVIRONMENT INITIALIZATION
// [CODEX-1337] CROSS-PLATFORM TESTING COMPATIBILITY
// [CODEX-1337] PRISMA CLIENT MOCKING AND ISOLATION
// ==========================================================

import dotenv from 'dotenv';
import path from 'path';
import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset } from 'jest-mock-extended';
import { createRedisInstance } from '../src/services/redis';

// Mock for Redis
jest.mock('../src/services/redis', () => ({
  createRedisInstance: jest.fn(),
  connectRedis: jest.fn().mockResolvedValue(undefined),
  disconnectRedis: jest.fn().mockResolvedValue(undefined),
  getRedisClient: jest.fn().mockReturnValue({
    get: jest.fn(),
    set: jest.fn(),
    del: jest.fn(),
    expire: jest.fn(),
    exists: jest.fn().mockResolvedValue(0),
  }),
}));

// Mock for nodemailer
jest.mock('nodemailer', () => ({
  createTransport: jest.fn().mockReturnValue({
    sendMail: jest.fn().mockImplementation((mailOptions) => {
      return Promise.resolve({
        messageId: 'mock-message-id',
        envelope: {},
        accepted: [mailOptions.to],
        rejected: [],
        pending: [],
        response: 'mock-response'
      });
    }),
  }),
  getTestMessageUrl: jest.fn().mockReturnValue('https://ethereal.email/mock-message-url'),
}));

// Mock for Prisma
jest.mock('../src/utils/database', () => {
  const mockPrismaClient = mockDeep<PrismaClient>();
  return {
    prisma: mockPrismaClient,
    disconnectPrisma: jest.fn(),
    connectPrisma: jest.fn().mockResolvedValue(undefined),
  };
});

/**
 * [CODEX-1337] Load test environment variables
 * Ensures testing uses isolated configuration
 */
const loadTestEnv = () => {
  // Load test environment variables
  const testEnvPath = path.resolve(__dirname, '../.env.test');
  dotenv.config({ path: testEnvPath });
  
  // Fall back to regular .env if .env.test doesn't exist
  if (!process.env.DATABASE_URL) {
    dotenv.config();
    // Force test database if using regular env
    if (process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('_test')) {
      // Make sure we're using a test database
      process.env.DATABASE_URL = process.env.DATABASE_URL.replace(
        /\/([^/]*)(\?.*)?$/,
        '/${1}_test$2'
      );
    }
  }
  
  // Override env vars for testing
  process.env.NODE_ENV = 'test';
  process.env.JWT_SECRET = 'test_jwt_secret';
  process.env.REFRESH_TOKEN_SECRET = 'test_refresh_secret';
  process.env.LOG_LEVEL = 'error'; // Minimal logging during tests
};

/**
 * [CODEX-1337] Reset mocks between tests
 * Ensures test isolation
 */
beforeEach(() => {
  mockReset(jest.mocked(createRedisInstance));
});

/**
 * [CODEX-1337] Global setup executed once before any tests
 */
beforeAll(() => {
  loadTestEnv();
  
  // Increase the timeout for async operations
  jest.setTimeout(30000);
  
  // Suppress console output during tests
  // Comment out for debugging
  global.console = {
    ...console,
    log: jest.fn(),
    info: jest.fn(),
    debug: jest.fn(),
    // Keep error and warn for test debugging
  };
  
  // Cross-platform path normalization for tests
  global.normalizePath = (filePath: string): string => {
    return filePath.replace(/\\/g, '/');
  };
});

/**
 * [CODEX-1337] Global teardown executed after all tests
 */
afterAll(async () => {
  // Cleanup resources if needed
});

// Export test utilities
export * from './helpers';
