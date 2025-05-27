// ==========================================================
// 🔐 C.H.A.O.S. AUTHENTICATION MIDDLEWARE 🔐
// ==========================================================
// █▀█ █░█ ▀█▀ █░█   █▀▄▀█ █ █▀▄ █▀▄ █░░ █▀▀ █░█░█ █▀█ █▀█ █▀▀
// █▀█ █▄█ ░█░ █▀█   █░▀░█ █ █▄▀ █▄▀ █▄▄ ██▄ ▀▄▀▄▀ █▀█ █▀▄ ██▄
// ==========================================================
// [CODEX-1337] JWT AUTHENTICATION VERIFICATION MIDDLEWARE
// [CODEX-1337] TOKEN VALIDATION AND USER SESSION HANDLING
// [CODEX-1337] ROLE-BASED ACCESS CONTROL MECHANISMS
// [CODEX-1337] SECURITY HARDENING AND ATTACK PREVENTION
// ==========================================================
// 🔐 RATE LIMITING - PROTECT API FROM ABUSE
// ==========================================================

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import '@fastify/jwt';
import rateLimit from '@fastify/rate-limit';

// [CODEX-1337] Type declarations for Fastify JWT extensions
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { 
      userId: string;
      [key: string]: any;
    };
    user: {
      userId: string;
      status?: string;
      role?: string;
      [key: string]: any;
    };
  }
}

// [CODEX-1337] Add custom decorators to FastifyInstance
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    authorize: (requiredRoles: string[]) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}
import fp from 'fastify-plugin';
import { prisma } from '../utils/database';
import { logger } from '../utils/logger';

/**
 * [CODEX-1337] Authentication Plugin
 * Adds JWT verification and user authentication to Fastify
 */
export const authPlugin = fp(async (fastify: FastifyInstance) => {
  // Add authenticate decorator to validate JWT tokens
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      // Verify JWT token
      await request.jwtVerify();
      
      // Extract user ID from verified token
      const userId = request.user.userId;
      
      if (!userId) {
        throw new Error('Invalid token payload: missing userId');
      }
      
      // Check if user exists in database (optional, adds extra security)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, status: true },
      });
      
      if (!user) {
        logger.warn({ userId }, 'Authentication failed: User not found');
        return reply.code(401).send({ 
          error: 'Unauthorized',
          message: 'Authentication failed' 
        });
      }
      
      // Add user details to request for further use
      request.user = {
        ...request.user,
        status: user.status
      };
      
    } catch (err) {
      logger.warn({ err, path: request.url }, 'Authentication failed: Invalid token');
      return reply.code(401).send({ 
        error: 'Unauthorized',
        message: 'Authentication required' 
      });
    }
  });
  
  /**
   * [CODEX-1337] Role-based authorization middleware
   * Verifies user has required role(s) for protected resources
   * @param requiredRoles Array of roles that can access the resource
   */
  fastify.decorate('authorize', (requiredRoles: string[]) => {
    return async (request: FastifyRequest, reply: FastifyReply) => {
      try {
        // First ensure user is authenticated
        await fastify.authenticate(request, reply);
        
        // If authentication passed, check roles
        const userId = request.user.userId;
        
        // Get user with roles from database
        const params = request.params as { hubId?: string };
        const hubId = params.hubId;
        
        if (!hubId) {
          logger.warn({ userId }, 'Authorization failed: Missing hubId parameter');
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Missing required parameter: hubId'
          });
        }
        
        const user = await prisma.user.findUnique({
          where: { id: userId },
          include: {
            memberships: {
              where: {
                hubId,
              },
              select: {
                role: true,
              },
            },
          },
        });
        
        // Extract user's role in the current hub context
        const userRole = user?.memberships[0]?.role;
        
        if (!userRole || !requiredRoles.includes(userRole)) {
          logger.warn({ userId, requiredRoles, userRole }, 'Authorization failed: Insufficient permissions');
          return reply.code(403).send({
            error: 'Forbidden',
            message: 'You do not have permission to access this resource'
          });
        }
        
        // Add role to request for further use
        request.user.role = userRole;
        
      } catch (err) {
        // Authentication errors are already handled by authenticate decorator
        if (reply.sent) return;
        
        logger.error({ err, path: request.url }, 'Authorization error');
        return reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An error occurred during authorization'
        });
      }
    };
  });
});

/**
 * [CODEX-1337] Rate limiting middleware
 * Prevents abuse by limiting request frequency
 */
export const rateLimitMiddleware = fp(async (fastify: FastifyInstance) => {
  // Register rate limiting plugin
  await fastify.register(import('@fastify/rate-limit'), {
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
    errorResponseBuilder: (request, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Rate limit exceeded. Try again in ${context.after}`,
    }),
  });
  
  logger.info('Rate limiting middleware configured');
});

/**
 * [CODEX-1337] Security headers middleware
 * Adds important security headers to all responses
 */
export const securityHeadersMiddleware = fp(async (fastify: FastifyInstance) => {
  fastify.addHook('onSend', (request, reply, payload, done) => {
    // Add security headers
    reply.header('X-Content-Type-Options', 'nosniff');
    reply.header('X-Frame-Options', 'DENY');
    reply.header('X-XSS-Protection', '1; mode=block');
    reply.header('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
    reply.header('Content-Security-Policy', "default-src 'self'");
    reply.header('Referrer-Policy', 'no-referrer-when-downgrade');
    reply.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    
    done(null, payload);
  });
  
  logger.info('Security headers middleware configured');
});
