/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                        USER ROUTES [NEXUS-IDENTITY-PATHS]                          ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  API routes for user profile, friend management, and status updates                ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import express from 'express';
import { body, param } from 'express-validator';
import userController from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

/**
 * CIPHER-X: User profile API routes
 * Provides endpoints for retrieving and managing user profiles
 * with MSN-inspired status and friend management functionality
 */

// @route   GET /api/v1/users/:id
// @desc    Get user profile by ID
// @access  Public/Private (based on privacy settings)
router.get(
  '/:id',
  [
    param('id').isMongoId().withMessage('Invalid user ID format')
  ],
  validate,
  authenticate, // Optional authentication to see more details if friends
  userController.getUserProfile
);

// @route   PUT /api/v1/users/profile
// @desc    Update current user's profile
// @access  Private
router.put(
  '/profile',
  authenticate,
  [
    body('displayName')
      .optional()
      .isLength({ min: 2, max: 50 }).withMessage('Display name must be between 2 and 50 characters'),
    body('bio')
      .optional()
      .isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters'),
    body('avatar')
      .optional()
      .isURL().withMessage('Avatar must be a valid URL')
  ],
  validate,
  userController.updateUserProfile
);

// @route   PUT /api/v1/users/status
// @desc    Update user status (MSN-style presence)
// @access  Private
router.put(
  '/status',
  authenticate,
  [
    body('status')
      .optional()
      .isIn(['online', 'away', 'busy', 'offline', 'invisible', 'custom'])
      .withMessage('Invalid status value'),
    body('customStatus')
      .optional()
      .isLength({ max: 100 }).withMessage('Custom status cannot exceed 100 characters')
  ],
  validate,
  userController.updateUserStatus
);

// @route   PUT /api/v1/users/settings
// @desc    Update user settings and preferences
// @access  Private
router.put(
  '/settings',
  authenticate,
  [
    body('theme')
      .optional()
      .isIn(['default', 'dark', 'light', 'retro', 'classic-msn'])
      .withMessage('Invalid theme'),
    body('notifications')
      .optional()
      .isBoolean().withMessage('Notifications must be a boolean'),
    body('sounds')
      .optional()
      .isBoolean().withMessage('Sounds must be a boolean'),
    body('language')
      .optional()
      .isLength({ min: 2, max: 5 }).withMessage('Invalid language code'),
    body('statusPrivacy')
      .optional()
      .isIn(['public', 'friends-only', 'private'])
      .withMessage('Invalid privacy setting'),
    body('autoLogin')
      .optional()
      .isBoolean().withMessage('Auto login must be a boolean')
  ],
  validate,
  userController.updateUserSettings
);

/**
 * CIPHER-X: Friend management routes
 * Implements MSN/Discord-style friend connections
 * with request, accept, reject, and block functionality
 */

// @route   GET /api/v1/users/friends
// @desc    Get current user's friends list with online status
// @access  Private
router.get(
  '/friends',
  authenticate,
  userController.getFriends
);

// @route   GET /api/v1/users/friends/pending
// @desc    Get pending friend requests
// @access  Private
router.get(
  '/friends/pending',
  authenticate,
  userController.getPendingFriendRequests
);

// @route   POST /api/v1/users/friends/request
// @desc    Send a friend request to another user
// @access  Private
router.post(
  '/friends/request',
  authenticate,
  [
    body('targetUserId')
      .isMongoId().withMessage('Invalid user ID format')
  ],
  validate,
  userController.sendFriendRequest
);

// @route   POST /api/v1/users/friends/accept/:requesterId
// @desc    Accept a friend request
// @access  Private
router.post(
  '/friends/accept/:requesterId',
  authenticate,
  [
    param('requesterId')
      .isMongoId().withMessage('Invalid requester ID format')
  ],
  validate,
  userController.acceptFriendRequest
);

// @route   POST /api/v1/users/friends/reject/:requesterId
// @desc    Reject a friend request
// @access  Private
router.post(
  '/friends/reject/:requesterId',
  authenticate,
  [
    param('requesterId')
      .isMongoId().withMessage('Invalid requester ID format')
  ],
  validate,
  userController.rejectFriendRequest
);

// @route   DELETE /api/v1/users/friends/:friendId
// @desc    Remove a friend
// @access  Private
router.delete(
  '/friends/:friendId',
  authenticate,
  [
    param('friendId')
      .isMongoId().withMessage('Invalid friend ID format')
  ],
  validate,
  userController.removeFriend
);

// @route   POST /api/v1/users/block
// @desc    Block a user
// @access  Private
router.post(
  '/block',
  authenticate,
  [
    body('targetUserId')
      .isMongoId().withMessage('Invalid user ID format')
  ],
  validate,
  userController.blockUser
);

// @route   DELETE /api/v1/users/block/:blockedUserId
// @desc    Unblock a user
// @access  Private
router.delete(
  '/block/:blockedUserId',
  authenticate,
  [
    param('blockedUserId')
      .isMongoId().withMessage('Invalid blocked user ID format')
  ],
  validate,
  userController.unblockUser
);

export default router;
