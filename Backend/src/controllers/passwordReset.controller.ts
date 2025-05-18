// ==========================================================
// 🔑 C.H.A.O.S. PASSWORD RESET CONTROLLER 🔑
// ==========================================================
// █▀█ █▀█ █▀ █▀ █░█░█ █▀█ █▀█ █▀▄   █▀█ █▀▀ █▀ █▀▀ ▀█▀
// █▀▀ █▀█ ▄█ ▄█ ▀▄▀▄▀ █▄█ █▀▄ █▄▀   █▀▄ ██▄ ▄█ ██▄ ░█░
// ==========================================================
// [CODEX-1337] SECURE PASSWORD RESET FLOW
// [CODEX-1337] TOKEN GENERATION AND VALIDATION
// [CODEX-1337] EMAIL NOTIFICATION SYSTEM
// [CODEX-1337] RATE LIMITING FOR SECURITY
// ==========================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';
import { randomBytes } from 'crypto';
import bcrypt from 'bcrypt';
import { sendEmail } from '../services/email';

// Validation schema for password reset request
const requestResetSchema = z.object({
  email: z.string().email('Invalid email format'),
});

// Validation schema for password reset verification
const verifyResetTokenSchema = z.object({
  token: z.string().min(20, 'Invalid reset token'),
  userId: z.string().uuid('Invalid user ID'),
});

// Validation schema for password update
const resetPasswordSchema = z.object({
  token: z.string().min(20, 'Invalid reset token'),
  userId: z.string().uuid('Invalid user ID'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must include uppercase, lowercase, number and special character'
    ),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

/**
 * [CODEX-1337] Request a password reset
 * Generates a secure token and sends an email with reset instructions
 */
export async function requestPasswordReset(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { email } = requestResetSchema.parse(request.body);
    
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        username: true,
      },
    });
    
    if (!user) {
      // For security, don't reveal if the email exists or not
      logger.info({ email }, 'Password reset requested for non-existent email');
      return reply.code(200).send({
        message: 'If your email is registered, you will receive reset instructions',
      });
    }
    
    // Generate a secure random token
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now
    
    // Store the reset token in the database
    await prisma.passwordReset.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });
    
    // Send email with reset instructions
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}&userId=${user.id}`;
    
    await sendEmail({
      to: user.email,
      subject: 'C.H.A.O.S Password Reset',
      html: `
        <h1>Password Reset</h1>
        <p>Hello ${user.username},</p>
        <p>You requested a password reset for your C.H.A.O.S account.</p>
        <p>Click the link below to reset your password. This link will expire in 1 hour.</p>
        <a href="${resetUrl}">Reset Password</a>
        <p>If you didn't request this, please ignore this email or contact support if you're concerned.</p>
      `,
    });
    
    logger.info({ userId: user.id }, 'Password reset token generated and email sent');
    
    return reply.code(200).send({
      message: 'If your email is registered, you will receive reset instructions',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: error.errors[0].message,
      });
    }
    
    logger.error({ error }, 'Error in password reset request');
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Failed to process password reset request',
    });
  }
}

/**
 * [CODEX-1337] Verify a password reset token
 * Checks if the token is valid and not expired
 */
export async function verifyResetToken(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { token, userId } = verifyResetTokenSchema.parse(request.body);
    
    // Find the token in the database
    const resetToken = await prisma.passwordReset.findFirst({
      where: {
        userId,
        token,
        expiresAt: {
          gt: new Date(),
        },
        used: false,
      },
    });
    
    if (!resetToken) {
      return reply.code(400).send({
        error: 'Invalid Token',
        message: 'The reset token is invalid or has expired',
      });
    }
    
    return reply.code(200).send({
      valid: true,
      message: 'Token is valid',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: error.errors[0].message,
      });
    }
    
    logger.error({ error }, 'Error verifying reset token');
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Failed to verify reset token',
    });
  }
}

/**
 * [CODEX-1337] Reset password with token
 * Updates the user's password if the token is valid
 */
export async function resetPassword(request: FastifyRequest, reply: FastifyReply) {
  try {
    const { token, userId, password } = resetPasswordSchema.parse(request.body);
    
    // Find the token in the database
    const resetToken = await prisma.passwordReset.findFirst({
      where: {
        userId,
        token,
        expiresAt: {
          gt: new Date(),
        },
        used: false,
      },
    });
    
    if (!resetToken) {
      return reply.code(400).send({
        error: 'Invalid Token',
        message: 'The reset token is invalid or has expired',
      });
    }
    
    // Hash the new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Update the user's password and mark the token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      }),
      prisma.passwordReset.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
      // Invalidate all sessions for security
      prisma.userSession.deleteMany({
        where: { userId },
      }),
    ]);
    
    logger.info({ userId }, 'Password reset successfully');
    
    return reply.code(200).send({
      message: 'Password has been reset successfully. Please log in with your new password.',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation Error',
        message: error.errors[0].message,
      });
    }
    
    logger.error({ error }, 'Error resetting password');
    return reply.code(500).send({
      error: 'Internal Server Error',
      message: 'Failed to reset password',
    });
  }
}
