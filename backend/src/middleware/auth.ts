/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                   AUTHENTICATION MIDDLEWARE [SENTINEL-GUARD-771]                   ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  JWT authentication middleware for protected routes                                ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { logger } from '../utils/logger';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

/**
 * CIPHER-X: Authentication middleware that validates JWT tokens
 * Acts as the first line of defense for protected API routes
 * Attaches validated user data to the request object
 */
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Access denied. No token provided.',
        timestamp: new Date()
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret') as { id: string };
    
    // Find user by ID
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found.',
        timestamp: new Date()
      });
    }
    
    // Attach user to request object
    req.user = user;
    
    // Update last active timestamp
    await User.findByIdAndUpdate(user._id, { lastActive: new Date() });
    
    next();
  } catch (error) {
    logger.error('Authentication error:', error);
    
    if ((error as Error).name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.',
        timestamp: new Date()
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid token.',
      timestamp: new Date()
    });
  }
};

/**
 * CIPHER-X: Role-based authorization middleware
 * Checks if a user has specific permissions before allowing access
 */
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.',
        timestamp: new Date()
      });
    }
    
    if (roles.length > 0 && !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden. You do not have permission to access this resource.',
        timestamp: new Date()
      });
    }
    
    next();
  };
};

export default { authenticate, authorize };
