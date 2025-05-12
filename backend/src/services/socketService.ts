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

import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
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
    
    // Connection handler
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
      
      // Message events
      socket.on('sendMessage', (data) => this.handleSendMessage(socket, data));
      socket.on('typing', (data) => this.handleTyping(socket, data));
      socket.on('stopTyping', (data) => this.handleStopTyping(socket, data));
      
      // Status events
      socket.on('setStatus', (data) => this.handleSetStatus(socket, data));
      
      // Voice/Video events
      socket.on('voiceCallSignal', (data) => this.handleVoiceCallSignal(socket, data));
      socket.on('videoCallSignal', (data) => this.handleVideoCallSignal(socket, data));
      
      // Disconnection handler
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
  
  /**
   * CIPHER-X: Message Handler
   * Processes and relays chat messages to recipients
   */
  private handleSendMessage(socket: Socket, data: any): void {
    const { channelId, content, attachments } = data;
    const { id, username, displayName } = socket.data.user;
    
    // Create message payload
    const messagePayload = {
      sender: {
        id,
        username,
        displayName
      },
      channelId,
      content,
      attachments,
      timestamp: new Date()
    };
    
    logger.debug(`✨ [Socket] Message from ${username} to channel ${channelId}`);
    
    // Broadcast to channel (room)
    socket.to(channelId).emit('newMessage', messagePayload);
  }
  
  /**
   * CIPHER-X: Typing Indicator Handler
   * Manages typing indicator events
   */
  private handleTyping(socket: Socket, data: any): void {
    const { channelId } = data;
    const { id, username } = socket.data.user;
    
    socket.to(channelId).emit('userTyping', {
      userId: id,
      username,
      channelId
    });
  }
  
  /**
   * CIPHER-X: Stop Typing Handler
   * Manages stop typing indicator events
   */
  private handleStopTyping(socket: Socket, data: any): void {
    const { channelId } = data;
    const { id } = socket.data.user;
    
    socket.to(channelId).emit('userStoppedTyping', {
      userId: id,
      channelId
    });
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
