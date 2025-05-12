/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                      SERVER CONTROLLER [NEXUS-PRIME-117]                           ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Controller for managing communication servers and hubs                            ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import Server from '../models/Server';
import User from '../models/User';
import Channel from '../models/Channel';
import { ApiError } from '../middleware/errorHandler';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

/**
 * CIPHER-X: Create a new server
 * Creates a new communication hub with default channels
 */
export const createServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    const { name, description, icon } = req.body;
    
    // Check for required fields
    if (!name) {
      throw new ApiError('Server name is required', 400);
    }
    
    // Create new server
    const newServer = new Server({
      name,
      description,
      icon,
      owner: userId,
      members: [
        {
          user: userId,
          joinedAt: new Date()
        }
      ],
      inviteCodes: [
        {
          code: uuidv4().substring(0, 8),
          createdBy: userId
        }
      ]
    });
    
    await newServer.save();
    
    // Create default channels: general text and voice
    const generalTextChannel = new Channel({
      type: 'text',
      name: 'general',
      server: newServer._id,
      position: 0,
      lastActivity: new Date()
    });
    
    const generalVoiceChannel = new Channel({
      type: 'voice',
      name: 'Voice Chat',
      server: newServer._id,
      position: 0,
      lastActivity: new Date()
    });
    
    await generalTextChannel.save();
    await generalVoiceChannel.save();
    
    // Set default channel
    await Server.findByIdAndUpdate(newServer._id, {
      'settings.defaultChannelId': generalTextChannel._id
    });
    
    // Return the created server with default channels
    const createdServer = await Server.findById(newServer._id)
      .populate('owner', 'id username displayName avatar');
    
    res.status(201).json({
      success: true,
      data: {
        server: createdServer,
        channels: [generalTextChannel, generalVoiceChannel]
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Get server by ID
 * Returns detailed server information if user is a member
 */
export const getServerById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Get server with populated fields
    const server = await Server.findById(serverId)
      .populate('owner', 'id username displayName avatar')
      .populate('moderators', 'id username displayName avatar')
      .populate('members.user', 'id username displayName avatar status');
    
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check if user is a member
    const isMember = server.members.some(
      (m: any) => m.user._id.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      throw new ApiError('You are not a member of this server', 403);
    }
    
    // Return server details
    res.status(200).json({
      success: true,
      data: server,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Get all servers for current user
 * Returns list of servers the user is a member of
 */
export const getUserServers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user._id;
    
    // Get all servers where user is a member
    const servers = await Server.find({
      'members.user': userId
    })
    .populate('owner', 'id username displayName avatar')
    .sort({ name: 1 });
    
    res.status(200).json({
      success: true,
      data: servers,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Update server details
 * Allows owner or moderators to modify server settings
 */
export const updateServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { name, description, icon, banner } = req.body;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Get server
    const server = await Server.findById(serverId);
    
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check if user has permission to update
    const isOwner = server.owner.toString() === req.user._id.toString();
    const isModerator = server.moderators.some(
      (mod) => mod.toString() === req.user._id.toString()
    );
    
    if (!isOwner && !isModerator) {
      throw new ApiError('You do not have permission to update this server', 403);
    }
    
    // Only owner can change name
    if (!isOwner && name) {
      throw new ApiError('Only the server owner can change the server name', 403);
    }
    
    // Build update object
    const updateData: any = {};
    
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (icon !== undefined) updateData.icon = icon;
    if (banner !== undefined) updateData.banner = banner;
    
    // Update server
    const updatedServer = await Server.findByIdAndUpdate(
      serverId,
      { $set: updateData },
      { new: true }
    )
    .populate('owner', 'id username displayName avatar')
    .populate('moderators', 'id username displayName avatar');
    
    res.status(200).json({
      success: true,
      data: updatedServer,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Delete a server
 * Only the owner can delete a server
 */
export const deleteServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Get server
    const server = await Server.findById(serverId);
    
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check if user is the owner
    if (server.owner.toString() !== req.user._id.toString()) {
      throw new ApiError('Only the server owner can delete the server', 403);
    }
    
    // Delete server
    await Server.findByIdAndDelete(serverId);
    
    // Delete all associated channels
    await Channel.deleteMany({ server: serverId });
    
    // Delete all messages in those channels
    const Message = require('../models/Message').default;
    await Message.deleteMany({ server: serverId });
    
    res.status(200).json({
      success: true,
      data: { message: 'Server deleted successfully' },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Generate a new invite code
 * Creates a temporary or permanent invite link
 */
export const createInviteCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { expiresIn, maxUses } = req.body;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Get server
    const server = await Server.findById(serverId);
    
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check if user has permission (owner or moderator)
    const isOwner = server.owner.toString() === req.user._id.toString();
    const isModerator = server.moderators.some(
      (mod) => mod.toString() === req.user._id.toString()
    );
    
    if (!isOwner && !isModerator) {
      throw new ApiError('You do not have permission to create invite codes', 403);
    }
    
    // Generate new invite code
    const inviteCode = {
      code: uuidv4().substring(0, 8),
      createdBy: req.user._id,
      expiresAt: expiresIn ? new Date(Date.now() + parseInt(expiresIn) * 1000) : null,
      maxUses: maxUses ? parseInt(maxUses) : null,
      uses: 0
    };
    
    // Add to server invite codes
    await Server.findByIdAndUpdate(serverId, {
      $push: { inviteCodes: inviteCode }
    });
    
    res.status(201).json({
      success: true,
      data: {
        code: inviteCode.code,
        expiresAt: inviteCode.expiresAt,
        maxUses: inviteCode.maxUses
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Join server with invite code
 * Adds the user to the server if invite is valid
 */
export const joinWithInviteCode = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    
    if (!code) {
      throw new ApiError('Invite code is required', 400);
    }
    
    // Find server with matching invite code
    const server = await Server.findOne({
      'inviteCodes.code': code
    });
    
    if (!server) {
      throw new ApiError('Invalid invite code', 404);
    }
    
    // Find the specific invite
    const inviteIndex = server.inviteCodes.findIndex((invite: any) => invite.code === code);
    
    if (inviteIndex === -1) {
      throw new ApiError('Invalid invite code', 404);
    }
    
    const invite = server.inviteCodes[inviteIndex];
    
    // Check if invite is expired
    if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
      throw new ApiError('Invite code has expired', 400);
    }
    
    // Check if max uses reached
    if (invite.maxUses && invite.uses >= invite.maxUses) {
      throw new ApiError('Invite code has reached maximum uses', 400);
    }
    
    // Check if user is already a member
    const isMember = server.members.some(
      (m: any) => m.user.toString() === req.user._id.toString()
    );
    
    if (isMember) {
      throw new ApiError('You are already a member of this server', 400);
    }
    
    // Add user to server members
    await Server.findByIdAndUpdate(server._id, {
      $push: { 
        members: { 
          user: req.user._id,
          joinedAt: new Date()
        } 
      },
      $inc: { [`inviteCodes.${inviteIndex}.uses`]: 1 }
    });
    
    // Get updated server details
    const updatedServer = await Server.findById(server._id)
      .populate('owner', 'id username displayName avatar');
    
    // Get server channels
    const channels = await Channel.find({ server: server._id });
    
    res.status(200).json({
      success: true,
      data: {
        message: 'Successfully joined server',
        server: updatedServer,
        channels
      },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Leave server
 * Removes the user from the server (owner cannot leave)
 */
export const leaveServer = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Get server
    const server = await Server.findById(serverId);
    
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check if user is a member
    const isMember = server.members.some(
      (m: any) => m.user.toString() === req.user._id.toString()
    );
    
    if (!isMember) {
      throw new ApiError('You are not a member of this server', 400);
    }
    
    // Owner cannot leave server
    if (server.owner.toString() === req.user._id.toString()) {
      throw new ApiError('Server owner cannot leave. You must transfer ownership or delete the server', 400);
    }
    
    // Remove user from server members
    await Server.findByIdAndUpdate(serverId, {
      $pull: { 
        members: { user: req.user._id },
        moderators: req.user._id
      }
    });
    
    res.status(200).json({
      success: true,
      data: { message: 'Successfully left server' },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Add moderator to server
 * Only the owner can promote members to moderators
 */
export const addModerator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { userId } = req.body;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Get server
    const server = await Server.findById(serverId);
    
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check if requester is the owner
    if (server.owner.toString() !== req.user._id.toString()) {
      throw new ApiError('Only the server owner can add moderators', 403);
    }
    
    // Check if target user is a member
    const isMember = server.members.some(
      (m: any) => m.user.toString() === userId
    );
    
    if (!isMember) {
      throw new ApiError('User is not a member of this server', 400);
    }
    
    // Check if already a moderator
    const isModerator = server.moderators.some(
      (mod) => mod.toString() === userId
    );
    
    if (isModerator) {
      throw new ApiError('User is already a moderator', 400);
    }
    
    // Add user to moderators
    await Server.findByIdAndUpdate(serverId, {
      $addToSet: { moderators: userId }
    });
    
    // Get updated server
    const updatedServer = await Server.findById(serverId)
      .populate('owner', 'id username displayName avatar')
      .populate('moderators', 'id username displayName avatar');
    
    res.status(200).json({
      success: true,
      data: updatedServer,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Remove moderator from server
 * Only the owner can demote moderators
 */
export const removeModerator = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId, userId } = req.params;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Get server
    const server = await Server.findById(serverId);
    
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check if requester is the owner
    if (server.owner.toString() !== req.user._id.toString()) {
      throw new ApiError('Only the server owner can remove moderators', 403);
    }
    
    // Check if target user is a moderator
    const isModerator = server.moderators.some(
      (mod) => mod.toString() === userId
    );
    
    if (!isModerator) {
      throw new ApiError('User is not a moderator', 400);
    }
    
    // Remove user from moderators
    await Server.findByIdAndUpdate(serverId, {
      $pull: { moderators: userId }
    });
    
    // Get updated server
    const updatedServer = await Server.findById(serverId)
      .populate('owner', 'id username displayName avatar')
      .populate('moderators', 'id username displayName avatar');
    
    res.status(200).json({
      success: true,
      data: updatedServer,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Transfer server ownership
 * Allows owner to transfer ownership to another member
 */
export const transferOwnership = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId } = req.params;
    const { newOwnerId } = req.body;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(newOwnerId)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Get server
    const server = await Server.findById(serverId);
    
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check if requester is the owner
    if (server.owner.toString() !== req.user._id.toString()) {
      throw new ApiError('Only the server owner can transfer ownership', 403);
    }
    
    // Check if target user is a member
    const isMember = server.members.some(
      (m: any) => m.user.toString() === newOwnerId
    );
    
    if (!isMember) {
      throw new ApiError('Target user is not a member of this server', 400);
    }
    
    // Transfer ownership and add previous owner as moderator
    await Server.findByIdAndUpdate(serverId, {
      owner: newOwnerId,
      $addToSet: { moderators: req.user._id }
    });
    
    // Get updated server
    const updatedServer = await Server.findById(serverId)
      .populate('owner', 'id username displayName avatar')
      .populate('moderators', 'id username displayName avatar');
    
    res.status(200).json({
      success: true,
      data: updatedServer,
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

/**
 * CIPHER-X: Kick member from server
 * Allows owner or moderators to remove members
 */
export const kickMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { serverId, userId } = req.params;
    
    // Validate server ID
    if (!mongoose.Types.ObjectId.isValid(serverId)) {
      throw new ApiError('Invalid server ID', 400);
    }
    
    // Validate user ID
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ApiError('Invalid user ID', 400);
    }
    
    // Get server
    const server = await Server.findById(serverId);
    
    if (!server) {
      throw new ApiError('Server not found', 404);
    }
    
    // Check permissions (owner or moderator)
    const isOwner = server.owner.toString() === req.user._id.toString();
    const isModerator = server.moderators.some(
      (mod) => mod.toString() === req.user._id.toString()
    );
    
    if (!isOwner && !isModerator) {
      throw new ApiError('You do not have permission to kick members', 403);
    }
    
    // Cannot kick the owner
    if (server.owner.toString() === userId) {
      throw new ApiError('Cannot kick the server owner', 400);
    }
    
    // Moderators cannot kick other moderators
    if (!isOwner && isModerator) {
      const isTargetModerator = server.moderators.some(
        (mod) => mod.toString() === userId
      );
      
      if (isTargetModerator) {
        throw new ApiError('Moderators cannot kick other moderators', 403);
      }
    }
    
    // Check if target user is a member
    const isMember = server.members.some(
      (m: any) => m.user.toString() === userId
    );
    
    if (!isMember) {
      throw new ApiError('User is not a member of this server', 400);
    }
    
    // Remove user from server
    await Server.findByIdAndUpdate(serverId, {
      $pull: { 
        members: { user: userId },
        moderators: userId
      }
    });
    
    res.status(200).json({
      success: true,
      data: { message: 'Member kicked successfully' },
      timestamp: new Date()
    });
  } catch (error) {
    next(error);
  }
};

export default {
  createServer,
  getServerById,
  getUserServers,
  updateServer,
  deleteServer,
  createInviteCode,
  joinWithInviteCode,
  leaveServer,
  addModerator,
  removeModerator,
  transferOwnership,
  kickMember
};
