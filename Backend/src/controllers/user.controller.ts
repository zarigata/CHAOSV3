// ==========================================================
// 👤 C.H.A.O.S. USER CONTROLLER 👤
// ==========================================================
// █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █▀█ █░░ █░░ █▀▀ █▀█
// █▄▄ █▄█ █░▀█ ░█░ █▀▄ █▄█ █▄▄ █▄▄ ██▄ █▀▄
// ==========================================================
// [CODEX-1337] THIS MODULE HANDLES USER ACCOUNT OPERATIONS
// [CODEX-1337] INCLUDES REGISTRATION, LOGIN, PROFILE UPDATES
// [CODEX-1337] IMPLEMENTS SECURE PASSWORD HANDLING (BCRYPT)
// [CODEX-1337] CREATES AND VALIDATES JWT FOR AUTHENTICATION
// ==========================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { UserStatus } from '@prisma/client';
import { randomUUID } from 'crypto';

// Initialize Prisma client
const prisma = new PrismaClient();

// ==========================================================
// 📊 VALIDATION SCHEMAS
// ==========================================================

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email address format' }),
  username: z
    .string()
    .min(3, { message: 'Username must be at least 3 characters long' })
    .max(20, { message: 'Username cannot exceed 20 characters' })
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Username can only contain letters, numbers, and underscores',
    }),
  password: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  displayName: z.string().min(1).max(50).optional(),
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string(),
});

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  statusMessage: z.string().max(100).optional(),
  status: z.enum(['ONLINE', 'AWAY', 'BUSY', 'INVISIBLE', 'OFFLINE']).optional(),
  avatarUrl: z.string().url().optional(),
});

const updatePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z
    .string()
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
      message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

// ==========================================================
// 🔐 AUTH CONTROLLERS
// ==========================================================

/**
 * Register a new user
 */
export const registerUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Validate request body
    const { email, username, password, displayName } = registerSchema.parse(request.body);

    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return reply.code(409).send({ error: 'Email already registered' });
      }
      return reply.code(409).send({ error: 'Username already taken' });
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName: displayName || username,
        status: 'OFFLINE' as UserStatus,
      },
    });

    // Generate JWT token
    const token = await reply.jwtSign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      { expiresIn: '1h' }
    );

    // Generate refresh token
    const refreshToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    // Store refresh token
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
        userAgent: request.headers['user-agent'] || '',
        ipAddress: request.ip,
      },
    });

    // Return success with user data and tokens
    return reply.code(201).send({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        avatarUrl: user.avatarUrl,
        statusMessage: user.statusMessage,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error during registration' });
  }
};

/**
 * Login user and create session
 */
export const loginUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    // Validate request body
    const { username, password } = loginSchema.parse(request.body);

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username },
          { email: username }, // Allow login with email as well
        ],
      },
    });

    if (!user) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.passwordHash);
    if (!passwordValid) {
      return reply.code(401).send({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = await reply.jwtSign(
      {
        id: user.id,
        username: user.username,
        email: user.email,
      },
      { expiresIn: '1h' }
    );

    // Generate refresh token
    const refreshToken = randomUUID();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    // Store refresh token
    await prisma.userSession.create({
      data: {
        userId: user.id,
        refreshToken,
        expiresAt,
        userAgent: request.headers['user-agent'] || '',
        ipAddress: request.ip,
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'ONLINE' },
    });

    // Return success with user data and tokens
    return reply.code(200).send({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        status: 'ONLINE',
        avatarUrl: user.avatarUrl,
        statusMessage: user.statusMessage,
        createdAt: user.createdAt,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error during login' });
  }
};

/**
 * Log out user and invalidate session
 */
export const logoutUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const refreshToken = request.headers['x-refresh-token'] as string;

    if (!refreshToken) {
      return reply.code(400).send({ error: 'Refresh token is required' });
    }

    // Delete the session
    await prisma.userSession.deleteMany({
      where: {
        userId,
        refreshToken,
      },
    });

    // Update user status
    await prisma.user.update({
      where: { id: userId },
      data: { status: 'OFFLINE' },
    });

    return reply.code(200).send({ message: 'Logged out successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error during logout' });
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshToken = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const refreshToken = request.headers['x-refresh-token'] as string;

    if (!refreshToken) {
      return reply.code(400).send({ error: 'Refresh token is required' });
    }

    // Find session by refresh token
    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken,
        expiresAt: {
          gt: new Date(),
        },
      },
      include: {
        user: true,
      },
    });

    if (!session) {
      return reply.code(401).send({ error: 'Invalid or expired refresh token' });
    }

    // Generate new JWT token
    const token = await reply.jwtSign(
      {
        id: session.user.id,
        username: session.user.username,
        email: session.user.email,
      },
      { expiresIn: '1h' }
    );

    // Update session last active time
    await prisma.userSession.update({
      where: { id: session.id },
      data: { lastActiveAt: new Date() },
    });

    return reply.code(200).send({ token });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error during token refresh' });
  }
};

// ==========================================================
// 👤 USER PROFILE CONTROLLERS
// ==========================================================

/**
 * Get current user profile
 */
export const getCurrentUser = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    return reply.code(200).send({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        avatarUrl: user.avatarUrl,
        statusMessage: user.statusMessage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error fetching user profile' });
  }
};

/**
 * Get user profile by ID or username
 */
export const getUserProfile = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { id },
          { username: id },
        ],
      },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Don't expose email for privacy
    return reply.code(200).send({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        status: user.status,
        avatarUrl: user.avatarUrl,
        statusMessage: user.statusMessage,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error fetching user profile' });
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const updates = updateProfileSchema.parse(request.body);

    const user = await prisma.user.update({
      where: { id: userId },
      data: updates,
    });

    return reply.code(200).send({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        displayName: user.displayName,
        status: user.status,
        avatarUrl: user.avatarUrl,
        statusMessage: user.statusMessage,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error updating user profile' });
  }
};

/**
 * Update user password
 */
export const updatePassword = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { currentPassword, newPassword } = updatePasswordSchema.parse(request.body);

    // Get user with current password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return reply.code(404).send({ error: 'User not found' });
    }

    // Verify current password
    const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!passwordValid) {
      return reply.code(401).send({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    return reply.code(200).send({ message: 'Password updated successfully' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({ 
        error: 'Validation failed', 
        details: error.errors 
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error updating password' });
  }
};

/**
 * Delete user account
 */
export const deleteAccount = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;

    // Delete all user sessions
    await prisma.userSession.deleteMany({
      where: { userId },
    });

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return reply.code(200).send({ message: 'Account deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error deleting account' });
  }
};
