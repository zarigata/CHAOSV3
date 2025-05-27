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
import { initializeEmailService } from './services/email';
import { setupRateLimits } from './middleware/rate-limit';
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
  // 🔐 REGISTER PLUGINS AND MIDDLEWARE
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
  
  // Rate limiting protection
  await setupRateLimits(server);

  // Swagger API documentation
  if (process.env.ENABLE_SWAGGER === 'true') {
    await server.register(fastifySwagger, {
      routePrefix: '/docs',
      // @ts-ignore - Type issues with swagger options
      swagger: {
        info: {
          title: 'C.H.A.O.S API Documentation',
          description: 'Communication Hub for Animated Online Socializing',
          version: '0.1.0',
        },
        externalDocs: {
          url: 'https://github.com/fastify/fastify-swagger',
          description: 'Find more info here',
        },
        host: `localhost:${PORT}`,
        schemes: ['http'],
        consumes: ['application/json'],
        produces: ['application/json'],
        securityDefinitions: {
          bearerAuth: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header'
          }
        }
      },
      exposeRoute: true,
    });
    
    logger.info(`📚 API Documentation available at http://localhost:${PORT}/docs`);
  }

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
    // [CODEX-1337] Initialize required services
    logger.info('Initializing C.H.A.O.S. backend services...');
    
    // Connect to Redis for caching and presence
    await connectRedis();
    logger.info('🔥 Redis service connected successfully');
    
    // Initialize email service for notifications
    initializeEmailService();
    logger.info('📧 Email service initialized successfully');
    
    // Build and start the server
    const server = await buildServer();
    await server.listen({ port: Number(PORT), host: '0.0.0.0' });
    
    // [CODEX-1337] Display ASCII art on server start
    console.log(`
    ██████╗    ██╗  ██╗    █████╗     ██████╗     ███████╗
    ██╔════╝    ██║  ██║   ██╔══██╗   ██╔═══██╗   ██╔════╝
    ██║         ███████║   ███████║   ██║   ██║   ███████╗
    ██║         ██╔══██║   ██╔══██║   ██║   ██║   ╚════██║
    ╚██████╗   ██║  ██║   ██║  ██║   ██████╔╝    ███████║
     ╚═════╝   ╚═╝  ╚═╝   ╚═╝  ╚═╝   ╚═════╝     ╚══════╝
     `); 
    
    logger.info(`🚀 Server started successfully on port ${PORT}`);
    logger.info(`👨‍💻 Environment: ${process.env.NODE_ENV}`);
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
