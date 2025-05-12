/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                         SERVER CORE [SYSTEM-DAEMON-PRIME]                          ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Main server initialization and configuration module                               ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import morgan from 'morgan';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { setupSocketHandlers } from './socket';
import { configureRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

// Load environment variables from .env file
dotenv.config();

// Create Express application
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middleware setup
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(`/${process.env.UPLOAD_DIR || 'uploads'}`, express.static(uploadsDir));

// Configure API routes
configureRoutes(app);

// Error handling middleware
app.use(errorHandler);

// Set up Socket.IO handlers
setupSocketHandlers(io);

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/chaosv3';
mongoose.connect(MONGODB_URI)
  .then(() => {
    logger.info('Connected to MongoDB');
    
    // Start the server
    const PORT = process.env.PORT || 5000;
    server.listen(PORT, () => {
      logger.info(`
      ╔════════════════════════════════════════════════════╗
      ║             C.H.A.O.S.V3 SERVER ONLINE             ║
      ╠════════════════════════════════════════════════════╣
      ║ Server running on port: ${PORT.toString().padEnd(24, ' ')} ║
      ║ Environment: ${process.env.NODE_ENV?.padEnd(30, ' ')} ║
      ║ MongoDB connected                                  ║
      ║ Socket.IO initialized                              ║
      ╚════════════════════════════════════════════════════╝
      `);
    });
  })
  .catch((error) => {
    logger.error('Failed to connect to MongoDB', error);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (error: Error) => {
  logger.error('Unhandled Rejection:', error);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

export { app, server, io };
