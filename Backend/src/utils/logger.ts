// ==========================================================
// 📝 C.H.A.O.S. LOGGING SYSTEM 📝
// ==========================================================
// - CENTRALIZED LOGGING UTILITY FOR SERVER OPERATIONS
// - CONFIGURABLE LOG LEVELS AND FORMATS
// - HANDLES BOTH CONSOLE AND FILE LOGGING
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
