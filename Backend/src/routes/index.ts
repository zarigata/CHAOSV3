// ==========================================================
// 🛣️ C.H.A.O.S. ROUTE REGISTRATION MODULE 🛣️
// ==========================================================
// █▀█ █▀█ █░█ ▀█▀ █▀▀ █▀   █▀ █▀▀ ▀█▀ █░█ █▀█
// █▀▄ █▄█ █▄█ ░█░ ██▄ ▄█   ▄█ ██▄ ░█░ █▄█ █▀▀
// ==========================================================
// [CODEX-1337] CENTRALIZED ROUTE MANAGEMENT FOR API
// [CODEX-1337] ORGANIZES ROUTES BY FEATURE/DOMAIN
// [CODEX-1337] APPLIES CONSISTENT PREFIX STRUCTURE
// [CODEX-1337] HANDLES AUTHENTICATION MIDDLEWARE
// ==========================================================

import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes';
import messageRoutes from './message.routes';
import { hubRoutes } from './hub.routes';
import { logger } from '../utils/logger';

/**
 * Register all API routes with appropriate prefixes
 * 
 * [CODEX-1337] This is the central registration point for all API routes
 * [CODEX-1337] Each route group is prefixed for organizational clarity
 * [CODEX-1337] Health check endpoint is exposed at root level for monitoring
 */
export async function setupRoutes(fastify: FastifyInstance): Promise<void> {
  // API version prefix for all routes
  const API_PREFIX = '/api/v1';
  
  // Register route modules with their prefixes
  fastify.register(authRoutes, { prefix: `${API_PREFIX}/auth` });
  fastify.register(messageRoutes, { prefix: `${API_PREFIX}/messages` });
  fastify.register(hubRoutes, { prefix: `${API_PREFIX}/hubs` });

  // Health check endpoint for service monitoring
  fastify.get('/health', async (_request: any, reply: any) => {
    logger.info('Health check endpoint accessed');
    return { status: 'ok', timestamp: new Date().toISOString() };
  });
  
  logger.info('✅ API routes registered successfully');
}
