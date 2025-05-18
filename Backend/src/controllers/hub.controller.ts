// ==========================================================
// 🌐 C.H.A.O.S. HUB CONTROLLER 🌐
// ==========================================================
// █░█ █░█ █▄▄   █▀▀ █▀█ █▄░█ ▀█▀ █▀█ █▀█ █░░ █░░ █▀▀ █▀█
// █▀█ █▄█ █▄█   █▄▄ █▄█ █░▀█ ░█░ █▀▄ █▄█ █▄▄ █▄▄ ██▄ █▀▄
// ==========================================================
// [CODEX-1337] THIS MODULE MANAGES HUB (SERVER) OPERATIONS
// [CODEX-1337] HANDLES CREATION, MODIFICATION, AND DELETION
// [CODEX-1337] INCLUDES CHANNEL AND MEMBER MANAGEMENT
// [CODEX-1337] IMPLEMENTS ROLE-BASED ACCESS CONTROL
// ==========================================================

import { FastifyRequest, FastifyReply } from 'fastify';
import { PrismaClient, MemberRole } from '@prisma/client';
import { z } from 'zod';
import { randomBytes } from 'crypto';

// Initialize Prisma client
const prisma = new PrismaClient();

// ==========================================================
// 📊 VALIDATION SCHEMAS
// ==========================================================

const createHubSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Hub name must be at least 3 characters long' })
    .max(50, { message: 'Hub name cannot exceed 50 characters' }),
  description: z.string().max(500).optional(),
  iconUrl: z.string().url().optional(),
  initialChannels: z
    .array(
      z.object({
        name: z
          .string()
          .min(2, { message: 'Channel name must be at least 2 characters long' })
          .max(30, { message: 'Channel name cannot exceed 30 characters' })
          .regex(/^[a-z0-9-]+$/, {
            message: 'Channel name can only contain lowercase letters, numbers, and hyphens',
          }),
        description: z.string().max(100).optional(),
        isPrivate: z.boolean().default(false),
      })
    )
    .min(1, { message: 'At least one channel is required' }),
});

const updateHubSchema = z.object({
  name: z
    .string()
    .min(3, { message: 'Hub name must be at least 3 characters long' })
    .max(50, { message: 'Hub name cannot exceed 50 characters' })
    .optional(),
  description: z.string().max(500).optional(),
  iconUrl: z.string().url().optional(),
});

const createChannelSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Channel name must be at least 2 characters long' })
    .max(30, { message: 'Channel name cannot exceed 30 characters' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'Channel name can only contain lowercase letters, numbers, and hyphens',
    }),
  description: z.string().max(100).optional(),
  isPrivate: z.boolean().default(false),
});

const updateChannelSchema = z.object({
  name: z
    .string()
    .min(2, { message: 'Channel name must be at least 2 characters long' })
    .max(30, { message: 'Channel name cannot exceed 30 characters' })
    .regex(/^[a-z0-9-]+$/, {
      message: 'Channel name can only contain lowercase letters, numbers, and hyphens',
    })
    .optional(),
  description: z.string().max(100).optional(),
  isPrivate: z.boolean().optional(),
});

const inviteSchema = z.object({
  expiresIn: z.number().min(1800).max(2592000).optional(), // 30 min to 30 days in seconds
  maxUses: z.number().min(1).max(100).optional(),
});

const updateMemberRoleSchema = z.object({
  role: z.enum(['ADMIN', 'MODERATOR', 'MEMBER']),
});

// ==========================================================
// 🔍 HELPER FUNCTIONS
// ==========================================================

/**
 * Check if user has permission to perform action on hub
 */
const checkHubPermission = async (hubId: string, userId: string, requiredRoles: MemberRole[] = ['OWNER', 'ADMIN']) => {
  const member = await prisma.hubMember.findUnique({
    where: {
      hubId_userId: {
        hubId,
        userId,
      },
    },
  });

  if (!member) {
    return false;
  }

  return requiredRoles.includes(member.role);
};

/**
 * Generate an invite code
 */
const generateInviteCode = (): string => {
  return 'CHAOS-' + randomBytes(4).toString('hex');
};

// ==========================================================
// 🌐 HUB CONTROLLERS
// ==========================================================

/**
 * Create a new hub
 */
export const createHub = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;
    const { name, description, iconUrl, initialChannels } = createHubSchema.parse(request.body);

    // Create hub
    const hub = await prisma.hub.create({
      data: {
        name,
        description,
        iconUrl,
        ownerId: userId,
        // Add owner as a member
        members: {
          create: {
            userId,
            role: 'OWNER' as MemberRole,
          },
        },
        // Create initial channels
        channels: {
          create: initialChannels.map((channel) => ({
            name: channel.name,
            description: channel.description,
            isPrivate: channel.isPrivate || false,
          })),
        },
      },
      include: {
        channels: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
      },
    });

    return reply.code(201).send({ hub });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error creating hub' });
  }
};

/**
 * Get hub by ID
 */
export const getHub = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;

    // First check if user is a member
    const membership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: id,
          userId,
        },
      },
    });

    if (!membership) {
      return reply.code(403).send({ error: 'You are not a member of this hub' });
    }

    // Get hub with channels and members
    const hub = await prisma.hub.findUnique({
      where: { id },
      include: {
        channels: true,
        members: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatarUrl: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!hub) {
      return reply.code(404).send({ error: 'Hub not found' });
    }

    return reply.code(200).send({ hub });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error fetching hub' });
  }
};

/**
 * Get all hubs the user is a member of
 */
export const getUserHubs = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const userId = request.user.id;

    const hubs = await prisma.hub.findMany({
      where: {
        members: {
          some: {
            userId,
          },
        },
      },
      include: {
        channels: {
          take: 1, // Just get one channel to show in the UI
        },
        _count: {
          select: {
            members: true,
            channels: true,
          },
        },
      },
    });

    return reply.code(200).send({ hubs });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error fetching user hubs' });
  }
};

/**
 * Update hub details
 */
export const updateHub = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;
    const updates = updateHubSchema.parse(request.body);

    // Check permission
    const hasPermission = await checkHubPermission(id, userId, ['OWNER', 'ADMIN']);
    if (!hasPermission) {
      return reply.code(403).send({ error: 'You do not have permission to update this hub' });
    }

    // Update hub
    const hub = await prisma.hub.update({
      where: { id },
      data: updates,
    });

    return reply.code(200).send({ hub });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error updating hub' });
  }
};

/**
 * Delete hub
 */
export const deleteHub = async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
  try {
    const { id } = request.params;
    const userId = request.user.id;

    // Check permission - only owner can delete
    const membership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: id,
          userId,
        },
      },
    });

    if (!membership || membership.role !== 'OWNER') {
      return reply.code(403).send({ error: 'Only the hub owner can delete it' });
    }

    // Delete hub (will cascade delete channels and memberships)
    await prisma.hub.delete({
      where: { id },
    });

    return reply.code(200).send({ message: 'Hub deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error deleting hub' });
  }
};

// ==========================================================
// 📢 CHANNEL CONTROLLERS
// ==========================================================

/**
 * Create a new channel in a hub
 */
export const createChannel = async (
  request: FastifyRequest<{ Params: { hubId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { hubId } = request.params;
    const userId = request.user.id;
    const channelData = createChannelSchema.parse(request.body);

    // Check permission
    const hasPermission = await checkHubPermission(hubId, userId, ['OWNER', 'ADMIN']);
    if (!hasPermission) {
      return reply.code(403).send({ error: 'You do not have permission to create channels in this hub' });
    }

    // Check if channel name already exists in this hub
    const existingChannel = await prisma.channel.findUnique({
      where: {
        hubId_name: {
          hubId,
          name: channelData.name,
        },
      },
    });

    if (existingChannel) {
      return reply.code(409).send({ error: 'A channel with this name already exists in this hub' });
    }

    // Create channel
    const channel = await prisma.channel.create({
      data: {
        ...channelData,
        hubId,
      },
    });

    return reply.code(201).send({ channel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error creating channel' });
  }
};

/**
 * Update a channel
 */
export const updateChannel = async (
  request: FastifyRequest<{ Params: { hubId: string; channelId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { hubId, channelId } = request.params;
    const userId = request.user.id;
    const updates = updateChannelSchema.parse(request.body);

    // Check permission
    const hasPermission = await checkHubPermission(hubId, userId, ['OWNER', 'ADMIN']);
    if (!hasPermission) {
      return reply.code(403).send({ error: 'You do not have permission to update channels in this hub' });
    }

    // If name is being updated, check for conflicts
    if (updates.name) {
      const existingChannel = await prisma.channel.findUnique({
        where: {
          hubId_name: {
            hubId,
            name: updates.name,
          },
        },
      });

      if (existingChannel && existingChannel.id !== channelId) {
        return reply.code(409).send({ error: 'A channel with this name already exists in this hub' });
      }
    }

    // Update channel
    const channel = await prisma.channel.update({
      where: { id: channelId },
      data: updates,
    });

    return reply.code(200).send({ channel });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error updating channel' });
  }
};

/**
 * Delete a channel
 */
export const deleteChannel = async (
  request: FastifyRequest<{ Params: { hubId: string; channelId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { hubId, channelId } = request.params;
    const userId = request.user.id;

    // Check permission
    const hasPermission = await checkHubPermission(hubId, userId, ['OWNER', 'ADMIN']);
    if (!hasPermission) {
      return reply.code(403).send({ error: 'You do not have permission to delete channels in this hub' });
    }

    // Check if this is the last channel in the hub
    const channelCount = await prisma.channel.count({
      where: { hubId },
    });

    if (channelCount <= 1) {
      return reply.code(400).send({ error: 'Cannot delete the last channel in a hub' });
    }

    // Delete channel
    await prisma.channel.delete({
      where: { id: channelId },
    });

    return reply.code(200).send({ message: 'Channel deleted successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error deleting channel' });
  }
};

// ==========================================================
// 🤝 INVITATION CONTROLLERS
// ==========================================================

/**
 * Create a hub invitation
 */
export const createInvite = async (
  request: FastifyRequest<{ Params: { hubId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { hubId } = request.params;
    const userId = request.user.id;
    const { expiresIn, maxUses } = inviteSchema.parse(request.body);

    // Check permission
    const hasPermission = await checkHubPermission(hubId, userId, ['OWNER', 'ADMIN', 'MODERATOR']);
    if (!hasPermission) {
      return reply.code(403).send({ error: 'You do not have permission to create invites for this hub' });
    }

    // Calculate expiry date if provided
    let expiresAt = null;
    if (expiresIn) {
      expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
    }

    // Generate invite code
    const code = generateInviteCode();

    // Store invite in database (in a real app, you'd have an Invite model)
    // For now, we'll just mock the response
    const invite = {
      id: `invite-${Date.now()}`,
      code,
      hubId,
      createdById: userId,
      expiresAt,
      maxUses,
      uses: 0,
      createdAt: new Date(),
    };

    return reply.code(201).send({ invite });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error creating invite' });
  }
};

/**
 * Join a hub using an invitation code
 */
export const joinHub = async (
  request: FastifyRequest<{ Body: { code: string } }>,
  reply: FastifyReply
) => {
  try {
    const userId = request.user.id;
    const { code } = request.body;

    if (!code) {
      return reply.code(400).send({ error: 'Invite code is required' });
    }

    // In a real app, you'd validate the invite code against your database
    // For now, we'll assume it's valid and create a membership for a mock hub
    const hub = await prisma.hub.findFirst();

    if (!hub) {
      return reply.code(404).send({ error: 'Hub not found' });
    }

    // Check if user is already a member
    const existingMembership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId: hub.id,
          userId,
        },
      },
    });

    if (existingMembership) {
      return reply.code(409).send({ error: 'You are already a member of this hub' });
    }

    // Create membership
    const membership = await prisma.hubMember.create({
      data: {
        hubId: hub.id,
        userId,
        role: 'MEMBER',
      },
      include: {
        hub: {
          include: {
            channels: true,
          },
        },
      },
    });

    return reply.code(201).send({ membership });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error joining hub' });
  }
};

// ==========================================================
// 👥 MEMBER MANAGEMENT CONTROLLERS
// ==========================================================

/**
 * Get all members of a hub
 */
export const getHubMembers = async (
  request: FastifyRequest<{ Params: { hubId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { hubId } = request.params;
    const userId = request.user.id;

    // Check if user is a member
    const membership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId,
          userId,
        },
      },
    });

    if (!membership) {
      return reply.code(403).send({ error: 'You are not a member of this hub' });
    }

    // Get members
    const members = await prisma.hubMember.findMany({
      where: { hubId },
      include: {
        user: {
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
    });

    return reply.code(200).send({ members });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error fetching hub members' });
  }
};

/**
 * Update a member's role
 */
export const updateMemberRole = async (
  request: FastifyRequest<{ Params: { hubId: string; memberId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { hubId, memberId } = request.params;
    const userId = request.user.id;
    const { role } = updateMemberRoleSchema.parse(request.body);

    // Check if user has permission to change roles
    const userMembership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId,
          userId,
        },
      },
    });

    if (!userMembership) {
      return reply.code(403).send({ error: 'You are not a member of this hub' });
    }

    if (userMembership.role !== 'OWNER' && userMembership.role !== 'ADMIN') {
      return reply.code(403).send({ error: 'You do not have permission to update member roles' });
    }

    // Admin can't update owner's role
    if (userMembership.role === 'ADMIN') {
      const targetMember = await prisma.hubMember.findUnique({
        where: { id: memberId },
      });

      if (targetMember?.role === 'OWNER') {
        return reply.code(403).send({ error: 'Admins cannot modify the owner\'s role' });
      }
    }

    // Update role
    const updatedMember = await prisma.hubMember.update({
      where: { id: memberId },
      data: { role: role as MemberRole },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            displayName: true,
          },
        },
      },
    });

    return reply.code(200).send({ member: updatedMember });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return reply.code(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error updating member role' });
  }
};

/**
 * Remove a member from a hub
 */
export const removeMember = async (
  request: FastifyRequest<{ Params: { hubId: string; memberId: string } }>,
  reply: FastifyReply
) => {
  try {
    const { hubId, memberId } = request.params;
    const userId = request.user.id;

    // Get the target member
    const targetMember = await prisma.hubMember.findUnique({
      where: { id: memberId },
      include: {
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!targetMember) {
      return reply.code(404).send({ error: 'Member not found' });
    }

    // Check permission
    const userMembership = await prisma.hubMember.findUnique({
      where: {
        hubId_userId: {
          hubId,
          userId,
        },
      },
    });

    if (!userMembership) {
      return reply.code(403).send({ error: 'You are not a member of this hub' });
    }

    // Check role permissions
    if (targetMember.role === 'OWNER') {
      return reply.code(403).send({ error: 'The owner cannot be removed from the hub' });
    }

    if (userMembership.role === 'MODERATOR' && targetMember.role === 'ADMIN') {
      return reply.code(403).send({ error: 'Moderators cannot remove admins' });
    }

    if (userMembership.role === 'MEMBER') {
      // Regular members can only remove themselves
      if (targetMember.user.id !== userId) {
        return reply.code(403).send({ error: 'You do not have permission to remove other members' });
      }
    }

    // Delete membership
    await prisma.hubMember.delete({
      where: { id: memberId },
    });

    return reply.code(200).send({ message: 'Member removed successfully' });
  } catch (error) {
    request.log.error(error);
    return reply.code(500).send({ error: 'Internal server error removing member' });
  }
};
