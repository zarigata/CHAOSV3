// ==========================================================
// 🛣️ C.H.A.O.S. ROUTE REGISTRATION MODULE 🛣️
// ==========================================================
// - CENTRAL MODULE FOR API ENDPOINT REGISTRATION
// - ORGANIZES ROUTES BY FUNCTIONAL DOMAIN
// - APPLIES ROUTE-SPECIFIC MIDDLEWARE
// ==========================================================

import { FastifyInstance } from 'fastify';
import { authRoutes } from './auth.routes';
import { userRoutes } from './user.routes';
import { messageRoutes } from './message.routes';
import { hubRoutes } from './hub.routes';
import { logger } from '../utils/logger';

// Register all API routes with the Fastify server
export const setupRoutes = (server: FastifyInstance): void => {
  // API version prefix for all routes
  const API_PREFIX = '/api/v1';
  
  // Register route modules with their prefixes
  server.register(authRoutes, { prefix: `${API_PREFIX}/auth` });
  server.register(userRoutes, { prefix: `${API_PREFIX}/users` });
  server.register(messageRoutes, { prefix: `${API_PREFIX}/messages` });
  server.register(hubRoutes, { prefix: `${API_PREFIX}/hubs` });
  
  // Log registered routes on server startup
  server.ready().then(() => {
    logger.info('✅ API routes registered successfully');
    
    // Log all registered routes in development mode
    if (process.env.NODE_ENV !== 'production') {
      server.log.info('📋 Available Routes:');
      
      // Get and print all registered routes
      const routes = server.printRoutes();
      server.log.info(routes);
    }
  }).catch(err => {
    logger.error({ err }, '❌ Failed to register API routes');
  });
};
