// ==========================================================
// 🧪 C.H.A.O.S. AUTH CONTROLLER TESTS 🧪
// ==========================================================
// █▀█ █░█ ▀█▀ █░█   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █▀█ █░░ █░░ █▀▀ █▀█
// █▀█ █▄█ ░█░ █▀█   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █▄█ █▄▄ █▄▄ ██▄ █▀▄
// ==========================================================
// [CODEX-1337] USER REGISTRATION TEST CASES
// [CODEX-1337] LOGIN AND JWT GENERATION TESTS
// [CODEX-1337] PASSWORD RESET VALIDATION
// [CODEX-1337] INPUT VALIDATION AND ERROR HANDLING
// ==========================================================

import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { MockProxy } from 'jest-mock-extended';
import bcrypt from 'bcrypt';
import { buildTestServer, closeTestServer, mockUser } from '../../helpers';

// Test context interface
interface TestContext {
  server: FastifyInstance;
  mockPrisma: MockProxy<PrismaClient> & PrismaClient;
}

// Test suite for auth controller
describe('Auth Controller', () => {
  let context: TestContext;
  
  // Setup test server before tests
  beforeAll(async () => {
    context = await buildTestServer();
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
  // 🔐 USER REGISTRATION TESTS
  // ==========================================================
  describe('User Registration', () => {
    it('should register a new user successfully', async () => {
      // Setup mock Prisma response
      const hashedPassword = await bcrypt.hash('Password123!', 10);
      const newUser = mockUser({ 
        email: 'newuser@example.com',
        username: 'newuser',
        password: hashedPassword
      });
      
      // Mock user creation in database
      context.mockPrisma.user.create.mockResolvedValueOnce(newUser);
      
      // Mock user check to ensure user doesn't already exist
      context.mockPrisma.user.findFirst.mockResolvedValueOnce(null);
      
      // Test registration request
      const response = await context.server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'Password123!'
        }
      });
      
      // Assert response
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.payload)).toHaveProperty('user');
      expect(JSON.parse(response.payload)).toHaveProperty('token');
      
      // Verify Prisma was called with correct params
      expect(context.mockPrisma.user.create).toHaveBeenCalledTimes(1);
      expect(context.mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          email: 'newuser@example.com',
          username: 'newuser',
          password: expect.any(String) // Hashed password
        })
      });
    });
    
    it('should return error if user already exists', async () => {
      // Mock user already exists
      context.mockPrisma.user.findFirst.mockResolvedValueOnce(mockUser({
        email: 'existing@example.com'
      }));
      
      // Test registration with existing email
      const response = await context.server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'existing@example.com',
          username: 'newuser',
          password: 'Password123!'
        }
      });
      
      // Assert error response
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toHaveProperty('error');
      expect(JSON.parse(response.payload).message).toContain('already exists');
      
      // Verify user was not created
      expect(context.mockPrisma.user.create).not.toHaveBeenCalled();
    });
    
    it('should validate password requirements', async () => {
      // Mock user doesn't exist
      context.mockPrisma.user.findFirst.mockResolvedValueOnce(null);
      
      // Test registration with weak password
      const response = await context.server.inject({
        method: 'POST',
        url: '/api/auth/register',
        payload: {
          email: 'newuser@example.com',
          username: 'newuser',
          password: 'weak'
        }
      });
      
      // Assert validation error
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toHaveProperty('error');
      expect(JSON.parse(response.payload).message).toContain('password');
      
      // Verify user was not created
      expect(context.mockPrisma.user.create).not.toHaveBeenCalled();
    });
  });
  
  // ==========================================================
  // 🔑 USER LOGIN TESTS 
  // ==========================================================
  describe('User Login', () => {
    it('should login user and return token', async () => {
      // Create hashed password and mock user
      const password = 'Password123!';
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const mockUserData = mockUser({
        email: 'test@example.com',
        password: hashedPassword
      });
      
      // Mock user found in database
      context.mockPrisma.user.findFirst.mockResolvedValueOnce(mockUserData);
      
      // Mock session creation
      context.mockPrisma.userSession.create.mockResolvedValueOnce({
        id: 'session-id',
        userId: mockUserData.id,
        refreshToken: 'refresh-token',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        lastActiveAt: new Date(),
        userAgent: 'test-agent',
        ipAddress: '127.0.0.1'
      });
      
      // Test login request
      const response = await context.server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password
        }
      });
      
      // Assert response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload)).toHaveProperty('token');
      expect(JSON.parse(response.payload)).toHaveProperty('refreshToken');
      expect(JSON.parse(response.payload)).toHaveProperty('user');
      
      // Verify session was created
      expect(context.mockPrisma.userSession.create).toHaveBeenCalledTimes(1);
    });
    
    it('should reject login with invalid credentials', async () => {
      // Create hashed password and mock user
      const correctPassword = 'Password123!';
      const wrongPassword = 'WrongPassword123!';
      const hashedPassword = await bcrypt.hash(correctPassword, 10);
      
      const mockUserData = mockUser({
        email: 'test@example.com',
        password: hashedPassword
      });
      
      // Mock user found in database
      context.mockPrisma.user.findFirst.mockResolvedValueOnce(mockUserData);
      
      // Test login with wrong password
      const response = await context.server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'test@example.com',
          password: wrongPassword
        }
      });
      
      // Assert error response
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toHaveProperty('error');
      expect(JSON.parse(response.payload).message).toContain('credentials');
      
      // Verify session was not created
      expect(context.mockPrisma.userSession.create).not.toHaveBeenCalled();
    });
    
    it('should handle non-existent user login attempts', async () => {
      // Mock user not found
      context.mockPrisma.user.findFirst.mockResolvedValueOnce(null);
      
      // Test login with non-existent email
      const response = await context.server.inject({
        method: 'POST',
        url: '/api/auth/login',
        payload: {
          email: 'nonexistent@example.com',
          password: 'Password123!'
        }
      });
      
      // Assert error response
      expect(response.statusCode).toBe(401);
      expect(JSON.parse(response.payload)).toHaveProperty('error');
      expect(JSON.parse(response.payload).message).toContain('credentials');
      
      // Verify lookups and no session creation
      expect(context.mockPrisma.user.findFirst).toHaveBeenCalledTimes(1);
      expect(context.mockPrisma.userSession.create).not.toHaveBeenCalled();
    });
  });
  
  // ==========================================================
  // 🔄 PASSWORD RESET TESTS
  // ==========================================================
  describe('Password Reset', () => {
    it('should initiate password reset successfully', async () => {
      // Mock user found in database
      const mockUserData = mockUser({ email: 'reset@example.com' });
      context.mockPrisma.user.findFirst.mockResolvedValueOnce(mockUserData);
      
      // Mock token creation
      context.mockPrisma.passwordReset.create.mockResolvedValueOnce({
        id: 'reset-token-id',
        userId: mockUserData.id,
        token: 'reset-token',
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour from now
        createdAt: new Date(),
        used: false
      });
      
      // Test password reset request
      const response = await context.server.inject({
        method: 'POST',
        url: '/api/auth/password-reset/request',
        payload: {
          email: 'reset@example.com'
        }
      });
      
      // Assert response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).success).toBeTruthy();
      
      // Verify token was created
      expect(context.mockPrisma.passwordReset.create).toHaveBeenCalledTimes(1);
    });
    
    it('should validate reset token properly', async () => {
      // Mock valid token
      const mockToken = {
        id: 'reset-token-id',
        userId: 'user-id',
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000), // Future date
        createdAt: new Date(),
        used: false
      };
      
      // Mock token found in database
      context.mockPrisma.passwordReset.findFirst.mockResolvedValueOnce(mockToken);
      
      // Test token validation
      const response = await context.server.inject({
        method: 'POST',
        url: '/api/auth/password-reset/validate',
        payload: {
          token: 'valid-token'
        }
      });
      
      // Assert response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).valid).toBeTruthy();
    });
    
    it('should reject expired reset token', async () => {
      // Mock expired token
      const mockToken = {
        id: 'reset-token-id',
        userId: 'user-id',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 3600000), // Past date
        createdAt: new Date(Date.now() - 7200000),
        used: false
      };
      
      // Mock token found in database
      context.mockPrisma.passwordReset.findFirst.mockResolvedValueOnce(mockToken);
      
      // Test token validation
      const response = await context.server.inject({
        method: 'POST',
        url: '/api/auth/password-reset/validate',
        payload: {
          token: 'expired-token'
        }
      });
      
      // Assert response
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.payload)).toHaveProperty('error');
      expect(JSON.parse(response.payload).message).toContain('expired');
    });
    
    it('should reset password with valid token', async () => {
      // Mock user data
      const userId = 'user-id';
      const mockUserData = mockUser({ id: userId });
      
      // Mock valid token
      const mockToken = {
        id: 'reset-token-id',
        userId,
        token: 'valid-token',
        expiresAt: new Date(Date.now() + 3600000), // Future date
        createdAt: new Date(),
        used: false
      };
      
      // Mock token found in database
      context.mockPrisma.passwordReset.findFirst.mockResolvedValueOnce(mockToken);
      
      // Mock user found in database
      context.mockPrisma.user.findUnique.mockResolvedValueOnce(mockUserData);
      
      // Mock user update
      context.mockPrisma.user.update.mockResolvedValueOnce({
        ...mockUserData,
        password: 'new-hashed-password'
      });
      
      // Mock token update (mark as used)
      context.mockPrisma.passwordReset.update.mockResolvedValueOnce({
        ...mockToken,
        used: true
      });
      
      // Test password reset
      const response = await context.server.inject({
        method: 'POST',
        url: '/api/auth/password-reset/reset',
        payload: {
          token: 'valid-token',
          newPassword: 'NewSecurePassword123!'
        }
      });
      
      // Assert response
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.payload).success).toBeTruthy();
      
      // Verify password was updated
      expect(context.mockPrisma.user.update).toHaveBeenCalledTimes(1);
      expect(context.mockPrisma.passwordReset.update).toHaveBeenCalledTimes(1);
      expect(context.mockPrisma.passwordReset.update).toHaveBeenCalledWith({
        where: { token: 'valid-token' },
        data: { used: true }
      });
    });
  });
});
