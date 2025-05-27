// ==========================================================
// 🛡️ C.H.A.O.S. RATE LIMITING MIDDLEWARE 🛡️
// ==========================================================
// █▀█ █▀█ ▀█▀ █▀▀   █░░ █ █▀▄▀█ █ ▀█▀ █ █▄░█ █▀▀
// █▀▄ █▀█ ░█░ ██▄   █▄▄ █ █░▀░█ █ ░█░ █ █░▀█ █▄█
// ==========================================================
// [CODEX-1337] API PROTECTION AGAINST BRUTE FORCE ATTACKS
// [CODEX-1337] CONFIGURABLE RATE LIMITS BY ENDPOINT
// [CODEX-1337] REDIS-BACKED FOR DISTRIBUTED DEPLOYMENTS
// ==========================================================

import { FastifyInstance } from 'fastify';
import fastifyRateLimit from '@fastify/rate-limit';
import { logger } from '../utils/logger';

/**
 * [CODEX-1337] Get Redis client for rate limiting
 * @returns Redis client instance
 */
async function getRedisClient() {
  try {
    if (!process.env.REDIS_URL) {
      return undefined;
    }
    
    const Redis = await import('ioredis');
    const client = new Redis.default(process.env.REDIS_URL);
    
    // Test connection
    await client.ping();
    logger.info('Successfully connected to Redis for rate limiting');
    
    return client;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis for rate limiting, falling back to in-memory store');
    return undefined;
  }
}

/**
 * [CODEX-1337] Set up rate limiting for the API
 * This helps prevent brute force attacks and API abuse
 * @param fastify The Fastify instance
 */
export async function setupRateLimits(fastify: FastifyInstance): Promise<void> {
  const redisClient = await getRedisClient();
  
  // Configure global rate limiting
  await fastify.register(fastifyRateLimit, {
    global: true,
    max: parseInt(process.env.RATE_LIMIT_MAX || '100'),
    timeWindow: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'),
    hook: 'preHandler',
    cache: 10000,
    redis: redisClient,
    nameSpace: process.env.REDIS_PREFIX ? `${process.env.REDIS_PREFIX}ratelimit:` : 'ratelimit:',
    
    // Customize error response
    errorResponseBuilder: (request, context) => {
      logger.warn({
        ip: request.ip,
        url: request.url,
        method: request.method,
        limit: context.max,
      }, 'Rate limit exceeded');
      
      return {
        statusCode: 429,
        error: 'Too Many Requests',
        message: `You've made too many requests. Please try again in ${context.after}.`,
        retryAfter: context.after,
      };
    },
  });
  
  // Add specific route rate limits
  fastify.after(() => {
    // Authentication routes
    const loginPath = '/api/auth/login';
    const registerPath = '/api/auth/register';
    const passwordResetPath = '/api/auth/password-reset/request';
    
    // Apply more restrictive limits to authentication endpoints
    fastify.addHook('onRoute', (routeOptions) => {
      if (routeOptions.url === loginPath) {
        routeOptions.config = {
          ...routeOptions.config,
          rateLimit: {
            max: 5,
            timeWindow: '1 minute',
          },
        };
      } else if (routeOptions.url === registerPath) {
        routeOptions.config = {
          ...routeOptions.config,
          rateLimit: {
            max: 3,
            timeWindow: '10 minutes',
          },
        };
      } else if (routeOptions.url === passwordResetPath) {
        routeOptions.config = {
          ...routeOptions.config,
          rateLimit: {
            max: 3,
            timeWindow: '15 minutes',
          },
        };
      }
    });
    
    logger.info('Rate limiting configured for sensitive endpoints');
  });
  
  logger.info('Rate limiting middleware configured');
}
