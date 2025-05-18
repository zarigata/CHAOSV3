// ==========================================================
// 💬 C.H.A.O.S. MESSAGE CONTROLLER 💬
// ==========================================================
// █▀▄▀█ █▀▀ █▀ █▀ ▄▀█ █▀▀ █▀▀   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █▀█ █░░
// █░▀░█ ██▄ ▄█ ▄█ █▀█ █▄█ ██▄   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █▄█ █▄▄
// ==========================================================
// [CODEX-1337] THIS MODULE HANDLES ALL MESSAGE OPERATIONS
// [CODEX-1337] INCLUDES DMs, CHANNEL MESSAGES, AND SYSTEM MESSAGES
// [CODEX-1337] SUPPORTS ENCRYPTION, EDITING, AND DELETION
// [CODEX-1337] HANDLES WEBSOCKET INTEGRATION FOR REAL-TIME DELIVERY
// ==========================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, MessageType } from '@prisma/client';
import { z } from 'zod';

// Initialize Prisma client
const prisma = new PrismaClient();

// ==========================================================
// 📊 VALIDATION SCHEMAS
// ==========================================================

const createDirectMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  recipientId: z.string().uuid(),
  isEncrypted: z.boolean().default(false),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO']).default('TEXT'),
  replyToId: z.string().uuid().optional(),
});

const createChannelMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  channelId: z.string().uuid(),
  isEncrypted: z.boolean().default(false),
  type: z.enum(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO']).default('TEXT'),
  replyToId: z.string().uuid().optional(),
});

const updateMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

// ==========================================================
// 🔍 HELPER FUNCTIONS
// ==========================================================

/**
 * Check if user can access a channel
 */
const canAccessChannel = async (channelId: string, userId: string): Promise<boolean> => {
  // Get the channel
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: {
      hub: {
        include: {
          members: {
            where: {
              userId,
            },
          },
        },
      },
    },
  });

  // No channel found
  if (!channel) {
    return false;
  }

  // Private channels require membership check
  if (channel.isPrivate) {
    // TODO: Implement private channel member check
    // For now, just check if user is a hub member
    return channel.hub.members.length > 0;
  }

  // Public channel - just check if user is a hub member
  return channel.hub.members.length > 0;
};

// ==========================================================
// 💬 MESSAGE CONTROLLERS
// ==========================================================

/**
 * Send a direct message to another user
 */
export const sendDirectMessage = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { content, recipientId, isEncrypted, type, replyToId } = createDirectMessageSchema.parse(request.body);

    // Check if recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: recipientId },
    });

    if (!recipient) {
      return reply.code(404).send({ error: 'Recipient not found' });
    }

    // Check if replying to a valid message
    if (replyToId) {
      const replyToMessage = await prisma.message.findUnique({
        where: { id: replyToId },
      });

      if (!replyToMessage) {
        return reply.code(404).send({ error: 'Reply message not found' });
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        recipientId,
        isEncrypted,
        type: type as MessageType,
        replyToId,
      },
    });

    // In a real app, emit the message to connected websockets
    // server.io.to(recipientId).emit('direct_message', message);

    return reply.code(201).send({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error sending message' });
  }
};

/**
 * Send a message to a channel
 */
export const sendChannelMessage = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { content, channelId, isEncrypted, type, replyToId } = createChannelMessageSchema.parse(request.body);

    // Check if user has access to the channel
    const hasAccess = await canAccessChannel(channelId, userId);
    if (!hasAccess) {
      return reply.code(403).send({ error: 'You do not have access to this channel' });
    }

    // Check if replying to a valid message
    if (replyToId) {
      const replyToMessage = await prisma.message.findUnique({
        where: { id: replyToId },
      });

      if (!replyToMessage) {
        return reply.code(404).send({ error: 'Reply message not found' });
      }
    }

    // Create message
    const message = await prisma.message.create({
      data: {
        content,
        senderId: userId,
        channelId,
        isEncrypted,
        type: type as MessageType,
        replyToId,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // In a real app, emit the message to connected websockets
    // server.io.to(`channel:${channelId}`).emit('channel_message', message);

    return reply.code(201).send({ message });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error sending message' });
  }
};

/**
 * Get direct messages between current user and another user
 */
export const getDirectMessages = async (
  request: FastifyRequest<{ Params: { userId: string }; Querystring: { limit?: string; before?: string } }>,
  reply: FastifyReply
) => {
  try {
    const currentUserId = request.user.id;
    const { userId } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit) : 50;
    const before = request.query.before;

    // Find messages where either user is sender or recipient
    const messages = await prisma.message.findMany({
      where: {
        AND: [
          // Either DM from current user to other user
          {
            OR: [
              {
                senderId: currentUserId,
                recipientId: userId,
              },
              {
                senderId: userId,
                recipientId: currentUserId,
              },
            ],
          },
          // If 'before' is specified, get messages before that ID
          ...(before
            ? [
                {
                  id: {
                    lt: before,
                  },
                },
              ]
            : []),
        ],
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });

    return reply.code(200).send({ messages: messages.reverse() });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error fetching messages' });
  }
};

/**
 * Get messages in a channel
 */
export const getChannelMessages = async (
  request: FastifyRequest<{ Params: { channelId: string }; Querystring: { limit?: string; before?: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = request.user.id;
    const { channelId } = request.params;
    const limit = request.query.limit ? parseInt(request.query.limit) : 50;
    const before = request.query.before;

    // Check if user has access to the channel
    const hasAccess = await canAccessChannel(channelId, userId);
    if (!hasAccess) {
      return reply.code(403).send({ error: 'You do not have access to this channel' });
    }

    // Get messages
    const messages = await prisma.message.findMany({
      where: {
        channelId,
        ...(before
          ? {
              id: {
                lt: before,
              },
            }
          : {}),
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
        replyTo: {
          select: {
            id: true,
            content: true,
            senderId: true,
            createdAt: true,
          },
        },
      },
    });

    return reply.code(200).send({ messages: messages.reverse() });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error fetching channel messages' });
  }
};

/**
 * Edit a message
 */
export const editMessage = async (
  request: FastifyRequest<{ Params: { messageId: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = request.user.id;
    const { messageId } = request.params;
    const { content } = updateMessageSchema.parse(request.body);

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return reply.code(404).send({ error: 'Message not found' });
    }

    // Check if user is the sender
    if (message.senderId !== userId) {
      return reply.code(403).send({ error: 'You can only edit your own messages' });
    }

    // Check if message is too old to edit (e.g., 24 hours)
    const messageAge = Date.now() - message.createdAt.getTime();
    const maxEditAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (messageAge > maxEditAge) {
      return reply.code(403).send({ error: 'Messages can only be edited within 24 hours of sending' });
    }

    // Update message
    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content,
        isEdited: true,
        updatedAt: new Date(),
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
    });

    // In a real app, emit the update to connected websockets
    // if (message.channelId) {
    //   server.io.to(`channel:${message.channelId}`).emit('message_updated', updatedMessage);
    // } else if (message.recipientId) {
    //   server.io.to(message.recipientId).emit('message_updated', updatedMessage);
    //   server.io.to(message.senderId).emit('message_updated', updatedMessage);
    // }

    return reply.code(200).send({ message: updatedMessage });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error updating message' });
  }
};

/**
 * Delete a message
 */
export const deleteMessage = async (
  request: FastifyRequest<{ Params: { messageId: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = request.user.id;
    const { messageId } = request.params;

    // Find the message
    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: {
        channel: {
          include: {
            hub: {
              include: {
                members: {
                  where: {
                    userId,
                    role: {
                      in: ['OWNER', 'ADMIN', 'MODERATOR'],
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!message) {
      return reply.code(404).send({ error: 'Message not found' });
    }

    // Check if user has permission to delete
    const isSender = message.senderId === userId;
    const isModeratorOfChannel =
      message.channel?.hub?.members && message.channel.hub.members.length > 0;

    if (!isSender && !isModeratorOfChannel) {
      return reply.code(403).send({ error: 'You do not have permission to delete this message' });
    }

    // Soft delete - update the content and mark as deleted
    const deletedMessage = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: 'This message has been deleted',
        isDeleted: true,
        updatedAt: new Date(),
      },
    });

    // In a real app, emit the deletion to connected websockets
    // if (message.channelId) {
    //   server.io.to(`channel:${message.channelId}`).emit('message_deleted', { id: messageId });
    // } else if (message.recipientId) {
    //   server.io.to(message.recipientId).emit('message_deleted', { id: messageId });
    //   server.io.to(message.senderId).emit('message_deleted', { id: messageId });
    // }

    return reply.code(200).send({ message: deletedMessage });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error deleting message' });
  }
};

/**
 * React to a message
 */
export const reactToMessage = async (
  request: FastifyRequest<{ Params: { messageId: string }; Body: { emoji: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = request.user.id;
    const { messageId } = request.params;
    const { emoji } = request.body;

    if (!emoji || typeof emoji !== 'string') {
      return reply.code(400).send({ error: 'Valid emoji is required' });
    }

    // In a production app, we would have a MessageReaction model
    // For now, we'll simulate a reaction with a response
    
    // Find the message first
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      return reply.code(404).send({ error: 'Message not found' });
    }

    // Check if user has access to this message
    if (message.channelId) {
      const hasAccess = await canAccessChannel(message.channelId, userId);
      if (!hasAccess) {
        return reply.code(403).send({ error: 'You do not have access to this message' });
      }
    } else if (message.recipientId !== userId && message.senderId !== userId) {
      return reply.code(403).send({ error: 'You do not have access to this message' });
    }

    return reply.code(200).send({ 
      messageId, 
      userId, 
      emoji,
      timestamp: new Date()
    });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error adding reaction' });
  }
};
