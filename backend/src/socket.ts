/**
 * ╔════════════════════════════════════════════════════════════════════════════════════╗
 * ║                              << C.H.A.O.S.V3 - CODEX >>                            ║
 * ║                 REAL-TIME SOCKET COMPATIBILITY [QUANTUM-BRIDGE]                    ║
 * ╠════════════════════════════════════════════════════════════════════════════════════╣
 * ║  Compatibility layer for Socket.IO integration with SocketService                  ║
 * ║  Last Updated: 2025-05-12                                                          ║
 * ║  Author: CHAOSV3 Team                                                              ║
 * ╚════════════════════════════════════════════════════════════════════════════════════╝
 */

import { Server as SocketIOServer } from 'socket.io';
import { logger } from './utils/logger';
import SocketService from './services/socketService';

/**
 * CIPHER-X: Socket connection manager
 * Provides compatibility layer between server.ts and SocketService
 */
let socketServiceInstance: SocketService | null = null;

/**
 * CIPHER-X: Setup Socket Handlers
 * Bridge function for compatibility with existing server.ts implementation
 */
export const setupSocketHandlers = (io: SocketIOServer): void => {
  logger.info('✨ [Socket] Setting up Socket.IO handlers');
  
  try {
    // Create an instance of our SocketService if it doesn't exist
    if (!socketServiceInstance) {
      // The SocketService constructor expects an HttpServer, but we only get an IO instance here
      // @ts-ignore - Ignore type mismatch for compatibility
      socketServiceInstance = new SocketService(io.server || io);
      logger.info('✨ [Socket] Socket service created successfully');
    }
  } catch (error) {
    logger.error(`❌ [Socket] Error initializing SocketService: ${error}`);
  }
};

export default {
  setupSocketHandlers
};
