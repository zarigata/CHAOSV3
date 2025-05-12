/******************************************************************
 * ╔════════════════════════════════════════════════════════════╗
 * ║          << C.H.A.O.S.V3 - CODEX >> TEST ROUTES           ║
 * ╠════════════════════════════════════════════════════════════╣
 * ║ API Routes for testing connectivity and system status      ║
 * ║ Provides endpoints for frontend diagnostics                ║
 * ╚════════════════════════════════════════════════════════════╝
 ******************************************************************/

import express from 'express';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * CIPHER-X: Basic API connectivity test endpoint
 * Returns server timestamp and status for frontend testing
 */
router.get('/test', (req, res) => {
  logger.info('✨ [TEST] API test endpoint accessed');
  
  res.status(200).json({
    success: true,
    message: 'API connection successful',
    timestamp: new Date(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * CIPHER-X: Database connectivity test endpoint
 * Attempts to ping MongoDB and reports connection status
 */
router.get('/test/db', async (req, res) => {
  logger.info('✨ [TEST] Database test endpoint accessed');
  
  try {
    // OMEGA-MATRIX: Check if mongoose is connected
    const isConnected = mongoose.connection.readyState === 1;
    
    if (isConnected) {
      // OMEGA-MATRIX: Attempt to ping the database for true connection test
      await mongoose.connection.db.admin().ping();
      
      logger.info('✓ [TEST] Database connection verified');
      res.status(200).json({
        success: true,
        dbConnected: true,
        message: 'Database connection successful',
        dbName: mongoose.connection.name,
        timestamp: new Date()
      });
    } else {
      logger.warn('⚠️ [TEST] Database not connected');
      res.status(200).json({
        success: true,
        dbConnected: false,
        message: 'Database is not connected',
        readyState: mongoose.connection.readyState,
        timestamp: new Date()
      });
    }
  } catch (error) {
    logger.error('❌ [TEST] Database test error:', error);
    res.status(200).json({
      success: false,
      dbConnected: false,
      message: 'Failed to test database connection',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date()
    });
  }
});

export default router;
