/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                      EXPRESS APPLICATION [NEXUS-WEB-CORE]                          ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Express application configuration and middleware setup                            ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { configureRoutes } from './routes';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

/**
 * CIPHER-X: Express Application Factory
 * Creates and configures the Express application
 */
export const createApp = (): Express => {
  // Create Express application
  const app = express();
  
  // Configure middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
  }));
  
  // Security headers
  app.use(helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false
  }));
  
  // Request parsing
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Logging
  app.use(morgan('dev', {
    stream: {
      write: (message: string) => logger.http(message.trim())
    }
  }));
  
  // Static file serving for uploads
  const uploadsDir = path.resolve(process.env.UPLOAD_DIR || 'uploads');
  app.use(`/${process.env.UPLOAD_DIR || 'uploads'}`, express.static(uploadsDir));
  
  // Configure API routes
  configureRoutes(app);
  
  // Error handling middleware (must be after routes)
  app.use(errorHandler);
  
  return app;
};

export default createApp;
