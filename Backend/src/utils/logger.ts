// ==========================================================
// 📝 C.H.A.O.S. LOGGING SYSTEM 📝
// ==========================================================
// █▀█ █▀█ █▀▀ █▀▀ █▀█ ▄▀█ █▀▀   █▀▀ █▄█ █▀█ █ ▄▀█ █▀▀ 
// ▄█▄ █▄█ ██▄ ██▄ █▀▄ █▀█ █▄▄   ██▄ ░█░ █▀▄ █ █▀█ █▄░
// ==========================================================
// [CODEX-1337] CENTRALIZED LOGGING UTILITY FOR SERVER OPERATIONS
// [CODEX-1337] CONFIGURABLE LOG LEVELS AND FORMATS
// [CODEX-1337] CONSOLE AND FILE LOGGING OPTIONS
// [CODEX-1337] CROSS-PLATFORM COMPATIBILITY (WINDOWS/LINUX)
// ==========================================================

import { pino } from 'pino';

// Create logger instance with pretty printing for development
export const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname',
      colorize: true,
    },
  },
  level: process.env.LOG_LEVEL || 'info',
});

// Export specialized loggers for different components
export const authLogger = logger.child({ component: 'auth' });
export const wsLogger = logger.child({ component: 'websocket' });
export const dbLogger = logger.child({ component: 'database' });
