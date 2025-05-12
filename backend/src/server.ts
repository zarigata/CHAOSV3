/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                         SERVER CORE [SYSTEM-DAEMON-PRIME]                          ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Main server initialization and configuration module                               ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import http from 'http';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createApp } from './app';
import SocketService from './services/socketService';
import { connectDatabase } from './utils/database';
import { logger } from './utils/logger';

/**
 * CIPHER-X: Server Initialization
 * Main entry point for the CHAOSV3 backend application
 * Initializes Express, Socket.IO, and MongoDB connections
 */

// Load environment variables from .env file
dotenv.config();

// Create uploads directory if it doesn't exist
const uploadsDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create Express application
const app = createApp();
const server = http.createServer(app);

// Initialize Socket.IO service
const socketService = new SocketService(server);

// Start the server
const startServer = async () => {
  try {
    // Connect to MongoDB - this now returns a boolean indicating success
    const dbConnected = await connectDatabase();
    
    // Start HTTP server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      // Prepare status message based on database connection
      const dbStatus = dbConnected ? 'MongoDB connected' : 'RUNNING WITHOUT DATABASE (limited functionality)';
      
      logger.info(`
      ╔════════════════════════════════════════════════════╗
      ║             C.H.A.O.S.V3 SERVER ONLINE             ║
      ╠════════════════════════════════════════════════════╣
      ║ Server running on port: ${PORT.toString().padEnd(24, ' ')} ║
      ║ Environment: ${(process.env.NODE_ENV || 'development').padEnd(30, ' ')} ║
      ║ ${dbStatus.padEnd(50, ' ')} ║
      ║ Socket.IO initialized                              ║
      ╚════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle graceful shutdown
const shutdownServer = async () => {
  logger.info('Shutting down server...');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
};

// Handle process termination signals
process.on('SIGTERM', shutdownServer);
process.on('SIGINT', shutdownServer);

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled Rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start the server
startServer();

export { app, server, socketService };
