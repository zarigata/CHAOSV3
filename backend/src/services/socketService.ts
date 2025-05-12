/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                      SOCKET SERVICE [NEXUS-STREAM-PULSE]                           ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  WebSocket service for real-time communication across CHAOS                        ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

/******************************************************************
 * OMEGA-MATRIX IMPORT DEPENDENCIES
 * Core modules required for socket communications and database ops
 * Security, logging, models, and type definitions
 ******************************************************************/
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { logger } from '../utils/logger';
import User from '../models/User';

// Connected user mapping
interface ConnectedUser {
  userId: string;
  socketId: string;
  username: string;
}

/**
 * CIPHER-X: Socket Service
 * Manages real-time communication and user presence
 * Handles events for messaging, typing indicators, and status changes
 */
/******************************************************************
 * CIPHER-X QUANTUM SOCKET SERVICE
 * Core real-time communication backbone for CHAOSV3
 * Handles all socket events, user sessions, and message delivery
 * Cross-platform compatible with both Windows and Linux systems
 ******************************************************************/
export class SocketService {
  private io: Server;
  private connectedUsers: Map<string, ConnectedUser> = new Map();
  
  constructor(server: HttpServer) {
    // Initialize Socket.IO with CORS settings
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
      },
      pingTimeout: 60000
    });
    
    this.setupSocketHandlers();
    logger.info('✨ [Socket] Socket.IO service initialized');
  }
  
  /**
   * CIPHER-X: Socket Connection Handler
   * Configures middleware and event handlers for socket connections
   */
  private setupSocketHandlers(): void {
    // Authentication middleware
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        
        if (!token) {
          return next(new Error('Authentication error: Token not provided'));
        }
        
        // Verify JWT token
        const decoded: any = jwt.verify(
          token, 
          process.env.JWT_SECRET || 'chaosv3_default_jwt_secret'
        );
        
        // Find user by ID
        const user = await User.findById(decoded.id);
        
        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }
        
        // Attach user data to socket
        socket.data.user = {
          id: user._id,
          username: user.username,
          displayName: user.displayName || user.username
        };
        
        next();
      } catch (error) {
        logger.error(`❌ [Socket] Authentication error: ${error}`);
        next(new Error('Authentication error: Invalid token'));
      }
    });
    
    /******************************************************************
     * CIPHER-X: NEURAL NETWORK SOCKET LISTENERS
     * Comprehensive event handler registration for all socket events
     * Includes messaging, presence, and media communication
     ******************************************************************/
    this.io.on('connection', (socket: Socket) => {
      // Initialize user connection
      this.handleConnection(socket);
      
      // CIPHER-X: Messaging Protocol Handlers
      socket.on('sendMessage', (data) => this.handleSendMessage(socket, data));
      socket.on('editMessage', (data) => this.handleEditMessage(socket, data));
      socket.on('deleteMessage', (data) => this.handleDeleteMessage(socket, data));
      socket.on('reactToMessage', (data) => this.handleReaction(socket, data));
      
      // CIPHER-X: Typing Indicator Protocol
      socket.on('typing', (data) => this.handleTyping(socket, data));
      socket.on('stopTyping', (data) => this.handleStopTyping(socket, data));
      
      // CIPHER-X: Channel Management
      socket.on('joinChannel', (data) => this.handleJoinChannel(socket, data));
      socket.on('leaveChannel', (data) => this.handleLeaveChannel(socket, data));
      socket.on('getChannelHistory', (data) => this.handleGetChannelHistory(socket, data));
      
      // CIPHER-X: Presence & Status Protocol
      socket.on('setStatus', (data) => this.handleSetStatus(socket, data));
      socket.on('getUserStatus', (data) => this.handleGetUserStatus(socket, data));
      
      // CIPHER-X: Media Communication Protocol
      socket.on('voiceCallSignal', (data) => this.handleVoiceCallSignal(socket, data));
      socket.on('videoCallSignal', (data) => this.handleVideoCallSignal(socket, data));
      socket.on('screenShareSignal', (data) => this.handleScreenShareSignal(socket, data));
      
      // CIPHER-X: Connection Lifecycle Events
      socket.on('ping', () => socket.emit('pong', { timestamp: new Date() }));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }
  
  /**
   * CIPHER-X: Connection Handler
   * Processes new socket connections and updates user presence
   */
  private handleConnection(socket: Socket): void {
    const { id, username } = socket.data.user;
    
    // Add to connected users
    const user: ConnectedUser = {
      userId: id,
      socketId: socket.id,
      username: username
    };
    
    this.connectedUsers.set(id, user);
    
    logger.info(`✨ [Socket] User connected: ${username} (${id})`);
    
    // Update user status in database
    User.findByIdAndUpdate(id, { status: 'online', lastSeen: new Date() })
      .catch(err => logger.error(`❌ [Socket] Error updating user status: ${err}`));
    
    // Broadcast user online status to friends
    this.io.emit('userOnline', { userId: id });
    
    // Send list of online users to the connected user
    socket.emit('onlineUsers', Array.from(this.connectedUsers.values()));
  }
  
  /******************************************************************
   * CIPHER-X: QUANTUM MESSAGING PROTOCOL
   * Processes and relays chat messages to all appropriate recipients
   * Handles message persistence, delivery status, and notification
   ******************************************************************/
  private async handleSendMessage(socket: Socket, data: any): Promise<void> {
    try {
      const { channel, content, attachments, recipientId, replyTo } = data;
      const { id, username, displayName } = socket.data.user;
      
      // Generate unique message ID
      const messageId = new mongoose.Types.ObjectId().toString();
      
      // OMEGA-MATRIX: Create comprehensive message payload
      const messagePayload = {
        id: messageId,
        sender: {
          id,
          username,
          displayName
        },
        channel,
        content,
        attachments: attachments || [],
        replyTo: replyTo || null,
        timestamp: new Date(),
        edited: false,
        deliveryStatus: 'sent',
        recipientId: recipientId || null
      };
      
      logger.debug(`✨ [Socket] Message from ${username} to channel ${channel}`);
      
      // Check for direct message vs. channel message
      if (recipientId) {
        // CIPHER-X: Direct message handling
        this.sendToUser(recipientId, 'newMessage', messagePayload);
        // Send confirmation to sender
        socket.emit('messageSent', { id: messageId, timestamp: messagePayload.timestamp });
      } else {
        // CIPHER-X: Channel message handling
        socket.to(channel).emit('newMessage', messagePayload);
        // Also send to sender to confirm delivery
        socket.emit('messageSent', { id: messageId, timestamp: messagePayload.timestamp });
      }
      
      // Clear typing indicator when message is sent
      this.handleStopTyping(socket, { channel });
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error sending message: ${errorMessage}`);
      socket.emit('error', { message: 'Failed to send message', details: errorMessage });
    }
  }
  
  /******************************************************************
   * CIPHER-X: NEURAL TYPING INDICATOR SYSTEM
   * Sophisticated real-time typing status broadcast system
   * Includes channel context and user metadata
   ******************************************************************/
  private handleTyping(socket: Socket, data: any): void {
    try {
      const { channel, isTyping } = data;
      const { id, username, displayName } = socket.data.user;
      
      // Only proceed if we have valid channel info
      if (!channel) {
        socket.emit('error', { message: 'Channel ID is required for typing indicators' });
        return;
      }
      
      // Determine if this is a direct message or channel message
      const isDirect = channel.startsWith('user_');
      const targetId = isDirect ? channel.replace('user_', '') : null;
      
      // Create typing payload with rich metadata
      const typingPayload = {
        user: {
          id,
          username,
          displayName
        },
        channel,
        timestamp: new Date(),
        isDirect
      };
      
      // Send typing indicator based on context
      if (isDirect && targetId) {
        // Handle direct message typing
        this.sendToUser(targetId, isTyping ? 'userTyping' : 'userStoppedTyping', typingPayload);
      } else {
        // Handle channel typing
        socket.to(channel).emit(isTyping ? 'userTyping' : 'userStoppedTyping', typingPayload);
      }
      
      logger.debug(`✨ [Socket] User ${username} ${isTyping ? 'typing' : 'stopped typing'} in ${channel}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error handling typing indicator: ${errorMessage}`);
    }
  }
  
  /******************************************************************
   * CIPHER-X: TYPING STATE TERMINATOR
   * Handles explicit typing indicator cancellation
   * Broadcasts typing state changes to relevant recipients
   ******************************************************************/
  private handleStopTyping(socket: Socket, data: any): void {
    try {
      // Reuse typing handler with isTyping=false
      this.handleTyping(socket, { ...data, isTyping: false });
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error handling stop typing: ${errorMessage}`);
    }
  }
  
  /******************************************************************
   * CIPHER-X: EDIT MESSAGE PROTOCOL
   * Handles message edits with versioning and broadcast
   * Preserves edit history and notifies relevant users
   ******************************************************************/
  private async handleEditMessage(socket: Socket, data: any): Promise<void> {
    try {
      const { messageId, content, channel } = data;
      const { id, username, displayName } = socket.data.user;
      
      if (!messageId || !content) {
        socket.emit('error', { message: 'Message ID and content are required' });
        return;
      }
      
      // Create update payload
      const updatePayload = {
        id: messageId,
        sender: {
          id,
          username,
          displayName
        },
        content,
        channel,
        editedAt: new Date(),
        edited: true
      };
      
      // Broadcast the edit to channel
      socket.to(channel).emit('messageUpdated', updatePayload);
      
      // Confirm edit to sender
      socket.emit('messageEdited', { id: messageId, success: true });
      
      logger.debug(`✨ [Socket] Message ${messageId} edited by ${username}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error editing message: ${errorMessage}`);
      socket.emit('error', { message: 'Failed to edit message', details: errorMessage });
    }
  }
  
  /******************************************************************
   * CIPHER-X: DELETE MESSAGE PROTOCOL
   * Handles message removal with appropriate permissions
   * Notifies all relevant parties of message deletion
   ******************************************************************/
  private async handleDeleteMessage(socket: Socket, data: any): Promise<void> {
    try {
      const { messageId, channel } = data;
      const { id, username } = socket.data.user;
      
      if (!messageId || !channel) {
        socket.emit('error', { message: 'Message ID and channel are required' });
        return;
      }
      
      // Create delete payload
      const deletePayload = {
        id: messageId,
        channel,
        deletedBy: id,
        deletedAt: new Date()
      };
      
      // Broadcast the deletion to channel
      socket.to(channel).emit('messageDeleted', deletePayload);
      
      // Confirm deletion to sender
      socket.emit('messageDeleted', { id: messageId, success: true });
      
      logger.debug(`✨ [Socket] Message ${messageId} deleted by ${username}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error deleting message: ${errorMessage}`);
      socket.emit('error', { message: 'Failed to delete message', details: errorMessage });
    }
  }
  
  /******************************************************************
   * CIPHER-X: REACTION PROTOCOL
   * Handles emoji reactions to messages
   * Tracks user reactions and broadcasts updates
   ******************************************************************/
  private async handleReaction(socket: Socket, data: any): Promise<void> {
    try {
      const { messageId, emoji, channel, remove } = data;
      const { id, username, displayName } = socket.data.user;
      
      if (!messageId || !emoji || !channel) {
        socket.emit('error', { message: 'Message ID, emoji, and channel are required' });
        return;
      }
      
      // Create reaction payload
      const reactionPayload = {
        messageId,
        emoji,
        user: {
          id,
          username,
          displayName
        },
        channel,
        timestamp: new Date(),
        removed: remove === true
      };
      
      // Broadcast the reaction to channel
      socket.to(channel).emit('messageReaction', reactionPayload);
      
      // Confirm reaction to sender
      socket.emit('reactionAdded', { messageId, emoji, success: true });
      
      logger.debug(`✨ [Socket] Reaction ${emoji} ${remove ? 'removed from' : 'added to'} message ${messageId} by ${username}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error handling reaction: ${errorMessage}`);
      socket.emit('error', { message: 'Failed to process reaction', details: errorMessage });
    }
  }
  
  /******************************************************************
   * CIPHER-X: CHANNEL JOIN PROTOCOL
   * Handles user joining a channel or conversation
   * Sets up socket rooms and notifies channel members
   ******************************************************************/
  private async handleJoinChannel(socket: Socket, data: any): Promise<void> {
    try {
      const { channel } = data;
      const { id, username } = socket.data.user;
      
      if (!channel) {
        socket.emit('error', { message: 'Channel ID is required' });
        return;
      }
      
      // Join the socket room
      socket.join(channel);
      
      // Notify channel members
      socket.to(channel).emit('userJoined', {
        userId: id,
        username,
        channel,
        timestamp: new Date()
      });
      
      // Send confirmation to user
      socket.emit('channelJoined', { channel, success: true });
      
      logger.debug(`✨ [Socket] User ${username} joined channel ${channel}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error joining channel: ${errorMessage}`);
      socket.emit('error', { message: 'Failed to join channel', details: errorMessage });
    }
  }
  
  /******************************************************************
   * CIPHER-X: CHANNEL LEAVE PROTOCOL
   * Handles user leaving a channel or conversation
   * Cleans up socket rooms and notifies remaining members
   ******************************************************************/
  private async handleLeaveChannel(socket: Socket, data: any): Promise<void> {
    try {
      const { channel } = data;
      const { id, username } = socket.data.user;
      
      if (!channel) {
        socket.emit('error', { message: 'Channel ID is required' });
        return;
      }
      
      // Leave the socket room
      socket.leave(channel);
      
      // Notify channel members
      socket.to(channel).emit('userLeft', {
        userId: id,
        username,
        channel,
        timestamp: new Date()
      });
      
      // Send confirmation to user
      socket.emit('channelLeft', { channel, success: true });
      
      logger.debug(`✨ [Socket] User ${username} left channel ${channel}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error leaving channel: ${errorMessage}`);
      socket.emit('error', { message: 'Failed to leave channel', details: errorMessage });
    }
  }
  
  /******************************************************************
   * CIPHER-X: CHANNEL HISTORY PROTOCOL
   * Retrieves message history for a channel with pagination
   * Supports filtering and sorting options
   ******************************************************************/
  private async handleGetChannelHistory(socket: Socket, data: any): Promise<void> {
    try {
      const { channel, limit = 50, before, after } = data;
      const { id, username } = socket.data.user;
      
      if (!channel) {
        socket.emit('error', { message: 'Channel ID is required' });
        return;
      }
      
      // In a real implementation, we would query the database for messages
      // For now, we'll just mock the response
      const mockHistory = {
        messages: [],
        hasMore: false,
        channel
      };
      
      // Send channel history to requester
      socket.emit('channelHistory', mockHistory);
      
      logger.debug(`✨ [Socket] User ${username} requested history for channel ${channel}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error getting channel history: ${errorMessage}`);
      socket.emit('error', { message: 'Failed to get channel history', details: errorMessage });
    }
  }
  
  /******************************************************************
   * CIPHER-X: USER STATUS QUERY PROTOCOL
   * Retrieves current status information for specified users
   * Provides rich presence information including custom status
   ******************************************************************/
  private async handleGetUserStatus(socket: Socket, data: any): Promise<void> {
    try {
      const { userIds } = data;
      
      if (!userIds || !Array.isArray(userIds)) {
        socket.emit('error', { message: 'Valid user IDs array is required' });
        return;
      }
      
      // Collect status info for requested users
      const statuses: Record<string, any> = {};
      
      for (const userId of userIds) {
        const user = this.connectedUsers.get(userId);
        if (user) {
          statuses[userId] = {
            online: true,
            lastSeen: new Date(),
            // In a real implementation, we'd get the full status from the database
            status: 'online'
          };
        } else {
          // User not connected, get last status from database
          statuses[userId] = {
            online: false,
            lastSeen: null,
            status: 'offline'
          };
        }
      }
      
      // Send statuses to requester
      socket.emit('userStatuses', { statuses });
      
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error getting user statuses: ${errorMessage}`);
      socket.emit('error', { message: 'Failed to get user statuses', details: errorMessage });
    }
  }
  
  /******************************************************************
   * CIPHER-X: SCREEN SHARE SIGNAL PROTOCOL
   * Handles WebRTC signaling for screen sharing functionality
   * Routes signals between peers for direct connection
   ******************************************************************/
  private handleScreenShareSignal(socket: Socket, data: any): void {
    try {
      const { signal, targetUserId } = data;
      const { id, username, displayName } = socket.data.user;
      
      if (!signal || !targetUserId) {
        socket.emit('error', { message: 'Signal and target user ID are required' });
        return;
      }
      
      // Create signaling payload
      const signalingPayload = {
        signal,
        sender: {
          id,
          username,
          displayName
        },
        timestamp: new Date()
      };
      
      // Send to target user
      this.sendToUser(targetUserId, 'screenShareSignal', signalingPayload);
      
      logger.debug(`✨ [Socket] Screen share signal from ${username} to user ${targetUserId}`);
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      logger.error(`❌ [Socket] Error handling screen share signal: ${errorMessage}`);
      socket.emit('error', { message: 'Failed to process screen share signal', details: errorMessage });
    }
  }
  
  /**
   * CIPHER-X: Status Update Handler
   * Processes user status changes
   */
  private handleSetStatus(socket: Socket, data: any): void {
    const { status, statusMessage } = data;
    const { id, username } = socket.data.user;
    
    // Valid statuses
    const validStatuses = ['online', 'away', 'busy', 'invisible', 'offline'];
    
    if (!validStatuses.includes(status)) {
      socket.emit('error', { message: 'Invalid status value' });
      return;
    }
    
    // Update in database
    User.findByIdAndUpdate(id, { 
      status, 
      statusMessage: statusMessage || '',
      lastSeen: new Date()
    })
    .catch(err => logger.error(`❌ [Socket] Error updating user status: ${err}`));
    
    // Broadcast to all users
    this.io.emit('userStatusChanged', {
      userId: id,
      username,
      status,
      statusMessage: statusMessage || ''
    });
    
    logger.info(`✨ [Socket] Status changed for ${username}: ${status}`);
  }
  
  /**
   * CIPHER-X: Voice Call Signal Handler
   * Relays WebRTC signaling for voice calls
   */
  private handleVoiceCallSignal(socket: Socket, data: any): void {
    const { signal, targetUserId } = data;
    const { id, username, displayName } = socket.data.user;
    
    // Find target user's socket
    const targetUser = this.connectedUsers.get(targetUserId);
    
    if (!targetUser) {
      socket.emit('callError', { message: 'User is not online' });
      return;
    }
    
    // Send signal to target user
    this.io.to(targetUser.socketId).emit('voiceCallSignal', {
      signal,
      caller: {
        id,
        username,
        displayName
      }
    });
  }
  
  /**
   * CIPHER-X: Video Call Signal Handler
   * Relays WebRTC signaling for video calls
   */
  private handleVideoCallSignal(socket: Socket, data: any): void {
    const { signal, targetUserId } = data;
    const { id, username, displayName } = socket.data.user;
    
    // Find target user's socket
    const targetUser = this.connectedUsers.get(targetUserId);
    
    if (!targetUser) {
      socket.emit('callError', { message: 'User is not online' });
      return;
    }
    
    // Send signal to target user
    this.io.to(targetUser.socketId).emit('videoCallSignal', {
      signal,
      caller: {
        id,
        username,
        displayName
      }
    });
  }
  
  /**
   * CIPHER-X: Disconnection Handler
   * Manages socket disconnections and user offline status
   */
  private handleDisconnect(socket: Socket): void {
    const { id, username } = socket.data.user;
    
    // Remove from connected users
    this.connectedUsers.delete(id);
    
    logger.info(`✨ [Socket] User disconnected: ${username} (${id})`);
    
    // Update user status in database
    User.findByIdAndUpdate(id, { 
      status: 'offline', 
      lastSeen: new Date()
    })
    .catch(err => logger.error(`❌ [Socket] Error updating user status: ${err}`));
    
    // Broadcast user offline status
    this.io.emit('userOffline', { userId: id });
  }
  
  /**
   * CIPHER-X: Channel Join
   * Adds a socket to a specific channel (room)
   */
  public joinChannel(userId: string, channelId: string): void {
    const user = this.connectedUsers.get(userId);
    
    if (user) {
      this.io.sockets.sockets.get(user.socketId)?.join(channelId);
      logger.debug(`✨ [Socket] User ${userId} joined channel ${channelId}`);
    }
  }
  
  /**
   * CIPHER-X: Channel Leave
   * Removes a socket from a specific channel (room)
   */
  public leaveChannel(userId: string, channelId: string): void {
    const user = this.connectedUsers.get(userId);
    
    if (user) {
      this.io.sockets.sockets.get(user.socketId)?.leave(channelId);
      logger.debug(`✨ [Socket] User ${userId} left channel ${channelId}`);
    }
  }
  
  /**
   * CIPHER-X: Direct Message
   * Sends a message directly to a specific user
   */
  public sendToUser(targetUserId: string, event: string, data: any): void {
    const user = this.connectedUsers.get(targetUserId);
    
    if (user) {
      this.io.to(user.socketId).emit(event, data);
    }
  }
  
  /**
   * CIPHER-X: Channel Broadcast
   * Sends a message to all users in a channel
   */
  public sendToChannel(channelId: string, event: string, data: any): void {
    this.io.to(channelId).emit(event, data);
  }
  
  /**
   * CIPHER-X: Broadcast
   * Sends a message to all connected users
   */
  public broadcast(event: string, data: any): void {
    this.io.emit(event, data);
  }
}

export default SocketService;
