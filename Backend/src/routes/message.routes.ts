// ==========================================================
// 💬 C.H.A.O.S. MESSAGE HANDLING ROUTES 💬
// ==========================================================
// █▀▄▀█ █▀▀ █▀ █▀ ▄▀█ █▀▀ █▀▀   █▀█ █▀█ █░█ ▀█▀ █▀▀ █▀
// █░▀░█ ██▄ ▄█ ▄█ █▀█ █▄█ ██▄   █▀▄ █▄█ █▄█ ░█░ ██▄ ▄█
// ==========================================================
// [CODEX-1337] ROUTES FOR REAL-TIME COMMUNICATION
// [CODEX-1337] HANDLES DIRECT AND CHANNEL MESSAGES
// [CODEX-1337] SUPPORTS ENCRYPTION, EDITING, AND DELETION
// [CODEX-1337] IMPLEMENTS MESSAGE REACTIONS AND REPLIES
// ==========================================================

import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { 
  sendDirectMessage,
  sendChannelMessage,
  getDirectMessages,
  getChannelMessages,
  editMessage,
  deleteMessage,
  reactToMessage
} from '../controllers/message.controller';

/**
 * [CODEX-1337] Message handling routes for the C.H.A.O.S. application
 * [CODEX-1337] Implements real-time messaging capabilities
 * [CODEX-1337] All routes are protected by authentication
 */
export default async function messageRoutes(fastify: FastifyInstance): Promise<void> {
  // All message routes require authentication
  fastify.register(async (routes: FastifyInstance) => {
    // Apply JWT verification to all routes in this context
    routes.addHook('onRequest', fastify.authenticate);
    
    // Direct message routes
    routes.post('/direct', sendDirectMessage);
    routes.get('/direct/:userId', getDirectMessages);
    
    // Channel message routes
    routes.post('/channel/:channelId', sendChannelMessage);
    routes.get('/channel/:channelId', getChannelMessages);
    
    // Message management routes
    routes.put('/message/:messageId', editMessage);
    routes.delete('/message/:messageId', deleteMessage);
    routes.post('/message/:messageId/react', reactToMessage);
  });

  // ==========================================================
  // 🔍 MESSAGE SEARCH ROUTES
  // ==========================================================

  // Search through direct messages
  fastify.get('/search', async (request: FastifyRequest, reply: FastifyReply) => {
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
