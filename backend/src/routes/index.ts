/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                     API ROUTES MANAGER [NEXUS-GATEWAY-501]                         ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Central configuration for all API routes and endpoints                            ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Application } from 'express';
import { httpLogger } from '../utils/logger';
import authRoutes from './authRoutes';
import userRoutes from './userRoutes';
import messageRoutes from './messageRoutes';
import channelRoutes from './channelRoutes';
import serverRoutes from './serverRoutes';

/**
 * CIPHER-X: API Routes Configuration
 * This function registers all API routes with the Express application
 * Sets up common middleware for routes and standardizes API path prefixes
 */
export const configureRoutes = (app: Application) => {
  // Apply HTTP request logging to all routes
  app.use(httpLogger);
  
  // API version prefix
  const apiPrefix = '/api/v1';
  
  // Register routes with their respective prefixes
  app.use(`${apiPrefix}/auth`, authRoutes);
  app.use(`${apiPrefix}/users`, userRoutes);
  app.use(`${apiPrefix}/messages`, messageRoutes);
  app.use(`${apiPrefix}/channels`, channelRoutes);
  app.use(`${apiPrefix}/servers`, serverRoutes);
  
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).json({
      status: 'up',
      server: 'CHAOSV3 API',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date()
    });
  });
  
  // 404 handler for undefined routes
  app.use((req, res) => {
    res.status(404).json({
      success: false,
      error: 'Resource not found',
      timestamp: new Date()
    });
  });
};
