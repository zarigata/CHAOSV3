// ==========================================================
// 👤 C.H.A.O.S. USER MANAGEMENT ROUTES 👤
// ==========================================================
// - USER PROFILE OPERATIONS (GET/UPDATE/DELETE)
// - CONTACTS MANAGEMENT AND FRIEND REQUESTS
// - USER SEARCH AND DISCOVERY FEATURES
// ==========================================================

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';
import { getUserStatus, setUserStatus } from '../services/redis';

// Initialize Prisma client
const prisma = new PrismaClient();

export async function userRoutes(fastify: FastifyInstance) {
  // Require authentication for all user routes
  fastify.addHook('onRequest', fastify.authenticate);

  // ==========================================================
  // 📝 INPUT VALIDATION SCHEMAS
  // ==========================================================
  
  // Update profile validation schema
  const updateProfileSchema = z.object({
    displayName: z.string().min(1).max(50).optional(),
    statusMessage: z.string().max(100).optional(),
    avatarUrl: z.string().url().optional().nullable(),
  });

  // Update status validation schema
  const updateStatusSchema = z.object({
    status: z.enum(['ONLINE', 'AWAY', 'BUSY', 'INVISIBLE', 'OFFLINE']),
    statusMessage: z.string().max(100).optional(),
  });

  // Add contact validation schema
  const addContactSchema = z.object({
    username: z.string().min(3).max(20),
    nickname: z.string().min(1).max(50).optional(),
    groupName: z.string().min(1).max(30).optional(),
  });

  // ==========================================================
  // 📊 USER PROFILE ROUTES
  // ==========================================================

  // Get current user profile
  fastify.get('/profile', async (request, reply) => {
    const userId = request.user.userId;

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          statusMessage: true,
          status: true,
          createdAt: true,
        },
      });

      if (!user) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // Get real-time status from Redis
      const redisStatus = await getUserStatus(userId);
      
      return {
        ...user,
        // Use Redis status if available, otherwise use DB status
        status: redisStatus?.status || user.status,
        statusMessage: redisStatus?.statusMessage || user.statusMessage,
        createdAt: user.createdAt.toISOString(),
      };
    } catch (err) {
      logger.error({ err, userId }, 'Failed to get user profile');
      throw err;
    }
  });

  // Update user profile
  fastify.put('/profile', {
    schema: {
      body: updateProfileSchema,
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const updates = updateProfileSchema.parse(request.body);

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: updates,
        select: {
          id: true,
          username: true,
          email: true,
          displayName: true,
          avatarUrl: true,
          statusMessage: true,
          status: true,
        },
      });

      logger.info({ userId }, 'User profile updated');
      return updatedUser;
    } catch (err) {
      logger.error({ err, userId }, 'Failed to update user profile');
      throw err;
    }
  });

  // Update user status
  fastify.put('/status', {
    schema: {
      body: updateStatusSchema,
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { status, statusMessage } = updateStatusSchema.parse(request.body);

    try {
      // Update status in Redis for real-time presence
      await setUserStatus(userId, status, statusMessage);
      
      // Also update in database for persistence
      await prisma.user.update({
        where: { id: userId },
        data: {
          status,
          statusMessage,
        },
      });

      logger.info({ userId, status }, 'User status updated');
      
      return {
        status,
        statusMessage,
        updated: true,
      };
    } catch (err) {
      logger.error({ err, userId }, 'Failed to update user status');
      throw err;
    }
  });

  // Delete user account
  fastify.delete('/account', async (request, reply) => {
    const userId = request.user.userId;

    try {
      // Start a transaction to ensure all related data is properly deleted
      await prisma.$transaction(async (tx) => {
        // Delete all sessions
        await tx.userSession.deleteMany({
          where: { userId },
        });
        
        // Delete all contacts
        await tx.contact.deleteMany({
          where: {
            OR: [
              { userId },
              { contactId: userId },
            ],
          },
        });
        
        // Handle hub memberships
        // First find hubs where user is owner
        const ownedHubs = await tx.hub.findMany({
          where: { ownerId: userId },
          select: { id: true },
        });
        
        // Delete owned hubs and their channels
        for (const hub of ownedHubs) {
          // Delete all messages in hub's channels
          await tx.message.deleteMany({
            where: {
              channel: {
                hubId: hub.id,
              },
            },
          });
          
          // Delete channels
          await tx.channel.deleteMany({
            where: {
              hubId: hub.id,
            },
          });
          
          // Delete hub members
          await tx.hubMember.deleteMany({
            where: {
              hubId: hub.id,
            },
          });
          
          // Delete hub
          await tx.hub.delete({
            where: {
              id: hub.id,
            },
          });
        }
        
        // Delete hub memberships
        await tx.hubMember.deleteMany({
          where: { userId },
        });
        
        // Delete messages
        await tx.message.deleteMany({
          where: {
            OR: [
              { senderId: userId },
              { recipientId: userId },
            ],
          },
        });
        
        // Finally, delete the user
        await tx.user.delete({
          where: { id: userId },
        });
      });

      logger.info({ userId }, 'User account deleted');
      
      return {
        message: 'Account successfully deleted',
      };
    } catch (err) {
      logger.error({ err, userId }, 'Failed to delete user account');
      throw err;
    }
  });

  // ==========================================================
  // 👥 CONTACT MANAGEMENT ROUTES
  // ==========================================================

  // Get user contacts
  fastify.get('/contacts', async (request, reply) => {
    const userId = request.user.userId;

    try {
      const contacts = await prisma.contact.findMany({
        where: { userId },
        include: {
          contact: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatarUrl: true,
              status: true,
              statusMessage: true,
            },
          },
        },
        orderBy: [
          { groupName: 'asc' },
          { nickname: 'asc' },
        ],
      });

      // Transform data and get real-time status
      const contactsWithStatus = await Promise.all(contacts.map(async (contact) => {
        const redisStatus = await getUserStatus(contact.contact.id);
        
        return {
          id: contact.id,
          contactId: contact.contact.id,
          username: contact.contact.username,
          displayName: contact.contact.displayName,
          nickname: contact.nickname,
          avatarUrl: contact.contact.avatarUrl,
          groupName: contact.groupName || 'Friends',
          status: redisStatus?.status || contact.contact.status,
          statusMessage: redisStatus?.statusMessage || contact.contact.statusMessage,
        };
      }));
      
      // Group contacts by groupName
      const groupedContacts: Record<string, any[]> = {};
      
      contactsWithStatus.forEach(contact => {
        const group = contact.groupName;
        if (!groupedContacts[group]) {
          groupedContacts[group] = [];
        }
        groupedContacts[group].push(contact);
      });

      return groupedContacts;
    } catch (err) {
      logger.error({ err, userId }, 'Failed to get user contacts');
      throw err;
    }
  });

  // Add contact
  fastify.post('/contacts', {
    schema: {
      body: addContactSchema,
    },
  }, async (request, reply) => {
    const userId = request.user.userId;
    const { username, nickname, groupName } = addContactSchema.parse(request.body);

    try {
      // Find user by username
      const contactUser = await prisma.user.findUnique({
        where: { username },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      });

      if (!contactUser) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'User not found',
        });
      }

      // Check if adding self
      if (contactUser.id === userId) {
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Cannot add yourself as a contact',
        });
      }

      // Check if already a contact
      const existingContact = await prisma.contact.findFirst({
        where: {
          userId,
          contactId: contactUser.id,
        },
      });

      if (existingContact) {
        return reply.status(409).send({
          statusCode: 409,
          error: 'Conflict',
          message: 'This user is already in your contacts',
        });
      }

      // Add contact
      const contact = await prisma.contact.create({
        data: {
          userId,
          contactId: contactUser.id,
          nickname: nickname || contactUser.displayName,
          groupName: groupName || 'Friends',
        },
        include: {
          contact: {
            select: {
              username: true,
              displayName: true,
              avatarUrl: true,
              status: true,
              statusMessage: true,
            },
          },
        },
      });

      logger.info({ userId, contactId: contactUser.id }, 'Contact added');

      return {
        id: contact.id,
        contactId: contactUser.id,
        username: contactUser.username,
        displayName: contactUser.displayName,
        nickname: contact.nickname,
        groupName: contact.groupName,
        avatarUrl: contactUser.avatarUrl,
        status: contact.contact.status,
        statusMessage: contact.contact.statusMessage,
      };
    } catch (err) {
      logger.error({ err, userId }, 'Failed to add contact');
      throw err;
    }
  });

  // Remove contact
  fastify.delete('/contacts/:contactId', async (request, reply) => {
    const userId = request.user.userId;
    const contactId = (request.params as { contactId: string }).contactId;

    try {
      const contact = await prisma.contact.findFirst({
        where: {
          id: contactId,
          userId,
        },
      });

      if (!contact) {
        return reply.status(404).send({
          statusCode: 404,
          error: 'Not Found',
          message: 'Contact not found',
        });
      }

      await prisma.contact.delete({
        where: {
          id: contactId,
        },
      });

      logger.info({ userId, contactId }, 'Contact removed');

      return {
        message: 'Contact removed successfully',
      };
    } catch (err) {
      logger.error({ err, userId, contactId }, 'Failed to remove contact');
      throw err;
    }
  });

  // ==========================================================
  // 🔍 USER SEARCH ROUTES
  // ==========================================================

  // Search for users
  fastify.get('/search', async (request, reply) => {
    const userId = request.user.userId;
    const query = (request.query as { q: string }).q;
    
    if (!query || query.length < 3) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Search query must be at least 3 characters',
      });
    }

    try {
      const users = await prisma.user.findMany({
        where: {
          OR: [
            {
              username: {
                contains: query,
                mode: 'insensitive',
              },
            },
            {
              displayName: {
                contains: query,
                mode: 'insensitive',
              },
            },
          ],
          // Exclude self from results
          NOT: {
            id: userId,
          },
        },
        take: 20, // Limit results
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
        },
      });

      // Check which users are already contacts
      const contacts = await prisma.contact.findMany({
        where: {
          userId,
          contactId: {
            in: users.map(user => user.id),
          },
        },
        select: {
          contactId: true,
        },
      });

      const contactIds = new Set(contacts.map(c => c.contactId));

      // Return results with isContact flag
      return users.map(user => ({
        ...user,
        isContact: contactIds.has(user.id),
      }));
    } catch (err) {
      logger.error({ err, userId, query }, 'Failed to search users');
      throw err;
    }
  });
}
