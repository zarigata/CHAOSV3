/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                      SERVER ROUTES [NEXUS-NODE-PATHS]                              ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  API routes for server creation, management, and organization                      ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import express from 'express';
import { body, param } from 'express-validator';
import serverController from '../controllers/serverController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

/**
 * CIPHER-X: Server API routes
 * Provides endpoints for managing communication servers
 * with complete member and permission management
 */

// @route   POST /api/v1/servers
// @desc    Create a new server
// @access  Private
router.post(
  '/',
  authenticate,
  [
    body('name')
      .isString().notEmpty().withMessage('Server name is required')
      .isLength({ min: 2, max: 100 }).withMessage('Server name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string')
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('icon')
      .optional()
      .isString().withMessage('Icon must be a string')
  ],
  validate,
  serverController.createServer
);

// @route   GET /api/v1/servers/user
// @desc    Get all servers for current user
// @access  Private
router.get(
  '/user',
  authenticate,
  serverController.getUserServers
);

// @route   GET /api/v1/servers/:serverId
// @desc    Get server by ID (if user is a member)
// @access  Private
router.get(
  '/:serverId',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format')
  ],
  validate,
  serverController.getServerById
);

// @route   PUT /api/v1/servers/:serverId
// @desc    Update server details (owner or moderator)
// @access  Private
router.put(
  '/:serverId',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format'),
    body('name')
      .optional()
      .isString().withMessage('Server name must be a string')
      .isLength({ min: 2, max: 100 }).withMessage('Server name must be between 2 and 100 characters'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string')
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('icon')
      .optional()
      .isString().withMessage('Icon must be a string'),
    body('banner')
      .optional()
      .isString().withMessage('Banner must be a string')
  ],
  validate,
  serverController.updateServer
);

// @route   DELETE /api/v1/servers/:serverId
// @desc    Delete a server (owner only)
// @access  Private
router.delete(
  '/:serverId',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format')
  ],
  validate,
  serverController.deleteServer
);

// @route   POST /api/v1/servers/:serverId/invite
// @desc    Generate invite code (owner or moderator)
// @access  Private
router.post(
  '/:serverId/invite',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format'),
    body('expiresIn')
      .optional()
      .isNumeric().withMessage('Expires in must be a number (in seconds)'),
    body('maxUses')
      .optional()
      .isNumeric().withMessage('Max uses must be a number')
  ],
  validate,
  serverController.createInviteCode
);

// @route   POST /api/v1/servers/join/:code
// @desc    Join server with invite code
// @access  Private
router.post(
  '/join/:code',
  authenticate,
  [
    param('code').isString().notEmpty().withMessage('Invite code is required')
  ],
  validate,
  serverController.joinWithInviteCode
);

// @route   DELETE /api/v1/servers/:serverId/leave
// @desc    Leave a server (cannot be owner)
// @access  Private
router.delete(
  '/:serverId/leave',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format')
  ],
  validate,
  serverController.leaveServer
);

// @route   POST /api/v1/servers/:serverId/moderators
// @desc    Add moderator (owner only)
// @access  Private
router.post(
  '/:serverId/moderators',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format'),
    body('userId')
      .isMongoId().withMessage('User ID must be a valid MongoDB ID')
  ],
  validate,
  serverController.addModerator
);

// @route   DELETE /api/v1/servers/:serverId/moderators/:userId
// @desc    Remove moderator (owner only)
// @access  Private
router.delete(
  '/:serverId/moderators/:userId',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format'),
    param('userId').isMongoId().withMessage('User ID must be a valid MongoDB ID')
  ],
  validate,
  serverController.removeModerator
);

// @route   PUT /api/v1/servers/:serverId/transfer-ownership
// @desc    Transfer server ownership (owner only)
// @access  Private
router.put(
  '/:serverId/transfer-ownership',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format'),
    body('newOwnerId')
      .isMongoId().withMessage('New owner ID must be a valid MongoDB ID')
  ],
  validate,
  serverController.transferOwnership
);

// @route   DELETE /api/v1/servers/:serverId/members/:userId
// @desc    Kick member from server (owner or moderator)
// @access  Private
router.delete(
  '/:serverId/members/:userId',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format'),
    param('userId').isMongoId().withMessage('User ID must be a valid MongoDB ID')
  ],
  validate,
  serverController.kickMember
);

export default router;
