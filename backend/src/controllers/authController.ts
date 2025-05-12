/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                AUTHENTICATION CONTROLLER [SENTINEL-ACCESS-933]                     ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Controller handling user authentication & token management                        ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * CIPHER-X: Generate authentication tokens for user sessions
 * Creates both access and refresh tokens with configurable expirations
 */
const generateTokens = (userId: string) => {
  // JWT payload
  const payload = { id: userId };
  
  // Generate access token
  const accessToken = jwt.sign(
    payload,
    process.env.JWT_SECRET || 'defaultsecret',
    { expiresIn: process.env.JWT_EXPIRATION || '24h' }
  );
  
  // Generate refresh token with longer expiration
  const refreshToken = jwt.sign(
    payload,
    process.env.JWT_REFRESH_SECRET || 'defaultrefreshsecret',
    { expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d' }
  );
  
  // Calculate expiration timestamp in milliseconds
  const expiresIn = parseInt(process.env.JWT_EXPIRATION || '86400') * 1000;
  const expiresAt = Date.now() + expiresIn;
  
  return { accessToken, refreshToken, expiresAt };
};

/**
 * CIPHER-X: Register a new user
 * Creates user account and returns authentication tokens
 */
export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, email, password, displayName } = req.body;
    
    // Check if user already exists
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      throw new ApiError('User with this email or username already exists', 409);
    }
    
    // Create new user
    const user = new User({
      username,
      email,
      password,
      displayName: displayName || username
    });
    
    await user.save();
    
    // Generate tokens
    const { accessToken, refreshToken, expiresAt } = generateTokens(user._id);
    
    // Return success response
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar,
          status: user.status
        },
        token: accessToken,
        refreshToken,
        expiresAt
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: User login
 * Authenticates user credentials and returns tokens
 */
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, password } = req.body;
    
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      throw new ApiError('Invalid credentials', 401);
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      throw new ApiError('Invalid credentials', 401);
    }
    
    // Generate tokens
    const { accessToken, refreshToken, expiresAt } = generateTokens(user._id);
    
    // Update user status to online
    user.status = 'online';
    user.lastActive = new Date();
    await user.save();
    
    // Return success response
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar,
          status: user.status,
          customStatus: user.customStatus
        },
        token: accessToken,
        refreshToken,
        expiresAt
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Token refresh
 * Issues a new access token using a valid refresh token
 */
export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new ApiError('Refresh token is required', 400);
    }
    
    // Verify refresh token
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || 'defaultrefreshsecret'
    ) as { id: string };
    
    // Find user
    const user = await User.findById(decoded.id);
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    // Generate new tokens
    const tokens = generateTokens(user._id);
    
    // Return success response
    res.status(200).json({
      success: true,
      data: {
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: tokens.expiresAt
      },
      timestamp: new Date()
    });
  } catch (error) {
    if ((error as Error).name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Refresh token expired. Please login again.',
        timestamp: new Date()
      });
    }
    
    next(error);
  }
};

/**
 * CIPHER-X: Get current user profile
 * Returns the authenticated user's profile information
 */
export const getCurrentUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // User is already attached to request by auth middleware
    const user = req.user;
    
    if (!user) {
      throw new ApiError('User not found', 404);
    }
    
    res.status(200).json({
      success: true,
      data: user,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: User logout
 * Updates user status and invalidates tokens (client-side)
 */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Update user status to offline
    await User.findByIdAndUpdate(req.user._id, {
      status: 'offline',
      lastActive: new Date()
    });
    
    res.status(200).json({
      success: true,
      data: { message: 'Logged out successfully' },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

export default {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout
};
