// ==========================================================
// 🔌 C.H.A.O.S. WEBSOCKET SERVICE 🔌
// ==========================================================
// - REAL-TIME MESSAGING AND PRESENCE DETECTION
// - SOCKET.IO IMPLEMENTATION WITH AUTHENTICATION
// - EVENT HANDLERS FOR USER INTERACTIONS
// ==========================================================

import { Server, Socket } from 'socket.io';
import { wsLogger as logger } from '../utils/logger';
import { setUserStatus, getUserStatus } from './redis';
import jwt from 'jsonwebtoken';

// Map to track connected users and their socket IDs
const connectedUsers = new Map<string, Set<string>>();

// JWT secret for authentication
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_changeme_in_production';

// Socket authentication middleware
const authenticateSocket = (socket: Socket, next: Function) => {
  // Get token from handshake auth or query
  const token = socket.handshake.auth.token || socket.handshake.query.token;
  
  if (!token) {
    const err = new Error('Authentication error: Token missing');
    logger.warn({ socketId: socket.id }, 'Socket connection rejected: No token');
    return next(err);
  }
  
  try {
    // Verify JWT token
    const decoded = jwt.verify(token as string, JWT_SECRET) as { userId: string };
    
    if (!decoded.userId) {
      throw new Error('Invalid token payload');
    }
    
    // Set user data on socket
    socket.data.userId = decoded.userId;
    logger.info({ userId: decoded.userId, socketId: socket.id }, 'Socket authenticated');
    next();
  } catch (err) {
    logger.warn({ socketId: socket.id, error: err }, 'Socket authentication failed');
    next(new Error('Authentication error: Invalid token'));
  }
};

// Setup WebSocket server
export const setupWebSockets = (io: Server): void => {
  // Apply global middleware for authentication
  io.use(authenticateSocket);
  
  // Handle new connections
  io.on('connection', (socket: Socket) => {
    const { userId } = socket.data;
    
    // Add user to connected users map
    if (!connectedUsers.has(userId)) {
      connectedUsers.set(userId, new Set());
    }
    connectedUsers.get(userId)?.add(socket.id);
    
    // Update user's online status in Redis
    setUserStatus(userId, 'ONLINE')
      .catch(err => logger.error({ err, userId }, 'Failed to set user online status'));
    
    logger.info({ userId, socketId: socket.id }, 'User connected');
    
    // Notify contacts that user is online
    socket.broadcast.emit('user:status', { userId, status: 'ONLINE' });
    
    // ==========================================================
    // 💬 MESSAGE EVENTS
    // ==========================================================
    
    // Handle direct messages
    socket.on('message:direct', async (data: { 
      recipientId: string,
      content: string,
      messageType?: string
    }) => {
      const { recipientId, content, messageType = 'TEXT' } = data;
      const timestamp = new Date();
      
      // Validate message
      if (!recipientId || !content) {
        logger.warn({ userId, socketId: socket.id }, 'Invalid message data');
        return;
      }
      
      try {
        // In a real implementation, save message to database here
        
        logger.info({ userId, recipientId }, 'Direct message sent');
        
        // Message payload to send to recipient
        const messagePayload = {
          id: `temp-${Date.now()}`, // Would be DB ID in real implementation
          senderId: userId,
          recipientId,
          content,
          type: messageType,
          timestamp: timestamp.toISOString(),
        };
        
        // Send to all recipient's connected devices
        const recipientSockets = connectedUsers.get(recipientId);
        if (recipientSockets && recipientSockets.size > 0) {
          recipientSockets.forEach(socketId => {
            io.to(socketId).emit('message:direct', messagePayload);
          });
        }
        
        // Acknowledge message receipt to sender
        socket.emit('message:sent', { 
          tempId: messagePayload.id,
          timestamp: timestamp.toISOString() 
        });
      } catch (err) {
        logger.error({ err, userId, recipientId }, 'Failed to process direct message');
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });
    
    // Handle channel messages
    socket.on('message:channel', async (data: { 
      channelId: string,
      content: string,
      messageType?: string
    }) => {
      const { channelId, content, messageType = 'TEXT' } = data;
      const timestamp = new Date();
      
      // Validate message
      if (!channelId || !content) {
        logger.warn({ userId, socketId: socket.id }, 'Invalid channel message data');
        return;
      }
      
      try {
        // In a real implementation, save message to database and check permissions
        
        logger.info({ userId, channelId }, 'Channel message sent');
        
        // Message payload to send to channel members
        const messagePayload = {
          id: `temp-${Date.now()}`, // Would be DB ID in real implementation
          senderId: userId,
          channelId,
          content,
          type: messageType,
          timestamp: timestamp.toISOString(),
        };
        
        // Broadcast to all users in the channel
        socket.to(channelId).emit('message:channel', messagePayload);
        
        // Acknowledge message receipt to sender
        socket.emit('message:sent', { 
          tempId: messagePayload.id,
          timestamp: timestamp.toISOString() 
        });
      } catch (err) {
        logger.error({ err, userId, channelId }, 'Failed to process channel message');
        socket.emit('message:error', { error: 'Failed to send message' });
      }
    });
    
    // ==========================================================
    // 🟢 TYPING AND PRESENCE EVENTS
    // ==========================================================
    
    // Handle typing indicator
    socket.on('typing:start', (data: { recipientId: string }) => {
      const { recipientId } = data;
      if (!recipientId) return;
      
      // Send typing notification to recipient
      const recipientSockets = connectedUsers.get(recipientId);
      if (recipientSockets && recipientSockets.size > 0) {
        recipientSockets.forEach(socketId => {
          io.to(socketId).emit('typing:start', { userId });
        });
      }
    });
    
    socket.on('typing:stop', (data: { recipientId: string }) => {
      const { recipientId } = data;
      if (!recipientId) return;
      
      // Send stop typing notification to recipient
      const recipientSockets = connectedUsers.get(recipientId);
      if (recipientSockets && recipientSockets.size > 0) {
        recipientSockets.forEach(socketId => {
          io.to(socketId).emit('typing:stop', { userId });
        });
      }
    });
    
    // Handle status changes
    socket.on('user:status', async (data: { 
      status: 'ONLINE' | 'AWAY' | 'BUSY' | 'INVISIBLE' | 'OFFLINE',
      statusMessage?: string
    }) => {
      const { status, statusMessage } = data;
      
      try {
        // Update status in Redis
        await setUserStatus(userId, status, statusMessage);
        
        // Only broadcast if not invisible
        if (status !== 'INVISIBLE') {
          socket.broadcast.emit('user:status', { 
            userId, 
            status,
            statusMessage
          });
        }
        
        logger.info({ userId, status }, 'User status updated');
      } catch (err) {
        logger.error({ err, userId }, 'Failed to update user status');
        socket.emit('status:error', { error: 'Failed to update status' });
      }
    });
    
    // ==========================================================
    // 📝 CHANNEL MANAGEMENT
    // ==========================================================
    
    // Join user to channel room
    socket.on('channel:join', (channelId: string) => {
      socket.join(channelId);
      logger.info({ userId, channelId }, 'User joined channel');
      
      // Notify others in channel
      socket.to(channelId).emit('channel:user_joined', { 
        channelId, 
        userId 
      });
    });
    
    // Leave channel
    socket.on('channel:leave', (channelId: string) => {
      socket.leave(channelId);
      logger.info({ userId, channelId }, 'User left channel');
      
      // Notify others in channel
      socket.to(channelId).emit('channel:user_left', { 
        channelId, 
        userId 
      });
    });
    
    // ==========================================================
    // 🔌 DISCONNECT HANDLING
    // ==========================================================
    
    // Handle disconnection
    socket.on('disconnect', async () => {
      logger.info({ userId, socketId: socket.id }, 'User disconnected');
      
      // Remove socket from user's connected sockets
      const userSockets = connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        
        // If no more active sockets, set user as offline and remove from map
        if (userSockets.size === 0) {
          connectedUsers.delete(userId);
          
          // Set user as offline in Redis
          await setUserStatus(userId, 'OFFLINE')
            .catch(err => logger.error({ err, userId }, 'Failed to set user offline status'));
            
          // Broadcast offline status to other users
          socket.broadcast.emit('user:status', { 
            userId, 
            status: 'OFFLINE' 
          });
        }
      }
    });
  });
  
  logger.info('WebSocket server initialized');
};
