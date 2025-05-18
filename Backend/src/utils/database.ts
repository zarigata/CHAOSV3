// ==========================================================
// 🔌 C.H.A.O.S. DATABASE CONNECTION UTILITY 🔌
// ==========================================================
// █▀▄ █▄▄ ░ █░█ ▀█▀ █ █░░   █▀ █▀▀ █▀█ █░█ █ █▀▀ █▀▀ █▀
// █▄▀ █▄█ ▄ █▄█ ░█░ █ █▄▄   ▄█ ██▄ █▀▄ ▀▄▀ █ █▄▄ ██▄ ▄█
// ==========================================================
// [CODEX-1337] PRISMA DATABASE CONNECTION MANAGEMENT
// [CODEX-1337] SINGLETON CLIENT FOR PRODUCTION USE
// [CODEX-1337] SUPPORTS DEV/PROD ENVIRONMENTS
// [CODEX-1337] CROSS-PLATFORM COMPATIBLE
// ==========================================================

import { PrismaClient } from '@prisma/client';
import { dbLogger as logger } from './logger';

// Environment variables
const isDev = process.env.NODE_ENV !== 'production';

// Prisma client initialization options
const prismaOptions = isDev 
  ? { 
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'event', level: 'info' },
        { emit: 'event', level: 'warn' },
      ] 
    }
  : {};

// Create a singleton instance of PrismaClient
let prismaInstance: PrismaClient | null = null;

/**
 * [CODEX-1337] Gets a singleton instance of the Prisma client
 * [CODEX-1337] Ensures only one connection is active
 */
export function getPrismaClient(): PrismaClient {
  if (!prismaInstance) {
    prismaInstance = new PrismaClient(prismaOptions);
    
    if (isDev) {
      // Logging in development mode
      prismaInstance.$on('query', (e: any) => {
        logger.debug(`Query: ${e.query}`);
        logger.debug(`Duration: ${e.duration}ms`);
      });
      
      prismaInstance.$on('error', (e: any) => {
        logger.error('Prisma Client Error:', e);
      });
      
      prismaInstance.$on('info', (e: any) => {
        logger.info('Prisma Info:', e);
      });
      
      prismaInstance.$on('warn', (e: any) => {
        logger.warn('Prisma Warning:', e);
      });
    }
    
    logger.info('Prisma Client initialized');
  }
  
  return prismaInstance;
}

/**
 * [CODEX-1337] Closes the Prisma client connection
 * [CODEX-1337] Should be called when the application terminates
 */
export async function disconnectPrisma(): Promise<void> {
  if (prismaInstance) {
    await prismaInstance.$disconnect();
    prismaInstance = null;
    logger.info('Prisma Client disconnected');
  }
}

// Export the default instance
export const prisma = getPrismaClient();

// Handle application termination
process.on('SIGINT', async () => {
  logger.warn('SIGINT received - closing Prisma connection');
  await disconnectPrisma();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received - closing Prisma connection');
  await disconnectPrisma();
  process.exit(0);
});
