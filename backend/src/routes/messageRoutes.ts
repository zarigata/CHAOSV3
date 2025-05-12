/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                    MESSAGE ROUTES [CRYPTO-MESSENGER-PATHS]                         ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  API routes for messaging, attachments, reactions, and media content               ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import express from 'express';
import { body, param, query } from 'express-validator';
import messageController from '../controllers/messageController';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

const router = express.Router();

// Set up file upload handling with multer
const uploadDir = process.env.UPLOAD_DIR || 'uploads';

// Create uploads directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: uuid + original extension
    const fileExt = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExt}`;
    cb(null, fileName);
  }
});

// Set up multer
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // Default 10MB
  },
  fileFilter: (req, file, cb) => {
    // Check file types if needed
    // For now, allow all types
    cb(null, true);
  }
});

/**
 * CIPHER-X: Message API routes
 * Provides endpoints for retrieving, sending, and managing messages
 * with support for rich content, reactions, and file uploads
 */

// @route   GET /api/v1/messages/channel/:channelId
// @desc    Get messages from a channel with pagination
// @access  Private
router.get(
  '/channel/:channelId',
  authenticate,
  [
    param('channelId').isMongoId().withMessage('Invalid channel ID format'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('before').optional().isISO8601().withMessage('Before must be a valid ISO date'),
    query('after').optional().isISO8601().withMessage('After must be a valid ISO date')
  ],
  validate,
  messageController.getChannelMessages
);

// @route   GET /api/v1/messages/:messageId
// @desc    Get a specific message by ID
// @access  Private
router.get(
  '/:messageId',
  authenticate,
  [
    param('messageId').isMongoId().withMessage('Invalid message ID format')
  ],
  validate,
  messageController.getMessageById
);

// @route   POST /api/v1/messages/channel/:channelId
// @desc    Send a message to a channel
// @access  Private
router.post(
  '/channel/:channelId',
  authenticate,
  [
    param('channelId').isMongoId().withMessage('Invalid channel ID format'),
    body('content').isString().notEmpty().withMessage('Message content is required'),
    body('replyTo').optional().isMongoId().withMessage('Invalid reply message ID format'),
    body('attachments').optional().isArray().withMessage('Attachments must be an array')
  ],
  validate,
  messageController.sendMessage
);

// @route   PUT /api/v1/messages/:messageId
// @desc    Edit a message
// @access  Private (only message owner)
router.put(
  '/:messageId',
  authenticate,
  [
    param('messageId').isMongoId().withMessage('Invalid message ID format'),
    body('content').isString().notEmpty().withMessage('Message content is required')
  ],
  validate,
  messageController.editMessage
);

// @route   DELETE /api/v1/messages/:messageId
// @desc    Delete a message
// @access  Private (message owner or moderator)
router.delete(
  '/:messageId',
  authenticate,
  [
    param('messageId').isMongoId().withMessage('Invalid message ID format')
  ],
  validate,
  messageController.deleteMessage
);

// @route   POST /api/v1/messages/:messageId/reaction
// @desc    Add/remove reaction to a message
// @access  Private
router.post(
  '/:messageId/reaction',
  authenticate,
  [
    param('messageId').isMongoId().withMessage('Invalid message ID format'),
    body('emoji').isString().notEmpty().withMessage('Emoji is required')
  ],
  validate,
  messageController.addReaction
);

// @route   POST /api/v1/messages/upload
// @desc    Upload file attachments
// @access  Private
router.post(
  '/upload',
  authenticate,
  upload.array('files', 10), // Max 10 files per upload
  messageController.uploadAttachment
);

export default router;
