/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                   ERROR HANDLING SYSTEM [QUANTUM-SHIELD-404]                       ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Global error handling middleware for Express API routes                           ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handling middleware
export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error details (sanitized in production)
  if (process.env.NODE_ENV === 'development') {
    logger.error(`${err.name}: ${err.message}`, { stack: err.stack });
  } else {
    logger.error(`${err.name}: ${err.message}`);
  }
  
  // Handle specific types of errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
      timestamp: new Date()
    });
  }
  
  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      error: 'Validation Error: ' + err.message,
      timestamp: new Date()
    });
  }
  
  // Handle MongoDB duplicate key errors
  if ((err as any).code === 11000) {
    const field = Object.keys((err as any).keyValue)[0];
    return res.status(409).json({
      success: false,
      error: `Duplicate value for ${field}. This ${field} is already in use.`,
      timestamp: new Date()
    });
  }
  
  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid authentication token',
      timestamp: new Date()
    });
  }
  
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Authentication token expired',
      timestamp: new Date()
    });
  }
  
  // Default to 500 server error
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong on our end. Please try again later.' 
      : err.message,
    timestamp: new Date()
  });
};

export default errorHandler;
