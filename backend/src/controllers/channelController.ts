/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                    CHANNEL CONTROLLER [NEXUS-STREAM-781]                           ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Controller for managing communication channels and DMs                            ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Channel, { DirectMessageChannel, ServerChannel, GroupChannel } from '../models/Channel';
import User from '../models/User';
import Server from '../models/Server';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';

/**
 * CIPHER-X: Create a new direct message channel
 * Ensures a unique DM channel between two users
 */
export const createDMChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { targetUserId } = req.body;
    
    // Validate target user ID
    if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
      throw new ApiError('Invalid target user ID', 400);
    }
    
    // Check if target user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new ApiError('Target user not found', 404);
    }
    
    // Check if DM channel already exists
    const existingChannel = await Channel.findOne({
      type: 'dm',
      participants: { 
        $all: [userId, targetUserId],
        $size: 2
      }
    });
    
    if (existingChannel) {
      return res.status(200).json({
        success: true,
        data: existingChannel,
        timestamp: new Date()
      });
    }
    
    // Create new DM channel
    const newChannel = new DirectMessageChannel({
      participants: [userId, targetUserId],
      lastActivity: new Date(),
      unreadCount: {
        [userId.toString()]: 0,
        [targetUserId.toString()]: 0
      }
    });
    
    await newChannel.save();
    
    res.status(201).json({
      success: true,
      data: newChannel,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Create a new group channel for multiple users
 * Supports multi-user chat outside of server channels
 */
export const createGroupChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { name, participantIds } = req.body;
    
    // Check for required fields
    if (!name) {
      throw new ApiError('Group name is required', 400);
    }
    
    if (!participantIds || !Array.isArray(participantIds) || participantIds.length < 2) {
      throw new ApiError('At least 2 participants are required', 400);
    }
    
    // Ensure creator is included in participants
    let allParticipants = [...new Set([...participantIds, userId.toString()])];
    
    // Validate participant IDs and check if they exist
    for (const id of allParticipants) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        throw new ApiError(`Invalid participant ID: ${id}`, 400);
      }
    }
    
    // Convert string IDs to ObjectIDs
    const participantObjectIds = allParticipants.map(id => new mongoose.Types.ObjectId(id));
    
    // Get count of valid users
    const userCount = await User.countDocuments({
      _id: { $in: participantObjectIds }
    });
    
    if (userCount !== allParticipants.length) {
      throw new ApiError('One or more participants not found', 404);
    }
    
    // Create group channel
    const newChannel = new GroupChannel({
      name,
      owner: userId,
      participants: participantObjectIds,
      lastActivity: new Date(),
      unreadCount: Object.fromEntries(allParticipants.map(id => [id, 0]))
    });
    
    await newChannel.save();
    
    res.status(201).json({
      success: true,
      data: newChannel,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Create a channel within a server
 * Support for text, voice, or video channels
 */
export const createServerChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { name, type, description, parentId, position } = req.body;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Check if server exists
    const server = await Server.findById(serverId);
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check if user has permission (server owner or moderator)
    const isOwner = server.owner.toString() === req.user._id.toString();
    const isModerator = server.moderators.some(
      mod => mod.toString() === req.user._id.toString()
    );
    
    if (!isOwner && !isModerator) {
      throw new ApiError('You do not have permission to create channels in this server', 403);
    }
    
    // Validate channel type
    if (!['text', 'voice', 'video', 'category'].includes(type)) {
      throw new ApiError('Invalid channel type', 400);
    }
    
    // Validate parent channel if provided
    if (parentId) {
      if (!mongoose.Types.ObjectId.isValid(parentId)) {
        throw new ApiError('Invalid parent channel ID', 400);
      }
      
      const parentChannel = await Channel.findById(parentId);
      if (!parentChannel) {
        throw new ApiError('Parent channel not found', 404);
      }
      
      if (parentChannel.type !== 'category') {
        throw new ApiError('Parent channel must be a category', 400);
      }
      
      if (parentChannel.server.toString() !== serverId) {
        throw new ApiError('Parent channel must be in the same server', 400);
      }
    }
    
    // Create channel based on type
    let newChannel;
    
    if (type === 'text') {
      newChannel = new ServerChannel({
        name,
        type,
        server: serverId,
        description,
        parentId,
        position: position || 0,
        lastActivity: new Date()
      });
    } else if (type === 'voice') {
      newChannel = new Channel({
        type: 'voice',
        name,
        server: serverId,
        description,
        parentId,
        position: position || 0,
        lastActivity: new Date()
      });
    } else if (type === 'video') {
      newChannel = new Channel({
        type: 'video',
        name,
        server: serverId,
        description,
        parentId,
        position: position || 0,
        lastActivity: new Date()
      });
    } else if (type === 'category') {
      newChannel = new Channel({
        type: 'category',
        name,
        server: serverId,
        position: position || 0,
        lastActivity: new Date()
      });
    }
    
    await newChannel.save();
    
    res.status(201).json({
      success: true,
      data: newChannel,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Get channels for a specific server
 * Returns organized channels grouped by categories
 */
export const getServerChannels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Check if server exists
    const server = await Server.findById(serverId);
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check if user is a member of the server
    const isMember = server.members.some(
      (m: any) => m.user.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      throw new ApiError('You are not a member of this server', 403);
    }
    
    // Get all channels for this server
    const channels = await Channel.find({ server: serverId })
      .sort({ type: 1, position: 1 });
    
    // Organize channels by categories
    const categories = channels.filter(channel => channel.type === 'category');
    const uncategorizedChannels = channels.filter(
      channel => channel.type !== 'category' && !channel.parentId
    );
    
    const organizedChannels = categories.map(category => {
      const childChannels = channels.filter(
        channel => channel.parentId && channel.parentId.toString() === category._id.toString()
      );
      
      return {
        category,
        channels: childChannels
      };
    });
    
    // Add uncategorized channels
    if (uncategorizedChannels.length > 0) {
      organizedChannels.push({
        category: null,
        channels: uncategorizedChannels
      });
    }
    
    res.status(200).json({
      success: true,
      data: organizedChannels,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Get all DM and group channels for the current user
 * Returns channels sorted by recent activity
 */
export const getUserChannels = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    
    // Get all DM and group channels the user is a participant in
    const channels = await Channel.find({
      $or: [
        { type: 'dm', participants: userId },
        { type: 'group', participants: userId }
      ]
    })
    .populate('participants', 'id username displayName avatar status')
    .populate('lastMessage')
    .sort({ lastActivity: -1 });
    
    res.status(200).json({
      success: true,
      data: channels,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Update a channel's details
 * Allows modification of name, description, etc.
 */
export const updateChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    const { name, description, topic, position } = req.body;
    
    // Validate channel ID
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      throw new ApiError('Invalid channel ID', 400);
    }
    
    // Find the channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new ApiError('Channel not found', 404);
    }
    
    // Check permissions
    if (channel.type === 'dm' || channel.type === 'group') {
      // For group channels, only owner can update
      if (channel.type === 'group' && channel.owner) {
        if (channel.owner.toString() !== req.user._id.toString()) {
          throw new ApiError('Only the group owner can update this channel', 403);
        }
      } else if (channel.type === 'dm') {
        // DM channels can't be updated
        throw new ApiError('Direct message channels cannot be updated', 400);
      }
    } else if (['text', 'voice', 'video', 'category'].includes(channel.type) && channel.server) {
      // For server channels, check server permissions
      const server = await Server.findById(channel.server);
      if (!server) {
        throw new ApiError('Server not found', 404);
      }
      
      const isOwner = server.owner.toString() === req.user._id.toString();
      const isModerator = server.moderators.some(
        mod => mod.toString() === req.user._id.toString()
      );
      
      if (!isOwner && !isModerator) {
        throw new ApiError('You do not have permission to update this channel', 403);
      }
    }
    
    // Update fields
    const updateData: any = {};
    
    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (topic !== undefined) updateData.topic = topic;
    if (position !== undefined) updateData.position = position;
    
    // Update the channel
    const updatedChannel = await Channel.findByIdAndUpdate(
      channelId,
      { $set: updateData },
      { new: true }
    );
    
    res.status(200).json({
      success: true,
      data: updatedChannel,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Delete a channel
 * Removes the channel and optionally its messages
 */
export const deleteChannel = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { channelId } = req.params;
    
    // Validate channel ID
    if (!mongoose.Types.ObjectId.isValid(channelId)) {
      throw new ApiError('Invalid channel ID', 400);
    }
    
    // Find the channel
    const channel = await Channel.findById(channelId);
    if (!channel) {
      throw new ApiError('Channel not found', 404);
    }
    
    // Check permissions
    if (channel.type === 'dm') {
      // For DM channels, either participant can leave
      const isParticipant = channel.participants.some(
        p => p.toString() === req.user._id.toString()
      );
      
      if (!isParticipant) {
        throw new ApiError('You are not a participant in this channel', 403);
      }
      
      // For DMs, just remove the user from participants. If no participants left, delete the channel
      if (channel.participants.length <= 1) {
        await Channel.findByIdAndDelete(channelId);
      }
    } else if (channel.type === 'group' && channel.owner) {
      // For group channels, only owner can delete
      if (channel.owner.toString() !== req.user._id.toString()) {
        throw new ApiError('Only the group owner can delete this channel', 403);
      }
      
      // Delete the group channel
      await Channel.findByIdAndDelete(channelId);
    } else if (['text', 'voice', 'video', 'category'].includes(channel.type) && channel.server) {
      // For server channels, check server permissions
      const server = await Server.findById(channel.server);
      if (!server) {
        throw new ApiError('Server not found', 404);
      }
      
      const isOwner = server.owner.toString() === req.user._id.toString();
      const isModerator = server.moderators.some(
        mod => mod.toString() === req.user._id.toString()
      );
      
      if (!isOwner && !isModerator) {
        throw new ApiError('You do not have permission to delete this channel', 403);
      }
      
      // Delete the server channel
      await Channel.findByIdAndDelete(channelId);
      
      // If category, update child channels
      if (channel.type === 'category') {
        await Channel.updateMany(
          { parentId: channelId },
          { $unset: { parentId: 1 } }
        );
      }
    }
    
    // Delete associated messages (could be done as a background job for large channels)
    const Message = require('../models/Message').default;
    await Message.deleteMany({ channel: channelId });
    
    res.status(200).json({
      success: true,
      data: { message: 'Channel deleted successfully' },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createDMChannel,
  createGroupChannel,
  createServerChannel,
  getServerChannels,
  getUserChannels,
  updateChannel,
  deleteChannel
};
