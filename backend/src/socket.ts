/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                 REAL-TIME SOCKET CONTROLLER [QUANTUM-SIGNAL-117]                   ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Socket.IO implementation for real-time communication across clients               ║
 * ║  Last Updated: 2025-05-11                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Server as SocketIOServer } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import User from './models/User';
import Message from './models/Message';
import Channel from './models/Channel';
import { logger } from './utils/logger';
import { SocketEvent } from '../../shared/types';

// User-socket mapping for keeping track of online users
const connectedUsers = new Map<string, string[]>();
// Active voice/video calls tracking
const activeCalls = new Map<string, Set<string>>();

/**
 * CIPHER-X: Main Socket.IO setup and event handling orchestrator
 * Manages real-time events between clients and coordinates signaling
 * for WebRTC connections and presence updates
 */
export const setupSocketHandlers = (io: SocketIOServer) => {
  // Middleware for JWT authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error: Token not provided'));
      }
      
      // Verify the JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'defaultsecret') as { id: string };
      const user = await User.findById(decoded.id);
      
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }
      
      // Attach user data to socket
      socket.data.user = {
        id: user._id.toString(),
        username: user.username,
        displayName: user.displayName
      };
      
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle connection event
  io.on('connection', async (socket) => {
    const userId = socket.data.user?.id;
    
    if (!userId) {
      logger.error('Socket connected without user data');
      socket.disconnect();
      return;
    }
    
    logger.info(`Socket connected: User ${socket.data.user.username} (${userId})`);
    
    // Track connected user
    if (connectedUsers.has(userId)) {
      connectedUsers.get(userId)?.push(socket.id);
    } else {
      connectedUsers.set(userId, [socket.id]);
      
      // Update user status to online
      await User.findByIdAndUpdate(userId, { status: 'online', lastActive: new Date() });
      
      // Broadcast user status change to friends
      const user = await User.findById(userId);
      if (user && user.friends.length > 0) {
        for (const friendId of user.friends) {
          if (connectedUsers.has(friendId.toString())) {
            const friendSockets = connectedUsers.get(friendId.toString()) || [];
            friendSockets.forEach(socketId => {
              io.to(socketId).emit(SocketEvent.USER_CONNECTED, {
                userId,
                username: socket.data.user.username,
                displayName: socket.data.user.displayName,
                status: 'online'
              });
            });
          }
        }
      }
    }

    // Handle disconnect
    socket.on('disconnect', async () => {
      logger.info(`Socket disconnected: User ${socket.data.user.username} (${userId})`);
      
      // Remove this socket from the user's connected sockets
      if (connectedUsers.has(userId)) {
        const userSockets = connectedUsers.get(userId) || [];
        const updatedSockets = userSockets.filter(id => id !== socket.id);
        
        if (updatedSockets.length === 0) {
          // User has no more active connections
          connectedUsers.delete(userId);
          
          // Update user status to offline
          await User.findByIdAndUpdate(userId, { 
            status: 'offline', 
            lastActive: new Date() 
          });
          
          // Broadcast user disconnection to friends
          const user = await User.findById(userId);
          if (user && user.friends.length > 0) {
            for (const friendId of user.friends) {
              if (connectedUsers.has(friendId.toString())) {
                const friendSockets = connectedUsers.get(friendId.toString()) || [];
                friendSockets.forEach(socketId => {
                  io.to(socketId).emit(SocketEvent.USER_DISCONNECTED, { userId });
                });
              }
            }
          }
          
          // Remove user from any active calls
          for (const [callId, participants] of activeCalls.entries()) {
            if (participants.has(userId)) {
              participants.delete(userId);
              // Notify other participants
              if (participants.size > 0) {
                participants.forEach(participantId => {
                  if (connectedUsers.has(participantId)) {
                    const participantSockets = connectedUsers.get(participantId) || [];
                    participantSockets.forEach(socketId => {
                      io.to(socketId).emit(SocketEvent.CALL_ENDED, { 
                        callId, 
                        userId,
                        reason: 'user_disconnected' 
                      });
                    });
                  }
                });
              }
              // If no participants left, delete the call
              if (participants.size === 0) {
                activeCalls.delete(callId);
              }
            }
          }
        } else {
          // User still has other active connections
          connectedUsers.set(userId, updatedSockets);
        }
      }
    });

    // ===== USER & PRESENCE EVENTS =====
    
    // Handle user status change
    socket.on(SocketEvent.USER_STATUS_CHANGED, async (data: { status: string, customStatus?: string }) => {
      try {
        await User.findByIdAndUpdate(userId, { 
          status: data.status,
          customStatus: data.customStatus,
          lastActive: new Date()
        });
        
        // Broadcast status change to friends
        const user = await User.findById(userId);
        if (user && user.friends.length > 0) {
          for (const friendId of user.friends) {
            if (connectedUsers.has(friendId.toString())) {
              const friendSockets = connectedUsers.get(friendId.toString()) || [];
              friendSockets.forEach(socketId => {
                io.to(socketId).emit(SocketEvent.USER_STATUS_CHANGED, {
                  userId,
                  status: data.status,
                  customStatus: data.customStatus
                });
              });
            }
          }
        }
      } catch (error) {
        logger.error('Error updating user status:', error);
      }
    });
    
    // Handle typing indicator
    socket.on(SocketEvent.USER_TYPING, async (data: { channelId: string }) => {
      try {
        const channel = await Channel.findById(data.channelId);
        if (!channel) return;
        
        // For DM channels, notify the other participant
        if (channel.type === 'dm' && channel.participants) {
          const otherUserId = channel.participants.find(
            p => p.toString() !== userId
          )?.toString();
          
          if (otherUserId && connectedUsers.has(otherUserId)) {
            const otherUserSockets = connectedUsers.get(otherUserId) || [];
            otherUserSockets.forEach(socketId => {
              io.to(socketId).emit(SocketEvent.USER_TYPING, {
                channelId: data.channelId,
                userId
              });
            });
          }
        }
        // For group/server channels, notify all participants
        else if (['text', 'group'].includes(channel.type)) {
          // For server channels, get all users with access
          if (channel.type === 'text' && channel.server) {
            // Implementation depends on your permission model
            // This is a simplified version that broadcasts to all server members
            const Server = require('./models/Server').default;
            const server = await Server.findById(channel.server);
            if (server) {
              const memberIds = server.members.map((m: any) => m.user.toString());
              for (const memberId of memberIds) {
                if (memberId !== userId && connectedUsers.has(memberId)) {
                  const memberSockets = connectedUsers.get(memberId) || [];
                  memberSockets.forEach(socketId => {
                    io.to(socketId).emit(SocketEvent.USER_TYPING, {
                      channelId: data.channelId,
                      userId
                    });
                  });
                }
              }
            }
          }
          // For group channels, notify all participants
          else if (channel.type === 'group' && channel.participants) {
            for (const participantId of channel.participants) {
              const partId = participantId.toString();
              if (partId !== userId && connectedUsers.has(partId)) {
                const partSockets = connectedUsers.get(partId) || [];
                partSockets.forEach(socketId => {
                  io.to(socketId).emit(SocketEvent.USER_TYPING, {
                    channelId: data.channelId,
                    userId
                  });
                });
              }
            }
          }
        }
      } catch (error) {
        logger.error('Error handling typing event:', error);
      }
    });

    // ===== MESSAGING EVENTS =====
    
    // Handle new message
    socket.on(SocketEvent.MESSAGE_CREATED, async (data: { 
      channelId: string,
      content: string,
      replyTo?: string,
      attachments?: Array<{
        type: string,
        url: string,
        name: string,
        size: number,
        mimeType: string
      }>
    }) => {
      try {
        const channel = await Channel.findById(data.channelId);
        if (!channel) return;
        
        // Create the message
        const newMessage = new Message({
          sender: userId,
          content: data.content,
          replyTo: data.replyTo,
          attachments: data.attachments,
          readBy: [userId]
        });
        
        // Set the appropriate channel/recipient fields
        if (channel.type === 'dm') {
          newMessage.recipient = channel.participants?.find(
            p => p.toString() !== userId
          );
        } else if (['text', 'voice', 'video'].includes(channel.type)) {
          newMessage.channel = channel._id;
          newMessage.server = channel.server;
        } else if (channel.type === 'group') {
          newMessage.channel = channel._id;
        }
        
        await newMessage.save();
        
        // Update the channel's last message and activity
        await Channel.findByIdAndUpdate(data.channelId, {
          lastMessage: newMessage._id,
          lastActivity: new Date()
        });
        
        // Broadcast to recipients
        const messageData = {
          ...newMessage.toObject(),
          id: newMessage._id
        };
        
        // For DM channels, notify the other participant
        if (channel.type === 'dm' && channel.participants) {
          const otherUserId = channel.participants.find(
            p => p.toString() !== userId
          )?.toString();
          
          if (otherUserId && connectedUsers.has(otherUserId)) {
            const otherUserSockets = connectedUsers.get(otherUserId) || [];
            otherUserSockets.forEach(socketId => {
              io.to(socketId).emit(SocketEvent.MESSAGE_CREATED, messageData);
            });
          }
        }
        // For group/server channels, notify all participants
        else if (['text', 'group'].includes(channel.type)) {
          let recipientIds: string[] = [];
          
          // For server channels, get all users with access
          if (channel.type === 'text' && channel.server) {
            const Server = require('./models/Server').default;
            const server = await Server.findById(channel.server);
            if (server) {
              recipientIds = server.members.map((m: any) => m.user.toString());
            }
          }
          // For group channels, get all participants
          else if (channel.type === 'group' && channel.participants) {
            recipientIds = channel.participants.map(p => p.toString());
          }
          
          // Send to all recipients except sender
          for (const recipientId of recipientIds) {
            if (recipientId !== userId && connectedUsers.has(recipientId)) {
              const recipientSockets = connectedUsers.get(recipientId) || [];
              recipientSockets.forEach(socketId => {
                io.to(socketId).emit(SocketEvent.MESSAGE_CREATED, messageData);
              });
            }
          }
        }
      } catch (error) {
        logger.error('Error handling new message:', error);
      }
    });

    // ===== CALL SIGNALING EVENTS =====
    
    // Initialize a call
    socket.on(SocketEvent.CALL_INITIATED, async (data: { 
      targetUserId: string, 
      callType: 'audio' | 'video',
      channelId?: string  // For group calls
    }) => {
      try {
        // Check if target user is online
        if (connectedUsers.has(data.targetUserId)) {
          // Generate a unique call ID
          const callId = `call_${Date.now()}_${userId}_${data.targetUserId}`;
          
          // Create entry in active calls
          activeCalls.set(callId, new Set([userId]));
          
          // Send call request to target user
          const targetSockets = connectedUsers.get(data.targetUserId) || [];
          targetSockets.forEach(socketId => {
            io.to(socketId).emit(SocketEvent.CALL_INITIATED, {
              callId,
              callerId: userId,
              callerName: socket.data.user.displayName,
              callType: data.callType,
              channelId: data.channelId
            });
          });
          
          // Confirm to caller that request has been sent
          socket.emit('callRequestSent', { callId, targetUserId: data.targetUserId });
        } else {
          // Target user is offline
          socket.emit('callError', { 
            error: 'user_offline',
            message: 'User is currently offline'
          });
        }
      } catch (error) {
        logger.error('Error initiating call:', error);
      }
    });
    
    // Handle call accepted
    socket.on(SocketEvent.CALL_ACCEPTED, async (data: { callId: string }) => {
      try {
        if (activeCalls.has(data.callId)) {
          // Add user to call participants
          activeCalls.get(data.callId)?.add(userId);
          
          // Notify all participants about the acceptance
          const participants = activeCalls.get(data.callId) || new Set();
          participants.forEach(participantId => {
            if (participantId !== userId && connectedUsers.has(participantId)) {
              const participantSockets = connectedUsers.get(participantId) || [];
              participantSockets.forEach(socketId => {
                io.to(socketId).emit(SocketEvent.CALL_ACCEPTED, {
                  callId: data.callId,
                  userId
                });
              });
            }
          });
        }
      } catch (error) {
        logger.error('Error accepting call:', error);
      }
    });
    
    // Handle call rejected
    socket.on(SocketEvent.CALL_REJECTED, async (data: { callId: string }) => {
      try {
        if (activeCalls.has(data.callId)) {
          // Notify participants about rejection
          const participants = activeCalls.get(data.callId) || new Set();
          participants.forEach(participantId => {
            if (participantId !== userId && connectedUsers.has(participantId)) {
              const participantSockets = connectedUsers.get(participantId) || [];
              participantSockets.forEach(socketId => {
                io.to(socketId).emit(SocketEvent.CALL_REJECTED, {
                  callId: data.callId,
                  userId
                });
              });
            }
          });
          
          // Remove call from active calls
          activeCalls.delete(data.callId);
        }
      } catch (error) {
        logger.error('Error rejecting call:', error);
      }
    });
    
    // Handle call ended
    socket.on(SocketEvent.CALL_ENDED, async (data: { callId: string }) => {
      try {
        if (activeCalls.has(data.callId)) {
          // Notify participants about call ending
          const participants = activeCalls.get(data.callId) || new Set();
          participants.forEach(participantId => {
            if (participantId !== userId && connectedUsers.has(participantId)) {
              const participantSockets = connectedUsers.get(participantId) || [];
              participantSockets.forEach(socketId => {
                io.to(socketId).emit(SocketEvent.CALL_ENDED, {
                  callId: data.callId,
                  userId
                });
              });
            }
          });
          
          // Remove call from active calls
          activeCalls.delete(data.callId);
        }
      } catch (error) {
        logger.error('Error ending call:', error);
      }
    });
    
    // WebRTC signaling: Handle SDP offer
    socket.on(SocketEvent.SIGNAL_OFFER, (data: { callId: string, targetUserId: string, sdp: any }) => {
      try {
        if (connectedUsers.has(data.targetUserId)) {
          const targetSockets = connectedUsers.get(data.targetUserId) || [];
          targetSockets.forEach(socketId => {
            io.to(socketId).emit(SocketEvent.SIGNAL_OFFER, {
              callId: data.callId,
              fromUserId: userId,
              sdp: data.sdp
            });
          });
        }
      } catch (error) {
        logger.error('Error handling SDP offer:', error);
      }
    });
    
    // WebRTC signaling: Handle SDP answer
    socket.on(SocketEvent.SIGNAL_ANSWER, (data: { callId: string, targetUserId: string, sdp: any }) => {
      try {
        if (connectedUsers.has(data.targetUserId)) {
          const targetSockets = connectedUsers.get(data.targetUserId) || [];
          targetSockets.forEach(socketId => {
            io.to(socketId).emit(SocketEvent.SIGNAL_ANSWER, {
              callId: data.callId,
              fromUserId: userId,
              sdp: data.sdp
            });
          });
        }
      } catch (error) {
        logger.error('Error handling SDP answer:', error);
      }
    });
    
    // WebRTC signaling: Handle ICE candidate
    socket.on(SocketEvent.SIGNAL_ICE_CANDIDATE, (data: { callId: string, targetUserId: string, candidate: any }) => {
      try {
        if (connectedUsers.has(data.targetUserId)) {
          const targetSockets = connectedUsers.get(data.targetUserId) || [];
          targetSockets.forEach(socketId => {
            io.to(socketId).emit(SocketEvent.SIGNAL_ICE_CANDIDATE, {
              callId: data.callId,
              fromUserId: userId,
              candidate: data.candidate
            });
          });
        }
      } catch (error) {
        logger.error('Error handling ICE candidate:', error);
      }
    });

    // ===== FRIEND MANAGEMENT EVENTS =====
    
    // Friend request
    socket.on(SocketEvent.FRIEND_REQUEST, async (data: { targetUserId: string }) => {
      try {
        // Update sender's pending friends
        await User.findByIdAndUpdate(userId, {
          $addToSet: { pendingFriends: data.targetUserId }
        });
        
        // Notify the recipient if online
        if (connectedUsers.has(data.targetUserId)) {
          const targetSockets = connectedUsers.get(data.targetUserId) || [];
          targetSockets.forEach(socketId => {
            io.to(socketId).emit(SocketEvent.FRIEND_REQUEST, {
              userId,
              username: socket.data.user.username,
              displayName: socket.data.user.displayName
            });
          });
        }
      } catch (error) {
        logger.error('Error sending friend request:', error);
      }
    });
    
    // Friend request accepted
    socket.on(SocketEvent.FRIEND_ACCEPTED, async (data: { targetUserId: string }) => {
      try {
        // Add users to each other's friend lists
        await User.findByIdAndUpdate(userId, {
          $addToSet: { friends: data.targetUserId },
          $pull: { pendingFriends: data.targetUserId }
        });
        
        await User.findByIdAndUpdate(data.targetUserId, {
          $addToSet: { friends: userId },
          $pull: { pendingFriends: userId }
        });
        
        // Notify the other user if online
        if (connectedUsers.has(data.targetUserId)) {
          const targetSockets = connectedUsers.get(data.targetUserId) || [];
          targetSockets.forEach(socketId => {
            io.to(socketId).emit(SocketEvent.FRIEND_ACCEPTED, {
              userId,
              username: socket.data.user.username,
              displayName: socket.data.user.displayName,
              status: 'online'
            });
          });
        }
      } catch (error) {
        logger.error('Error accepting friend request:', error);
      }
    });
  });

  // Return the Socket.IO instance for use elsewhere
  return io;
};
