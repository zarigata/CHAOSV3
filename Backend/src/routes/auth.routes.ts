// ==========================================================
// 🔑 C.H.A.O.S. AUTHENTICATION ROUTES 🔑
// ==========================================================
// █▀█ █░█ ▀█▀ █▄▀ █▀▀ ██▄ ▀█▀ █░█ ▀█▀ █░█ █▄▄ ██▄
// █▀▄ █▄█ ░█░ █▀█ ██▄ █ₐ▄ ░█░ █▄█ ░█░ █▄█ ▆░▆ ▀▄█
// ==========================================================
// [CODEX-1337] SECURE JWT-BASED AUTH SYSTEM WITH REFRESH TOKENS
// [CODEX-1337] REGISTER, LOGIN, TOKEN REFRESH, LOGOUT ENDPOINTS
// [CODEX-1337] PASSWORD HASHING AND VALIDATION WITH BCRYPT
// [CODEX-1337] ACCOUNT MANAGEMENT AND PROFILE UPDATES
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaClient } from '@prisma/client';
import { authLogger as logger } from '../utils/logger';

// Import controllers
import { 
  registerUser,
  loginUser,
  refreshToken,
  logoutUser,
  updateUserProfile,
  getUserProfile,
  deleteAccount
} from '../controllers/user.controller';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * [CODEX-1337] Authentication routes for user registration, login, and management
 * [CODEX-1337] Implements secure JWT authentication with refresh tokens
 */
export async function authRoutes(fastify: FastifyInstance): Promise<void> {
  // Register all authentication routes within this context
  fastify.register(async (routes: FastifyInstance) => {
    // User registration and authentication
    routes.post('/register', registerUser);
    routes.post('/login', loginUser);
    routes.post('/refresh', refreshToken);
    routes.post('/logout', logoutUser);
    
    // Protected routes that require authentication
    routes.register(async (protectedRoutes: FastifyInstance) => {
      protectedRoutes.addHook('onRequest', fastify.authenticate);
      
      // User profile management
      protectedRoutes.get('/profile', getUserProfile);
      protectedRoutes.put('/profile', updateUserProfile);
      protectedRoutes.delete('/account', deleteAccount);
    });
  });
  
  // Store the original auth routes for reference
  // ==========================================================
  // 📝 ORIGINAL VALIDATION SCHEMAS AND IMPLEMENTATIONS
  // ==========================================================
  
  // Register request validation schema
  const registerSchema = z.object({
    email: z.string().email('Invalid email format'),
    username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username cannot exceed 20 characters')
      .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z.string().min(8, 'Password must be at least 8 characters')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, 
        'Password must include at least one uppercase letter, one lowercase letter, one number, and one special character'),
    displayName: z.string().min(1).max(50).optional(),
  });

  // Login request validation schema
  const loginSchema = z.object({
    emailOrUsername: z.string().min(1, 'Email or username is required'),
    password: z.string().min(1, 'Password is required'),
  });

  // Refresh token validation schema
  const refreshSchema = z.object({
    refreshToken: z.string().min(1, 'Refresh token is required'),
  });

  // ==========================================================
  // 📊 ROUTE HANDLERS
  // ==========================================================

  // Register a new user
  fastify.post('/register', {
    schema: {
      body: registerSchema,
      response: {
        201: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            displayName: { type: 'string' },
            createdAt: { type: 'string' },
          },
        },
        400: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        409: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { email, username, password, displayName } = registerSchema.parse(request.body);
      
      // Check if email already exists
      const existingEmail = await prisma.user.findUnique({ where: { email } });
      if (existingEmail) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'Email already exists',
        });
      }
      
      // Check if username already exists
      const existingUsername = await prisma.user.findUnique({ where: { username } });
      if (existingUsername) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'Username already exists',
        });
      }
      
      // Hash password
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Create new user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          passwordHash,
          displayName: displayName || username,
          status: 'OFFLINE',
        },
      });
      
      logger.info({ userId: user.id }, 'New user registered');
      
      return reply.status(201).send({
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        createdAt: user.createdAt.toISOString(),
      });
    } catch (err) {
      logger.error({ err }, 'Registration failed');
      
      if (err instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: err.errors[0].message,
        });
      }
      
      throw err;
    }
  });

  // Login user
  fastify.post('/login', {
    schema: {
      body: loginSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            user: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                username: { type: 'string' },
                email: { type: 'string' },
                displayName: { type: 'string' },
                avatarUrl: { type: 'string', nullable: true },
              },
            },
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
        400: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        401: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { emailOrUsername, password } = loginSchema.parse(request.body);
      
      // Find user by email or username
      const user = await prisma.user.findFirst({
        where: {
          OR: [
            { email: emailOrUsername },
            { username: emailOrUsername },
          ],
        },
      });
      
      // If user not found or password invalid
      if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid credentials',
        });
      }
      
      // Generate access token - short lived (15 minutes)
      const accessToken = fastify.jwt.sign(
        { userId: user.id, username: user.username },
        { expiresIn: '15m' }
      );
      
      // Generate refresh token - longer lived (7 days)
      const refreshToken = uuidv4();
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // 7 days from now
      
      // Get client info
      const userAgent = request.headers['user-agent'] || 'unknown';
      const ipAddress = request.ip || 'unknown';
      
      // Store refresh token in database
      await prisma.userSession.create({
        data: {
          userId: user.id,
          refreshToken,
          expiresAt,
          userAgent,
          ipAddress,
        },
      });
      
      logger.info({ userId: user.id }, 'User logged in successfully');
      
      return {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          displayName: user.displayName || user.username,
          avatarUrl: user.avatarUrl,
        },
        accessToken,
        refreshToken,
        expiresIn: 900, // 15 minutes in seconds
      };
    } catch (err) {
      logger.error({ err }, 'Login failed');
      
      if (err instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: err.errors[0].message,
        });
      }
      
      throw err;
    }
  });

  // Refresh access token
  fastify.post('/refresh', {
    schema: {
      body: refreshSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            expiresIn: { type: 'number' },
          },
        },
        401: {
          type: 'object',
          properties: {
            statusCode: { type: 'number' },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { refreshToken } = refreshSchema.parse(request.body);
      
      // Find valid session by refresh token
      const session = await prisma.userSession.findFirst({
        where: {
          refreshToken,
          expiresAt: {
            gt: new Date(), // Not expired
          },
        },
        include: {
          user: true,
        },
      });
      
      // If session not found or expired
      if (!session) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Invalid or expired refresh token',
        });
      }
      
      // Generate new access token
      const accessToken = fastify.jwt.sign(
        { userId: session.user.id, username: session.user.username },
        { expiresIn: '15m' }
      );
      
      // Update session last active time
      await prisma.userSession.update({
        where: { id: session.id },
        data: { lastActiveAt: new Date() },
      });
      
      logger.info({ userId: session.userId }, 'Access token refreshed');
      
      return {
        accessToken,
        expiresIn: 900, // 15 minutes in seconds
      };
    } catch (err) {
      logger.error({ err }, 'Token refresh failed');
      
      if (err instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: err.errors[0].message,
        });
      }
      
      throw err;
    }
  });

  // Logout user
  fastify.post('/logout', {
    schema: {
      body: refreshSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            message: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    try {
      const { refreshToken } = refreshSchema.parse(request.body);
      
      // Delete the session with this refresh token
      const result = await prisma.userSession.deleteMany({
        where: { refreshToken },
      });
      
      if (result.count > 0) {
        logger.info('User logged out successfully');
      } else {
        logger.warn('Logout attempted with invalid refresh token');
      }
      
      return { message: 'Successfully logged out' };
    } catch (err) {
      logger.error({ err }, 'Logout failed');
      
      if (err instanceof z.ZodError) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: err.errors[0].message,
        });
      }
      
      throw err;
    }
  });
  
  // Check if current session is valid (protected route example)
  fastify.get('/me', {
    onRequest: [fastify.authenticate],
    schema: {
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            username: { type: 'string' },
            email: { type: 'string' },
          },
        },
      },
    },
  }, async (request, reply) => {
    // The user is already authenticated by the middleware
    const userId = request.user.userId;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
      },
    });
    
    if (!user) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
      });
    }
    
    return user;
  });
};

// ==========================================================
// 🔐 JWT AUTHENTICATION PLUGIN
// ==========================================================

// Helper function to add authenticate decorator to fastify instance
export const configureAuthPlugin = (fastify: FastifyInstance): void => {
  // Add authentication decorator
  fastify.decorate('authenticate', async (request: any, reply: any) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      });
    }
  });
};
