/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                   MESSAGE CONTROLLER [CRYPTO-MESSENGER-441]                        ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Controller for handling real-time messages, attachments, and reactions            ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Request, Response, NextFunction } from 'express';
import Message from '../models/Message';
import User from '../models/User';
import Channel from '../models/Channel';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import { io } from '../server';
import { SocketEvent } from '../../../shared/types';

/**
 * CIPHER-X: Get messages from a specific channel
 * Returns paginated messages with support for timestamps and limits
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getChannelMessages = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    const { before, after, limit = 50 } = req.query;
    
    // Validate channel ID
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      throw new ApiError('Invalid channel ID', 400);
    }
    
    // Check if channel exists and if user has access
    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      throw new ApiError('Channel not found', 404);
    }
    
    // For DM channels, verify user is a participant
    if (channel.type === 'dm' && channel.participants) {
      const isParticipant = channel.participants.some(
        (p) => p.toString() === req.user._id.toString()
      );
      
      if (!isParticipant) {
        throw new ApiError('You do not have access to this channel', 403);
      }
    }
    
    // For server channels, check server membership and permissions
    if (['text', 'voice', 'video'].includes(channel.type) && channel.server) {
      // This would involve more complex permission checking based on your permission model
      // Simple example here - could be expanded based on roles and permissions
      const Server = require('../models/Server').default;
      const server = await Server.findById(channel.server);
      
      if (!server) {
        throw new ApiError('Server not found', 404);
      }
      
      const isMember = server.members.some(
        (m: any) => m.user.toString() === req.user._id.toString()
      );
      
      if (!isMember) {
        throw new ApiError('You do not have access to this server', 403);
      }
    }
    
    // Build query based on pagination parameters
    const query: any = { channel: channelId };
    
    if (before) {
      query.createdAt = { $lt: new Date(before as string) };
    }
    
    if (after) {
      query.createdAt = { ...query.createdAt, $gt: new Date(after as string) };
    }
    
    // Get messages with pagination
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .populate('sender', 'id username displayName avatar')
      .populate('replyTo', 'id content sender')
      .lean();
    
    // Mark messages as read by current user
    await Message.updateMany(
      { 
        channel: channelId,
        readBy: { $ne: req.user._id }
      },
      { 
        $addToSet: { readBy: req.user._id } 
      }
    );
    
    // Update unread count in the channel for this user
    if (channel.unreadCount) {
      const unreadCountMap = new Map(Object.entries(channel.unreadCount));
      unreadCountMap.set(req.user._id.toString(), 0);
      
      await Channel.findByIdAndUpdate(channelId, {
        unreadCount: Object.fromEntries(unreadCountMap)
      });
    }
    
    // Return messages in chronological order (oldest first)
    res.status(200).json({
      success: true,
      data: messages.reverse(),
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Get a specific message by ID
 * Returns detailed message data including reactions and attachments
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const getMessageById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    
    // Validate message ID
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new ApiError('Invalid message ID', 400);
    }
    
    // Get message with populated fields
    const message = await Message.findById(messageId)
      .populate('sender', 'id username displayName avatar')
      .populate('replyTo', 'id content sender')
      .populate('readBy', 'id username displayName');
    
    if (!message) {
      throw new ApiError('Message not found', 404);
    }
    
    // Check if user has access to this message
    // For DM messages
    if (message.recipient && !message.channel) {
      const isParticipant = 
        message.sender._id.toString() === req.user._id.toString() ||
        message.recipient.toString() === req.user._id.toString();
      
      if (!isParticipant) {
        throw new ApiError('You do not have access to this message', 403);
      }
    }
    // For channel messages
    else if (message.channel) {
      const channel = await Channel.findById(message.channel);
      
      if (!channel) {
        throw new ApiError('Channel not found', 404);
      }
      
      // DM channel
      if (channel.type === 'dm' && channel.participants) {
        const isParticipant = channel.participants.some(
          (p) => p.toString() === req.user._id.toString()
        );
        
        if (!isParticipant) {
          throw new ApiError('You do not have access to this channel', 403);
        }
      }
      // Server channel
      else if (['text', 'voice', 'video'].includes(channel.type) && channel.server) {
        // Check server membership and permissions
        // This would involve more complex permission checking
        const Server = require('../models/Server').default;
        const server = await Server.findById(channel.server);
        
        if (!server) {
          throw new ApiError('Server not found', 404);
        }
        
        const isMember = server.members.some(
          (m: any) => m.user.toString() === req.user._id.toString()
        );
        
        if (!isMember) {
          throw new ApiError('You do not have access to this server', 403);
        }
      }
    }
    
    // Mark message as read by current user if not already
    if (!message.readBy.some((user: any) => user._id.toString() === req.user._id.toString())) {
      message.readBy.push(req.user._id);
      await message.save();
    }
    
    // Return the message
    res.status(200).json({
      success: true,
      data: message,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Send a new message to a channel
 * Supports text content, attachments, and replies
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const sendMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    const { content, replyTo, attachments } = req.body;
    
    // Validate channel ID
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      throw new ApiError('Invalid channel ID', 400);
    }
    
    // Check if channel exists
    const channel = await Channel.findById(channelId);
    
    if (!channel) {
      throw new ApiError('Channel not found', 404);
    }
    
    // Check access rights to the channel
    // For DM channels
    if (channel.type === 'dm' && channel.participants) {
      const isParticipant = channel.participants.some(
        (p) => p.toString() === req.user._id.toString()
      );
      
      if (!isParticipant) {
        throw new ApiError('You do not have access to this channel', 403);
      }
    }
    // For server channels
    else if (['text', 'voice', 'video'].includes(channel.type) && channel.server) {
      // Check server membership and permissions
      const Server = require('../models/Server').default;
      const server = await Server.findById(channel.server);
      
      if (!server) {
        throw new ApiError('Server not found', 404);
      }
      
      const isMember = server.members.some(
        (m: any) => m.user.toString() === req.user._id.toString()
      );
      
      if (!isMember) {
        throw new ApiError('You do not have access to this server', 403);
      }
      
      // Additional permission checks could be added here
    }
    
    // Validate replyTo if provided
    if (replyTo && !mongoose.Types.ObjectId.isValid(replyTo)) {
      throw new ApiError('Invalid reply message ID', 400);
    }
    
    // Create the message
    const newMessage = new Message({
      sender: req.user._id,
      channel: channelId,
      content,
      replyTo,
      attachments,
      readBy: [req.user._id]
    });
    
    // Set server reference if this is a server channel
    if (['text', 'voice', 'video'].includes(channel.type) && channel.server) {
      newMessage.server = channel.server;
    }
    
    // If DM channel, set recipient
    if (channel.type === 'dm' && channel.participants) {
      const recipientId = channel.participants.find(
        (p) => p.toString() !== req.user._id.toString()
      );
      
      if (recipientId) {
        newMessage.recipient = recipientId;
      }
    }
    
    // Save the message
    await newMessage.save();
    
    // Update channel with last message and activity
    await Channel.findByIdAndUpdate(channelId, {
      lastMessage: newMessage._id,
      lastActivity: new Date()
    });
    
    // Increment unread count for all participants except sender
    if (channel.unreadCount) {
      const unreadCountMap = new Map(Object.entries(channel.unreadCount));
      
      if (channel.type === 'dm' && channel.participants) {
        const recipientId = channel.participants.find(
          p => p.toString() !== req.user._id.toString()
        );
        
        if (recipientId) {
          const currentCount = unreadCountMap.get(recipientId.toString()) || 0;
          unreadCountMap.set(recipientId.toString(), currentCount + 1);
        }
      } else if (['text', 'group'].includes(channel.type)) {
        let participantIds: string[] = [];
        
        // Get all participants
        if (channel.type === 'text' && channel.server) {
          const Server = require('../models/Server').default;
          const server = await Server.findById(channel.server);
          
          if (server) {
            participantIds = server.members.map((m: any) => m.user.toString());
          }
        } else if (channel.type === 'group' && channel.participants) {
          participantIds = channel.participants.map(p => p.toString());
        }
        
        // Update counts for all participants except sender
        for (const participantId of participantIds) {
          if (participantId !== req.user._id.toString()) {
            const currentCount = unreadCountMap.get(participantId) || 0;
            unreadCountMap.set(participantId, currentCount + 1);
          }
        }
      }
      
      // Save updated unread counts
      await Channel.findByIdAndUpdate(channelId, {
        unreadCount: Object.fromEntries(unreadCountMap)
      });
    }
    
    // Format the response
    const populatedMessage = await Message.findById(newMessage._id)
      .populate('sender', 'id username displayName avatar')
      .populate('replyTo', 'id content sender')
      .populate('readBy', 'id username displayName');
    
    // Return the created message
    res.status(201).json({
      success: true,
      data: populatedMessage,
      timestamp: new Date()
    });
    
    // Emit real-time event through Socket.IO
    // For DM channels, notify the recipient
    if (channel.type === 'dm' && channel.participants) {
      const recipientId = channel.participants.find(
        p => p.toString() !== req.user._id.toString()
      )?.toString();
      
      if (recipientId) {
        io.to(`user:${recipientId}`).emit(SocketEvent.MESSAGE_CREATED, {
          message: populatedMessage
        });
      }
    }
    // For other channels, notify all members
    else {
      io.to(`channel:${channelId}`).emit(SocketEvent.MESSAGE_CREATED, {
        message: populatedMessage
      });
    }
    
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Edit an existing message
 * Allows users to modify their own messages and tracks edit history
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const editMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    
    // Validate message ID
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new ApiError('Invalid message ID', 400);
    }
    
    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      throw new ApiError('Message not found', 404);
    }
    
    // Verify user owns the message
    if (message.sender.toString() !== req.user._id.toString()) {
      throw new ApiError('You can only edit your own messages', 403);
    }
    
    // Initialize edit history if not exists
    if (!message.editHistory) {
      message.editHistory = [];
    }
    
    // Add current content to edit history
    message.editHistory.push({
      content: message.content,
      timestamp: new Date()
    });
    
    // Update message content and edited flag
    message.content = content;
    message.edited = true;
    
    // Save the updated message
    await message.save();
    
    // Get fully populated message
    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'id username displayName avatar')
      .populate('replyTo', 'id content sender')
      .populate('readBy', 'id username displayName');
    
    // Return the updated message
    res.status(200).json({
      success: true,
      data: updatedMessage,
      timestamp: new Date()
    });
    
    // Emit real-time event for the edit
    if (message.channel) {
      io.to(`channel:${message.channel}`).emit(SocketEvent.MESSAGE_UPDATED, {
        message: updatedMessage
      });
    } else if (message.recipient) {
      io.to(`user:${message.recipient}`).emit(SocketEvent.MESSAGE_UPDATED, {
        message: updatedMessage
      });
    }
    
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Delete a message
 * Allows users to remove their own messages or moderators to remove any message
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const deleteMessage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    
    // Validate message ID
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new ApiError('Invalid message ID', 400);
    }
    
    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      throw new ApiError('Message not found', 404);
    }
    
    // Check if user owns the message or has moderation permissions
    const isOwner = message.sender.toString() === req.user._id.toString();
    let isModerator = false;
    
    // Check for moderation rights if in a server channel
    if (message.server && !isOwner) {
      const Server = require('../models/Server').default;
      const server = await Server.findById(message.server);
      
      if (server) {
        // Check if user is owner or moderator of the server
        isModerator = 
          server.owner.toString() === req.user._id.toString() ||
          server.moderators.includes(req.user._id);
      }
    }
    
    // Check permission to delete
    if (!isOwner && !isModerator) {
      throw new ApiError('You do not have permission to delete this message', 403);
    }
    
    // Save channel ID and recipient ID before deleting
    const channelId = message.channel;
    const recipientId = message.recipient;
    
    // Delete the message
    await Message.findByIdAndDelete(messageId);
    
    // If message had attachments, optionally delete the files
    if (message.attachments && message.attachments.length > 0) {
      // Get upload directory from environment or use default
      const uploadDir = process.env.UPLOAD_DIR || 'uploads';
      
      // Delete each attachment file
      for (const attachment of message.attachments) {
        try {
          const filePath = path.join(process.cwd(), uploadDir, path.basename(attachment.url));
          
          // Check if file exists before attempting to delete
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        } catch (err) {
          // Log error but continue with deletion of other files
          logger.error(`Failed to delete attachment file: ${err}`);
        }
      }
    }
    
    // Return success response
    res.status(200).json({
      success: true,
      data: {
        id: messageId,
        message: 'Message deleted successfully'
      },
      timestamp: new Date()
    });
    
    // Emit deletion event
    if (channelId) {
      io.to(`channel:${channelId}`).emit(SocketEvent.MESSAGE_DELETED, {
        messageId,
        channelId
      });
    } else if (recipientId) {
      io.to(`user:${recipientId}`).emit(SocketEvent.MESSAGE_DELETED, {
        messageId,
        senderId: req.user._id
      });
    }
    
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Add reaction to a message
 * Allows users to react to messages with emoji
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const addReaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    
    // Validate message ID
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      throw new ApiError('Invalid message ID', 400);
    }
    
    // Validate emoji
    if (!emoji) {
      throw new ApiError('Emoji is required', 400);
    }
    
    // Find the message
    const message = await Message.findById(messageId);
    
    if (!message) {
      throw new ApiError('Message not found', 404);
    }
    
    // Check if user has access to this message (same checks as getMessageById)
    // ... (access check logic) ...
    
    // Initialize reactions array if it doesn't exist
    if (!message.reactions) {
      message.reactions = [];
    }
    
    // Find existing reaction with this emoji
    const existingReaction = message.reactions.find(r => r.emoji === emoji);
    
    if (existingReaction) {
      // Check if user already reacted with this emoji
      if (existingReaction.users.includes(req.user._id)) {
        // Remove user's reaction
        existingReaction.users = existingReaction.users.filter(
          (userId) => userId.toString() !== req.user._id.toString()
        );
        
        // Remove the reaction entirely if no users left
        if (existingReaction.users.length === 0) {
          message.reactions = message.reactions.filter(r => r.emoji !== emoji);
        }
      } else {
        // Add user to existing reaction
        existingReaction.users.push(req.user._id);
      }
    } else {
      // Create new reaction
      message.reactions.push({
        emoji,
        users: [req.user._id]
      });
    }
    
    // Save the message
    await message.save();
    
    // Get updated message with populated fields
    const updatedMessage = await Message.findById(messageId)
      .populate('sender', 'id username displayName avatar')
      .populate('replyTo', 'id content sender')
      .populate('reactions.users', 'id username displayName avatar');
    
    // Return updated message
    res.status(200).json({
      success: true,
      data: updatedMessage,
      timestamp: new Date()
    });
    
    // Emit reaction event
    if (message.channel) {
      io.to(`channel:${message.channel}`).emit(SocketEvent.MESSAGE_REACTION, {
        messageId,
        userId: req.user._id,
        emoji,
        added: message.reactions.some(r => r.emoji === emoji && r.users.includes(req.user._id))
      });
    } else if (message.recipient) {
      io.to(`user:${message.recipient}`).emit(SocketEvent.MESSAGE_REACTION, {
        messageId,
        userId: req.user._id,
        emoji,
        added: message.reactions.some(r => r.emoji === emoji && r.users.includes(req.user._id))
      });
    }
    
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Upload file attachments for messages
 * Handles file uploads to be attached to messages
 * 
 * @param {Request} req - Express request object
 * @param {Response} res - Express response object
 * @param {NextFunction} next - Express next function
 */
export const uploadAttachment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Files will be available in req.files (handled by multer middleware)
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      throw new ApiError('No files uploaded', 400);
    }
    
    // Get base URL for files
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const uploadDir = process.env.UPLOAD_DIR || 'uploads';
    
    // Process each uploaded file
    const attachments = req.files.map((file: any) => {
      // Determine file type
      let type = 'file';
      if (file.mimetype.startsWith('image/')) type = 'image';
      if (file.mimetype.startsWith('video/')) type = 'video';
      if (file.mimetype.startsWith('audio/')) type = 'audio';
      
      // Create attachment object
      return {
        type,
        url: `${baseUrl}/${uploadDir}/${file.filename}`,
        name: file.originalname,
        size: file.size,
        mimeType: file.mimetype
      };
    });
    
    // Return attachment info
    res.status(201).json({
      success: true,
      data: attachments,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getChannelMessages,
  getMessageById,
  sendMessage,
  editMessage,
  deleteMessage,
  addReaction,
  uploadAttachment
};
