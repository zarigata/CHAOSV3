// ==========================================================
// 🧪 C.H.A.O.S. E2E USER MESSAGING FLOW TEST 🧪
// ==========================================================
// █▀▀ █▄░█ █▀▄   ▀█▀ █▀█   █▀▀ █▄░█ █▀▄   █▀▀ █░░ █▀█ █░█░█
// ██▄ █░▀█ █▄▀   ░█░ █▄█   ██▄ █░▀█ █▄▀   █▀░ █▄▄ █▄█ ▀▄▀▄▀
// ==========================================================
// [CODEX-1337] COMPLETE USER JOURNEY TESTING
// [CODEX-1337] REGISTRATION TO MESSAGE DELIVERY
// [CODEX-1337] AUTHENTICATED API INTERACTIONS
// [CODEX-1337] CROSS-PLATFORM COMPATIBILITY
// ==========================================================

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MockProxy } from 'jest-mock-extended';
import { Socket, io as ioClient } from 'socket.io-client';
import { buildTestServer, closeTestServer, mockUser } from '../../helpers';
import bcrypt from 'bcrypt';
import path from 'path';
import * as os from 'os';

// Test context interface
interface TestContext {
  server: FastifyInstance;
  mockPrisma: MockProxy<PrismaClient> & PrismaClient;
}

/**
 * [CODEX-1337] Cross-platform path normalization
 * Ensures test paths work on both Windows and Linux
 */
const normalizePath = (filePath: string): string => {
  return filePath.replace(/\\/g, path.sep).replace(/\//g, path.sep);
};

describe('E2E User Messaging Flow', () => {
  let context: TestContext;
  let authToken: string;
  let refreshToken: string;
  
  // User data for testing
  const testUser = {
    email: 'e2e-test@example.com',
    username: 'e2etester',
    password: 'SecurePassword123!'
  };
  
  const recipientUser = mockUser({
    id: 'recipient-id',
    email: 'recipient@example.com',
    username: 'recipient'
  });
  
  // Setup test server before tests
  beforeAll(async () => {
    context = await buildTestServer();
    
    // Mock Socket.IO connection
    jest.mock('socket.io', () => {
      return {
        Server: jest.fn(() => ({
          on: jest.fn(),
          to: jest.fn().mockReturnThis(),
          emit: jest.fn(),
        })),
      };
    });
  });
  
  // Close server after tests
  afterAll(async () => {
    await closeTestServer(context.server);
  });
  
  // Reset mocks between tests
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  // ==========================================================
  // 🧑‍💻 COMPLETE USER FLOW
  // ==========================================================
  
  /**
   * [CODEX-1337] This test simulates a complete user journey:
   * 1. User registers an account
   * 2. User logs in and gets tokens
   * 3. User sends a direct message
   * 4. User creates a hub
   * 5. User refreshes their session
   */
  it('should complete full user journey from registration to messaging', async () => {
    // Step 1: Register a new user
    // ================================
    
    // Setup mock responses for registration
    const hashedPassword = await bcrypt.hash(testUser.password, 10);
    const newUser = mockUser({
      email: testUser.email,
      username: testUser.username,
      password: hashedPassword
    });
    
    // Mock user check (user doesn't exist yet)
    context.mockPrisma.user.findFirst.mockResolvedValueOnce(null);
    
    // Mock user creation
    context.mockPrisma.user.create.mockResolvedValueOnce(newUser);
    
    // Perform registration request
    console.log('📝 Registering new user...');
    const registerResponse = await context.server.inject({
      method: 'POST',
      url: '/api/auth/register',
      payload: testUser
    });
    
    // Verify registration success
    expect(registerResponse.statusCode).toBe(201);
    const registerData = JSON.parse(registerResponse.payload);
    expect(registerData).toHaveProperty('token');
    expect(registerData).toHaveProperty('user');
    expect(registerData.user.email).toBe(testUser.email);
    
    // Capture registration token for later tests
    const registrationToken = registerData.token;
    console.log('✅ Registration successful');
    
    // Step 2: Login with the created user
    // ================================
    
    // Mock user found in database for login
    context.mockPrisma.user.findFirst.mockResolvedValueOnce(newUser);
    
    // Mock session creation
    context.mockPrisma.userSession.create.mockResolvedValueOnce({
      id: 'session-id',
      userId: newUser.id,
      refreshToken: 'test-refresh-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(),
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1'
    });
    
    // Perform login request
    console.log('🔑 Logging in...');
    const loginResponse = await context.server.inject({
      method: 'POST',
      url: '/api/auth/login',
      payload: {
        email: testUser.email,
        password: testUser.password
      }
    });
    
    // Verify login success
    expect(loginResponse.statusCode).toBe(200);
    const loginData = JSON.parse(loginResponse.payload);
    expect(loginData).toHaveProperty('token');
    expect(loginData).toHaveProperty('refreshToken');
    
    // Capture tokens for authenticated requests
    authToken = loginData.token;
    refreshToken = loginData.refreshToken;
    console.log('✅ Login successful');
    
    // Step 3: Send a direct message
    // ================================
    
    // Mock recipient user existence check
    context.mockPrisma.user.findUnique.mockResolvedValueOnce(recipientUser);
    
    // Mock message creation
    const messageContent = 'Hello from E2E test!';
    const newMessage = {
      id: 'msg-id',
      content: messageContent,
      senderId: newUser.id,
      recipientId: recipientUser.id,
      channelId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      isEdited: false,
      isRead: false,
      readAt: null
    };
    
    context.mockPrisma.message.create.mockResolvedValueOnce(newMessage);
    
    // Send direct message
    console.log('💬 Sending direct message...');
    const messageResponse = await context.server.inject({
      method: 'POST',
      url: '/api/messages/dm',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: {
        recipientId: recipientUser.id,
        content: messageContent
      }
    });
    
    // Verify message sent successfully
    expect(messageResponse.statusCode).toBe(201);
    const messageData = JSON.parse(messageResponse.payload);
    expect(messageData).toHaveProperty('id');
    expect(messageData.content).toBe(messageContent);
    console.log('✅ Message sent successfully');
    
    // Step 4: Create a new hub
    // ================================
    
    // Mock hub creation
    const hubData = {
      name: 'E2E Test Hub',
      description: 'Hub created during E2E testing'
    };
    
    const newHub = {
      id: 'hub-id',
      name: hubData.name,
      description: hubData.description,
      iconUrl: null,
      ownerId: newUser.id,
      isPrivate: false,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Mock hub creation
    context.mockPrisma.hub.create.mockResolvedValueOnce(newHub);
    
    // Create default channel
    context.mockPrisma.channel.create.mockResolvedValueOnce({
      id: 'channel-id',
      name: 'general',
      hubId: newHub.id,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Mock hub member creation (owner)
    context.mockPrisma.hubMember.create.mockResolvedValueOnce({
      id: 'member-id',
      userId: newUser.id,
      hubId: newHub.id,
      role: 'OWNER',
      joinedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create hub
    console.log('🏢 Creating new hub...');
    const hubResponse = await context.server.inject({
      method: 'POST',
      url: '/api/hubs',
      headers: {
        authorization: `Bearer ${authToken}`
      },
      payload: hubData
    });
    
    // Verify hub created successfully
    expect(hubResponse.statusCode).toBe(201);
    const hubResponseData = JSON.parse(hubResponse.payload);
    expect(hubResponseData).toHaveProperty('id');
    expect(hubResponseData.name).toBe(hubData.name);
    expect(hubResponseData.ownerId).toBe(newUser.id);
    console.log('✅ Hub created successfully');
    
    // Step 5: Refresh authentication token
    // ================================
    
    // Mock user session for refresh token
    context.mockPrisma.userSession.findFirst.mockResolvedValueOnce({
      id: 'session-id',
      userId: newUser.id,
      refreshToken,
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(),
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1'
    });
    
    // Mock user retrieval
    context.mockPrisma.user.findUnique.mockResolvedValueOnce(newUser);
    
    // Mock session update
    context.mockPrisma.userSession.update.mockResolvedValueOnce({
      id: 'session-id',
      userId: newUser.id,
      refreshToken: 'new-refresh-token',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      lastActiveAt: new Date(),
      userAgent: 'test-agent',
      ipAddress: '127.0.0.1'
    });
    
    // Refresh token
    console.log('🔄 Refreshing authentication token...');
    const refreshResponse = await context.server.inject({
      method: 'POST',
      url: '/api/auth/refresh',
      payload: {
        refreshToken
      }
    });
    
    // Verify token refresh successful
    expect(refreshResponse.statusCode).toBe(200);
    const refreshData = JSON.parse(refreshResponse.payload);
    expect(refreshData).toHaveProperty('token');
    expect(refreshData).toHaveProperty('refreshToken');
    console.log('✅ Token refreshed successfully');
    
    // Complete user journey successfully
    console.log('🎉 E2E User flow completed successfully!');
  });
});
