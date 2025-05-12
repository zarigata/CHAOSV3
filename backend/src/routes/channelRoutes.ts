/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                      CHANNEL ROUTES [NEXUS-STREAM-PATHS]                           ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  API routes for channel creation, management, and organization                     ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import express from 'express';
import { body, param } from 'express-validator';
import channelController from '../controllers/channelController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';

const router = express.Router();

/**
 * CIPHER-X: Channel API routes
 * Provides endpoints for managing communication channels
 * with both direct messaging and server-based channels
 */

// @route   POST /api/v1/channels/dm
// @desc    Create a direct message channel between two users
// @access  Private
router.post(
  '/dm',
  authenticate,
  [
    body('targetUserId')
      .isMongoId().withMessage('Invalid target user ID format')
  ],
  validate,
  channelController.createDMChannel
);

// @route   POST /api/v1/channels/group
// @desc    Create a group channel (multi-user but not server-based)
// @access  Private
router.post(
  '/group',
  authenticate,
  [
    body('name')
      .isString().notEmpty().withMessage('Group name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Group name must be between 2 and 50 characters'),
    body('participantIds')
      .isArray().withMessage('Participant IDs must be an array')
      .custom((value) => Array.isArray(value) && value.length >= 2)
      .withMessage('At least 2 participants are required')
  ],
  validate,
  channelController.createGroupChannel
);

// @route   POST /api/v1/channels/server/:serverId
// @desc    Create a channel in a server (requires appropriate permissions)
// @access  Private (Server owner/moderator)
router.post(
  '/server/:serverId',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format'),
    body('name')
      .isString().notEmpty().withMessage('Channel name is required')
      .isLength({ min: 2, max: 50 }).withMessage('Channel name must be between 2 and 50 characters'),
    body('type')
      .isString().notEmpty().withMessage('Channel type is required')
      .isIn(['text', 'voice', 'video', 'category']).withMessage('Invalid channel type'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string')
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('parentId')
      .optional()
      .isMongoId().withMessage('Invalid parent channel ID format'),
    body('position')
      .optional()
      .isInt({ min: 0 }).withMessage('Position must be a non-negative integer')
  ],
  validate,
  channelController.createServerChannel
);

// @route   GET /api/v1/channels/server/:serverId
// @desc    Get all channels in a server (organized by categories)
// @access  Private (Server members)
router.get(
  '/server/:serverId',
  authenticate,
  [
    param('serverId').isMongoId().withMessage('Invalid server ID format')
  ],
  validate,
  channelController.getServerChannels
);

// @route   GET /api/v1/channels/user
// @desc    Get all DM and group channels for the current user
// @access  Private
router.get(
  '/user',
  authenticate,
  channelController.getUserChannels
);

// @route   PUT /api/v1/channels/:channelId
// @desc    Update a channel's details
// @access  Private (Owner or moderator)
router.put(
  '/:channelId',
  authenticate,
  [
    param('channelId').isMongoId().withMessage('Invalid channel ID format'),
    body('name')
      .optional()
      .isString().withMessage('Name must be a string')
      .isLength({ min: 2, max: 50 }).withMessage('Name must be between 2 and 50 characters'),
    body('description')
      .optional()
      .isString().withMessage('Description must be a string')
      .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters'),
    body('topic')
      .optional()
      .isString().withMessage('Topic must be a string')
      .isLength({ max: 200 }).withMessage('Topic cannot exceed 200 characters'),
    body('position')
      .optional()
      .isInt({ min: 0 }).withMessage('Position must be a non-negative integer')
  ],
  validate,
  channelController.updateChannel
);

// @route   DELETE /api/v1/channels/:channelId
// @desc    Delete a channel
// @access  Private (Owner or moderator)
router.delete(
  '/:channelId',
  authenticate,
  [
    param('channelId').isMongoId().withMessage('Invalid channel ID format')
  ],
  validate,
  channelController.deleteChannel
);

export default router;
