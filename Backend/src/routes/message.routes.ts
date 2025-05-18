// ==========================================================
// 💬 C.H.A.O.S. MESSAGE HANDLING ROUTES 💬
// ==========================================================
// - DIRECT MESSAGE OPERATIONS (SEND/RECEIVE/UPDATE/DELETE)
// - MESSAGE ENCRYPTION FOR PRIVATE COMMUNICATIONS
// - MESSAGE HISTORY AND SEARCH CAPABILITIES
// ==========================================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Initialize Prisma client
const prisma = new PrismaClient();

export async function messageRoutes(fastify: FastifyInstance) {
  // Require authentication for all message routes
  fastify.addHook('onRequest', fastify.authenticate);

  // ==========================================================
  // 📝 INPUT VALIDATION SCHEMAS
  // ==========================================================
  
  // Send direct message schema
  const sendDirectMessageSchema = z.object({
    recipientId: z.string().uuid('Invalid recipient ID format'),
    content: z.string().min(1, 'Message content cannot be empty').max(2000, 'Message too long'),
    isEncrypted: z.boolean().default(false),
    type: z.enum(['TEXT', 'IMAGE', 'FILE', 'AUDIO', 'VIDEO']).default('TEXT'),
    replyToId: z.string().uuid('Invalid reply message ID').optional(),
  });

  // Update message schema
  const updateMessageSchema = z.object({
    content: z.string().min(1, 'Message content cannot be empty').max(2000, 'Message too long'),
    isEncrypted: z.boolean().optional(),
  });

  // Message pagination schema
  const paginationSchema = z.object({
    limit: z.string().transform(val => parseInt(val)).default('20'),
    before: z.string().optional(), // Message ID for pagination (get messages before this ID)
  });

  // ==========================================================
  // 📊 DIRECT MESSAGE ROUTES
  // ==========================================================

  // Get direct message history with another user
  fastify.get('/direct/:userId', {
    schema: {
      querystring: paginationSchema,
      response: {
        200: {
          type: 'object',
          properties: {
            messages: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  content: { type: 'string' },
                  senderId: { type: 'string' },
                  recipientId: { type: 'string' },
                  type: { type: 'string' },
                  isEncrypted: { type: 'boolean' },
                  isEdited: { type: 'boolean' },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                  replyToId: { type: 'string', nullable: true },
                },
              },
            },
            hasMore: { type: 'boolean' },
          },
        },
      },
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const otherUserId = (request.params as { userId: string }).userId;
    const { limit, before } = request.query as z.infer<typeof paginationSchema>;
    
    // Validate user exists
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    });

    if (!otherUser) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'User not found',
      });
    }

    try {
      // Query conditions
      const whereCondition: any = {
        OR: [
          // Messages sent from current user to other user
          {
            senderId: userId,
            recipientId: otherUserId,
          },
          // Messages sent from other user to current user
          {
            senderId: otherUserId,
            recipientId: userId,
          },
        ],
        isDeleted: false,
      };

      // Add pagination condition if 'before' is specified
      if (before) {
        const beforeMessage = await prisma.message.findUnique({
          where: { id: before },
          select: { createdAt: true },
        });

        if (beforeMessage) {
          whereCondition.createdAt = {
            lt: beforeMessage.createdAt,
          };
        }
      }

      // Get messages
      const messages = await prisma.message.findMany({
        where: whereCondition,
        orderBy: {
          createdAt: 'desc', // Newest first
        },
        take: limit + 1, // Fetch one extra to check if more exist
        include: {
          replyTo: {
            select: {
              id: true,
              content: true,
              senderId: true,
              createdAt: true,
              type: true,
              isEncrypted: true,
            },
          },
        },
      });

      // Check if more messages exist
      const hasMore = messages.length > limit;
      const resultMessages = hasMore ? messages.slice(0, limit) : messages;

      // Format messages for client
      const formattedMessages = resultMessages.map(message => ({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        recipientId: message.recipientId,
        type: message.type,
        isEncrypted: message.isEncrypted,
        isEdited: message.isEdited,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        replyToId: message.replyToId,
        replyTo: message.replyTo ? {
          id: message.replyTo.id,
          content: message.replyTo.content,
          senderId: message.replyTo.senderId,
          createdAt: message.replyTo.createdAt.toISOString(),
          type: message.replyTo.type,
          isEncrypted: message.replyTo.isEncrypted,
        } : null,
      }));

      return {
        messages: formattedMessages,
        hasMore,
      };
    } catch (err) {
      logger.error({ err, userId, otherUserId }, 'Failed to get message history');
      throw err;
    }
  });

  // Send direct message (REST endpoint, not replacing WebSocket)
  fastify.post('/direct', {
    schema: {
      body: sendDirectMessageSchema,
    },
  }, async (request, reply) => {
    const senderId = request.user.userId;
    const messageData = sendDirectMessageSchema.parse(request.body);

    try {
      // Ensure recipient exists
      const recipient = await prisma.user.findUnique({
        where: { id: messageData.recipientId },
        select: { id: true },
      });

      if (!recipient) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Recipient not found',
        });
      }

      // Check if reply message exists if replyToId is provided
      if (messageData.replyToId) {
        const replyMessage = await prisma.message.findUnique({
          where: { id: messageData.replyToId },
          select: { id: true },
        });

        if (!replyMessage) {
          return reply.status(404).send({
            statusCode: 404,
            error: 'Not Found',
            message: 'Reply message not found',
          });
        }
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          content: messageData.content,
          senderId,
          recipientId: messageData.recipientId,
          type: messageData.type,
          isEncrypted: messageData.isEncrypted,
          replyToId: messageData.replyToId,
        },
      });

      logger.info({ 
        messageId: message.id, 
        senderId, 
        recipientId: messageData.recipientId 
      }, 'Direct message sent');

      // Message should be delivered via WebSocket if user is online
      // This endpoint serves as a backup or for offline messaging

      return {
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        recipientId: message.recipientId,
        type: message.type,
        isEncrypted: message.isEncrypted,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
        replyToId: message.replyToId,
      };
    } catch (err) {
      logger.error({ 
        err, 
        senderId, 
        recipientId: messageData.recipientId 
      }, 'Failed to send direct message');
      throw err;
    }
  });

  // Edit message
  fastify.put('/direct/:messageId', {
    schema: {
      body: updateMessageSchema,
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const messageId = (request.params as { messageId: string }).messageId;
    const updates = updateMessageSchema.parse(request.body);

    try {
      // Get message and verify ownership
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          senderId: true,
          recipientId: true,
          isDeleted: true,
        },
      });

      if (!message) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Message not found',
        });
      }

      if (message.senderId !== userId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'You cannot edit this message',
        });
      }

      if (message.isDeleted) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Cannot edit a deleted message',
        });
      }

      // Update message
      const updatedMessage = await prisma.message.update({
        where: { id: messageId },
        data: {
          content: updates.content,
          isEncrypted: updates.isEncrypted,
          isEdited: true,
        },
      });

      logger.info({ 
        messageId, 
        senderId: userId, 
        recipientId: message.recipientId 
      }, 'Message edited');

      return {
        id: updatedMessage.id,
        content: updatedMessage.content,
        senderId: updatedMessage.senderId,
        recipientId: updatedMessage.recipientId,
        type: updatedMessage.type,
        isEncrypted: updatedMessage.isEncrypted,
        isEdited: updatedMessage.isEdited,
        createdAt: updatedMessage.createdAt.toISOString(),
        updatedAt: updatedMessage.updatedAt.toISOString(),
      };
    } catch (err) {
      logger.error({ err, userId, messageId }, 'Failed to edit message');
      throw err;
    }
  });

  // Delete message (soft delete)
  fastify.delete('/direct/:messageId', async (request, reply) => {
    const userId = request.user.userId;
    const messageId = (request.params as { messageId: string }).messageId;

    try {
      // Get message and verify ownership
      const message = await prisma.message.findUnique({
        where: { id: messageId },
        select: {
          id: true,
          senderId: true,
          recipientId: true,
          isDeleted: true,
        },
      });

      if (!message) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Message not found',
        });
      }

      if (message.senderId !== userId) {
        return reply.status(403).send({
          statusCode: 403,
          error: 'Forbidden',
          message: 'You cannot delete this message',
        });
      }

      if (message.isDeleted) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Message is already deleted',
        });
      }

      // Soft delete the message
      await prisma.message.update({
        where: { id: messageId },
        data: {
          isDeleted: true,
          content: '[This message has been deleted]',
        },
      });

      logger.info({ 
        messageId, 
        senderId: userId, 
        recipientId: message.recipientId 
      }, 'Message deleted');

      return {
        message: 'Message deleted successfully',
      };
    } catch (err) {
      logger.error({ err, userId, messageId }, 'Failed to delete message');
      throw err;
    }
  });

  // ==========================================================
  // 🔍 MESSAGE SEARCH ROUTES
  // ==========================================================

  // Search through direct messages
  fastify.get('/search', async (request, reply) => {
    const userId = request.user.userId;
    const query = (request.query as { q?: string }).q;
    
    if (!query || query.length < 3) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Search query must be at least 3 characters',
      });
    }

    try {
      // Search for messages where user is sender or recipient
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId },
            { recipientId: userId },
          ],
          content: {
            contains: query,
            mode: 'insensitive',
          },
          isDeleted: false,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 20, // Limit results
        include: {
          sender: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
          recipient: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
            },
          },
        },
      });

      return messages.map(message => ({
        id: message.id,
        content: message.content,
        senderId: message.senderId,
        senderUsername: message.sender.username,
        senderDisplayName: message.sender.displayName,
        senderAvatarUrl: message.sender.avatarUrl,
        recipientId: message.recipientId,
        recipientUsername: message.recipient?.username,
        recipientDisplayName: message.recipient?.displayName,
        recipientAvatarUrl: message.recipient?.avatarUrl,
        type: message.type,
        createdAt: message.createdAt.toISOString(),
      }));
    } catch (err) {
      logger.error({ err, userId, query }, 'Failed to search messages');
      throw err;
    }
  });
}
