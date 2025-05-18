// ==========================================================
// 🌐 C.H.A.O.S. HUB ROUTES 🌐
// ==========================================================
// █░█ █░█ █▄▄   █▀█ █▀█ █░█ ▀█▀ █▀▀ █▀
// █▀█ █▄█ █▄█   █▀▄ █▄█ █▄█ ░█░ ██▄ ▄█
// ==========================================================
// [CODEX-1337] ROUTES FOR HUB (SERVER) MANAGEMENT
// [CODEX-1337] HANDLES CREATION, UPDATES, AND DELETION
// [CODEX-1337] MANAGES CHANNELS AND MEMBERSHIP
// [CODEX-1337] IMPLEMENTS INVITE SYSTEM AND ROLE CONTROL
// ==========================================================

import type { FastifyInstance } from 'fastify';
import { 
  createHub,
  getHub,
  getUserHubs,
  updateHub,
  deleteHub,
  createChannel,
  updateChannel,
  deleteChannel,
  createInvite,
  joinHub,
  getHubMembers,
  updateMemberRole,
  removeMember
} from '../controllers/hub.controller';

/**
 * Hub and channel management routes
 */
export async function hubRoutes(fastify: FastifyInstance): Promise<void> {
  // All hub routes require authentication
  fastify.register(async (routes: FastifyInstance) => {
    // Apply JWT verification to all routes in this context
    routes.addHook('onRequest', fastify.authenticate);
    
    // Hub routes
    routes.post('/hubs', createHub);
    routes.get('/hubs', getUserHubs);
    routes.get('/hubs/:id', getHub);
    routes.put('/hubs/:id', updateHub);
    routes.delete('/hubs/:id', deleteHub);
    
    // Channel routes
    routes.post('/hubs/:hubId/channels', createChannel);
    routes.put('/hubs/:hubId/channels/:channelId', updateChannel);
    routes.delete('/hubs/:hubId/channels/:channelId', deleteChannel);
    
    // Invitation routes
    routes.post('/hubs/:hubId/invites', createInvite);
    routes.post('/invites/join', joinHub);
    
    // Member management
    routes.get('/hubs/:hubId/members', getHubMembers);
    routes.put('/hubs/:hubId/members/:memberId', updateMemberRole);
    routes.delete('/hubs/:hubId/members/:memberId', removeMember);
  });
}
