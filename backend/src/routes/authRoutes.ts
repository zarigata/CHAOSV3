/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                 AUTHENTICATION ROUTES [SENTINEL-GATEWAY-357]                       ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  API routes for user authentication and account management                         ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import express from 'express';
import { body } from 'express-validator';
import authController from '../controllers/authController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

/**
 * CIPHER-X: Authentication route configuration
 * Defines entry points for user registration, login, token refresh,
 * and logout operations with appropriate validation rules
 */

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post(
  '/register',
  [
    body('username')
      .not().isEmpty().withMessage('Username is required')
      .isLength({ min: 3, max: 30 }).withMessage('Username must be between 3 and 30 characters')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username can only contain letters, numbers, and underscores'),
    body('email')
      .isEmail().withMessage('Please provide a valid email'),
    body('password')
      .isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
    body('displayName')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Display name must be between 2 and 50 characters')
  ],
  validate,
  authController.register
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    body('email')
      .isEmail().withMessage('Please provide a valid email'),
    body('password')
      .not().isEmpty().withMessage('Password is required')
  ],
  validate,
  authController.login
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token using refresh token
// @access  Public
router.post(
  '/refresh',
  [
    body('refreshToken')
      .not().isEmpty().withMessage('Refresh token is required')
  ],
  validate,
  authController.refreshToken
);

// @route   GET /api/auth/me
// @desc    Get current user profile
// @access  Private
router.get('/me', authenticate, authController.getCurrentUser);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Private
router.post('/logout', authenticate, authController.logout);

export default router;
