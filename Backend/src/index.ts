// ==========================================================
// ⚙️ C.H.A.O.S. SERVER - MAIN ENTRY POINT ⚙️ 
// ==========================================================
// █▀▄▀█ █▀█ █ █▄░█   █▀▀ █▄░█ ▀█▀ █▀█ █▄█   █▀█ █▀█ █ █▄░█ ▀█▀
// █░▀░█ █▀█ █ █░▀█   ██▄ █░▀█ ░█░ █▀▄ ░█░   █▀▀ █▄█ █ █░▀█ ░█░
// ==========================================================
// [CODEX-1337] FASTIFY SERVER SETUP WITH SOCKET.IO INTEGRATION
// [CODEX-1337] JWT AUTH, CORS, AND SWAGGER DOCUMENTATION
// [CODEX-1337] CENTRALIZED ERROR HANDLING AND LOGGING
// [CODEX-1337] REAL-TIME MESSAGING VIA WEBSOCKETS
// [CODEX-1337] CROSS-PLATFORM COMPATIBLE (LINUX/WINDOWS)
// ==========================================================

import fastify, { FastifyInstance } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import fastifyCors from '@fastify/cors';
import fastifySwagger from '@fastify/swagger';
import { Server } from 'socket.io';
import dotenv from 'dotenv';

// ==========================================================
// 🔌 IMPORT MODULAR COMPONENTS
// ==========================================================
import { setupRoutes } from './routes';
import { setupWebSockets } from './services/websocket';
import { connectRedis } from './services/redis';
import { errorHandler } from './utils/errorHandler';
import { logger } from './utils/logger';

dotenv.config();

// ==========================================================
// ⚡ SERVER CONFIGURATION
// ==========================================================
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_changeme_in_production';

// ==========================================================
// 🧰 BUILD SERVER INSTANCE
// ==========================================================
const buildServer = async (): Promise<FastifyInstance> => {
  // Create Fastify instance with logging
  const server = fastify({
    logger: {
      transport: {
        target: 'pino-pretty',
        options: {
          translateTime: 'HH:MM:ss Z',
          ignore: 'pid,hostname',
          colorize: true
        },
      },
    },
  });

  // ==========================================================
  // 🔒 REGISTER PLUGINS AND MIDDLEWARE
  // ==========================================================
  
  // CORS for cross-origin requests
  await server.register(fastifyCors, {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  });

  // JWT for authentication
  await server.register(fastifyJwt, {
    secret: JWT_SECRET,
  });

  // Swagger API documentation
  await server.register(fastifySwagger, {
    routePrefix: '/docs',
    swagger: {
      info: {
        title: 'C.H.A.O.S API Documentation',
        description: 'API documentation for Communication Hub for Animated Online Socializing',
        version: '0.1.0',
      },
      externalDocs: {
        url: 'https://swagger.io',
        description: 'Find more info here',
      },
      host: 'localhost',
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
    },
    exposeRoute: true,
  });

  // ==========================================================
  // 🛣️ REGISTER API ROUTES
  // ==========================================================
  setupRoutes(server);

  // ==========================================================
  // 🔄 SETUP WEBSOCKET FOR REAL-TIME FEATURES
  // ==========================================================
  const io = new Server(server.server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      credentials: true,
    },
  });

  // Configure WebSockets
  setupWebSockets(io);

  // ==========================================================
  // ⚠️ GLOBAL ERROR HANDLER
  // ==========================================================
  server.setErrorHandler(errorHandler);

  // Basic health check route
  server.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  return server;
};

// ==========================================================
// 🚀 SERVER STARTUP
// ==========================================================
const startServer = async () => {
  try {
    // Connect to Redis for caching and presence
    await connectRedis();
    
    // Build and start the server
    const server = await buildServer();
    await server.listen({ port: Number(PORT), host: '0.0.0.0' });
    
    logger.info(`🚀 Server started successfully on port ${PORT}`);
    logger.info(`📚 Documentation available at http://localhost:${PORT}/docs`);
  } catch (err) {
    logger.error('Failed to start server:');
    logger.error(err);
    process.exit(1);
  }
};

// Start server if this file is run directly
if (require.main === module) {
  startServer();
}

// Export for testing
export { buildServer };
